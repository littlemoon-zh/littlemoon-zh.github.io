import Link from 'next/link'
import type { ReactNode } from 'react'
import { NoteMoon } from '@/components/moon'
import { formatMonthDay, getYear } from '@/lib/date'
import type { NoteMeta } from '@/lib/content'
import styles from '@/styles/Site.module.css'

/** What a row needs to render; notes and demos both map onto it. */
export type ListEntry = {
  href: string
  title: string
  date: string
  summary: string
  tags: string[]
  /** Hosted HTML pages live outside the Next router and need a full page load. */
  external?: boolean
  /** Short label for entries that are more than text, such as interactive reports. */
  kind?: string
}

export function noteToEntry(note: NoteMeta): ListEntry {
  return {
    href: note.href,
    title: note.title,
    date: note.date,
    summary: note.summary,
    tags: note.tags,
    external: note.source === 'site',
    ...(note.layout === 'article' ? {} : { kind: 'Interactive' }),
  }
}

export function EntryLink({
  entry,
  className,
  children,
}: {
  entry: Pick<ListEntry, 'href' | 'external'>
  className?: string
  children: ReactNode
}) {
  if (entry.external) {
    return (
      <a href={entry.href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={entry.href} className={className}>
      {children}
    </Link>
  )
}

function groupByYear(entries: ListEntry[]): Array<{ year: string; entries: ListEntry[] }> {
  const groups: Array<{ year: string; entries: ListEntry[] }> = []

  for (const entry of entries) {
    const year = getYear(entry.date)
    const last = groups[groups.length - 1]

    if (last && last.year === year) {
      last.entries.push(entry)
    } else {
      groups.push({ year, entries: [entry] })
    }
  }

  return groups
}

/**
 * Entries grouped by year, newest first. `compact` drops summaries and shows
 * one line per entry, which is what keeps a long archive scannable.
 */
export function EntryList({ entries, compact = false }: { entries: ListEntry[]; compact?: boolean }) {
  return (
    <div className={compact ? styles.compact : undefined}>
      {groupByYear(entries).map((group) => (
        <section key={group.year}>
          <div className={`${styles.grid} ${styles.year}`}>
            <h2 className={styles.gutter}>{group.year}</h2>
            <div className={`${styles.body} ${styles.yearRule}`} aria-hidden />
          </div>
          <ol className={styles.list}>
            {group.entries.map((entry) => (
              <li key={entry.href}>
                <EntryLink entry={entry} className={`${styles.grid} ${styles.row}`}>
                  <div className={`${styles.gutter} ${styles.rowMeta}`}>
                    <time dateTime={entry.date}>{formatMonthDay(entry.date)}</time>
                    <NoteMoon date={entry.date} size={compact ? 11 : 13} />
                  </div>
                  <div className={styles.body}>
                    <h3 className={styles.rowTitle}>
                      <span>{entry.title}</span>
                      {entry.kind && <span className={styles.kind}>{entry.kind}</span>}
                    </h3>
                    {!compact && entry.summary && <p className={styles.rowSummary}>{entry.summary}</p>}
                  </div>
                  {compact && entry.tags.length > 0 && (
                    <div className={styles.rowTags}>{entry.tags.join(' · ')}</div>
                  )}
                </EntryLink>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
