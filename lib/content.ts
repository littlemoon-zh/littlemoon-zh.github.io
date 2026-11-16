import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'
import type { ArtifactChrome } from '@/lib/artifact-types'

type ContentKind = 'notes' | 'demos'
type NoteLayout = 'article' | 'artifact' | 'site'
type NoteSource = 'mdx' | 'site'
type HostedSiteChrome = 'site' | 'none'

const CONTENT_ROOT = path.join(process.cwd(), 'content')
const isProductionBuild = process.env.NODE_ENV === 'production'

const dateField = z.preprocess((value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return '1970-01-01'
}, z.string())

const stringArrayField = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}, z.array(z.string()))

const draftField = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }

  return false
}, z.boolean())

const optionalUrlField = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  return value
}, z.string().url().optional().or(z.literal('')).optional())

const baseFrontmatterSchema = z.object({
  title: z.string().trim().min(1).optional(),
  date: dateField,
  summary: z.string().trim().default(''),
  draft: draftField.default(false),
})

const noteFrontmatterSchema = baseFrontmatterSchema.extend({
  tags: stringArrayField.default([]),
  layout: z.enum(['article', 'artifact']).default('article'),
  artifact: z.string().trim().optional().default(''),
  artifactChrome: z.enum(['browser', 'immersive', 'custom']).optional(),
})

const demoFrontmatterSchema = baseFrontmatterSchema.extend({
  stack: stringArrayField.default([]),
  liveUrl: optionalUrlField,
  repoUrl: optionalUrlField,
})

const hostedSiteMetadataSchema = baseFrontmatterSchema.extend({
  title: z.string().trim().min(1),
  tags: stringArrayField.default([]),
  chrome: z.enum(['site', 'none']).default('site'),
})

type NoteFrontmatter = z.infer<typeof noteFrontmatterSchema>
type DemoFrontmatter = z.infer<typeof demoFrontmatterSchema>
type HostedSiteMetadata = z.infer<typeof hostedSiteMetadataSchema>

type ContentFrontmatter = {
  title: string
  date: string
  summary: string
  draft: boolean
}

export type NoteMeta = ContentFrontmatter & {
  slug: string
  href: string
  source: NoteSource
  tags: string[]
  layout: NoteLayout
  artifact?: string
  artifactChrome?: ArtifactChrome
  chrome?: HostedSiteChrome
}

export type DemoMeta = ContentFrontmatter & {
  slug: string
  stack: string[]
  liveUrl?: string
  repoUrl?: string
}

export type NoteEntry = NoteMeta & {
  body: string
}

export type DemoEntry = DemoMeta & {
  body: string
}

const portfolioDemoTags = new Set([
  'portfolio',
  'personal-work',
  'video',
  'video-ai',
  'video-generation',
  'creative-ai',
])

function listContentFiles(kind: ContentKind): string[] {
  const directory = path.join(CONTENT_ROOT, kind)

  if (!fs.existsSync(directory)) {
    return []
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
}

function readRawFile(kind: ContentKind, slug: string): string | null {
  const directory = path.join(CONTENT_ROOT, kind)
  const mdxPath = path.join(directory, `${slug}.mdx`)
  const mdPath = path.join(directory, `${slug}.md`)

  if (fs.existsSync(mdxPath)) {
    return fs.readFileSync(mdxPath, 'utf-8')
  }

  if (fs.existsSync(mdPath)) {
    return fs.readFileSync(mdPath, 'utf-8')
  }

  return null
}

function listHostedSiteSlugs(): string[] {
  const directory = path.join(CONTENT_ROOT, 'sites')

  if (!fs.existsSync(directory)) {
    return []
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) {
        return false
      }

      const siteDirectory = path.join(directory, entry.name)
      return (
        fs.existsSync(path.join(siteDirectory, 'index.html')) &&
        fs.existsSync(path.join(siteDirectory, 'site.json'))
      )
    })
    .map((entry) => entry.name)
}

function readHostedSiteMetadata(slug: string): HostedSiteMetadata {
  const metadataPath = path.join(CONTENT_ROOT, 'sites', slug, 'site.json')
  let data: unknown

  try {
    data = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
  } catch (error) {
    throw new Error(
      `Invalid JSON in sites/${slug}/site.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  const parsed = hostedSiteMetadataSchema.safeParse(data)

  if (!parsed.success) {
    throw new Error(`Invalid metadata in sites/${slug}/site.json: ${parsed.error.message}`)
  }

  return parsed.data
}

function fileNameToSlug(fileName: string): string {
  return fileName.replace(/\.mdx?$/, '')
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')
}

function sortByDateDesc<T extends { date: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const left = Date.parse(a.date)
    const right = Date.parse(b.date)
    return right - left
  })
}

function shouldShowEntry(draft: boolean): boolean {
  if (!draft) {
    return true
  }

  return !isProductionBuild
}

function parseNoteRaw(raw: string, slug: string, fileName: string): NoteEntry {
  const { data, content } = matter(raw)
  const parsed = noteFrontmatterSchema.safeParse(data)

  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in notes/${fileName}: ${parsed.error.message}`)
  }

  const frontmatter: NoteFrontmatter = parsed.data
  return {
    slug,
    href: `/notes/${slug}`,
    source: 'mdx',
    title: frontmatter.title || slugToTitle(slug),
    date: frontmatter.date,
    summary: frontmatter.summary,
    draft: frontmatter.draft,
    tags: frontmatter.tags,
    layout: frontmatter.layout,
    ...(frontmatter.artifact ? { artifact: frontmatter.artifact } : {}),
    ...(frontmatter.artifactChrome ? { artifactChrome: frontmatter.artifactChrome } : {}),
    body: content.trim(),
  }
}

function parseHostedSite(slug: string): NoteMeta {
  const metadata = readHostedSiteMetadata(slug)

  return {
    slug,
    href: `/notes/${slug}/`,
    source: 'site',
    title: metadata.title,
    date: metadata.date,
    summary: metadata.summary,
    draft: metadata.draft,
    tags: metadata.tags,
    layout: 'site',
    chrome: metadata.chrome,
  }
}

function parseDemoRaw(raw: string, slug: string, fileName: string): DemoEntry {
  const { data, content } = matter(raw)
  const parsed = demoFrontmatterSchema.safeParse(data)

  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in demos/${fileName}: ${parsed.error.message}`)
  }

  const frontmatter: DemoFrontmatter = parsed.data
  return {
    slug,
    title: frontmatter.title || slugToTitle(slug),
    date: frontmatter.date,
    summary: frontmatter.summary,
    draft: frontmatter.draft,
    stack: frontmatter.stack,
    body: content.trim(),
    ...(frontmatter.liveUrl ? { liveUrl: frontmatter.liveUrl } : {}),
    ...(frontmatter.repoUrl ? { repoUrl: frontmatter.repoUrl } : {}),
  }
}

function getMarkdownNotesMeta(): NoteMeta[] {
  return listContentFiles('notes')
    .map<NoteMeta | null>((fileName) => {
      const slug = fileNameToSlug(fileName)
      const raw = readRawFile('notes', slug)
      if (!raw) {
        return null
      }

      const entry = parseNoteRaw(raw, slug, fileName)
      if (!shouldShowEntry(entry.draft)) {
        return null
      }

      return {
        slug: entry.slug,
        href: entry.href,
        source: entry.source,
        title: entry.title,
        date: entry.date,
        summary: entry.summary,
        draft: entry.draft,
        tags: entry.tags,
        layout: entry.layout,
        ...(entry.artifact ? { artifact: entry.artifact } : {}),
        ...(entry.artifactChrome ? { artifactChrome: entry.artifactChrome } : {}),
      }
    })
    .filter((entry): entry is NoteMeta => entry !== null)
}

function getHostedSitesMeta(): NoteMeta[] {
  return listHostedSiteSlugs()
    .map<NoteMeta | null>((slug) => {
      const entry = parseHostedSite(slug)
      if (!shouldShowEntry(entry.draft)) {
        return null
      }

      return entry
    })
    .filter((entry): entry is NoteMeta => entry !== null)
}

export function getAllNotesMeta(): NoteMeta[] {
  const entries = [...getMarkdownNotesMeta(), ...getHostedSitesMeta()]

  return sortByDateDesc(entries)
}

export type TagCount = {
  tag: string
  count: number
}

/** Tags ordered by how many notes carry them, then alphabetically. */
export function getTagCounts(notes: Pick<NoteMeta, 'tags'>[]): TagCount[] {
  const counts = new Map<string, number>()

  for (const note of notes) {
    for (const tag of note.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }

  return Array.from(counts, ([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function getAllDemosMeta(): DemoMeta[] {
  const entries = listContentFiles('demos')
    .map<DemoMeta | null>((fileName) => {
      const slug = fileNameToSlug(fileName)
      const raw = readRawFile('demos', slug)
      if (!raw) {
        return null
      }

      const entry = parseDemoRaw(raw, slug, fileName)
      if (!shouldShowEntry(entry.draft)) {
        return null
      }

      return {
        slug: entry.slug,
        title: entry.title,
        date: entry.date,
        summary: entry.summary,
        draft: entry.draft,
        stack: entry.stack,
        ...(entry.liveUrl ? { liveUrl: entry.liveUrl } : {}),
        ...(entry.repoUrl ? { repoUrl: entry.repoUrl } : {}),
      }
    })
    .filter((entry): entry is DemoMeta => entry !== null)

  return sortByDateDesc(entries)
}

export function isPortfolioDemo(entry: Pick<DemoMeta, 'stack'>): boolean {
  return entry.stack.some((item) => portfolioDemoTags.has(item.toLowerCase()))
}

export function getPortfolioDemosMeta(): DemoMeta[] {
  return getAllDemosMeta().filter(isPortfolioDemo)
}

export function getNoteSlugs(): string[] {
  return getMarkdownNotesMeta().map((entry) => entry.slug)
}

export function getDemoSlugs(): string[] {
  return getPortfolioDemosMeta().map((entry) => entry.slug)
}

export function getNoteBySlug(slug: string): NoteEntry | null {
  const raw = readRawFile('notes', slug)
  if (!raw) {
    return null
  }

  const fileName = `${slug}.mdx`
  const entry = parseNoteRaw(raw, slug, fileName)
  if (!shouldShowEntry(entry.draft)) {
    return null
  }

  return entry
}

export function getDemoBySlug(slug: string): DemoEntry | null {
  const raw = readRawFile('demos', slug)
  if (!raw) {
    return null
  }

  const fileName = `${slug}.mdx`
  const entry = parseDemoRaw(raw, slug, fileName)
  if (!shouldShowEntry(entry.draft)) {
    return null
  }

  return entry
}

export function getLatestNotes(limit = 3): NoteMeta[] {
  return getAllNotesMeta().slice(0, limit)
}

export function getLatestDemos(limit = 3): DemoMeta[] {
  return getAllDemosMeta().slice(0, limit)
}

export function getLatestPortfolioDemos(limit = 3): DemoMeta[] {
  return getPortfolioDemosMeta().slice(0, limit)
}
