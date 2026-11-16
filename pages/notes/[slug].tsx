import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import type { ReactNode } from 'react'
import { Article, ArticleHeader, DateMargin, Prose, type Neighbour } from '@/components/article'
import { getArtifactDefinition, type ArtifactDefinition } from '@/components/artifacts/registry'
import { Layout } from '@/components/layout'
import { getAllNotesMeta, getNoteBySlug, getNoteSlugs, type NoteEntry } from '@/lib/content'
import { renderMarkdown, type TocItem } from '@/lib/markdown'
import { site } from '@/lib/site'
import grid from '@/styles/Site.module.css'
import styles from '@/styles/Article.module.css'

type NoteDetailPageProps = {
  note: Omit<NoteEntry, 'body'> & {
    html: string
    toc: TocItem[]
  }
  newer: Neighbour | null
  older: Neighbour | null
}

const tagHref = (tag: string) => `/notes?tag=${encodeURIComponent(tag)}`

function renderArtifact(
  note: NoteDetailPageProps['note'],
  artifact: ArtifactDefinition | null,
  productionUrl: string,
): ReactNode {
  if (artifact) {
    const ArtifactComponent = artifact.Component
    return <ArtifactComponent note={note} productionUrl={productionUrl} />
  }

  return <Prose html={note.html} />
}

function NoteHead({ note }: Pick<NoteDetailPageProps, 'note'>) {
  return (
    <Head>
      <title>{`${note.title} | ${site.name}`}</title>
      <meta name="description" content={note.summary} />
      <link rel="canonical" href={`${site.url}${note.href}`} />
      <meta property="og:title" content={note.title} />
      <meta property="og:description" content={note.summary} />
      <meta property="og:type" content={note.layout === 'artifact' ? 'website' : 'article'} />
      <meta property="og:url" content={`${site.url}${note.href}`} />
      <meta property="article:published_time" content={note.date} />
    </Head>
  )
}

/** The written notes that accompany an interactive report. */
function ArtifactNotes({ note, heading }: Pick<NoteDetailPageProps, 'note'> & { heading?: string }) {
  if (!note.html) {
    return null
  }

  return (
    <section className={`${grid.grid} ${grid.stack} ${styles.artifactNotes}`}>
      <DateMargin date={note.date} />
      <div className={grid.body}>
        <h2>{heading || 'Notes'}</h2>
        <Prose html={note.html} />
      </div>
    </section>
  )
}

type ArtifactPageProps = Pick<NoteDetailPageProps, 'note'> & {
  artifact: ArtifactDefinition | null
  productionUrl: string
}

/** `browser` chrome: the site introduces the report, then shows it in a frame. */
function FramedArtifactPage({ note, artifact, productionUrl }: ArtifactPageProps) {
  return (
    <Layout wide>
      <NoteHead note={note} />
      <div className={`${grid.grid} ${grid.stack} ${styles.artifactHead}`}>
        <DateMargin date={note.date} />
        <div className={grid.body}>
          <ArticleHeader title={note.title} summary={note.summary} tags={note.tags} tagHref={tagHref} />
        </div>
      </div>
      <section className={styles.frame} aria-label={artifact?.label || note.title}>
        {renderArtifact(note, artifact, productionUrl)}
      </section>
      <ArtifactNotes note={note} heading={artifact?.notesHeading} />
    </Layout>
  )
}

/** `immersive` chrome: the report owns the page below the site header. */
function ImmersiveArtifactPage({ note, artifact, productionUrl }: ArtifactPageProps) {
  return (
    <Layout wide>
      <NoteHead note={note} />
      {renderArtifact(note, artifact, productionUrl)}
      <ArtifactNotes note={note} heading={artifact?.notesHeading} />
    </Layout>
  )
}

export default function NoteDetailPage({ note, newer, older }: NoteDetailPageProps) {
  if (note.layout === 'artifact') {
    const artifact = getArtifactDefinition(note.artifact)
    const productionUrl = `${site.url}/notes/${note.slug}`
    const chrome = note.artifactChrome || artifact?.chrome || 'browser'

    if (chrome === 'custom') {
      return (
        <>
          <NoteHead note={note} />
          {renderArtifact(note, artifact, productionUrl)}
        </>
      )
    }

    if (chrome === 'immersive') {
      return <ImmersiveArtifactPage note={note} artifact={artifact} productionUrl={productionUrl} />
    }

    return <FramedArtifactPage note={note} artifact={artifact} productionUrl={productionUrl} />
  }

  return (
    <Layout>
      <NoteHead note={note} />
      <Article
        title={note.title}
        date={note.date}
        summary={note.summary}
        tags={note.tags}
        tagHref={tagHref}
        html={note.html}
        toc={note.toc}
        newer={newer}
        older={older}
        back={{ href: '/notes', label: 'All notes' }}
      />
    </Layout>
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

  const { html, toc } = await renderMarkdown(note.body)

  // Notes are sorted newest first, so the previous entry in the list is newer.
  const allNotes = getAllNotesMeta()
  const index = allNotes.findIndex((entry) => entry.href === note.href)
  const toNeighbour = (entry: (typeof allNotes)[number] | undefined): Neighbour | null =>
    entry ? { href: entry.href, title: entry.title, external: entry.source === 'site' } : null

  return {
    props: {
      note: {
        slug: note.slug,
        href: note.href,
        source: note.source,
        title: note.title,
        date: note.date,
        summary: note.summary,
        draft: note.draft,
        tags: note.tags,
        layout: note.layout,
        ...(note.artifact ? { artifact: note.artifact } : {}),
        ...(note.artifactChrome ? { artifactChrome: note.artifactChrome } : {}),
        html,
        toc,
      },
      newer: index > 0 ? toNeighbour(allNotes[index - 1]) : null,
      older: index >= 0 ? toNeighbour(allNotes[index + 1]) : null,
    },
  }
}
