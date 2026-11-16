import { useSyncExternalStore } from 'react'
import { moonLitPath, moonPhase, moonPhaseForDate, moonPhaseName } from '@/lib/moon'

type MoonProps = {
  /** Cycle fraction from `moonPhase`; `null` draws an empty disc. */
  phase: number | null
  size?: number
  className?: string
  title?: string
}

export function Moon({ phase, size = 12, className, title }: MoonProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="11" fill="var(--moon-shadow)" />
      {phase !== null && <path d={moonLitPath(phase, 11, 12)} fill="var(--moon-lit)" />}
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="none"
        stroke="var(--moon-rim)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** The moon on the day a note was written. */
export function NoteMoon({ date, size, className }: { date: string; size?: number; className?: string }) {
  const phase = moonPhaseForDate(date)
  return <Moon phase={phase} size={size} className={className} title={moonPhaseName(phase)} />
}

const subscribeToNothing = () => () => {}

/**
 * Tonight's phase, known only in the browser. The server snapshot is `null`
 * so a statically exported page never ships a stale moon.
 */
export function useTonightPhase(): number | null {
  return useSyncExternalStore(
    subscribeToNothing,
    () => Math.round(moonPhase(new Date()) * 200) / 200,
    () => null,
  )
}
