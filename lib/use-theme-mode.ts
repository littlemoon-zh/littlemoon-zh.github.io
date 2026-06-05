import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

const THEME_STORAGE_KEY = 'littlemoon:theme-mode'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function getThemeEventName() {
  return 'littlemoon:theme-mode-change'
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
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const customEventName = getThemeEventName()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        onStoreChange()
      }
    }

    mediaQuery.addEventListener('change', onStoreChange)
    window.addEventListener('storage', handleStorage)
    window.addEventListener(customEventName, onStoreChange)

    return () => {
      mediaQuery.removeEventListener('change', onStoreChange)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(customEventName, onStoreChange)
    }
  }, [])

  const mode = useSyncExternalStore<ThemeMode>(subscribe, getStoredMode, () => 'system')

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode)
    applyTheme(nextMode)
    window.dispatchEvent(new Event(getThemeEventName()))
  }, [])

  return {
    mode,
    setMode,
    resolvedTheme: mode === 'system' ? getSystemTheme() : mode,
  }
}
