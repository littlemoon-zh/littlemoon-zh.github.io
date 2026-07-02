import type { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDate } from '@/lib/date'
import { getPortfolioDemosMeta, type DemoMeta } from '@/lib/content'
import { site } from '@/lib/site'
import { useStoredView } from '@/lib/use-stored-view'
import styles from '@/styles/Content.module.css'

type DemosPageProps = {
  demos: DemoMeta[]
}

export default function DemosPage({ demos }: DemosPageProps) {
  const [view, setView] = useStoredView('littlemoon:demos:view')

  return (
    <>
      <Head>
        <title>{`Demos | ${site.name}`}</title>
        <meta
          name="description"
          content="Personal demos and video AI prototypes by Yuhang Xiao."
        />
        <link rel="canonical" href={`${site.url}/demos`} />
        <meta property="og:title" content={`Demos | ${site.name}`} />
        <meta property="og:description" content="Prototype notes behind Littlemoon." />
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

        <div className={styles.shell}>
          <section className={styles.header}>
            <p className={styles.label}>Demos</p>
            <h1>Personal demos, starting with video work.</h1>
            <p className={styles.subtitle}>
              可运行的个人作品会放在这里，优先是视频 AI、生成流程和交互原型。
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

          {demos.length > 0 ? (
            <section className={`${styles.grid} ${view === 'rows' ? styles.rows : ''}`}>
              {demos.map((demo) => (
                <Link key={demo.slug} href={`/demos/${demo.slug}`} className={styles.card}>
                  <p className={styles.meta}>{formatDate(demo.date)}</p>
                  <h2>{demo.title}</h2>
                  <p>{demo.summary}</p>
                  {demo.stack.length > 0 && (
                    <div className={styles.tags}>
                      {demo.stack.map((item) => (
                        <span key={item} className={styles.tag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className={styles.cardLink}>Open</span>
                </Link>
              ))}
            </section>
          ) : (
            <section className={styles.empty}>Video demos will appear here.</section>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<DemosPageProps> = async () => {
  return {
    props: {
      demos: getPortfolioDemosMeta(),
    },
  }
}
