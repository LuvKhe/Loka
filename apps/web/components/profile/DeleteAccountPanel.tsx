'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountPanel() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Something went wrong')
      }
      try {
        await createClient().auth.signOut()
      } catch {}
      try {
        sessionStorage.clear()
      } catch {}
      window.location.href = '/onboarding'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="loka-card">
      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">Delete my profile</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
        This permanently removes your profile, timetable, friendships, requests, settings, and location. It cannot be
        undone.
      </p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="loka-btn-secondary py-2 text-xs">
          Delete profile
        </button>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label="Type DELETE to confirm"
            placeholder="Type DELETE to confirm"
            className="loka-input w-full"
            autoCapitalize="characters"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={remove}
              disabled={confirmText !== 'DELETE' || busy}
              className="py-2 px-4 rounded-xl bg-red-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? 'Deleting...' : 'Permanently delete'}
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={busy}
              className="loka-btn-secondary py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
