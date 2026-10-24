'use client'

import { useEffect, useState } from 'react'
import { computeTimetableState, formatTime, formatDuration } from '@loka/shared/timetable'
import type { TimetableEntry, TimetableState, Profile, PrivacySettings } from '@loka/shared/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { STATUS_LABELS } from '@loka/shared/constants'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CheckInPanel from '@/components/location/CheckInPanel'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface FriendStatus {
  id: string
  displayName: string
  status: string
  currentClass: string | null
}

interface ActiveLocation {
  placeLabel: string
  campusBuildingId: string | null
}

interface Props {
  profile: Profile | null
  timetableEntries: TimetableEntry[]
  privacySettings: PrivacySettings | null
  friendsData: FriendStatus[]
  activeLocation: ActiveLocation | null
  friendLocations: Record<string, string>
}

export default function HomeClient({ profile, timetableEntries, friendsData, activeLocation, friendLocations }: Props) {
  const router = useRouter()
  const [state, setState] = useState<TimetableState | null>(null)
  const [now, setNow] = useState(new Date())
  const [settingOverride, setSettingOverride] = useState(false)

  // Recompute status every 30 seconds
  useEffect(() => {
    const compute = () => {
      const current = new Date()
      setNow(current)
      setState(computeTimetableState(timetableEntries, current, profile?.statusOverride ?? null))
    }
    compute()
    const interval = setInterval(compute, 30_000)
    return () => clearInterval(interval)
  }, [timetableEntries, profile?.statusOverride])

  async function setFree() {
    setSettingOverride(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusOverride: 'free' }),
      })
      router.refresh()
    } finally {
      setSettingOverride(false)
    }
  }

  async function clearOverride() {
    setSettingOverride(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusOverride: null }),
      })
      router.refresh()
    } finally {
      setSettingOverride(false)
    }
  }

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  const isManual = profile.statusOverride === 'free'

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Loka</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Your status card */}
      <section>
        <p className="loka-section-label">You</p>
        <div className="loka-card">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{profile.displayName}</p>
              {state && <StatusBadge status={isManual ? 'free' : state.status} />}
            </div>
            {isManual && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
                Manual
              </span>
            )}
          </div>

          {!isManual && state?.currentClass && (
            <div className="mt-1 pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {state.currentClass.subjectCode}
                {state.currentClass.subjectName && (
                  <span className="font-normal text-gray-500 dark:text-gray-400"> — {state.currentClass.subjectName}</span>
                )}
              </p>
              {state.currentClass.venue && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{state.currentClass.venue}</p>
              )}
              {state.timeRemainingSeconds != null && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Ends {formatTime(state.currentClass.endTime)}
                  {' '}· {formatDuration(state.timeRemainingSeconds)} remaining
                </p>
              )}
            </div>
          )}

          {!isManual && state?.nextClass && !state?.currentClass && (
            <div className="mt-1 pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-1">Next</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{state.nextClass.subjectCode}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(state.nextClass.startTime)}
                {state.nextClass.venue && ` · ${state.nextClass.venue}`}
              </p>
              {state.timeUntilNextSeconds != null && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {state.timeUntilNextSeconds >= 24 * 60 * 60
                    ? DAY_NAMES[state.nextClass.dayOfWeek]
                    : `In ${formatDuration(state.timeUntilNextSeconds)}`}
                </p>
              )}
            </div>
          )}

          {!isManual && state && !state.currentClass && !state.nextClass && (
            <div className="mt-1 pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {STATUS_LABELS[state.status] ?? 'No classes scheduled'}
              </p>
            </div>
          )}

          {/* Override controls */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
            {isManual ? (
              <button
                onClick={clearOverride}
                disabled={settingOverride}
                className="loka-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
              >
                {settingOverride ? '...' : 'Back to automatic'}
              </button>
            ) : (
              <button
                onClick={setFree}
                disabled={settingOverride}
                className="loka-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
              >
                {settingOverride ? '...' : 'Set myself as free'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Campus check-in */}
      <section>
        <p className="loka-section-label">Location</p>
        <CheckInPanel activeLocation={activeLocation} />
      </section>

      {/* Friends */}
      <section>
        <div className="flex items-center justify-between">
          <p className="loka-section-label">Friends</p>
          <Link href="/friends" className="text-xs text-blue-500 pb-1">
            See all
          </Link>
        </div>

        {friendsData.length === 0 ? (
          <div className="loka-card">
            <p className="text-sm text-gray-400 mb-2">No friends yet.</p>
            <Link href="/friends/add" className="loka-btn-primary py-2 px-3 text-xs inline-block">
              Add a friend
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {friendsData.map((friend) => (
              <Link
                key={friend.id}
                href={`/friends/${friend.id}`}
                className="loka-card flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {friend.displayName[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{friend.displayName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <StatusBadge status={friend.status} />
                    {friend.currentClass && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{friend.currentClass}</p>
                    )}
                  </div>
                  {friendLocations[friend.id] && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {friendLocations[friend.id]}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
