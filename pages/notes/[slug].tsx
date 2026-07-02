import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { getArtifactDefinition, type ArtifactDefinition } from '@/components/artifacts/registry'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getNoteBySlug, getNoteSlugs, type NoteEntry } from '@/lib/content'
import { renderMarkdownToHtml } from '@/lib/markdown'
import { site } from '@/lib/site'
import styles from '@/styles/Content.module.css'

type NoteDetailPageProps = {
  note: Omit<NoteEntry, 'body'> & {
    html: string
  }
}

function renderArtifact(
  note: NoteDetailPageProps['note'],
  artifact: ArtifactDefinition | null,
  productionUrl: string,
): ReactNode {
  if (artifact) {
    const ArtifactComponent = artifact.Component
    return <ArtifactComponent note={note} productionUrl={productionUrl} />
  }

  return (
    <section
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: note.html }}
    />
  )
}

function NoteHead({ note }: NoteDetailPageProps) {
  return (
    <Head>
      <title>{`${note.title} | ${site.name}`}</title>
      <meta name="description" content={note.summary} />
      <link rel="canonical" href={`${site.url}/notes/${note.slug}`} />
      <meta property="og:title" content={note.title} />
      <meta property="og:description" content={note.summary} />
      <meta property="og:type" content={note.layout === 'artifact' ? 'website' : 'article'} />
      <meta property="og:url" content={`${site.url}/notes/${note.slug}`} />
      <meta property="article:published_time" content={note.date} />
    </Head>
  )
}

function SiteTopbar() {
  return (
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
  )
}

function ArtifactTopbar({ note }: NoteDetailPageProps) {
  return (
    <header className={styles.artifactTopbar}>
      <Link href="/" className={styles.brand}>
        {site.name}
      </Link>
      <div className={styles.artifactAddress} aria-label="Hosted page path">
        <span>Hosted HTML</span>
        <strong>/notes/{note.slug}</strong>
      </div>
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
  )
}

function ArtifactNotes({
  note,
  heading,
}: NoteDetailPageProps & {
  heading?: string
}) {
  if (!note.html) {
    return null
  }

  return (
    <section className={styles.artifactNotes}>
      <div>
        <p className={styles.label}>Research notes</p>
        <h2>{heading || 'Notes and implementation details.'}</h2>
      </div>
      <section
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: note.html }}
      />
    </section>
  )
}

function BrowserArtifactPage({
  note,
  artifact,
  productionUrl,
}: NoteDetailPageProps & {
  artifact: ArtifactDefinition | null
  productionUrl: string
}) {
  return (
    <>
      <NoteHead note={note} />
      <main className={`${styles.page} ${styles.artifactPage}`}>
        <ArtifactTopbar note={note} />

        <article className={styles.artifactShell}>
          <section className={styles.artifactHero}>
            <div>
              <Link href="/notes" className={styles.backLink}>
                Back to notes
              </Link>
              <p className={styles.label}>GitHub-hosted artifact</p>
              <h1>{note.title}</h1>
              <p>{note.summary}</p>
              <div className={styles.articleMeta}>
                <span>{formatDate(note.date)}</span>
                {note.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <aside className={styles.artifactRoutePanel}>
              <span>Production URL</span>
              <a href={productionUrl}>{productionUrl.replace('https://', '')}</a>
              <p>Static export, shareable as a standalone hosted page.</p>
            </aside>
          </section>

          <section className={styles.artifactStage} aria-label="Hosted artifact">
            <div className={styles.artifactStageBar}>
              <span className={styles.windowDots} aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span>{artifact?.label || note.artifact || 'html-artifact'}</span>
              <a href={productionUrl}>Open canonical</a>
            </div>
            <div className={styles.artifactCanvas}>
              {renderArtifact(note, artifact, productionUrl)}
            </div>
          </section>

          <ArtifactNotes note={note} heading={artifact?.notesHeading} />
        </article>
      </main>
    </>
  )
}

function ImmersiveArtifactPage({
  note,
  artifact,
  productionUrl,
}: NoteDetailPageProps & {
  artifact: ArtifactDefinition | null
  productionUrl: string
}) {
  return (
    <>
      <NoteHead note={note} />
      <main className={`${styles.page} ${styles.artifactPage}`}>
        <ArtifactTopbar note={note} />
        <article className={styles.immersiveArtifactShell}>
          {renderArtifact(note, artifact, productionUrl)}
          <ArtifactNotes note={note} heading={artifact?.notesHeading} />
        </article>
      </main>
    </>
  )
}

function CustomArtifactPage({
  note,
  artifact,
  productionUrl,
}: NoteDetailPageProps & {
  artifact: ArtifactDefinition | null
  productionUrl: string
}) {
  return (
    <>
      <NoteHead note={note} />
      {renderArtifact(note, artifact, productionUrl)}
    </>
  )
}

function ArticleNotePage({ note }: NoteDetailPageProps) {
  return (
    <>
      <NoteHead note={note} />
      <main className={styles.page}>
        <SiteTopbar />

        <article className={styles.shell}>
          <section className={styles.article}>
            <Link href="/notes" className={styles.backLink}>
              Back to notes
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

export default function NoteDetailPage({ note }: NoteDetailPageProps) {
  if (note.layout === 'artifact') {
    const artifact = getArtifactDefinition(note.artifact)
    const productionUrl = `${site.url}/notes/${note.slug}`
    const chrome = note.artifactChrome || artifact?.chrome || 'browser'

    if (chrome === 'custom') {
      return <CustomArtifactPage note={note} artifact={artifact} productionUrl={productionUrl} />
    }

    if (chrome === 'immersive') {
      return <ImmersiveArtifactPage note={note} artifact={artifact} productionUrl={productionUrl} />
    }

    return <BrowserArtifactPage note={note} artifact={artifact} productionUrl={productionUrl} />
  }

  return <ArticleNotePage note={note} />
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
        layout: note.layout,
        ...(note.artifact ? { artifact: note.artifact } : {}),
        ...(note.artifactChrome ? { artifactChrome: note.artifactChrome } : {}),
        html,
      },
    },
  }
}
