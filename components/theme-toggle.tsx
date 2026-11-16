import { useThemeMode } from '@/lib/use-theme-mode'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggle } = useThemeMode()
  const label = resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button type="button" className={className} onClick={toggle} aria-label={label} title={label}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />
      </svg>
    </button>
  )
}
