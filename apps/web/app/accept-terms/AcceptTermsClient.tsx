'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AcceptTermsClient() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Something went wrong')
      }
      router.replace('/home')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Updated terms</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Our Terms of Use and Privacy Policy have changed. Please review and accept them to keep using Loka.
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            I have read and agree to the{' '}
            <Link href="/terms" target="_blank" className="text-blue-600 dark:text-blue-400 underline">
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <button
          onClick={accept}
          disabled={!checked || busy}
          className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Saving...' : 'Accept and continue'}
        </button>
      </div>
    </div>
  )
}
