import Link from 'next/link'
import type { ReactNode } from 'react'
import { Moon } from '@/components/moon'
import { EntryLink } from '@/components/note-list'
import { Toc } from '@/components/toc'
import { formatDotDate } from '@/lib/date'
import type { TocItem } from '@/lib/markdown'
import { moonPhaseForDate, moonPhaseName } from '@/lib/moon'
import site from '@/styles/Site.module.css'
import styles from '@/styles/Article.module.css'

export type Neighbour = {
  href: string
  title: string
  external?: boolean
}

/** Date and moon phase, set in the gutter beside a title. */
export function DateMargin({ date }: { date: string }) {
  const phase = moonPhaseForDate(date)

  return (
    <div className={`${site.gutter} ${styles.margin}`}>
      <Moon phase={phase} size={26} />
      <time dateTime={date}>{formatDotDate(date)}</time>
      <span>{moonPhaseName(phase)}</span>
    </div>
  )
}

export function ArticleHeader({
  title,
  summary,
  tags,
  tagHref,
  children,
}: {
  title: string
  summary?: string
  tags: string[]
  /** Makes each tag a link; omit for plain labels. */
  tagHref?: (tag: string) => string
  children?: ReactNode
}) {
  return (
    <header className={styles.head}>
      <h1 className={styles.title}>{title}</h1>
      {summary && <p className={styles.summary}>{summary}</p>}
      {tags.length > 0 && (
        <ul className={styles.tags}>
          {tags.map((tag) => (
            <li key={tag}>{tagHref ? <Link href={tagHref(tag)}>#{tag}</Link> : `#${tag}`}</li>
          ))}
        </ul>
      )}
      {children}
    </header>
  )
}

export function Prose({ html }: { html: string }) {
  return <section className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
}

type ArticleProps = {
  title: string
  date: string
  summary?: string
  tags: string[]
  tagHref?: (tag: string) => string
  html: string
  toc: TocItem[]
  /** Extra header content, such as a demo's external links. */
  headerExtra?: ReactNode
  newer?: Neighbour | null
  older?: Neighbour | null
  back: { href: string; label: string }
}

/** The standard long-form page: margin date, text, outline, neighbours. */
export function Article({
  title,
  date,
  summary,
  tags,
  tagHref,
  html,
  toc,
  headerExtra,
  newer,
  older,
  back,
}: ArticleProps) {
  return (
    <article className={`${site.grid} ${site.stack}`}>
      <DateMargin date={date} />

      <div className={site.body}>
        <ArticleHeader title={title} summary={summary} tags={tags} tagHref={tagHref}>
          {headerExtra}
        </ArticleHeader>

        <Prose html={html} />

        {(newer || older) && (
          <nav className={styles.pager} aria-label="Adjacent entries">
            {newer && (
              <EntryLink entry={newer} className={styles.newer}>
                <small>← Newer</small>
                <span>{newer.title}</span>
              </EntryLink>
            )}
            {older && (
              <EntryLink entry={older} className={styles.older}>
                <small>Older →</small>
                <span>{older.title}</span>
              </EntryLink>
            )}
          </nav>
        )}

        <Link href={back.href} className={styles.back}>
          {back.label}
        </Link>
      </div>

      {toc.length > 2 && (
        <aside className={site.aside}>
          <Toc items={toc} />
        </aside>
      )}
    </article>
  )
}
