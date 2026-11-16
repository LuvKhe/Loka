'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RestoreClient() {
  const [lokaId, setLokaId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/recovery/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lokaId, recoveryCode: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not restore your profile')
        setBusy(false)
        return
      }
      window.location.href = '/home'
    } catch {
      setError('Could not reach Loka. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <main id="main" className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <Link href="/onboarding" className="text-sm font-medium text-gray-700 dark:text-gray-200 min-h-[2.75rem] inline-flex items-center -ml-1 px-1">
            Back
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100" style={{ textWrap: 'balance' }}>
            Restore your profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Enter the Loka ID and recovery code from when you first set up Loka. Your timetable, friends and settings come back.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="loka-id" className="loka-section-label block">Loka ID</label>
            <input
              id="loka-id"
              type="text"
              value={lokaId}
              onChange={(e) => setLokaId(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={9}
              className="loka-input w-full min-h-[3rem] font-mono tracking-wider"
            />
          </div>
          <div>
            <label htmlFor="recovery-code" className="loka-section-label block">Recovery code</label>
            <input
              id="recovery-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LOKA-XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              className="loka-input w-full min-h-[3rem] font-mono tracking-wider"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || lokaId.trim().length < 9 || code.trim().length < 10}
            className="loka-btn-primary w-full min-h-[3rem] text-base disabled:opacity-40"
          >
            {busy ? 'Restoring...' : 'Restore my profile'}
          </button>
        </form>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          Lost your recovery code? Loka cannot recover it for you. If you are still signed in on another device,
          open Profile, then Recovery code, to create a new one.
        </p>
      </div>
    </main>
  )
}
