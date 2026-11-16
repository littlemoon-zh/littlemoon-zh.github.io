import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { Layout } from '@/components/layout'
import { EntryList, type ListEntry } from '@/components/note-list'
import { getPortfolioDemosMeta } from '@/lib/content'
import { site } from '@/lib/site'
import styles from '@/styles/Site.module.css'

type DemosPageProps = {
  demos: ListEntry[]
}

export default function DemosPage({ demos }: DemosPageProps) {
  return (
    <Layout>
      <Head>
        <title>{`Demos | ${site.name}`}</title>
        <meta name="description" content="Personal demos and video AI prototypes by Yuhang Xiao." />
        <link rel="canonical" href={`${site.url}/demos`} />
        <meta property="og:title" content={`Demos | ${site.name}`} />
        <meta property="og:description" content="Personal demos and video AI prototypes by Yuhang Xiao." />
      </Head>

      <div className={`${styles.grid} ${styles.stack} ${styles.indexHead}`}>
        <div className={styles.body}>
          <h1>Demos</h1>
          <p>Things that run: video AI, generation pipelines and interactive prototypes.</p>
        </div>
      </div>

      {demos.length > 0 ? (
        <EntryList entries={demos} />
      ) : (
        <div className={`${styles.grid} ${styles.stack}`}>
          <p className={`${styles.body} ${styles.empty}`}>Nothing public yet. Demos will show up here.</p>
        </div>
      )}
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<DemosPageProps> = async () => {
  return {
    props: {
      demos: getPortfolioDemosMeta().map((demo) => ({
        href: `/demos/${demo.slug}`,
        title: demo.title,
        date: demo.date,
        summary: demo.summary,
        tags: demo.stack,
      })),
    },
  }
}
