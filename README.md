# littlemoon-zh.github.io

Personal knowledge and demo website built with Next.js static export for GitHub Pages.

## Local development

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

The static output is generated in `out/` and deployed through GitHub Actions.

## Content model

- `content/notes/*.mdx` for notes
- `content/demos/*.mdx` for demos

## Frontmatter schema

Note:

```md
---
title: Post title
date: 2026-02-28
summary: Short summary for list pages
tags: transformer, attention
draft: false
---
```

Demo:

```md
---
title: Demo title
date: 2026-02-28
summary: Short summary for list pages
stack: nextjs, typescript
liveUrl: https://example.com
repoUrl: https://github.com/xxx/yyy
draft: false
---
```

`draft: true` entries are hidden in production builds.

## Markdown rendering

Rendering uses a standard pipeline:

- `gray-matter` for frontmatter
- `zod` for schema validation
- `remark/rehype` for Markdown + GFM + math
- `rehype-pretty-code` for syntax highlighting

## Create new content

```bash
npm run new:note -- --slug your-note-slug
npm run new:demo -- --slug your-demo-slug
```

Optional title:

```bash
npm run new:note -- --slug your-note-slug --title "Custom title"
```

## Routes

- `/` home
- `/notes` and `/notes/[slug]`
- `/demos` and `/demos/[slug]`
