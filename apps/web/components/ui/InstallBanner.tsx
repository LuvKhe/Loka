'use client'

import { useEffect, useState } from 'react'
import InstallSteps from '@/components/ui/InstallSteps'
import { detectPlatform, isInstalled, type Platform } from '@/lib/install'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

const DISMISS_KEY = 'loka-install-dismissed'

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  const [showSteps, setShowSteps] = useState(false)
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    try {
      if (isInstalled()) return
      if (localStorage.getItem(DISMISS_KEY) === '1') return
    } catch {}
    setPlatform(detectPlatform())
    setVisible(true)

    function onPrompt(e: Event) {
      e.preventDefault()
      setPromptEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    setVisible(false)
  }

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt()
      setPromptEvent(null)
      return
    }
    setShowSteps(true)
  }

  if (!visible) return null

  return (
    <div className="loka-card space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Install Loka</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Add Loka to your home screen and open it from there so it remembers you every time.
        </p>
      </div>
      {showSteps && <InstallSteps platform={platform} />}
      <div className="flex gap-2">
        <button onClick={install} className="loka-btn-primary py-2 px-4 text-xs">
          {promptEvent ? 'Install' : showSteps ? 'Got it' : 'Show me how'}
        </button>
        <button onClick={dismiss} className="loka-btn-secondary py-2 px-4 text-xs">
          Dismiss
        </button>
      </div>
    </div>
  )
}
