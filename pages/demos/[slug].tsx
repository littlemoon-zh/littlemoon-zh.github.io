import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getDemoBySlug, getDemoSlugs, type DemoEntry } from '@/lib/content'
import { renderMarkdownToHtml } from '@/lib/markdown'
import { site } from '@/lib/site'
import styles from '@/styles/Content.module.css'

type DemoDetailPageProps = {
  demo: Omit<DemoEntry, 'body'> & {
    html: string
  }
}

export default function DemoDetailPage({ demo }: DemoDetailPageProps) {
  return (
    <>
      <Head>
        <title>{`${demo.title} | ${site.name}`}</title>
        <meta name="description" content={demo.summary} />
        <link rel="canonical" href={`${site.url}/demos/${demo.slug}`} />
        <meta property="og:title" content={demo.title} />
        <meta property="og:description" content={demo.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${site.url}/demos/${demo.slug}`} />
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

        <article className={styles.shell}>
          <section className={styles.article}>
            <Link href="/demos" className={styles.backLink}>
              Back to demos
            </Link>
            <h1 className={styles.articleTitle}>{demo.title}</h1>
            <p className={styles.articleSummary}>{demo.summary}</p>
            <div className={styles.articleMeta}>
              <span>{formatDate(demo.date)}</span>
              {demo.stack.map((item) => (
                <span key={item} className={styles.tag}>
                  {item}
                </span>
              ))}
            </div>

            {(demo.liveUrl || demo.repoUrl) && (
              <div className={styles.externalLinks}>
                {demo.liveUrl && (
                  <a
                    href={demo.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.externalBtn}
                  >
                    Live Demo
                  </a>
                )}
                {demo.repoUrl && (
                  <a
                    href={demo.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.externalBtn}
                  >
                    Source Code
                  </a>
                )}
              </div>
            )}

            <section
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: demo.html }}
            />
          </section>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getDemoSlugs().map((slug) => ({
      params: { slug },
    })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<DemoDetailPageProps> = async ({ params }) => {
  const slug = params?.slug
  if (typeof slug !== 'string') {
    return { notFound: true }
  }

  const demo = getDemoBySlug(slug)
  if (!demo) {
    return { notFound: true }
  }

  const html = await renderMarkdownToHtml(demo.body)

  const demoProps: DemoDetailPageProps['demo'] = {
    slug: demo.slug,
    title: demo.title,
    date: demo.date,
    summary: demo.summary,
    draft: demo.draft,
    stack: demo.stack,
    html,
    ...(demo.liveUrl ? { liveUrl: demo.liveUrl } : {}),
    ...(demo.repoUrl ? { repoUrl: demo.repoUrl } : {}),
  }

  return {
    props: {
      demo: demoProps,
    },
  }
}
