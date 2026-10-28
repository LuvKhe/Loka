'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateDisplayName, validateBio } from '@loka/shared/validation'
import Avatar from '@/components/ui/Avatar'
import { fileToAvatarDataUrl } from '@/lib/avatar'

interface Props {
  userId: string
  displayName: string
  bio: string
  avatarUrl: string | null
}

const BIO_MAX = 160

export default function ProfileEditClient({ displayName: initialName, bio: initialBio, avatarUrl: initialAvatar }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [avatar, setAvatar] = useState<string | null>(initialAvatar)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [bioError, setBioError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const changed =
    name.trim() !== initialName || bio.trim() !== initialBio.trim() || avatar !== initialAvatar

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarError(null)
    try {
      setAvatar(await fileToAvatarDataUrl(file))
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'That image could not be used')
    }
  }

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
        body: JSON.stringify({
          displayName: name.trim(),
          bio: bio.trim(),
          ...(avatar !== initialAvatar ? { avatarUrl: avatar } : {}),
        }),
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
      <div className="flex items-center gap-4">
        <Avatar url={avatar} name={name} size={80} />
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="loka-btn-secondary py-2 px-4 text-xs"
            >
              {avatar ? 'Change photo' : 'Add photo'}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="loka-btn-secondary py-2 px-4 text-xs"
              >
                Remove
              </button>
            )}
          </div>
          {avatarError && <p className="text-xs text-red-600 dark:text-red-400">{avatarError}</p>}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label htmlFor="field-display-name" className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Display name</label>
        <input id="field-display-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className={['loka-input w-full', error ? 'border-red-400' : ''].join(' ')}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
      </div>

      <div>
        <label htmlFor="field-bio" className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Bio</label>
        <textarea id="field-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          placeholder="Tell your friends a little about you"
          className={['loka-input w-full resize-none', bioError ? 'border-red-400' : ''].join(' ')}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-red-600 dark:text-red-400">{bioError}</span>
          <span className="text-xs text-gray-500 dark:text-slate-400">{bio.length}/{BIO_MAX}</span>
        </div>
      </div>

      {serverError && <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>}

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
