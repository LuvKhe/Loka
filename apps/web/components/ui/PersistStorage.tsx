'use client'

import { useEffect } from 'react'

export default function PersistStorage() {
  useEffect(() => {
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(() => {})
      }
    } catch {}
  }, [])

  return null
}
