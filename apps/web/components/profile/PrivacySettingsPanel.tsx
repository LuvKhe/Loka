'use client'

import { useState } from 'react'
import type { PrivacySettings } from '@loka/shared/types'

interface Props {
  settings: PrivacySettings | null
}

type SettingKey = 'shareLocation' | 'shareCurrentClass' | 'shareNextClass' | 'showInSearch'

const SETTINGS: { key: SettingKey; label: string; description: string }[] = [
  {
    key: 'shareLocation',
    label: 'Share location',
    description: 'Let friends see your general campus location.',
  },
  {
    key: 'shareCurrentClass',
    label: 'Share current class',
    description: 'Let friends see what class you are in.',
  },
  {
    key: 'shareNextClass',
    label: 'Share next class',
    description: 'Let friends see your next upcoming class.',
  },
  {
    key: 'showInSearch',
    label: 'Appear in search',
    description: 'Let people find you by your Loka ID.',
  },
]

export default function PrivacySettingsPanel({ settings }: Props) {
  const [values, setValues] = useState<Record<SettingKey, boolean>>({
    shareLocation: settings?.shareLocation ?? true,
    shareCurrentClass: settings?.shareCurrentClass ?? true,
    shareNextClass: settings?.shareNextClass ?? true,
    showInSearch: settings?.showInSearch ?? true,
  })
  const [saving, setSaving] = useState<SettingKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function toggle(key: SettingKey) {
    const next = !values[key]
    setValues((v) => ({ ...v, [key]: next }))
    setSaving(key)
    setError(null)

    try {
      const res = await fetch('/api/profile/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch {
      // Revert on error
      setValues((v) => ({ ...v, [key]: !next }))
      setError('Could not save. Try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="loka-card divide-y divide-gray-100">
      {SETTINGS.map(({ key, label, description }) => (
        <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
          <button
            role="switch"
            aria-checked={values[key]}
            aria-label={label}
            disabled={saving === key}
            onClick={() => toggle(key)}
            className={[
              'relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              values[key] ? 'bg-blue-600' : 'bg-gray-200',
              saving === key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                values[key] ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      ))}
      {error && (
        <p className="text-xs text-red-500 pt-2">{error}</p>
      )}
    </div>
  )
}
