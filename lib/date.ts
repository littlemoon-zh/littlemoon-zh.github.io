function parseDate(dateInput: string): Date | null {
  const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = dateMatch
    ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))
    : new Date(dateInput)

  return Number.isNaN(date.getTime()) ? null : date
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `07.02`, for rows that already sit under a year heading. */
export function formatMonthDay(dateInput: string): string {
  const date = parseDate(dateInput)
  if (!date) {
    return dateInput
  }

  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

/** `2026.07.02` */
export function formatDotDate(dateInput: string): string {
  const date = parseDate(dateInput)
  if (!date) {
    return dateInput
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

export function getYear(dateInput: string): string {
  const date = parseDate(dateInput)
  return date ? String(date.getFullYear()) : ''
}
