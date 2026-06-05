const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const SITE_URL = 'https://littlemoon-zh.github.io'
const PUBLIC_DIR = path.join(process.cwd(), 'public')
const CONTENT_DIR = path.join(process.cwd(), 'content')

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function listEntries(kind) {
  const directory = path.join(CONTENT_DIR, kind)
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, '')
      const raw = fs.readFileSync(path.join(directory, file), 'utf8')
      const parsed = matter(raw)
      const draft = parsed.data.draft === true || String(parsed.data.draft).toLowerCase() === 'true'

      return {
        kind,
        slug,
        title: parsed.data.title || slug,
        summary: parsed.data.summary || '',
        date: parsed.data.date ? new Date(parsed.data.date).toISOString().slice(0, 10) : null,
        draft,
      }
    })
    .filter((entry) => !entry.draft)
    .sort((a, b) => Date.parse(b.date || '1970-01-01') - Date.parse(a.date || '1970-01-01'))
}

function writeFile(fileName, content) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  fs.writeFileSync(path.join(PUBLIC_DIR, fileName), content)
}

function buildSitemap(entries) {
  const routes = [
    { url: '/', priority: '1.0' },
    { url: '/notes', priority: '0.9' },
    { url: '/demos', priority: '0.6' },
    ...entries.map((entry) => ({
      url: `/${entry.kind}/${entry.slug}`,
      lastmod: entry.date,
      priority: entry.kind === 'notes' ? '0.8' : '0.5',
    })),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    const lastmod = route.lastmod ? `\n    <lastmod>${escapeXml(route.lastmod)}</lastmod>` : ''
    return `  <url>
    <loc>${escapeXml(`${SITE_URL}${route.url}`)}</loc>${lastmod}
    <priority>${route.priority}</priority>
  </url>`
  })
  .join('\n')}
</urlset>
`
}

function buildFeed(notes) {
  const latestBuildDate = new Date(notes[0]?.date || '1970-01-01').toUTCString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Littlemoon Notes</title>
    <link>${SITE_URL}/notes</link>
    <description>AI engineering notes by Yuhang Xiao.</description>
    <language>zh-CN</language>
    <lastBuildDate>${latestBuildDate}</lastBuildDate>
${notes
  .map((note) => {
    const link = `${SITE_URL}/notes/${note.slug}`
    const pubDate = note.date ? new Date(note.date).toUTCString() : latestBuildDate

    return `    <item>
      <title>${escapeXml(note.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(note.summary)}</description>
    </item>`
  })
  .join('\n')}
  </channel>
</rss>
`
}

const notes = listEntries('notes')
const demos = listEntries('demos')
const allEntries = [...notes, ...demos]

writeFile(
  'robots.txt',
  `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`,
)
writeFile('sitemap.xml', buildSitemap(allEntries))
writeFile('feed.xml', buildFeed(notes))
