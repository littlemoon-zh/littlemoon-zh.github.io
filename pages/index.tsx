import Head from 'next/head'
import type { GetStaticProps } from 'next'
import Link from 'next/link'
import { Layout } from '@/components/layout'
import { Moon, useTonightPhase } from '@/components/moon'
import { EntryList, noteToEntry, type ListEntry } from '@/components/note-list'
import { getAllNotesMeta, getPortfolioDemosMeta, getTagCounts, type TagCount } from '@/lib/content'
import { moonPhaseName } from '@/lib/moon'
import { site } from '@/lib/site'
import styles from '@/styles/Site.module.css'

const RECENT_NOTES = 8
const TOPICS = 12

type HomePageProps = {
  notes: ListEntry[]
  totalNotes: number
  demos: ListEntry[]
  topics: TagCount[]
}

export default function Home({ notes, totalNotes, demos, topics }: HomePageProps) {
  const tonight = useTonightPhase()

  return (
    <Layout>
      <Head>
        <title>{site.name}</title>
        <meta name="description" content={site.description} />
        <meta property="og:title" content={site.name} />
        <meta property="og:description" content={site.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={site.url} />
        <meta property="og:image" content={`${site.url}${site.image}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={site.url} />
      </Head>

      <section className={`${styles.grid} ${styles.stack} ${styles.hero}`}>
        <div className={`${styles.gutter} ${styles.tonight}`}>
          <Moon phase={tonight} size={64} />
          <span>
            Tonight
            {tonight !== null && (
              <>
                <br />
                {moonPhaseName(tonight)}
              </>
            )}
          </span>
        </div>
        <div className={styles.body}>
          <h1 className={styles.tagline}>{site.tagline}</h1>
          <p className={styles.intro}>{site.intro}</p>
        </div>
      </section>

      <section className={`${styles.grid} ${styles.stack}`} aria-label="Recent notes">
        <div className={styles.span}>
          {notes.length > 0 ? (
            <EntryList entries={notes} />
          ) : (
            <p className={styles.empty}>No notes yet.</p>
          )}
          {totalNotes > notes.length && (
            <div className={styles.grid}>
              <Link href="/notes" className={`${styles.body} ${styles.more}`}>
                All {totalNotes} notes →
              </Link>
            </div>
          )}
        </div>

        {topics.length > 0 && (
          <aside className={`${styles.aside} ${styles.topics}`}>
            <h2>Topics</h2>
            <ul>
              {topics.map((topic) => (
                <li key={topic.tag}>
                  <Link href={`/notes?tag=${encodeURIComponent(topic.tag)}`}>
                    {topic.tag}
                    {topic.count > 1 && <small>{topic.count}</small>}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      {demos.length > 0 && (
        <section className={styles.sectionGap} aria-label="Demos">
          <div className={styles.grid}>
            <h2 className={`${styles.body} ${styles.sectionTitle}`}>Demos</h2>
          </div>
          <EntryList entries={demos} />
        </section>
      )}
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const allNotes = getAllNotesMeta()

  return {
    props: {
      notes: allNotes.slice(0, RECENT_NOTES).map(noteToEntry),
      totalNotes: allNotes.length,
      demos: getPortfolioDemosMeta().map((demo) => ({
        href: `/demos/${demo.slug}`,
        title: demo.title,
        date: demo.date,
        summary: demo.summary,
        tags: demo.stack,
      })),
      topics: getTagCounts(allNotes).slice(0, TOPICS),
    },
  }
}
