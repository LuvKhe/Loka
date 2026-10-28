'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateDisplayName, validateBio } from '@loka/shared/validation'

interface Props {
  userId: string
  displayName: string
  bio: string
}

const BIO_MAX = 160

export default function ProfileEditClient({ displayName: initialName, bio: initialBio }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [error, setError] = useState<string | null>(null)
  const [bioError, setBioError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const changed = name.trim() !== initialName || bio.trim() !== initialBio.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBioError(null)
    setServerError(null)

    const nameResult = validateDisplayName(name.trim())
    if (!nameResult.ok) {
      setError(nameResult.error)
      return
    }
    const bioResult = validateBio(bio)
    if (!bioResult.ok) {
      setBioError(bioResult.error)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim(), bio: bio.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save')
      }
      router.push('/profile')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Display name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className={['loka-input w-full', error ? 'border-red-400' : ''].join(' ')}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          placeholder="Tell your friends a little about you"
          className={['loka-input w-full resize-none', bioError ? 'border-red-400' : ''].join(' ')}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-red-500">{bioError}</span>
          <span className="text-xs text-gray-400 dark:text-slate-500">{bio.length}/{BIO_MAX}</span>
        </div>
      </div>

      {serverError && <p className="text-xs text-red-500">{serverError}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="loka-btn-secondary flex-1 py-3"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !changed}
          className="loka-btn-primary flex-1 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
