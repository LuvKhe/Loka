'use client'

import { useEffect, useState } from 'react'
import { detectPlatform, isInstalled } from '@/lib/install'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

type Availability = 'checking' | 'unsupported' | 'needs_install' | 'denied' | 'off' | 'on'

interface Settings {
  friendRequests: boolean
  friendAccepted: boolean
  classReminders: boolean
  classReminderMinutes: number
  friendCheckins: boolean
  morningSummary: boolean
}

const DEFAULT_SETTINGS: Settings = {
  friendRequests: true,
  friendAccepted: true,
  classReminders: false,
  classReminderMinutes: 10,
  friendCheckins: false,
  morningSummary: false,
}

const LEAD_OPTIONS = [5, 10, 15, 30]

function keyToBytes(base64: string): Uint8Array {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          'relative shrink-0 w-12 h-7 rounded-full transition-colors duration-150',
          checked ? 'bg-blue-700' : 'bg-gray-400 dark:bg-slate-600',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-150',
            checked ? 'translate-x-5' : '',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export default function NotificationsPanel() {
  const [state, setState] = useState<Availability>('checking')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  async function loadSettings(): Promise<void> {
    try {
      const res = await fetch('/api/push/settings')
      if (!res.ok) return
      const data = await res.json()
      setSettings({
        friendRequests: data.friendRequests !== false,
        friendAccepted: data.friendAccepted !== false,
        classReminders: data.classReminders === true,
        classReminderMinutes: LEAD_OPTIONS.includes(data.classReminderMinutes) ? data.classReminderMinutes : 10,
        friendCheckins: data.friendCheckins === true,
        morningSummary: data.morningSummary === true,
      })
    } catch {
      return
    }
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!supported) {
        const ios = detectPlatform() === 'ios'
        setState(ios && !isInstalled() ? 'needs_install' : 'unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (cancelled) return
        setState(sub && Notification.permission === 'granted' ? 'on' : 'off')
        if (sub && !cancelled) await loadSettings()
      } catch {
        if (!cancelled) setState('unsupported')
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  async function turnOn() {
    setBusy(true)
    setMessage(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) as BufferSource,
        }))
      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not turn on notifications')
      }
      await loadSettings()
      setState('on')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not turn on notifications')
    } finally {
      setBusy(false)
    }
  }

  async function turnOff() {
    setBusy(true)
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off')
    } catch {
      setMessage('Could not turn off notifications')
    } finally {
      setBusy(false)
    }
  }

  async function save(next: Partial<Settings>) {
    const previous = settings
    setSettings({ ...settings, ...next })
    setMessage(null)
    try {
      const res = await fetch('/api/push/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setSettings(previous)
      setMessage('Could not save that change. Try again.')
    }
  }

  async function sendTest() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      setMessage(res.ok ? 'Test sent. It should arrive in a few seconds.' : typeof data.error === 'string' ? data.error : 'Could not send a test')
    } catch {
      setMessage('Could not send a test')
    } finally {
      setBusy(false)
    }
  }

  if (!VAPID_PUBLIC_KEY || state === 'checking') return null

  return (
    <div className="loka-card">
      {state === 'unsupported' && (
        <p className="text-sm text-gray-700 dark:text-gray-300">This browser cannot receive notifications.</p>
      )}

      {state === 'needs_install' && (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          On iPhone, notifications work only after you add Loka to your home screen and open it from there. Use the install steps above, then come back here.
        </p>
      )}

      {state === 'denied' && (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Notifications are blocked for Loka. Allow them in your phone or browser settings, then reopen this page.
        </p>
      )}

      {state === 'off' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Get notified about friend requests. You can also choose class reminders and more once this is on.
          </p>
          <button onClick={turnOn} disabled={busy} className="loka-btn-primary min-h-[2.75rem] px-5 text-sm disabled:opacity-40">
            {busy ? 'Turning on...' : 'Turn on notifications'}
          </button>
        </div>
      )}

      {state === 'on' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Friends</p>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            <Switch
              checked={settings.friendRequests}
              onChange={(v) => save({ friendRequests: v })}
              label="New friend requests"
              hint="When someone wants to be your friend."
            />
            <Switch
              checked={settings.friendAccepted}
              onChange={(v) => save({ friendAccepted: v })}
              label="Accepted requests"
              hint="When someone accepts your request."
            />
            <Switch
              checked={settings.friendCheckins}
              onChange={(v) => save({ friendCheckins: v })}
              label="Friends arriving on campus"
              hint="When a friend checks in. Only friends who share their location, at most once an hour each."
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mt-4">Your timetable</p>
          <div className="divide-y divide-gray-100 dark:divide-slate-700 mb-3">
            <Switch
              checked={settings.classReminders}
              onChange={(v) => save({ classReminders: v })}
              label="Class reminders"
              hint="A heads-up before each class starts."
            />
            {settings.classReminders && (
              <div className="py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Remind me before class</p>
                <div role="radiogroup" aria-label="Reminder time" className="flex gap-2">
                  {LEAD_OPTIONS.map((m) => {
                    const active = settings.classReminderMinutes === m
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => save({ classReminderMinutes: m })}
                        className={[
                          'min-h-[2.75rem] flex-1 rounded-xl text-sm font-semibold border',
                          active
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-slate-600',
                        ].join(' ')}
                      >
                        {m} min
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <Switch
              checked={settings.morningSummary}
              onChange={(v) => save({ morningSummary: v })}
              label="Morning summary"
              hint="Around 7:00, how many classes you have today and the first one."
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
            <button onClick={sendTest} disabled={busy} className="loka-btn-secondary min-h-[2.75rem] px-4 text-sm disabled:opacity-40">
              Send a test
            </button>
            <button onClick={turnOff} disabled={busy} className="loka-btn-secondary min-h-[2.75rem] px-4 text-sm disabled:opacity-40">
              Turn off on this device
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="text-sm text-gray-700 dark:text-gray-300 mt-3">
          {message}
        </p>
      )}
    </div>
  )
}
