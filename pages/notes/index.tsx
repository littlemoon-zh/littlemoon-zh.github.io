import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getAllNotesMeta, type NoteMeta } from '@/lib/content'
import { useStoredView } from '@/lib/use-stored-view'
import styles from '@/styles/Content.module.css'

type NotesPageProps = {
  notes: NoteMeta[]
}

export default function NotesPage({ notes }: NotesPageProps) {
  const [view, setView] = useStoredView('littlemoon:notes:view')

  return (
    <>
      <Head>
        <title>Notes | Littlemoon</title>
        <meta name="description" content="Knowledge notes and long-form writing." />
      </Head>

      <main className={styles.page}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            littlemoon
          </Link>
          <nav className={styles.nav}>
            <Link href="/notes">Notes</Link>
            <Link href="/demos">Demos</Link>
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
            <h1>All Notes</h1>
            <p className={styles.subtitle}>Ideas, writeups, and technical deep dives.</p>
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
                <Link key={note.slug} href={`/notes/${note.slug}`} className={styles.card}>
                  <p className={styles.meta}>{formatDate(note.date)}</p>
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
                  <span className={styles.cardLink}>Read note</span>
                </Link>
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
