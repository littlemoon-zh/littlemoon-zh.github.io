// Moon phase maths for the site's signature motif: every note is marked with
// the phase of the moon on the day it was written.
//
// The model is the mean synodic month counted from a known new moon. It drifts
// from the true phase by a few hours at most, which is invisible at icon size.

const SYNODIC_MONTH_DAYS = 29.530588853
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14)
const DAY_MS = 86_400_000

/** Phase as a fraction of the cycle: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - REFERENCE_NEW_MOON_MS) / DAY_MS
  const phase = (days % SYNODIC_MONTH_DAYS) / SYNODIC_MONTH_DAYS
  return phase < 0 ? phase + 1 : phase
}

/** Phase for a `yyyy-mm-dd` note date, read as the evening of that day in UTC+8. */
export function moonPhaseForDate(dateInput: string): number {
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) {
    const parsed = new Date(dateInput)
    return Number.isNaN(parsed.getTime()) ? 0 : moonPhase(parsed)
  }

  const [, year, month, day] = match
  return moonPhase(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12)))
}

export function moonPhaseName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return 'New moon'
  if (phase < 0.22) return 'Waxing crescent'
  if (phase < 0.28) return 'First quarter'
  if (phase < 0.47) return 'Waxing gibbous'
  if (phase < 0.53) return 'Full moon'
  if (phase < 0.72) return 'Waning gibbous'
  if (phase < 0.78) return 'Last quarter'
  return 'Waning crescent'
}

/** Share of the disc that is lit, 0 to 1. */
export function moonIllumination(phase: number): number {
  return (1 - Math.cos(2 * Math.PI * phase)) / 2
}

/**
 * SVG path of the lit part of a disc with the given centre and radius.
 *
 * The lit shape is bounded by half of the disc's edge and by the terminator,
 * which seen from Earth is half an ellipse whose horizontal radius shrinks to
 * zero at the quarters. Waxing moons are lit on the right, as seen from the
 * northern hemisphere.
 */
export function moonLitPath(phase: number, radius: number, center: number): string {
  const k = Math.cos(2 * Math.PI * phase)
  const terminatorRadius = (Math.abs(k) * radius).toFixed(2)
  const waxing = phase < 0.5
  const crescent = k > 0
  const top = `${center},${(center - radius).toFixed(2)}`
  const bottom = `${center},${(center + radius).toFixed(2)}`
  const edgeSweep = waxing ? 1 : 0
  const terminatorSweep = waxing === crescent ? 0 : 1

  return `M${top}A${radius},${radius} 0 0 ${edgeSweep} ${bottom}A${terminatorRadius},${radius} 0 0 ${terminatorSweep} ${top}Z`
}
