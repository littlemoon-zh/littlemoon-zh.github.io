#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const CONTENT_SITES_DIR = path.join(process.cwd(), 'content', 'sites')
const OUT_NOTES_DIR = path.join(process.cwd(), 'out', 'notes')
const LINKEDIN_URL = 'https://www.linkedin.com/in/yuhang-xiao/'

function parseDraft(value) {
  return value === true || String(value).toLowerCase() === 'true'
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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
  position: sticky;
  top: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 58px;
  padding: 12px clamp(16px, 4vw, 44px);
  border-bottom: 1px solid color-mix(in srgb, CanvasText 16%, transparent);
  background: color-mix(in srgb, Canvas 92%, transparent);
  color: CanvasText;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.3;
  backdrop-filter: blur(14px);
}

.lm-site-chrome a {
  color: inherit;
  text-decoration: none;
}

.lm-site-chrome__brand {
  font-weight: 800;
}

.lm-site-chrome__path {
  min-width: 0;
  color: color-mix(in srgb, CanvasText 68%, transparent);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lm-site-chrome__nav {
  display: flex;
  align-items: center;
  gap: 12px;
  color: color-mix(in srgb, CanvasText 74%, transparent);
  font-size: 13px;
  font-weight: 700;
}

.lm-site-chrome__nav a {
  padding: 6px 0;
}

.lm-site-chrome__nav a:hover,
.lm-site-chrome__nav a[aria-current="page"] {
  color: CanvasText;
}

@media (max-width: 640px) {
  .lm-site-chrome {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .lm-site-chrome__nav {
    width: 100%;
    justify-content: space-between;
  }
}
</style>`
}

function siteChromeMarkup(slug, metadata) {
  return `<header class="lm-site-chrome" data-littlemoon-site-chrome aria-label="Littlemoon site navigation">
  <a class="lm-site-chrome__brand" href="/">Littlemoon</a>
  <div class="lm-site-chrome__path" title="${escapeHtml(metadata.title)}">/notes/${escapeHtml(slug)}/</div>
  <nav class="lm-site-chrome__nav" aria-label="Primary navigation">
    <a href="/">Home</a>
    <a href="/notes" aria-current="page">Notes</a>
    <a href="/demos">Demos</a>
    <a href="${LINKEDIN_URL}" target="_blank" rel="noreferrer">LinkedIn</a>
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
  return withStyles.replace(/<body([^>]*)>/i, `<body$1>\n${siteChromeMarkup(slug, metadata)}`)
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
