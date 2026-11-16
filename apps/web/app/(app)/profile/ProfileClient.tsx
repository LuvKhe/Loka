'use client'

import { useState } from 'react'
import type { Profile, PrivacySettings } from '@loka/shared/types'
import QRCodeDisplay from '@/components/ui/QRCodeDisplay'
import PrivacySettingsPanel from '@/components/profile/PrivacySettingsPanel'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Avatar from '@/components/ui/Avatar'
import KeepSafeCard from '@/components/profile/KeepSafeCard'
import DeleteAccountPanel from '@/components/profile/DeleteAccountPanel'
import NotificationsPanel from '@/components/profile/NotificationsPanel'

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
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading profile...</p>
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
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Profile</h1>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-20 bg-gradient-to-r from-blue-700 to-violet-800" aria-hidden="true" />
        <div className="px-4 pb-4 -mt-10">
          <div className="inline-block rounded-full p-1 bg-white dark:bg-slate-800">
            <Avatar url={profile.avatarUrl} name={profile.displayName} size={72} />
          </div>
          <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 break-words mt-2" style={{ textWrap: 'balance' }}>
            {profile.displayName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{profile.university}</p>
          {profile.bio && <p className="text-sm text-gray-800 dark:text-gray-200 mt-3 break-words">{profile.bio}</p>}

          <div className="mt-4 rounded-xl bg-gray-50 dark:bg-slate-900 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Loka ID</p>
              <p className="font-mono font-bold text-xl tracking-wider text-gray-900 dark:text-gray-100">
                {profile.lokaId || '-'}
              </p>
            </div>
            <button onClick={copyLokaId} className="loka-btn-secondary min-h-[2.75rem] px-4 text-sm shrink-0">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setShowQR(!showQR)}
              aria-expanded={showQR}
              className="loka-btn-secondary min-h-[2.75rem] text-sm"
            >
              {showQR ? 'Hide QR code' : 'Show QR code'}
            </button>
            <a href="/profile/edit" className="loka-btn-primary min-h-[2.75rem] text-sm text-center inline-flex items-center justify-center">
              Edit profile
            </a>
          </div>

          {showQR && (
            <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
              <QRCodeDisplay value={profile.lokaId} />
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="loka-section-label">Privacy</h2>
        <PrivacySettingsPanel settings={privacySettings} />
      </section>

      {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
        <section>
          <h2 className="loka-section-label">Notifications</h2>
          <NotificationsPanel />
        </section>
      )}

      <section>
        <h2 className="loka-section-label">Appearance</h2>
        <ThemeToggle />
      </section>

      <section>
        <h2 className="loka-section-label">Keep your profile safe</h2>
        <div className="space-y-3">
          <KeepSafeCard />
          <div className="loka-card">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Recovery code</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              If you lose this device, your Loka ID and recovery code bring your profile back. Create a new code any time.
            </p>
            <a href="/profile/recovery" className="loka-btn-secondary min-h-[2.75rem] text-sm inline-flex items-center">
              Manage recovery code
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 className="loka-section-label">Legal</h2>
        <div className="loka-card flex gap-6 text-sm">
          <a href="/terms" className="text-blue-700 dark:text-blue-400 underline min-h-[2.75rem] inline-flex items-center">Terms of Use</a>
          <a href="/privacy" className="text-blue-700 dark:text-blue-400 underline min-h-[2.75rem] inline-flex items-center">Privacy Policy</a>
        </div>
      </section>

      <section>
        <h2 className="loka-section-label">Delete profile</h2>
        <DeleteAccountPanel />
      </section>
    </div>
  )
}
