import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

type ContentKind = 'notes' | 'demos'

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

const baseFrontmatterSchema = z.object({
  title: z.string().trim().min(1).optional(),
  date: dateField,
  summary: z.string().trim().default(''),
  draft: draftField.default(false),
})

const noteFrontmatterSchema = baseFrontmatterSchema.extend({
  tags: stringArrayField.default([]),
})

const demoFrontmatterSchema = baseFrontmatterSchema.extend({
  stack: stringArrayField.default([]),
  liveUrl: z.string().trim().url().optional().or(z.literal('')).optional(),
  repoUrl: z.string().trim().url().optional().or(z.literal('')).optional(),
})

type NoteFrontmatter = z.infer<typeof noteFrontmatterSchema>
type DemoFrontmatter = z.infer<typeof demoFrontmatterSchema>

type ContentFrontmatter = {
  title: string
  date: string
  summary: string
  draft: boolean
}

export type NoteMeta = ContentFrontmatter & {
  slug: string
  tags: string[]
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
    title: frontmatter.title || slugToTitle(slug),
    date: frontmatter.date,
    summary: frontmatter.summary,
    draft: frontmatter.draft,
    tags: frontmatter.tags,
    body: content.trim(),
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
    liveUrl: frontmatter.liveUrl || undefined,
    repoUrl: frontmatter.repoUrl || undefined,
    body: content.trim(),
  }
}

export function getAllNotesMeta(): NoteMeta[] {
  const entries = listContentFiles('notes')
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
        title: entry.title,
        date: entry.date,
        summary: entry.summary,
        draft: entry.draft,
        tags: entry.tags,
      }
    })
    .filter((entry): entry is NoteMeta => entry !== null)

  return sortByDateDesc(entries)
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
        liveUrl: entry.liveUrl,
        repoUrl: entry.repoUrl,
      }
    })
    .filter((entry): entry is DemoMeta => entry !== null)

  return sortByDateDesc(entries)
}

export function getNoteSlugs(): string[] {
  return getAllNotesMeta().map((entry) => entry.slug)
}

export function getDemoSlugs(): string[] {
  return getAllDemosMeta().map((entry) => entry.slug)
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
