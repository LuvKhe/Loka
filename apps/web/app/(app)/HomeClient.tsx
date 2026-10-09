'use client'

import { useEffect, useState } from 'react'
import { computeTimetableState, formatTime, formatDuration } from '@loka/shared/timetable'
import type { TimetableEntry, TimetableState, Profile, PrivacySettings } from '@loka/shared/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { STATUS_LABELS } from '@loka/shared/constants'

interface Props {
  profile: Profile | null
  timetableEntries: TimetableEntry[]
  privacySettings: PrivacySettings | null
}

export default function HomeClient({ profile, timetableEntries }: Props) {
  const [state, setState] = useState<TimetableState | null>(null)
  const [now, setNow] = useState(new Date())

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

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Loka</h1>
        <p className="text-sm text-gray-500">
          {now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Your status card */}
      <section>
        <p className="loka-section-label">You</p>
        <div className="loka-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{profile.displayName}</p>
              {state && <StatusBadge status={state.status} />}
            </div>
            {state?.isManualOverride && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Manual
              </span>
            )}
          </div>

          {state?.currentClass && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {state.currentClass.subjectCode}
                {state.currentClass.subjectName && (
                  <span className="font-normal text-gray-500"> — {state.currentClass.subjectName}</span>
                )}
              </p>
              {state.currentClass.venue && (
                <p className="text-sm text-gray-500">{state.currentClass.venue}</p>
              )}
              {state.timeRemainingSeconds != null && (
                <p className="text-sm text-gray-500">
                  Ends {formatTime(state.currentClass.endTime)}
                  {' '}({formatDuration(state.timeRemainingSeconds)} remaining)
                </p>
              )}
            </div>
          )}

          {state?.nextClass && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Next</p>
              <p className="text-sm font-medium text-gray-900">
                {state.nextClass.subjectCode}
              </p>
              <p className="text-sm text-gray-500">
                {formatTime(state.nextClass.startTime)}
                {state.nextClass.venue && ` · ${state.nextClass.venue}`}
              </p>
              {state.timeUntilNextSeconds != null && (
                <p className="text-sm text-gray-500">
                  In {formatDuration(state.timeUntilNextSeconds)}
                </p>
              )}
            </div>
          )}

          {state && !state.currentClass && !state.nextClass && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {STATUS_LABELS[state.status] ?? 'No classes'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Friends section — live data loaded by FriendsFeed component (Phase 7) */}
      <section>
        <p className="loka-section-label">Friends</p>
        <div className="loka-card">
          <p className="text-sm text-gray-400">
            Add friends to see their status here.
          </p>
        </div>
      </section>
    </div>
  )
}
