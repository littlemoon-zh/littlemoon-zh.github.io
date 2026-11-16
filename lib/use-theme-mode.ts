import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'littlemoon:theme-mode'
const THEME_EVENT_NAME = 'littlemoon:theme-mode-change'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Runs in <head> before first paint so a stored choice never flashes the
 * other theme. Keep it in sync with `applyTheme`.
 */
export const themeInitScript = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m==='light'||m==='dark'){var r=document.documentElement;r.setAttribute('data-theme',m);r.style.colorScheme=m}}catch(e){}})()`

function getStoredMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement

  if (mode === 'system') {
    root.removeAttribute('data-theme')
    root.style.colorScheme = 'light dark'
    return
  }

  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
}

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(DARK_QUERY)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      onStoreChange()
    }
  }

  mediaQuery.addEventListener('change', onStoreChange)
  window.addEventListener('storage', handleStorage)
  window.addEventListener(THEME_EVENT_NAME, onStoreChange)

  return () => {
    mediaQuery.removeEventListener('change', onStoreChange)
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(THEME_EVENT_NAME, onStoreChange)
  }
}

export function useThemeMode() {
  const mode = useSyncExternalStore<ThemeMode>(subscribe, getStoredMode, () => 'system')
  const systemTheme = useSyncExternalStore<ResolvedTheme>(subscribe, getSystemTheme, () => 'light')
  const resolvedTheme: ResolvedTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    try {
      if (nextMode === 'system') {
        window.localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode)
      }
    } catch {
      // Storage can be blocked; the choice then lasts for this page only.
    }

    applyTheme(nextMode)
    window.dispatchEvent(new Event(THEME_EVENT_NAME))
  }, [])

  /** Flip light/dark. Landing back on the system's own theme clears the override. */
  const toggle = useCallback(() => {
    const next: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setMode(next === getSystemTheme() ? 'system' : next)
  }, [resolvedTheme, setMode])

  return { mode, setMode, resolvedTheme, toggle }
}
