#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const type = process.argv[2]
const args = process.argv.slice(3)

if (!['note', 'demo', 'site'].includes(type)) {
  console.error('Usage: npm run new:note -- --slug your-slug')
  console.error('   or: npm run new:demo -- --slug your-slug')
  console.error('   or: npm run new:site -- --slug your-slug')
  process.exit(1)
}

const options = {}
for (let i = 0; i < args.length; i += 1) {
  const token = args[i]
  if (!token.startsWith('--')) {
    continue
  }

  const key = token.slice(2)
  const next = args[i + 1]
  if (next && !next.startsWith('--')) {
    options[key] = next
    i += 1
  } else {
    options[key] = 'true'
  }
}

const slug = options.slug
if (!slug) {
  console.error('Missing required argument: --slug')
  process.exit(1)
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('Slug must match: ^[a-z0-9-]+$')
  process.exit(1)
}

const title =
  options.title ||
  slug
    .split('-')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')

const today = new Date().toISOString().slice(0, 10)

if (type === 'site') {
  const siteChrome = options.chrome || 'site'
  if (!['site', 'none'].includes(siteChrome)) {
    console.error('Site chrome must be site or none')
    process.exit(1)
  }

  const siteDirectory = path.join(process.cwd(), 'content', 'sites', slug)
  const indexPath = path.join(siteDirectory, 'index.html')
  const metadataPath = path.join(siteDirectory, 'site.json')

  if (fs.existsSync(siteDirectory)) {
    console.error(`Directory already exists: ${siteDirectory}`)
    process.exit(1)
  }

  fs.mkdirSync(siteDirectory, { recursive: true })

  const metadata = {
    title,
    date: today,
    summary: 'Write a short summary for list pages.',
    tags: ['hosted-html', 'notes'],
    draft: false,
    chrome: siteChrome,
  }

  const escapedTitle = escapeHtml(title)
  const escapedSummary = escapeHtml(metadata.summary)

  const htmlTemplate = `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedSummary}">
  <style>
    :root {
      color-scheme: light dark;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      margin: 0;
      background: Canvas;
      color: CanvasText;
    }

    main {
      width: min(880px, calc(100% - 32px));
      margin: 0 auto;
      padding: clamp(48px, 8vw, 96px) 0;
    }

    h1 {
      margin: 0;
      font-size: clamp(2.25rem, 7vw, 5.5rem);
      line-height: 1;
    }

    p {
      max-width: 68ch;
      color: color-mix(in srgb, CanvasText 72%, transparent);
      font-size: 1.05rem;
      line-height: 1.75;
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapedTitle}</h1>
    <p>Start writing a standalone hosted HTML article here. The build will inject the Littlemoon topbar unless site.json sets chrome to "none".</p>
  </main>
</body>
</html>
`

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf-8')
  fs.writeFileSync(indexPath, htmlTemplate, 'utf-8')

  console.log(`Created: ${siteDirectory}`)
  process.exit(0)
}

const noteLayout = options.layout || (options.artifact ? 'artifact' : 'article')
const artifactChrome = options['artifact-chrome'] || options.artifactChrome || options.chrome || 'immersive'

if (!['article', 'artifact'].includes(noteLayout)) {
  console.error('Note layout must be article or artifact')
  process.exit(1)
}

if (!['browser', 'immersive', 'custom'].includes(artifactChrome)) {
  console.error('Artifact chrome must be browser, immersive, or custom')
  process.exit(1)
}

const contentDirectory = path.join(
  process.cwd(),
  'content',
  type === 'note' ? 'notes' : 'demos'
)

const targetPath = path.join(contentDirectory, `${slug}.mdx`)
if (fs.existsSync(targetPath)) {
  console.error(`File already exists: ${targetPath}`)
  process.exit(1)
}

fs.mkdirSync(contentDirectory, { recursive: true })

const noteTemplate = `---
title: ${title}
date: ${today}
summary: Write a short summary for list pages.
tags: knowledge, notes
layout: ${noteLayout}
${noteLayout === 'artifact' ? `artifact: ${options.artifact || ''}\nartifactChrome: ${artifactChrome}\n` : ''}draft: false
---

## Context

What problem does this note solve?

## Key takeaways

- Takeaway 1
- Takeaway 2

## Reusable approach

Capture practical steps you can reuse in future projects.
`

const demoTemplate = `---
title: ${title}
date: ${today}
summary: Write a short summary for list pages.
stack: nextjs, typescript
liveUrl: https://example.com
repoUrl: https://github.com/your-name/your-repo
draft: false
---

## Demo goal

What idea does this demo validate?

## How to use

1. Open the demo
2. Run the main flow
3. Observe the output

## Next iteration

List improvements for the next version.
`

const content = type === 'note' ? noteTemplate : demoTemplate
fs.writeFileSync(targetPath, content, 'utf-8')

console.log(`Created: ${targetPath}`)
