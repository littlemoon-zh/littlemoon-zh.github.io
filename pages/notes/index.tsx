import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getAllNotesMeta, type NoteMeta } from '@/lib/content'
import { site } from '@/lib/site'
import { useStoredView } from '@/lib/use-stored-view'
import styles from '@/styles/Content.module.css'

type NotesPageProps = {
  notes: NoteMeta[]
}

function noteTypeLabel(note: NoteMeta): string {
  if (note.layout === 'site' || note.layout === 'artifact') {
    return 'Hosted HTML'
  }

  return 'Note'
}

function NoteCard({ note }: { note: NoteMeta }) {
  const content = (
    <>
      <p className={styles.meta}>
        {formatDate(note.date)} / {noteTypeLabel(note)}
      </p>
      <h2>{note.title}</h2>
      <p>{note.summary}</p>
      {note.tags.length > 0 && (
        <div className={styles.tags}>
          {note.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <span className={styles.cardLink}>
        {note.layout === 'article' ? 'Read' : 'Open'}
      </span>
    </>
  )

  if (note.source === 'site') {
    return (
      <a href={note.href} className={styles.card}>
        {content}
      </a>
    )
  }

  return (
    <Link href={note.href} className={styles.card}>
      {content}
    </Link>
  )
}

export default function NotesPage({ notes }: NotesPageProps) {
  const [view, setView] = useStoredView('littlemoon:notes:view')

  return (
    <>
      <Head>
        <title>{`Notes | ${site.name}`}</title>
        <meta
          name="description"
          content="Hosted HTML notes, research reports, and engineering writeups."
        />
        <link rel="canonical" href={`${site.url}/notes`} />
        <meta property="og:title" content={`Notes | ${site.name}`} />
        <meta property="og:description" content={site.chineseDescription} />
      </Head>

      <main className={styles.page}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            {site.name}
          </Link>
          <nav className={styles.nav}>
            <Link href="/notes">Notes</Link>
            <Link href="/demos">Demos</Link>
            <a href={site.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </nav>
          <ThemeToggle
            containerClassName={styles.themeToggle}
            buttonClassName={styles.themeButton}
            activeButtonClassName={styles.themeButtonActive}
          />
        </header>

        <div className={styles.shell}>
          <section className={styles.header}>
            <p className={styles.label}>Notes</p>
            <h1>Hosted notes and research reports.</h1>
            <p className={styles.subtitle}>
              这里存放可直接访问的 HTML 文章：研究报告、工程笔记、数据可视化和长期复盘。
            </p>
            <div className={styles.viewControls} role="group" aria-label="Choose list layout">
              <button
                type="button"
                className={`${styles.viewButton} ${
                  view === 'cards' ? styles.viewButtonActive : ''
                }`}
                onClick={() => setView('cards')}
              >
                Cards
              </button>
              <button
                type="button"
                className={`${styles.viewButton} ${
                  view === 'rows' ? styles.viewButtonActive : ''
                }`}
                onClick={() => setView('rows')}
              >
                Rows
              </button>
            </div>
          </section>

          {notes.length > 0 ? (
            <section className={`${styles.grid} ${view === 'rows' ? styles.rows : ''}`}>
              {notes.map((note) => (
                <NoteCard key={note.href} note={note} />
              ))}
            </section>
          ) : (
            <section className={styles.empty}>No notes published yet.</section>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<NotesPageProps> = async () => {
  return {
    props: {
      notes: getAllNotesMeta(),
    },
  }
}
