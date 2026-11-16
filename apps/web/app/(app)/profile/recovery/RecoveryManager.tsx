'use client'

import { useState } from 'react'

export default function RecoveryManager() {
  const [understood, setUnderstood] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/recovery/regenerate', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data.recoveryCode !== 'string') {
        setError(typeof data.error === 'string' ? data.error : 'Could not create a recovery code')
        return
      }
      setCode(data.recoveryCode)
    } catch {
      setError('Could not reach Loka. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function copy() {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (code && !saved) {
    return (
      <div className="space-y-4">
        <div className="loka-card space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            This is the only time you will see this code. Save it in Notes or a password manager.
          </p>
          <p
            className="font-mono text-xl font-bold tracking-wider text-gray-900 dark:text-gray-100 break-all"
            aria-label="Your new recovery code"
          >
            {code}
          </p>
          <button onClick={copy} className="loka-btn-secondary min-h-[2.75rem] px-4 text-sm">
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <button onClick={() => { setSaved(true); setCode(null) }} className="loka-btn-primary w-full min-h-[3rem]">
          I have saved it
        </button>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="loka-card space-y-2">
        <p className="font-bold text-gray-900 dark:text-gray-100">Recovery code saved</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If you ever lose this device, use your Loka ID and this code on the Restore screen to get your profile back.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="loka-card space-y-3">
        <p className="font-semibold text-gray-900 dark:text-gray-100">If you lose this device</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your Loka ID plus your recovery code bring your profile, timetable and friends back on a new phone.
          We only store a one-way scrambled version, so we cannot show you the old code again.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If you have lost your code, or you are not sure it was ever saved, create a new one here.
        </p>
      </div>

      <label className="flex items-start gap-3 min-h-[2.75rem] text-sm text-gray-700 dark:text-gray-200">
        <input
          type="checkbox"
          className="w-5 h-5 mt-0.5 shrink-0"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
        />
        <span>I understand my old recovery code will stop working.</span>
      </label>

      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}

      <button
        onClick={create}
        disabled={!understood || busy}
        className="loka-btn-primary w-full min-h-[3rem] disabled:opacity-40"
      >
        {busy ? 'Creating...' : 'Create a new recovery code'}
      </button>
    </div>
  )
}
