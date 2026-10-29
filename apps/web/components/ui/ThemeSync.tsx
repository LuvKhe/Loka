'use client'

import { useEffect } from 'react'

function apply() {
  try {
    const t = localStorage.getItem('loka-theme')
    const m = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = t === 'dark' || ((t === null || t === 'system') && m)
    const el = document.documentElement
    el.classList.toggle('dark', dark)
    el.style.colorScheme = dark ? 'dark' : 'light'
  } catch {}
}

export default function ThemeSync() {
  useEffect(() => {
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    window.addEventListener('pageshow', apply)
    document.addEventListener('visibilitychange', apply)
    window.addEventListener('storage', apply)
    return () => {
      mq.removeEventListener('change', apply)
      window.removeEventListener('pageshow', apply)
      document.removeEventListener('visibilitychange', apply)
      window.removeEventListener('storage', apply)
    }
  }, [])
  return null
}
