import Head from 'next/head'
import type { GetStaticProps } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import {
  getAllDemosMeta,
  getAllNotesMeta,
  getLatestNotes,
  type DemoMeta,
  type NoteMeta,
} from '@/lib/content'
import { focusAreas, readingPaths, site } from '@/lib/site'
import styles from '@/styles/Home.module.css'

type HomePageProps = {
  notes: NoteMeta[]
  noteCount: number
  demoCount: number
  topicCount: number
  latestDate: string | null
  latestDemos: DemoMeta[]
}

export default function Home({
  notes,
  noteCount,
  demoCount,
  topicCount,
  latestDate,
  latestDemos,
}: HomePageProps) {
  const year = new Date().getFullYear()
  const latestDateLabel = latestDate ? latestDate.replaceAll('-', '.') : 'Soon'

  return (
    <>
      <Head>
        <title>{`${site.name} | AI Engineering Notes`}</title>
        <meta name="description" content={site.chineseDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#151618" />
        <meta property="og:title" content={`${site.name} | AI Engineering Notes`} />
        <meta property="og:description" content={site.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={site.url} />
        <meta property="og:image" content={`${site.url}${site.image}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={site.url} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.page}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            {site.name}
          </Link>
          <nav className={styles.nav}>
            <Link href="/notes">Notes</Link>
            <Link href="/demos">Demos</Link>
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

        <section className={styles.hero}>
          <div className={styles.heroImage} aria-hidden />
          <div className={styles.heroOverlay} aria-hidden />
          <div className={styles.heroInner}>
            <p className={styles.kicker}>{site.owner} / {site.role}</p>
            <h1>{site.name}</h1>
            <p className={styles.heroLead}>{site.chineseDescription}</p>
            <div className={styles.focusRow} aria-label="Focus areas">
              {focusAreas.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>
            <div className={styles.actions}>
              <Link href="/notes" className={styles.primaryBtn}>
                Read Notes
              </Link>
              <a href={`mailto:${site.email}`} className={styles.secondaryBtn}>
                Contact
              </a>
            </div>
          </div>
        </section>

        <section className={styles.stats} aria-label="Site overview">
          <div>
            <span>{noteCount}</span>
            <p>Published notes</p>
          </div>
          <div>
            <span>{topicCount}</span>
            <p>Research tags</p>
          </div>
          <div>
            <span>{demoCount}</span>
            <p>Prototype logs</p>
          </div>
          <div>
            <span>{latestDateLabel}</span>
            <p>Latest update</p>
          </div>
        </section>

        <section id="knowledge" className={styles.section}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>Latest Notes</p>
            <h2>把实践拆成可复用的判断。</h2>
            <p>
              这里的笔记偏工程现场：系统设计、模型机制、质量评测和产品化过程中的取舍。
            </p>
          </div>
          <div className={styles.noteList}>
            {notes.map((post, index) => (
              <Link key={post.slug} href={`/notes/${post.slug}`} className={styles.noteRow}>
                <span className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className={styles.meta}>{formatDate(post.date)}</p>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <div className={styles.tagRow}>
                    {post.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span className={styles.rowArrow}>Read</span>
              </Link>
            ))}
          </div>
          <Link href="/demos" className={styles.sectionCta}>
            Browse prototypes
          </Link>
        </section>

        <section className={styles.paths}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>Reading Paths</p>
            <h2>三条长期线索。</h2>
          </div>
          <div className={styles.pathGrid}>
            {readingPaths.map((path) => (
              <article key={path.title} className={styles.pathItem}>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <div className={styles.tagRow}>
                  {path.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.demos}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>Prototype Notes</p>
            <h2>Demo 是想法的检查点。</h2>
          </div>
          <div className={styles.demoStrip}>
            {latestDemos.map((demo) => (
              <Link key={demo.slug} href={`/demos/${demo.slug}`} className={styles.demoItem}>
                <p>{formatDate(demo.date)}</p>
                <h3>{demo.title}</h3>
                <span>{demo.stack.join(' / ')}</span>
              </Link>
            ))}
          </div>
          <Link href="/notes" className={styles.sectionCta}>
            View all notes
          </Link>
        </section>

        <footer id="contact" className={styles.footer}>
          <p>© {year} {site.name}. Photo by Dhony Koswara on Unsplash.</p>
          <div className={styles.footerLinks}>
            <a href={`mailto:${site.email}`}>Email</a>
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
  const allDemos = getAllDemosMeta()
  const topics = new Set(allNotes.flatMap((note) => note.tags))

  return {
    props: {
      notes: getLatestNotes(3),
      noteCount: allNotes.length,
      demoCount: allDemos.length,
      topicCount: topics.size,
      latestDate: allNotes[0]?.date ?? null,
      latestDemos: allDemos.slice(0, 2),
    },
  }
}
