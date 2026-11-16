import { useEffect, useRef, useState } from 'react'
import type { TocItem } from '@/lib/markdown'
import styles from '@/styles/Article.module.css'

/** Sticky outline that marks the section currently being read. */
export function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null)

    if (headings.length === 0) {
      return
    }

    // The active section is the last heading that has scrolled past the top
    // quarter of the viewport.
    const update = () => {
      const line = window.innerHeight * 0.25
      let current: string | null = null

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) {
          current = heading.id
        } else {
          break
        }
      }

      setActiveId(current)
    }

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  // A long outline scrolls inside its own box; keep the active entry in view.
  useEffect(() => {
    const nav = navRef.current
    const link = nav?.querySelector<HTMLElement>('a[aria-current="location"]')
    if (!nav || !link) {
      return
    }

    const top = link.offsetTop
    const bottom = top + link.offsetHeight

    if (top < nav.scrollTop) {
      nav.scrollTop = top - 32
    } else if (bottom > nav.scrollTop + nav.clientHeight) {
      nav.scrollTop = bottom - nav.clientHeight + 32
    }
  }, [activeId])

  return (
    <nav ref={navRef} className={styles.toc} aria-label="Contents">
      <h2>Contents</h2>
      <ol>
        {items.map((item) => (
          <li key={item.id} data-depth={item.depth}>
            <a href={`#${item.id}`} aria-current={activeId === item.id ? 'location' : undefined}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
