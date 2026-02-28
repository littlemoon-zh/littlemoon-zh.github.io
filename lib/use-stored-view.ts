import { useEffect, useState } from 'react'

export type ListView = 'cards' | 'rows'

export function useStoredView(storageKey: string, fallback: ListView = 'cards') {
  const [view, setView] = useState<ListView>(fallback)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'cards' || stored === 'rows') {
      setView(stored)
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey, view)
  }, [storageKey, view])

  return [view, setView] as const
}
