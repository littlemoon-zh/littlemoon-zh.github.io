import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { Article } from '@/components/article'
import { Layout } from '@/components/layout'
import { getDemoBySlug, getDemoSlugs, type DemoEntry } from '@/lib/content'
import { renderMarkdown, type TocItem } from '@/lib/markdown'
import { site } from '@/lib/site'
import styles from '@/styles/Article.module.css'

type DemoDetailPageProps = {
  demo: Omit<DemoEntry, 'body'> & {
    html: string
    toc: TocItem[]
  }
}

export default function DemoDetailPage({ demo }: DemoDetailPageProps) {
  return (
    <Layout>
      <Head>
        <title>{`${demo.title} | ${site.name}`}</title>
        <meta name="description" content={demo.summary} />
        <link rel="canonical" href={`${site.url}/demos/${demo.slug}`} />
        <meta property="og:title" content={demo.title} />
        <meta property="og:description" content={demo.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${site.url}/demos/${demo.slug}`} />
      </Head>

      <Article
        title={demo.title}
        date={demo.date}
        summary={demo.summary}
        tags={demo.stack}
        html={demo.html}
        toc={demo.toc}
        back={{ href: '/demos', label: 'All demos' }}
        headerExtra={
          (demo.liveUrl || demo.repoUrl) && (
            <div className={styles.links}>
              {demo.liveUrl && (
                <a href={demo.liveUrl} target="_blank" rel="noreferrer">
                  Live demo ↗
                </a>
              )}
              {demo.repoUrl && (
                <a href={demo.repoUrl} target="_blank" rel="noreferrer">
                  Source ↗
                </a>
              )}
            </div>
          )
        }
      />
    </Layout>
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

  const { html, toc } = await renderMarkdown(demo.body)

  const demoProps: DemoDetailPageProps['demo'] = {
    slug: demo.slug,
    title: demo.title,
    date: demo.date,
    summary: demo.summary,
    draft: demo.draft,
    stack: demo.stack,
    html,
    toc,
    ...(demo.liveUrl ? { liveUrl: demo.liveUrl } : {}),
    ...(demo.repoUrl ? { repoUrl: demo.repoUrl } : {}),
  }

  return {
    props: {
      demo: demoProps,
    },
  }
}
