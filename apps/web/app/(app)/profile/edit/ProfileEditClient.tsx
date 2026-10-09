'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateDisplayName } from '@loka/shared/validation'

interface Props {
  userId: string
  displayName: string
}

export default function ProfileEditClient({ displayName: initial }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function handleChange(value: string) {
    setName(value)
    if (error) setError(null)
    if (serverError) setServerError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validateDisplayName(name.trim())
    if (!result.ok) {
      setError(result.error)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save')
      }
      router.push('/profile')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Display name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={40}
          className={['loka-input w-full', error ? 'border-red-400' : ''].join(' ')}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
          disabled={saving || name.trim() === initial}
          className="loka-btn-primary flex-1 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
