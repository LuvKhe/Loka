'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@loka/shared/constants'

export default function RecoveryCodeClient() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    // Read once and immediately clear — the plaintext code must never persist
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

  function handleDone() {
    router.replace(ROUTES.HOME)
  }

  if (!code) {
    // If there is no code in sessionStorage, the user likely navigated here directly.
    // Redirect them home — they can view their recovery code from profile settings.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-gray-900 font-medium">Recovery code not available</p>
          <p className="text-sm text-gray-500">
            Your recovery code was already displayed. You can view it again from your profile.
          </p>
          <button onClick={handleDone} className="loka-btn-primary py-2 px-4 text-sm">
            Go to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Save your recovery code</h2>
          <p className="text-sm text-gray-500 mt-2">
            This is the only time you will see this code. If you lose access to this device,
            it is the only way to restore your Loka profile. Loka cannot recover it for you.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Recovery Code</p>
          <p className="font-mono font-bold text-gray-900 text-lg tracking-widest break-all">
            {code}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="loka-btn-secondary w-full py-2.5 text-sm"
          >
            {copied ? 'Copied to clipboard' : 'Copy to clipboard'}
          </button>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              I have saved my recovery code somewhere safe.
            </span>
          </label>

          <button
            onClick={handleDone}
            disabled={!confirmed}
            className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
