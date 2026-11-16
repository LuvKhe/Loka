'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@loka/shared/constants'

export default function RecoveryCodeClient() {
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('loka_recovery_code_once')
    if (stored) {
      sessionStorage.removeItem('loka_recovery_code_once')
      setCode(stored)
    }
  }, [])

  function handleCopy() {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleDone() {
    setNavigating(true)
    const supabase = createClient()
    let attempts = 0
    while (attempts < 10) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) break
      await new Promise((r) => setTimeout(r, 200))
      attempts++
    }
    window.location.href = ROUTES.HOME
  }

  const shell = 'min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black'

  if (!code) {
    return (
      <main id="main" className={shell}>
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recovery code not available</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your recovery code was already shown and cannot be displayed again. Open Profile, then Recovery code, to create a new one.
          </p>
          <button onClick={handleDone} className="loka-btn-primary min-h-[3rem] px-6">
            Go to home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main id="main" className={shell}>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Step 2 of 2</p>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1" style={{ textWrap: 'balance' }}>
            Save your recovery code
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            This is the only time you will see it. If you lose this device, your Loka ID and this code are the only way to get your profile back.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-violet-900 text-white p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider">Recovery code</p>
          <p className="font-mono font-bold text-xl tracking-wider break-all mt-1 select-all">{code}</p>
          <button
            onClick={handleCopy}
            className="mt-4 min-h-[2.75rem] px-4 rounded-full text-sm font-semibold bg-black/30 active:scale-95 transition-transform duration-150"
          >
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>

        <ul className="loka-card list-disc pl-9 pr-4 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
          <li>Save it in Notes or a password manager. A screenshot is not enough if you delete it.</li>
          <li>Add Loka to your home screen and open it from there to stay signed in.</li>
        </ul>

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200 min-h-[2.75rem]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 mt-0.5 shrink-0"
            />
            <span>I have saved my recovery code somewhere safe.</span>
          </label>

          <button
            onClick={handleDone}
            disabled={!confirmed || navigating}
            className="loka-btn-primary w-full min-h-[3rem] text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {navigating ? 'Loading...' : 'Done'}
          </button>
        </div>
      </div>
    </main>
  )
}
