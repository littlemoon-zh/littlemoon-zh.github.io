import { useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

const THEME_STORAGE_KEY = 'littlemoon:theme-mode'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  if (mode === 'system') {
    root.removeAttribute('data-theme')
    root.style.colorScheme = 'light dark'
    return
  }

  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
}

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    const initialMode: ThemeMode =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    setMode(initialMode)
    applyTheme(initialMode)
  }, [])

  useEffect(() => {
    applyTheme(mode)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    }
  }, [mode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  return {
    mode,
    setMode,
    resolvedTheme: mode === 'system' ? getSystemTheme() : mode,
  }
}
