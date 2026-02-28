import Head from 'next/head'
import type { GetStaticProps } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getLatestDemos, getLatestNotes, type DemoMeta, type NoteMeta } from '@/lib/content'
import styles from '@/styles/Home.module.css'

type HomePageProps = {
  notes: NoteMeta[]
  demos: DemoMeta[]
}

export default function Home({ notes, demos }: HomePageProps) {
  const year = new Date().getFullYear()

  return (
    <>
      <Head>
        <title>Littlemoon | Knowledge & Demos</title>
        <meta
          name="description"
          content="Personal site for sharing knowledge notes and interactive demos."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.page}>
        <div className={styles.backdrop} aria-hidden />

        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            littlemoon
          </Link>
          <nav className={styles.nav}>
            <Link href="/notes">Notes</Link>
            <Link href="/demos">Demos</Link>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <ThemeToggle
            containerClassName={styles.themeToggle}
            buttonClassName={styles.themeButton}
            activeButtonClassName={styles.themeButtonActive}
          />
        </header>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>PERSONAL KNOWLEDGE SITE</p>
          <h1 className={styles.title}>
            A home for long-form notes and practical demos.
          </h1>
          <p className={styles.subtitle}>
            I publish technical notes, mental models, and interactive prototypes here.
            Everything is designed to be searchable and easy to extend.
          </p>
          <div className={styles.actions}>
            <Link href="/notes" className={styles.primaryBtn}>
              Explore Notes
            </Link>
            <Link href="/demos" className={styles.secondaryBtn}>
              Browse Demos
            </Link>
          </div>
        </section>

        <section id="knowledge" className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Notes</p>
            <h2>Recent Notes</h2>
          </div>
          <div className={styles.cardGrid}>
            {notes.map((post) => (
              <Link key={post.slug} href={`/notes/${post.slug}`} className={styles.card}>
                <p className={styles.meta}>{formatDate(post.date)}</p>
                <h3>{post.title}</h3>
                <p>{post.summary}</p>
                <div className={styles.tagRow}>
                  {post.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <span className={styles.linkHint}>Read note</span>
              </Link>
            ))}
          </div>
          <Link href="/notes" className={styles.sectionCta}>
            View all notes →
          </Link>
        </section>

        <section id="demos" className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Demos</p>
            <h2>Recent Demos</h2>
          </div>
          <div className={styles.cardGrid}>
            {demos.map((demo) => (
              <Link key={demo.slug} href={`/demos/${demo.slug}`} className={styles.card}>
                <p className={styles.meta}>{formatDate(demo.date)}</p>
                <h3>{demo.title}</h3>
                <p>{demo.summary}</p>
                <div className={styles.techRow}>
                  {demo.stack.map((item) => (
                    <span key={item} className={styles.techTag}>
                      {item}
                    </span>
                  ))}
                </div>
                <span className={styles.linkHint}>View demo</span>
              </Link>
            ))}
          </div>
          <Link href="/demos" className={styles.sectionCta}>
            View all demos →
          </Link>
        </section>

        <section id="about" className={styles.about}>
          <p className={styles.sectionLabel}>About</p>
          <h2>Building a personal operating system for ideas</h2>
          <p>
            This website is where I collect what I learn, what I build, and what I want to
            test next.
          </p>
        </section>

        <footer id="contact" className={styles.footer}>
          <p>© {year} littlemoon</p>
          <div className={styles.footerLinks}>
            <a href="mailto:yuhangxiaocs@gmail.com">Email</a>
            <a href="https://github.com/littlemoon-zh" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  return {
    props: {
      notes: getLatestNotes(3),
      demos: getLatestDemos(3),
    },
  }
}
