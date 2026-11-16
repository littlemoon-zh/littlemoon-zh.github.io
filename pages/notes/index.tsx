import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '@/components/layout'
import { EntryList, noteToEntry, type ListEntry } from '@/components/note-list'
import { getAllNotesMeta, getTagCounts, type TagCount } from '@/lib/content'
import { site } from '@/lib/site'
import styles from '@/styles/Site.module.css'

type NotesPageProps = {
  notes: ListEntry[]
  tags: TagCount[]
}

function matchesQuery(note: ListEntry, query: string): boolean {
  const haystack = `${note.title} ${note.summary} ${note.tags.join(' ')}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export default function NotesPage({ notes, tags }: NotesPageProps) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  // The selected tag lives in the URL (`/notes?tag=x`) so it can be linked to.
  const tagParam = router.query.tag
  const activeTag = typeof tagParam === 'string' ? tagParam : null

  const setActiveTag = (tag: string | null) => {
    router.replace(tag ? { pathname: '/notes', query: { tag } } : '/notes', undefined, {
      shallow: true,
      scroll: false,
    })
  }

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.closest('input, textarea, [contenteditable="true"]')

      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const visibleNotes = useMemo(
    () =>
      notes.filter(
        (note) =>
          (!activeTag || note.tags.includes(activeTag)) && (!query.trim() || matchesQuery(note, query)),
      ),
    [notes, activeTag, query],
  )

  return (
    <Layout>
      <Head>
        <title>{`Notes | ${site.name}`}</title>
        <meta name="description" content={site.description} />
        <link rel="canonical" href={`${site.url}/notes`} />
        <meta property="og:title" content={`Notes | ${site.name}`} />
        <meta property="og:description" content={site.description} />
      </Head>

      <div className={`${styles.grid} ${styles.stack} ${styles.indexHead}`}>
        <div className={styles.body}>
          <h1>Notes</h1>
          <p>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}, newest first. The moon beside each one is
            the phase on the day it was written.
          </p>

          <input
            ref={searchRef}
            type="search"
            className={styles.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes (press /)"
            aria-label="Search notes"
          />

          {tags.length > 0 && (
            <div className={styles.filters} role="group" aria-label="Filter by topic">
              <button
                type="button"
                className={styles.filter}
                aria-pressed={activeTag === null}
                onClick={() => setActiveTag(null)}
              >
                All
              </button>
              {tags.map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.filter}
                  aria-pressed={activeTag === tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                  {count > 1 && <small>{count}</small>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {visibleNotes.length > 0 ? (
        <EntryList entries={visibleNotes} compact />
      ) : (
        <div className={`${styles.grid} ${styles.stack}`}>
          <p className={`${styles.body} ${styles.empty}`}>
            {notes.length > 0 ? 'No notes match.' : 'No notes yet.'}
          </p>
        </div>
      )}
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<NotesPageProps> = async () => {
  const notes = getAllNotesMeta()

  return {
    props: {
      notes: notes.map(noteToEntry),
      tags: getTagCounts(notes),
    },
  }
}
