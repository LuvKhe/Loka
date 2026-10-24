'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateDisplayName } from '@loka/shared/validation'
import { ROUTES } from '@loka/shared/constants'

type Step = 'welcome' | 'name' | 'creating' | 'error'

export default function OnboardingClient() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleNameChange(value: string) {
    setDisplayName(value)
    if (nameError) setNameError(null)
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accepted) return
    const result = validateDisplayName(displayName.trim())
    if (!result.ok) {
      setNameError(result.error)
      return
    }
    createProfile(displayName.trim())
  }

  async function createProfile(name: string) {
    setStep('creating')
    setErrorMessage(null)

    try {
      const supabase = createClient()

      // 1. Sign in anonymously — creates a new anonymous user session
      const { data: existing } = await supabase.auth.getSession()
      if (!existing.session) {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
        if (authError || !authData.user) {
          throw new Error(authError?.message ?? 'Authentication failed')
        }
      }

      // 2. Call the profile setup Edge Function, which:
      //    - Generates a unique Loka ID server-side
      //    - Generates a recovery code and stores only its bcrypt hash
      //    - Inserts the profile and privacy_settings rows
      //    - Returns the generated lokaId and plaintext recovery code (shown once)
      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, acceptedTerms: true }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Profile setup failed')
      }

      const { recoveryCode } = await res.json()

      // 3. Store the recovery code in sessionStorage so the next page can show it once.
      //    It is never stored persistently — only the bcrypt hash is on the server.
      if (recoveryCode) {
        sessionStorage.setItem('loka_recovery_code_once', recoveryCode)
      }

      // 4. Redirect to the recovery code display page so user can write it down
      router.replace(ROUTES.ONBOARDING_RECOVERY)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setErrorMessage(msg)
      setStep('error')
    }
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Loka</h1>
            <p className="text-gray-500 text-sm mt-2">
              Know when your friends are free — privately.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
              <p>No email or password required. No account to create.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
              <p>Your location is never stored — only your general campus area.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
              <p>Only friends you approve can see your status.</p>
            </div>
          </div>

          <button
            onClick={() => setStep('name')}
            className="loka-btn-primary w-full py-3"
          >
            Get started
          </button>
        </div>
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <button
              onClick={() => setStep('welcome')}
              className="text-sm text-gray-400 mb-4 -ml-1 px-1"
            >
              Back
            </button>
            <h2 className="text-xl font-bold text-gray-900">What should friends call you?</h2>
            <p className="text-sm text-gray-500 mt-1">
              This is your display name. You can change it later.
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={40}
                className={['loka-input w-full', nameError ? 'border-red-400 focus:ring-red-400' : ''].join(' ')}
              />
              {nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
            </div>

            <label className="flex items-start gap-3 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                I have read and agree to the{' '}
                <Link href="/terms" target="_blank" className="text-blue-600 underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-blue-600 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={!displayName.trim() || !accepted}
              className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 'creating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  // error step
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-gray-900 font-medium">Something went wrong</p>
        <p className="text-sm text-gray-500">{errorMessage}</p>
        <button
          onClick={() => setStep('name')}
          className="loka-btn-secondary py-2 px-4 text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
