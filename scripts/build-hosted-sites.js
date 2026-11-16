#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const CONTENT_SITES_DIR = path.join(process.cwd(), 'content', 'sites')
const OUT_NOTES_DIR = path.join(process.cwd(), 'out', 'notes')
const GITHUB_URL = 'https://github.com/littlemoon-zh'

function parseDraft(value) {
  return value === true || String(value).toLowerCase() === 'true'
}

function readMetadata(slug) {
  const metadataPath = path.join(CONTENT_SITES_DIR, slug, 'site.json')
  let metadata

  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  } catch (error) {
    throw new Error(
      `Invalid JSON in sites/${slug}/site.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  if (!metadata.title || typeof metadata.title !== 'string') {
    throw new Error(`Missing required string "title" in sites/${slug}/site.json`)
  }

  const chrome = metadata.chrome || 'site'
  if (!['site', 'none'].includes(chrome)) {
    throw new Error(`Invalid chrome in sites/${slug}/site.json: expected "site" or "none"`)
  }

  return {
    ...metadata,
    chrome,
    draft: parseDraft(metadata.draft),
  }
}

function listSiteSlugs() {
  if (!fs.existsSync(CONTENT_SITES_DIR)) {
    return []
  }

  return fs
    .readdirSync(CONTENT_SITES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function copySiteAssets(sourceDirectory, destinationDirectory) {
  fs.rmSync(destinationDirectory, { recursive: true, force: true })
  fs.mkdirSync(destinationDirectory, { recursive: true })

  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (entry.name === 'site.json') {
      continue
    }

    const sourcePath = path.join(sourceDirectory, entry.name)
    const destinationPath = path.join(destinationDirectory, entry.name)

    if (entry.isDirectory()) {
      fs.cpSync(sourcePath, destinationPath, { recursive: true })
    } else {
      fs.copyFileSync(sourcePath, destinationPath)
    }
  }
}

// Standalone pages bring their own styles, so this bar is self-contained and
// follows the page's light/dark scheme through system colours. Its layout
// mirrors the header in components/layout.tsx.
function siteChromeCss() {
  return `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style id="littlemoon-site-chrome">
.lm-site-chrome,
.lm-site-chrome * {
  box-sizing: border-box;
}

.lm-site-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: min(84rem, 100% - 3rem);
  margin: 0 auto;
  padding: 28px 0;
  color: CanvasText;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14.5px;
  line-height: 1;
}

.lm-site-chrome a {
  color: inherit;
  text-decoration: none;
}

.lm-site-chrome__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: "Iowan Old Style", Palatino, Georgia, serif;
  font-size: 22px;
  font-style: italic;
}

.lm-site-chrome__brand::before {
  content: "";
  width: 16px;
  height: 16px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  background: linear-gradient(90deg, currentColor 50%, transparent 50%);
}

.lm-site-chrome__nav {
  display: flex;
  align-items: center;
  gap: 24px;
  color: color-mix(in srgb, CanvasText 62%, transparent);
}

.lm-site-chrome__nav a:hover,
.lm-site-chrome__nav a[aria-current="page"] {
  color: CanvasText;
}

@media (max-width: 720px) {
  .lm-site-chrome {
    width: min(84rem, 100% - 2.5rem);
    padding: 20px 0;
  }

  .lm-site-chrome__nav {
    gap: 18px;
  }
}
</style>`
}

function siteChromeMarkup() {
  return `<header class="lm-site-chrome" data-littlemoon-site-chrome aria-label="Littlemoon site navigation">
  <a class="lm-site-chrome__brand" href="/">Littlemoon</a>
  <nav class="lm-site-chrome__nav" aria-label="Primary">
    <a href="/notes" aria-current="page">Notes</a>
    <a href="/demos">Demos</a>
    <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
  </nav>
</header>`
}

function injectSiteChrome(html, slug, metadata) {
  if (metadata.chrome === 'none') {
    return html
  }

  if (!/<\/head>/i.test(html)) {
    throw new Error(`sites/${slug}/index.html is missing a closing </head> tag`)
  }

  if (!/<body(?:\s[^>]*)?>/i.test(html)) {
    throw new Error(`sites/${slug}/index.html is missing an opening <body> tag`)
  }

  const withStyles = html.replace(/<\/head>/i, `${siteChromeCss()}\n</head>`)
  return withStyles.replace(/<body([^>]*)>/i, `<body$1>\n${siteChromeMarkup()}`)
}

function buildHostedSite(slug) {
  const sourceDirectory = path.join(CONTENT_SITES_DIR, slug)
  const destinationDirectory = path.join(OUT_NOTES_DIR, slug)
  const sourceIndexPath = path.join(sourceDirectory, 'index.html')

  if (!fs.existsSync(sourceIndexPath)) {
    throw new Error(`Missing sites/${slug}/index.html`)
  }

  const metadata = readMetadata(slug)
  if (metadata.draft) {
    fs.rmSync(destinationDirectory, { recursive: true, force: true })
    return false
  }

  copySiteAssets(sourceDirectory, destinationDirectory)

  const html = fs.readFileSync(sourceIndexPath, 'utf8')
  const outputHtml = injectSiteChrome(html, slug, metadata)
  fs.writeFileSync(path.join(destinationDirectory, 'index.html'), outputHtml, 'utf8')
  return true
}

if (!fs.existsSync(path.join(process.cwd(), 'out'))) {
  throw new Error('Missing out/ directory. Run next build before build-hosted-sites.')
}

let published = 0
for (const slug of listSiteSlugs()) {
  if (buildHostedSite(slug)) {
    published += 1
  }
}

console.log(`Hosted HTML sites published: ${published}`)
