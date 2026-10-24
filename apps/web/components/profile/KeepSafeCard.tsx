'use client'

import { useEffect, useState } from 'react'
import InstallSteps from '@/components/ui/InstallSteps'
import { detectPlatform, isInstalled, type Platform } from '@/lib/install'

export default function KeepSafeCard() {
  const [platform, setPlatform] = useState<Platform>('other')
  const [installed, setInstalled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setInstalled(isInstalled())
  }, [])

  return (
    <div className="loka-card space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Keep your profile safe</p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-slate-300">
          <li>
            Your recovery code was shown once when you signed up. Keep it in Notes or a password manager.
          </li>
          <li>Add Loka to your home screen and always open it from there.</li>
        </ul>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Installed on this device: {installed ? 'Yes' : 'No'}
      </p>
      {!installed && (
        <>
          <button onClick={() => setOpen(!open)} className="loka-btn-secondary py-2 px-4 text-xs">
            {open ? 'Hide steps' : 'How to install'}
          </button>
          {open && <InstallSteps platform={platform} />}
        </>
      )}
    </div>
  )
}
