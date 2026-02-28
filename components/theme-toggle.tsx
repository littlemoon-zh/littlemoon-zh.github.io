import { useThemeMode, type ThemeMode } from '@/lib/use-theme-mode'

type ThemeToggleProps = {
  containerClassName: string
  buttonClassName: string
  activeButtonClassName: string
}

const options: Array<{ key: ThemeMode; label: string }> = [
  { key: 'system', label: 'Auto' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
]

export function ThemeToggle({
  containerClassName,
  buttonClassName,
  activeButtonClassName,
}: ThemeToggleProps) {
  const { mode, setMode } = useThemeMode()

  return (
    <div className={containerClassName} role="group" aria-label="Color theme">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => setMode(option.key)}
          className={`${buttonClassName} ${mode === option.key ? activeButtonClassName : ''}`}
          aria-pressed={mode === option.key}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
