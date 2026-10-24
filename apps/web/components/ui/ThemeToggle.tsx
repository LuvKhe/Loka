'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('loka-theme')
      if (stored === 'light' || stored === 'dark' || stored === 'system') setTheme(stored)
    } catch {}
  }, [])

  function choose(next: Theme) {
    setTheme(next)
    try {
      localStorage.setItem('loka-theme', next)
    } catch {}
    applyTheme(next)
  }

  return (
    <div className="loka-card">
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
              theme === o.value
                ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                : 'bg-white border-gray-300 text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-200',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
