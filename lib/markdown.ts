import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from 'rehype-pretty-code'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'

export type TocItem = {
  id: string
  text: string
  depth: 2 | 3
}

export type RenderedMarkdown = {
  html: string
  toc: TocItem[]
}

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },
  keepBackground: false,
  defaultLang: 'text',
}

function textOf(node: HastNode): string {
  if (node.type === 'text') {
    return node.value || ''
  }

  return (node.children || []).map(textOf).join('')
}

/** Collects h2/h3 headings. Must run after rehype-slug and before anchors are appended. */
function collectToc(toc: TocItem[]) {
  return () => (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        const id = node.properties?.id
        const text = textOf(node).trim()

        if (typeof id === 'string' && text) {
          toc.push({ id, text, depth: node.tagName === 'h2' ? 2 : 3 })
        }
      }

      node.children?.forEach(visit)
    }

    visit(tree)
  }
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const toc: TocItem[] = []

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(collectToc(toc))
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: {
        className: ['heading-anchor'],
        ariaHidden: 'true',
        tabIndex: -1,
      },
      content: {
        type: 'text',
        value: '#',
      },
    })
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown)

  return { html: String(file), toc }
}
