#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const type = process.argv[2]
const args = process.argv.slice(3)

if (!['note', 'demo'].includes(type)) {
  console.error('Usage: npm run new:note -- --slug your-slug')
  console.error('   or: npm run new:demo -- --slug your-slug')
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
draft: false
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
