import Head from 'next/head'
import type { GetStaticProps } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import {
  getAllNotesMeta,
  getPortfolioDemosMeta,
  type DemoMeta,
  type NoteMeta,
} from '@/lib/content'
import { site } from '@/lib/site'
import styles from '@/styles/Home.module.css'

type HomePageProps = {
  notes: NoteMeta[]
  demos: DemoMeta[]
}

function noteTypeLabel(note: NoteMeta): string {
  if (note.layout === 'site' || note.layout === 'artifact') {
    return 'Hosted HTML'
  }

  return 'Note'
}

function HomeNoteItem({ post }: { post: NoteMeta }) {
  const content = (
    <>
      <p className={styles.meta}>
        {formatDate(post.date)} / {noteTypeLabel(post)}
      </p>
      <h2>{post.title}</h2>
      <p>{post.summary}</p>
    </>
  )

  if (post.source === 'site') {
    return (
      <a href={post.href} className={styles.itemBlock}>
        {content}
      </a>
    )
  }

  return (
    <Link href={post.href} className={styles.itemBlock}>
      {content}
    </Link>
  )
}

export default function Home({
  notes,
  demos,
}: HomePageProps) {
  const year = new Date().getFullYear()

  return (
    <>
      <Head>
        <title>{`${site.name} | Notes & Demos`}</title>
        <meta name="description" content={site.chineseDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#151618" />
        <meta property="og:title" content={`${site.name} | Notes & Demos`} />
        <meta property="og:description" content={site.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={site.url} />
        <meta property="og:image" content={`${site.url}${site.image}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={site.url} />
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
            <a href={site.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
          <ThemeToggle
            containerClassName={styles.themeToggle}
            buttonClassName={styles.themeButton}
            activeButtonClassName={styles.themeButtonActive}
          />
        </header>

        <section className={styles.hero} aria-label="Site header">
          <div className={styles.heroImage} aria-hidden />
          <div className={styles.heroOverlay} aria-hidden />
          <div className={styles.heroInner}>
            <p>Notes / Demos</p>
            <h1>{site.name}</h1>
          </div>
        </section>

        <section className={styles.directory}>
          <div className={styles.column}>
            <div className={styles.columnHead}>
              <h1>Notes</h1>
              <Link href="/notes">All notes</Link>
            </div>
            <div className={styles.itemList}>
              {notes.map((post) => (
                <HomeNoteItem key={post.href} post={post} />
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.columnHead}>
              <h1>Demos</h1>
              <Link href="/demos">All demos</Link>
            </div>
            {demos.length > 0 ? (
              <div className={styles.itemList}>
                {demos.map((demo) => (
                  <Link key={demo.slug} href={`/demos/${demo.slug}`} className={styles.itemBlock}>
                    <p className={styles.meta}>
                      {formatDate(demo.date)} / {demo.stack.slice(0, 2).join(' / ') || 'Demo'}
                    </p>
                    <h2>{demo.title}</h2>
                    <p>{demo.summary}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyBlock}>
                <h2>No demos yet</h2>
                <p>Video demos will show up here.</p>
              </div>
            )}
          </div>
        </section>

        <footer id="contact" className={styles.footer}>
          <p>© {year} {site.name}</p>
          <div className={styles.footerLinks}>
            <a href={`mailto:${site.email}`}>Email</a>
            <a href={site.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={site.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const allNotes = getAllNotesMeta()

  return {
    props: {
      notes: allNotes,
      demos: getPortfolioDemosMeta(),
    },
  }
}
