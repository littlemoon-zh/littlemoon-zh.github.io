import { useCallback, useSyncExternalStore, type SetStateAction } from 'react'

export type ListView = 'cards' | 'rows'

function isListView(value: string | null): value is ListView {
  return value === 'cards' || value === 'rows'
}

function getStoredView(storageKey: string, fallback: ListView): ListView {
  if (typeof window === 'undefined') {
    return fallback
  }

  const stored = window.localStorage.getItem(storageKey)
  return isListView(stored) ? stored : fallback
}

function getStorageEventName(storageKey: string) {
  return `littlemoon:storage:${storageKey}`
}

export function useStoredView(storageKey: string, fallback: ListView = 'cards') {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => {}
      }

      const customEventName = getStorageEventName(storageKey)
      const handleStorage = (event: StorageEvent) => {
        if (event.key === storageKey) {
          onStoreChange()
        }
      }

      window.addEventListener('storage', handleStorage)
      window.addEventListener(customEventName, onStoreChange)

      return () => {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener(customEventName, onStoreChange)
      }
    },
    [storageKey],
  )

  const view = useSyncExternalStore(
    subscribe,
    () => getStoredView(storageKey, fallback),
    () => fallback,
  )

  const setView = useCallback(
    (nextView: SetStateAction<ListView>) => {
      if (typeof window === 'undefined') {
        return
      }

      const value =
        typeof nextView === 'function' ? nextView(getStoredView(storageKey, fallback)) : nextView

      window.localStorage.setItem(storageKey, value)
      window.dispatchEvent(new Event(getStorageEventName(storageKey)))
    },
    [fallback, storageKey],
  )

  return [view, setView] as const
}
