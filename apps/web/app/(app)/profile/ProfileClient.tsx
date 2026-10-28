'use client'

import { useState } from 'react'
import type { Profile, PrivacySettings } from '@loka/shared/types'
import QRCodeDisplay from '@/components/ui/QRCodeDisplay'
import PrivacySettingsPanel from '@/components/profile/PrivacySettingsPanel'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Avatar from '@/components/ui/Avatar'
import KeepSafeCard from '@/components/profile/KeepSafeCard'
import DeleteAccountPanel from '@/components/profile/DeleteAccountPanel'

interface Props {
  profile: Profile | null
  privacySettings: PrivacySettings | null
}

export default function ProfileClient({ profile, privacySettings }: Props) {
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Loading profile...</p>
      </div>
    )
  }

  function copyLokaId() {
    navigator.clipboard.writeText(profile!.lokaId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Identity card */}
      <div className="loka-card">
        <div className="flex items-center gap-4 mb-4">
          <Avatar url={profile.avatarUrl} name={profile.displayName} size={56} />
          <div>
            <p className="font-bold text-gray-900">{profile.displayName}</p>
            <p className="text-sm text-gray-500">{profile.university}</p>
            {profile.bio && <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>}
          </div>
        </div>

        {/* Loka ID */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-400 mb-1">Loka ID</p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono font-bold text-gray-900 text-xl">
              {profile.lokaId || '—'}
            </p>
            <button
              onClick={copyLokaId}
              className="loka-btn-secondary py-1.5 px-3 text-xs shrink-0"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="loka-btn-secondary flex-1 py-2 text-xs"
          >
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
          <a href="/profile/edit" className="loka-btn-secondary flex-1 py-2 text-xs text-center">
            Edit Profile
          </a>
        </div>

        {showQR && (
          <div className="mt-4 flex justify-center">
            <QRCodeDisplay value={profile.lokaId} />
          </div>
        )}
      </div>

      <section>
        <p className="loka-section-label">Keep your profile safe</p>
        <KeepSafeCard />
      </section>

      <section>
        <p className="loka-section-label">Appearance</p>
        <ThemeToggle />
      </section>

      {/* Privacy settings */}
      <section>
        <p className="loka-section-label">Privacy</p>
        <PrivacySettingsPanel settings={privacySettings} />
      </section>

      {/* Recovery */}
      <section>
        <p className="loka-section-label">Recovery</p>
        <div className="loka-card">
          <p className="text-sm font-medium text-gray-900 mb-1">Recovery Code</p>
          <p className="text-xs text-gray-500 mb-3">
            If you lose this device, your recovery code lets you restore your Loka profile.
            Keep it somewhere safe — Loka cannot recover it for you.
          </p>
          <a href="/profile/recovery" className="loka-btn-secondary py-2 text-xs inline-block">
            View Recovery Code
          </a>
        </div>
      </section>

      <section>
        <p className="loka-section-label">Legal</p>
        <div className="loka-card flex gap-4 text-sm">
          <a href="/terms" className="text-blue-600 dark:text-blue-400 underline">Terms of Use</a>
          <a href="/privacy" className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</a>
        </div>
      </section>

      <section>
        <p className="loka-section-label">Delete profile</p>
        <DeleteAccountPanel />
      </section>
    </div>
  )
}
