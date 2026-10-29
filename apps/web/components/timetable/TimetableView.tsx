'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { TimetableEntry } from '@loka/shared/types'
import { subjectColor } from '@/lib/subject-color'
import { campusNow } from '@loka/shared/timetable'

const DAY_FULL = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toMin(t: string) {
  const [h, m] = t.split(':')
  return Number(h) * 60 + Number(m)
}

function span(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function nowParts(d: Date) {
  const js = d.getDay()
  return { dow: js === 0 ? 7 : js, min: d.getHours() * 60 + d.getMinutes() }
}

export default function TimetableView({
  entries,
  readOnly = false,
  suppressNow = false,
}: {
  entries: TimetableEntry[]
  readOnly?: boolean
  suppressNow?: boolean
}) {
  const [now, setNow] = useState<{ dow: number; min: number } | null>(null)
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(nowParts(campusNow()))
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  const byDay = useMemo(() => {
    const g: Record<number, TimetableEntry[]> = {}
    for (const e of entries) (g[e.dayOfWeek] ??= []).push(e)
    for (const k of Object.keys(g)) g[Number(k)]!.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return g
  }, [entries])

  const activeDay = picked ?? now?.dow ?? 1
  const dayEntries = byDay[activeDay] ?? []

  const hero = useMemo(() => {
    if (!now) return null
    const today = byDay[now.dow] ?? []
    const current = suppressNow
      ? undefined
      : today.find((e) => toMin(e.startTime) <= now.min && now.min < toMin(e.endTime))
    if (current) {
      const s0 = toMin(current.startTime)
      const e0 = toMin(current.endTime)
      return { kind: 'now' as const, entry: current, mins: e0 - now.min, pct: Math.round(((now.min - s0) / (e0 - s0)) * 100) }
    }
    const next = today.find((e) => toMin(e.startTime) > now.min)
    if (next) return { kind: 'next' as const, entry: next, mins: toMin(next.startTime) - now.min }
    for (let i = 1; i <= 7; i++) {
      const d = ((now.dow - 1 + i) % 7) + 1
      const list = byDay[d]
      if (list?.length) return { kind: 'later' as const, entry: list[0]!, day: d }
    }
    return null
  }, [now, byDay, suppressNow])

  const range = useMemo(() => {
    let lo = 8 * 60
    let hi = 17 * 60
    for (const e of entries) {
      lo = Math.min(lo, Math.floor(toMin(e.startTime) / 60) * 60)
      hi = Math.max(hi, Math.ceil(toMin(e.endTime) / 60) * 60)
    }
    return { lo, hi }
  }, [entries])

  const totalWeek = entries.length

  return (
    <div className="space-y-5">
      {now === null ? (
        <div className="h-36 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" aria-hidden="true" />
      ) : hero ? (
        <HeroCard hero={hero} readOnly={readOnly} />
      ) : null}

      <div role="group" aria-label="Choose a day" className="grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const count = byDay[d]?.length ?? 0
          const selected = d === activeDay
          const isToday = now?.dow === d
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              onClick={() => setPicked(d)}
              className={[
                'min-h-[3.5rem] rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all duration-150 active:scale-95',
                selected
                  ? 'bg-blue-700 text-white shadow-md'
                  : count
                    ? 'bg-white text-gray-900 border border-gray-200 dark:bg-slate-800 dark:text-gray-100 dark:border-slate-700'
                    : 'bg-transparent text-gray-600 border border-dashed border-gray-300 dark:text-gray-400 dark:border-slate-700',
                isToday && !selected ? 'ring-2 ring-blue-600 dark:ring-blue-400' : '',
              ].join(' ')}
            >
              <span>{DAY_SHORT[d]}<span className="sr-only">, {count} {count === 1 ? 'class' : 'classes'}{isToday ? ', today' : ''}</span></span>
              <span className="flex gap-0.5 h-1.5" aria-hidden="true">
                {(byDay[d] ?? []).slice(0, 4).map((e) => (
                  <span key={e.id} className={['w-1.5 h-1.5 rounded-full', selected ? 'bg-white' : subjectColor(e.subjectCode).bar].join(' ')} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <section aria-label={`${DAY_FULL[activeDay]} classes`}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ textWrap: 'balance' }}>
            {DAY_FULL[activeDay]}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
            {dayEntries.length === 0 ? 'Free day' : `${dayEntries.length} ${dayEntries.length === 1 ? 'class' : 'classes'}`}
          </p>
        </div>

        {dayEntries.length === 0 ? (
          <div className="loka-card text-center py-8">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nothing scheduled</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enjoy the breathing room.</p>
          </div>
        ) : (
          <ol className="space-y-0">
            {dayEntries.map((e, i) => {
              const c = subjectColor(e.subjectCode)
              const s = toMin(e.startTime)
              const en = toMin(e.endTime)
              const isToday = now?.dow === activeDay
              const live = isToday && now !== null && s <= now.min && now.min < en
              const done = isToday && now !== null && now.min >= en
              const prev = dayEntries[i - 1]
              const gap = prev ? s - toMin(prev.endTime) : 0
              return (
                <li key={e.id}>
                  {gap >= 30 && (
                    <div className="flex items-center gap-3 py-2 pl-[4.25rem]">
                      <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">Free for {span(gap)}</span>
                      <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex gap-3 py-1.5">
                    <div className="w-[3.25rem] shrink-0 text-right pt-3">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{e.startTime.slice(0, 5)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">{e.endTime.slice(0, 5)}</p>
                    </div>
                    <Wrap
                      href={readOnly ? null : `/timetable/${e.id}/edit`}
                      className={[
                        'relative flex-1 min-w-0 rounded-2xl overflow-hidden pl-5 pr-4 py-3 border transition-transform duration-150 active:scale-[0.98]',
                        c.tint,
                        live ? 'border-blue-600 dark:border-blue-400 shadow-md' : 'border-transparent',
                      ].join(' ')}
                    >
                      <span className={['absolute left-0 top-0 bottom-0 w-2', c.bar].join(' ')} aria-hidden="true" />
                      <div className="flex items-start justify-between gap-2">
                        <p className={['font-bold text-base', c.text].join(' ')}>{e.subjectCode}</p>
                        {live && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-700 rounded-full px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden="true" />
                            Now
                          </span>
                        )}
                        {done && <span className="text-xs text-gray-700 dark:text-gray-200">Done</span>}
                      </div>
                      {e.subjectName && <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{e.subjectName}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs rounded-full px-2 py-0.5 bg-white/80 text-gray-800 dark:bg-slate-900/60 dark:text-gray-200 tabular-nums">
                          {span(en - s)}
                        </span>
                        {e.venue && (
                          <span className="text-xs rounded-full px-2 py-0.5 bg-white/80 text-gray-800 dark:bg-slate-900/60 dark:text-gray-200">
                            {e.venue}
                          </span>
                        )}
                        {e.groupName && (
                          <span className="text-xs rounded-full px-2 py-0.5 bg-white/80 text-gray-800 dark:bg-slate-900/60 dark:text-gray-200">
                            Group {e.groupName}
                          </span>
                        )}
                      </div>
                    </Wrap>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section aria-label="Week at a glance">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="loka-section-label mb-0">Week at a glance</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">{totalWeek} total</p>
        </div>
        <div className="loka-card">
          <div
            role="img"
            aria-label={`Your week: ${[1, 2, 3, 4, 5, 6, 7].filter((d) => byDay[d]?.length).map((d) => `${DAY_FULL[d]} ${byDay[d]!.length}`).join(', ')}`}
            className="grid grid-cols-7 gap-1.5"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div className="relative w-full h-28 rounded-lg bg-gray-100 dark:bg-slate-900/60 overflow-hidden">
                  {(byDay[d] ?? []).map((e) => {
                    const total = range.hi - range.lo
                    const top = ((toMin(e.startTime) - range.lo) / total) * 100
                    const h = ((toMin(e.endTime) - toMin(e.startTime)) / total) * 100
                    return (
                      <span
                        key={e.id}
                        className={['absolute left-0.5 right-0.5 rounded-md', subjectColor(e.subjectCode).bar].join(' ')}
                        style={{ top: `${top}%`, height: `${Math.max(h, 4)}%` }}
                      />
                    )
                  })}
                </div>
                <span className={['text-xs', now?.dow === d ? 'font-bold text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'].join(' ')}>
                  {DAY_SHORT[d]!.slice(0, 1)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 tabular-nums">
            {String(Math.floor(range.lo / 60)).padStart(2, '0')}:00 to {String(Math.floor(range.hi / 60)).padStart(2, '0')}:00
          </p>
        </div>
      </section>
    </div>
  )
}

function Wrap({ href, className, children }: { href: string | null; className: string; children: React.ReactNode }) {
  if (href === null) return <div className={className}>{children}</div>
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

function HeroCard({
  hero,
  readOnly,
}: {
  hero:
    | { kind: 'now'; entry: TimetableEntry; mins: number; pct: number }
    | { kind: 'next'; entry: TimetableEntry; mins: number }
    | { kind: 'later'; entry: TimetableEntry; day: number }
  readOnly: boolean
}) {
  const c = subjectColor(hero.entry.subjectCode)
  const label = hero.kind === 'now' ? (readOnly ? 'In class now' : 'Happening now') : hero.kind === 'next' ? 'Up next' : 'Next class'
  let sub: string
  if (hero.kind === 'later') sub = `${DAY_FULL[hero.day]} at ${hero.entry.startTime.slice(0, 5)}`
  else if (hero.kind === 'now') sub = `Ends in ${span(hero.mins)}`
  else sub = `Starts in ${span(hero.mins)}`
  return (
    <Wrap
      href={readOnly ? null : `/timetable/${hero.entry.id}/edit`}
      className={['block rounded-2xl bg-gradient-to-br text-white p-5 shadow-lg transition-transform duration-150 active:scale-[0.98]', c.hero].join(' ')}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-white">{label}</p>
      <p className="text-3xl font-extrabold mt-1" style={{ textWrap: 'balance' }}>{hero.entry.subjectCode}</p>
      <p className="text-base font-medium mt-0.5 tabular-nums">{sub}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs rounded-full px-2.5 py-1 bg-black/25 tabular-nums">
          {hero.entry.startTime.slice(0, 5)} to {hero.entry.endTime.slice(0, 5)}
        </span>
        {hero.entry.venue && <span className="text-xs rounded-full px-2.5 py-1 bg-black/25">{hero.entry.venue}</span>}
        {hero.entry.groupName && <span className="text-xs rounded-full px-2.5 py-1 bg-black/25">Group {hero.entry.groupName}</span>}
      </div>
      {hero.kind === 'now' && (
        <div className="mt-4">
          <div
            role="progressbar"
            aria-label="Class progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hero.pct}
            className="h-2 rounded-full bg-black/30 overflow-hidden"
          >
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${hero.pct}%` }} />
          </div>
          <p className="text-xs mt-1.5 tabular-nums">{hero.pct}% done</p>
        </div>
      )}
    </Wrap>
  )
}
