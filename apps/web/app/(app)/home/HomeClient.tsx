'use client'

import { useEffect, useState } from 'react'
import { computeTimetableState, formatTime, formatDuration, campusNow } from '@loka/shared/timetable'
import type { TimetableEntry, TimetableState, Profile, PrivacySettings } from '@loka/shared/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { STATUS_LABELS } from '@loka/shared/constants'
import { subjectColor } from '@/lib/subject-color'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import CheckInPanel from '@/components/location/CheckInPanel'
import InstallBanner from '@/components/ui/InstallBanner'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface FriendStatus {
  id: string
  displayName: string
  status: string
  currentClass: string | null
  endsAt?: number | null
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
  const [now, setNow] = useState(() => campusNow())
  const [settingOverride, setSettingOverride] = useState(false)
  const [avatars, setAvatars] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const compute = () => {
      const current = campusNow()
      setNow(current)
      setState(computeTimetableState(timetableEntries, current, profile?.statusOverride ?? null))
    }
    compute()
    const interval = setInterval(compute, 30_000)
    return () => clearInterval(interval)
  }, [timetableEntries, profile?.statusOverride])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const id = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router])

  const friendKey = friendsData.map((f) => f.id).join(',')

  useEffect(() => {
    if (!friendKey) return
    let cancelled = false
    createClient()
      .from('profiles')
      .select('id, avatar_url')
      .in('id', friendKey.split(','))
      .then(({ data }) => {
        if (cancelled || !data) return
        setAvatars(Object.fromEntries(data.map((r) => [r.id as string, (r.avatar_url as string | null) ?? null])))
      })
    return () => {
      cancelled = true
    }
  }, [friendKey])

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
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  const isManual = profile.statusOverride === 'free'
  const firstName = profile.displayName.split(' ')[0] ?? profile.displayName
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

  const counts = { free: 0, in_class: 0, between_classes: 0 }
  for (const f of friendsData) {
    if (f.status === 'free') counts.free++
    else if (f.status === 'in_class') counts.in_class++
    else if (f.status === 'between_classes') counts.between_classes++
  }

  let heroGradient = 'from-slate-700 to-slate-900'
  let heroLabel = ''
  let heroTitle = ''
  let heroSub = ''
  let heroChips: string[] = []
  let heroPct: number | null = null

  if (state) {
    if (isManual) {
      heroLabel = 'You are'
      heroTitle = 'Free'
      heroSub = 'Set manually. Friends see you as free.'
      heroGradient = 'from-emerald-700 to-emerald-900'
    } else if (state.currentClass) {
      const c = state.currentClass
      heroGradient = subjectColor(c.subjectCode).hero
      heroLabel = 'In class now'
      heroTitle = c.subjectCode
      heroSub = state.timeRemainingSeconds != null ? `Ends in ${formatDuration(state.timeRemainingSeconds)}` : ''
      heroChips = [`${formatTime(c.startTime)} to ${formatTime(c.endTime)}`, ...(c.venue ? [c.venue] : []), ...(c.groupName ? [`Group ${c.groupName}`] : [])]
      const s0 = toMin(c.startTime)
      const e0 = toMin(c.endTime)
      heroPct = e0 > s0 ? Math.max(0, Math.min(100, Math.round(((nowMin - s0) / (e0 - s0)) * 100))) : null
    } else if (state.nextClass) {
      const n = state.nextClass
      heroGradient = subjectColor(n.subjectCode).hero
      heroLabel = state.status === 'between_classes' ? 'Between classes. Up next' : 'Up next'
      heroTitle = n.subjectCode
      heroSub =
        state.timeUntilNextSeconds != null
          ? state.timeUntilNextSeconds >= 24 * 60 * 60
            ? `${DAY_NAMES[n.dayOfWeek]} at ${formatTime(n.startTime)}`
            : `Starts in ${formatDuration(state.timeUntilNextSeconds)}`
          : ''
      heroChips = [`${formatTime(n.startTime)} to ${formatTime(n.endTime)}`, ...(n.venue ? [n.venue] : []), ...(n.groupName ? [`Group ${n.groupName}`] : [])]
    } else {
      heroLabel = 'You are'
      heroTitle = 'Free'
      heroSub = STATUS_LABELS[state.status] ?? 'No classes scheduled'
      heroGradient = 'from-emerald-700 to-emerald-900'
    }
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 truncate" style={{ textWrap: 'balance' }}>
            {greeting}, {firstName}
          </h1>
        </div>
        <Link href="/profile" aria-label="Your profile" className="shrink-0 rounded-full">
          <Avatar url={profile.avatarUrl ?? null} name={profile.displayName} size={44} />
        </Link>
      </header>

      <InstallBanner />

      <section aria-label="Your status">
        {state === null ? (
          <div className="h-44 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" aria-hidden="true" />
        ) : (
          <div className={['rounded-2xl bg-gradient-to-br text-white p-5 shadow-lg', heroGradient].join(' ')}>
            <p className="text-xs font-semibold uppercase tracking-wider text-white">{heroLabel}</p>
            <p className="text-4xl font-extrabold mt-1" style={{ textWrap: 'balance' }}>{heroTitle}</p>
            {heroSub && <p className="text-base font-medium mt-0.5 tabular-nums">{heroSub}</p>}
            {heroChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {heroChips.map((c) => (
                  <span key={c} className="text-xs rounded-full px-2.5 py-1 bg-black/25 tabular-nums">{c}</span>
                ))}
              </div>
            )}
            {heroPct !== null && (
              <div className="mt-4">
                <div
                  role="progressbar"
                  aria-label="Class progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={heroPct}
                  className="h-2 rounded-full bg-black/30 overflow-hidden"
                >
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${heroPct}%` }} />
                </div>
                <p className="text-xs mt-1.5 tabular-nums">{heroPct}% done</p>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={isManual ? clearOverride : setFree}
                disabled={settingOverride}
                className="min-h-[2.75rem] px-4 rounded-full text-sm font-semibold bg-black/30 text-white active:scale-95 transition-transform duration-150 disabled:opacity-50"
              >
                {settingOverride ? '...' : isManual ? 'Back to automatic' : 'Set myself as free'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="loka-section-label">Location</h2>
        <CheckInPanel
          activeLocation={activeLocation}
          currentClass={
            state?.currentClass?.venue
              ? { key: `${state.currentClass.id}-${now.getFullYear()}${now.getMonth()}${now.getDate()}`, venue: state.currentClass.venue }
              : null
          }
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="loka-section-label mb-0">Friends</h2>
          <Link href="/friends" className="text-sm font-semibold text-blue-700 dark:text-blue-400 min-h-[2.75rem] inline-flex items-center">
            See all
          </Link>
        </div>

        {friendsData.length === 0 ? (
          <div className="loka-card text-center py-8">
            <p className="font-bold text-gray-900 dark:text-gray-100">Nobody here yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4" style={{ textWrap: 'balance' }}>
              Add a friend with their Loka ID to see when they are free.
            </p>
            <Link href="/friends/add" className="loka-btn-primary min-h-[2.75rem] inline-flex items-center">
              Add a friend
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3 tabular-nums">
              {counts.free > 0 && (
                <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {counts.free} free
                </span>
              )}
              {counts.in_class > 0 && (
                <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200">
                  {counts.in_class} in class
                </span>
              )}
              {counts.between_classes > 0 && (
                <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {counts.between_classes} between classes
                </span>
              )}
            </div>
            <div className="loka-list">
              {friendsData.map((friend) => {
                const code = friend.currentClass ? friend.currentClass.split(' — ')[0]! : null
                const ring =
                  friend.status === 'in_class'
                    ? 'ring-blue-600 dark:ring-blue-400'
                    : friend.status === 'free'
                      ? 'ring-emerald-600 dark:ring-emerald-400'
                      : friend.status === 'between_classes'
                        ? 'ring-amber-600 dark:ring-amber-400'
                        : 'ring-gray-300 dark:ring-slate-600'
                return (
                  <Link
                    key={friend.id}
                    href={`/friends/${friend.id}`}
                    className="relative loka-card flex items-center gap-3 overflow-hidden pl-5 min-h-[4.5rem] transition-transform duration-150 active:scale-[0.98]"
                  >
                    {code && (
                      <span className={['absolute left-0 top-0 bottom-0 w-2', subjectColor(code).bar].join(' ')} aria-hidden="true" />
                    )}
                    <span className={['rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111113] shrink-0', ring].join(' ')}>
                      <Avatar url={avatars[friend.id]} name={friend.displayName} size={40} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{friend.displayName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <StatusBadge status={friend.status} />
                        {friend.currentClass && (
                          <span className="text-xs text-gray-700 dark:text-slate-300 truncate">{code}</span>
                        )}
                        {friend.currentClass && friend.endsAt != null && friend.endsAt > Date.now() && (
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                            Ends in {formatDuration(Math.round((friend.endsAt - Date.now()) / 1000))}
                          </span>
                        )}
                      </div>
                      {friendLocations[friend.id] && (
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 truncate">At {friendLocations[friend.id]}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
