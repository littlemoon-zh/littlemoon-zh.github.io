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

export default function NotesPage({ notes }: NotesPageProps) {
  const [view, setView] = useStoredView('littlemoon:notes:view')

  return (
    <>
      <Head>
        <title>{`Notes | ${site.name}`}</title>
        <meta
          name="description"
          content="AI engineering notes on agents, evaluation loops, model internals, and production systems."
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
            <h1>Engineering notes, written after the work.</h1>
            <p className={styles.subtitle}>
              Long-form notes on AI systems, evaluation, product quality, and model internals.
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
                  <span className={styles.cardLink}>Read</span>
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
