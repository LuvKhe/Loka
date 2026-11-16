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
      const { data: existing } = await supabase.auth.getSession()
      if (!existing.session) {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
        if (authError || !authData.user) {
          throw new Error(authError?.message ?? 'Authentication failed')
        }
      }
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
      if (recoveryCode) {
        sessionStorage.setItem('loka_recovery_code_once', recoveryCode)
      }
      router.replace(ROUTES.ONBOARDING_RECOVERY)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setErrorMessage(msg)
      setStep('error')
    }
  }

  const shell = 'min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black'

  if (step === 'welcome') {
    const features = [
      {
        title: 'No password, no email',
        text: 'Pick a name and you are in. Nothing to remember.',
        icon: <path d="M12 3 4 6v6c0 4.5 3.2 7.6 8 9 4.8-1.4 8-4.5 8-9V6l-8-3Z M9 12l2 2 4-4" />,
      },
      {
        title: 'See who is free',
        text: 'Your timetable shows friends when you are in class and when you are not.',
        icon: <path d="M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4" />,
      },
      {
        title: 'You choose what to share',
        text: 'Only friends you approve see your status. Only the place name is shared, never GPS.',
        icon: <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z M12 11.5h.01" />,
      },
    ]
    return (
      <main id="main" className={shell}>
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <picture>
              <source media="(prefers-color-scheme: dark)" srcSet="/icon-dark-192.png" />
              <img src="/icon-192.png" alt="Loka" width={80} height={80} className="w-20 h-20 rounded-2xl mx-auto mb-5 shadow-lg" />
            </picture>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100" style={{ textWrap: 'balance' }}>
              Know when your friends are free
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2" style={{ textWrap: 'balance' }}>
              Loka is the UNESWA Kwaluseni campus app for timetables and friends.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f.title} className="loka-card flex gap-3 items-start">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {f.icon}
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{f.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <button onClick={() => setStep('name')} className="loka-btn-primary w-full min-h-[3rem] text-base">
              Get started
            </button>
            <p className="text-center text-sm text-gray-700 dark:text-gray-300">
              Already have a Loka profile?{' '}
              <Link href="/restore" className="font-semibold text-blue-700 dark:text-blue-400 underline">
                Restore it
              </Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'name') {
    return (
      <main id="main" className={shell}>
        <div className="w-full max-w-sm space-y-6">
          <div>
            <button
              onClick={() => setStep('welcome')}
              className="text-sm font-medium text-gray-700 dark:text-gray-200 min-h-[2.75rem] -ml-1 px-1"
            >
              Back
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mt-2">Step 1 of 2</p>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1" style={{ textWrap: 'balance' }}>
              What should friends call you?
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This is your display name. You can change it later.
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-5">
            <div>
              <label htmlFor="display-name" className="sr-only">Your display name</label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={40}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? 'name-error' : undefined}
                className={['loka-input w-full min-h-[3.5rem] text-lg', nameError ? 'border-red-500' : ''].join(' ')}
              />
              {nameError && (
                <p id="name-error" role="alert" className="text-sm text-red-700 dark:text-red-400 mt-1.5">{nameError}</p>
              )}
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 min-h-[2.75rem]">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span>
                I have read and agree to the{' '}
                <Link href="/terms" target="_blank" className="text-blue-700 dark:text-blue-400 underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-blue-700 dark:text-blue-400 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={!displayName.trim() || !accepted}
              className="loka-btn-primary w-full min-h-[3rem] text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (step === 'creating') {
    return (
      <main id="main" className={shell}>
        <div className="text-center space-y-3" role="status">
          <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full motion-safe:animate-spin mx-auto" aria-hidden="true" />
          <p className="text-gray-700 dark:text-gray-300">Setting up your profile...</p>
        </div>
      </main>
    )
  }

  return (
    <main id="main" className={shell}>
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
        <button onClick={() => setStep('name')} className="loka-btn-primary min-h-[3rem] px-6">
          Try again
        </button>
      </div>
    </main>
  )
}
