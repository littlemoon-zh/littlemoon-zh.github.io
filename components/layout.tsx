import Link from 'next/link'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'
import { Moon, useTonightPhase } from '@/components/moon'
import { ThemeToggle } from '@/components/theme-toggle'
import { moonPhaseName } from '@/lib/moon'
import { site } from '@/lib/site'
import styles from '@/styles/Site.module.css'

type LayoutProps = {
  children: ReactNode
  /** Let the content use the full width, for interactive reports. */
  wide?: boolean
}

const sections = [
  { href: '/notes', label: 'Notes' },
  { href: '/demos', label: 'Demos' },
]

export function Layout({ children, wide = false }: LayoutProps) {
  const { pathname } = useRouter()
  const tonight = useTonightPhase()
  const year = new Date().getFullYear()

  return (
    <div className={`${styles.page} ${wide ? styles.wide : ''}`}>
      <header className={`${styles.container} ${styles.header}`}>
        <Link href="/" className={styles.brand}>
          <Moon
            phase={tonight}
            size={18}
            title={tonight === null ? undefined : `Tonight: ${moonPhaseName(tonight).toLowerCase()}`}
          />
          <span>{site.name}</span>
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              aria-current={pathname.startsWith(section.href) ? 'page' : undefined}
            >
              {section.label}
            </Link>
          ))}
          <a href={site.github} target="_blank" rel="noreferrer" className={styles.navExternal}>
            GitHub
          </a>
          <ThemeToggle className={styles.themeToggle} />
        </nav>
      </header>

      <main className={`${styles.container} ${styles.main}`}>{children}</main>

      <footer className={`${styles.container} ${styles.footer}`}>
        <p>
          © {year} {site.owner}
        </p>
        <nav className={styles.footerLinks} aria-label="Contact">
          <a href={`mailto:${site.email}`}>Email</a>
          <a href={site.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={site.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href="/feed.xml">RSS</a>
        </nav>
      </footer>
    </div>
  )
}
