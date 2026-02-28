import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getNoteBySlug, getNoteSlugs, type NoteEntry } from '@/lib/content'
import { renderMarkdownToHtml } from '@/lib/markdown'
import styles from '@/styles/Content.module.css'

type NoteDetailPageProps = {
  note: Omit<NoteEntry, 'body'> & {
    html: string
  }
}

export default function NoteDetailPage({ note }: NoteDetailPageProps) {
  return (
    <>
      <Head>
        <title>{note.title} | Notes</title>
        <meta name="description" content={note.summary} />
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

        <article className={styles.shell}>
          <section className={styles.article}>
            <Link href="/notes" className={styles.backLink}>
              ← Back to notes
            </Link>
            <h1 className={styles.articleTitle}>{note.title}</h1>
            <p className={styles.articleSummary}>{note.summary}</p>
            <div className={styles.articleMeta}>
              <span>{formatDate(note.date)}</span>
              {note.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <section
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: note.html }}
            />
          </section>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getNoteSlugs().map((slug) => ({
      params: { slug },
    })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<NoteDetailPageProps> = async ({ params }) => {
  const slug = params?.slug
  if (typeof slug !== 'string') {
    return { notFound: true }
  }

  const note = getNoteBySlug(slug)
  if (!note) {
    return { notFound: true }
  }

  const html = await renderMarkdownToHtml(note.body)

  return {
    props: {
      note: {
        slug: note.slug,
        title: note.title,
        date: note.date,
        summary: note.summary,
        draft: note.draft,
        tags: note.tags,
        html,
      },
    },
  }
}
