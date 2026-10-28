'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  UNESWA_PROGRAMMES,
  getModuleSlots,
  DAY_LABELS,
  type ProgrammeSlot,
} from '@/lib/uneswa-timetable'
import { subjectColor } from '@/lib/subject-color'

type Phase = 'pick' | 'done'

interface ModuleGroup {
  name: string
  slots: ProgrammeSlot[]
}

interface ModuleInfo {
  code: string
  year: number
  slots: ProgrammeSlot[]
  lectures: ProgrammeSlot[]
  groups: ModuleGroup[]
}

function slotKey(slot: ProgrammeSlot) {
  return `${slot.moduleCode}|${slot.group ?? ''}|${slot.day}|${slot.startTime}|${slot.venue}`
}

function yearOf(code: string): number {
  const digit = code.match(/\d/)?.[0]
  return digit ? Number(digit) : 0
}

function slotLabel(slot: ProgrammeSlot) {
  return `${DAY_LABELS[slot.day]} ${slot.startTime}–${slot.endTime}`
}

export default function SelectClient() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('pick')
  const [programmeId, setProgrammeId] = useState('')
  const [year, setYear] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const programme = UNESWA_PROGRAMMES.find((p) => p.id === programmeId)

  const modules: ModuleInfo[] = useMemo(() => {
    if (!programme) return []
    const codes = Array.from(new Set(programme.slots.map((s) => s.moduleCode))).sort()
    return codes.map((code) => {
      const slots = getModuleSlots(programme.id, code)
      const lectures = slots.filter((s) => !s.group)
      const groupNames = Array.from(
        new Set(slots.filter((s) => s.group).map((s) => s.group as string)),
      ).sort()
      const groups = groupNames.map((name) => ({
        name,
        slots: slots.filter((s) => s.group === name),
      }))
      return { code, year: yearOf(code), slots, lectures, groups }
    })
  }, [programme])

  const years = useMemo(
    () => Array.from(new Set(modules.map((m) => m.year))).sort((a, b) => a - b),
    [modules],
  )

  const visibleModules = useMemo(
    () => modules.filter((m) => m.year === year),
    [modules, year],
  )

  const selectedSlots = useMemo(
    () => modules.flatMap((m) => m.slots).filter((s) => selected.has(slotKey(s))),
    [modules, selected],
  )

  function countForYear(y: number) {
    return modules
      .filter((m) => m.year === y)
      .reduce((n, m) => n + m.slots.filter((s) => selected.has(slotKey(s))).length, 0)
  }

  function handleProgrammeSelect(id: string) {
    setProgrammeId(id)
    setSelected(new Set())
    setError(null)
    const prog = UNESWA_PROGRAMMES.find((p) => p.id === id)
    if (!prog) {
      setYear(null)
      return
    }
    const ys = prog.slots.map((s) => yearOf(s.moduleCode)).sort((a, b) => a - b)
    setYear(ys[0] ?? null)
  }

  function toggleSlot(slot: ProgrammeSlot) {
    const key = slotKey(slot)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleModule(m: ModuleInfo) {
    const enrolled = m.slots.some((s) => selected.has(slotKey(s)))
    setSelected((prev) => {
      const next = new Set(prev)
      if (enrolled) {
        m.slots.forEach((s) => next.delete(slotKey(s)))
      } else {
        m.lectures.forEach((s) => next.add(slotKey(s)))
      }
      return next
    })
  }

  function chooseGroup(m: ModuleInfo, name: string) {
    const chosen = m.groups.find((g) => g.name === name)
    if (!chosen) return
    const alreadyOn = chosen.slots.every((s) => selected.has(slotKey(s)))
    setSelected((prev) => {
      const next = new Set(prev)
      m.groups.forEach((g) => g.slots.forEach((s) => next.delete(slotKey(s))))
      if (!alreadyOn) {
        chosen.slots.forEach((s) => next.add(slotKey(s)))
        m.lectures.forEach((s) => next.add(slotKey(s)))
      }
      return next
    })
  }

  async function handleSave() {
    if (selectedSlots.length === 0) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace: replaceExisting,
          entries: selectedSlots.map((slot) => ({
            subjectCode: slot.moduleCode,
            subjectName: null,
            dayOfWeek: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            groupName: slot.group,
            venue: slot.venue,
          })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save your timetable')
      }

      setPhase('done')
      setTimeout(() => {
        router.push('/timetable')
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const enrolledCount = modules.filter((m) => m.slots.some((s) => selected.has(slotKey(s)))).length
  const needGroup = modules.filter(
    (m) =>
      m.groups.length > 0 &&
      m.slots.some((s) => selected.has(slotKey(s))) &&
      !m.groups.some((g) => g.slots.every((s) => selected.has(slotKey(s)))),
  ).length

  if (phase === 'done') {
    return (
      <div className="p-4">
        <div className="loka-card text-center py-12">
          <svg viewBox="0 0 64 64" className="w-20 h-20 mx-auto mb-4" aria-hidden="true">
            <circle cx="32" cy="32" r="30" className="fill-emerald-100 dark:fill-emerald-900/40" />
            <path
              d="M18 33 l9 9 l19 -20"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-emerald-700 dark:stroke-emerald-400 loka-draw"
            />
          </svg>
          <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Timetable saved</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 tabular-nums">
            {selectedSlots.length} class{selectedSlots.length === 1 ? '' : 'es'} added. Taking you there now.
          </p>
        </div>
      </div>
    )
  }

  const step = !programme ? 1 : enrolledCount === 0 ? 2 : 3
  const steps = ['Programme', 'Modules', 'Groups']

  return (
    <div className="p-4 space-y-5 pb-56">
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100" style={{ textWrap: 'balance' }}>
          Build your week
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" style={{ textWrap: 'balance' }}>
          Pick your programme, add your modules, then choose your group for each.
        </p>
      </div>

      <ol className="flex items-center gap-2" aria-label="Progress">
        {steps.map((label, i) => {
          const n = i + 1
          const done = n < step
          const current = n === step
          return (
            <li key={label} className="flex-1" aria-current={current ? 'step' : undefined}>
              <div
                className={[
                  'h-1.5 rounded-full transition-colors duration-300',
                  done || current ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-slate-700',
                ].join(' ')}
              />
              <p
                className={[
                  'text-xs mt-1.5 font-medium',
                  current ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400',
                ].join(' ')}
              >
                {n}. {label}
              </p>
            </li>
          )
        })}
      </ol>

      <section>
        <label htmlFor="programme" className="loka-section-label block">Programme</label>
        <select
          id="programme"
          className="loka-input w-full min-h-[3rem] font-medium"
          value={programmeId}
          onChange={(e) => handleProgrammeSelect(e.target.value)}
        >
          <option value="">Select a programme...</option>
          {UNESWA_PROGRAMMES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </section>

      {programme && years.length > 0 && (
        <section>
          <p className="loka-section-label">Year of study</p>
          <div
            role="group"
            aria-label="Year of study"
            className="grid gap-1.5 p-1 rounded-xl bg-gray-200/70 dark:bg-slate-800"
            style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}
          >
            {years.map((y) => {
              const active = y === year
              const count = countForYear(y)
              return (
                <button
                  key={y}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setYear(y)}
                  className={[
                    'min-h-[2.75rem] rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95',
                    active
                      ? 'bg-white text-blue-800 shadow dark:bg-slate-600 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300',
                  ].join(' ')}
                >
                  Year {y}
                  {count > 0 && <span className="ml-1 text-xs tabular-nums">({count})</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {programme && year !== null && (
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <p className="loka-section-label mb-0">Year {year} modules</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
              {enrolledCount} of {modules.length} added
            </p>
          </div>

          <div className="loka-list">
            {visibleModules.map((m) => {
              const { code, lectures, groups } = m
              const enrolled = m.slots.some((s) => selected.has(slotKey(s)))
              const chosenGroup = groups.find((g) => g.slots.every((s) => selected.has(slotKey(s))))
              const c = subjectColor(code)

              return (
                <div
                  key={code}
                  className={[
                    'relative rounded-2xl overflow-hidden border pl-5 pr-4 py-3 transition-colors duration-200',
                    enrolled ? c.tint + ' border-transparent' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700',
                  ].join(' ')}
                >
                  <span className={['absolute left-0 top-0 bottom-0 w-2', c.bar].join(' ')} aria-hidden="true" />
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className={['font-extrabold text-lg', enrolled ? c.text : 'text-gray-900 dark:text-gray-100'].join(' ')}>
                      {code}
                    </p>
                    <button
                      type="button"
                      aria-label={`${enrolled ? 'Remove' : 'Add'} ${code}`}
                      className={[
                        'min-h-[2.75rem] min-w-[5.5rem] text-sm font-semibold px-4 rounded-full border transition-all duration-150 active:scale-95',
                        enrolled
                          ? 'border-gray-400 text-gray-800 bg-white dark:border-slate-400 dark:text-white dark:bg-slate-900'
                          : 'border-blue-700 bg-blue-700 text-white',
                      ].join(' ')}
                      onClick={() => toggleModule(m)}
                    >
                      {enrolled ? 'Remove' : 'Add'}
                    </button>
                  </div>

                  {lectures.length > 0 && (
                    <div className="space-y-1.5">
                      {groups.length > 0 && (
                        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Lectures</p>
                      )}
                      {lectures.map((slot) => {
                        const on = selected.has(slotKey(slot))
                        return (
                          <button
                            key={slotKey(slot)}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleSlot(slot)}
                            className="w-full text-left flex items-center justify-between gap-3 rounded-xl px-3 min-h-[2.75rem] bg-white/80 dark:bg-slate-900/50 active:scale-[0.98] transition-transform duration-150"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                                {slotLabel(slot)}
                              </span>
                              <span className="block text-xs text-gray-600 dark:text-slate-400 truncate">{slot.venue}</span>
                            </span>
                            <Tick on={on} />
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {groups.length > 0 && (
                    <div className={lectures.length > 0 ? 'mt-3' : ''}>
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                        Your group for {code}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {groups.map((g) => {
                          const on = chosenGroup?.name === g.name
                          return (
                            <button
                              key={g.name}
                              type="button"
                              aria-pressed={on}
                              aria-label={`Group ${g.name} for ${code}`}
                              onClick={() => chooseGroup(m, g.name)}
                              className={[
                                'min-w-[2.75rem] min-h-[2.75rem] px-3 rounded-full text-base font-bold border-2 transition-all duration-150 active:scale-90',
                                on
                                  ? 'bg-blue-700 border-blue-700 text-white scale-105'
                                  : 'bg-white border-gray-300 text-gray-800 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100',
                              ].join(' ')}
                            >
                              {g.name}
                            </button>
                          )
                        })}
                      </div>
                      {chosenGroup ? (
                        <div className="mt-2 rounded-xl bg-white/80 dark:bg-slate-900/50 px-3 py-2 space-y-0.5">
                          {chosenGroup.slots.map((slot) => (
                            <p key={slotKey(slot)} className="text-xs text-gray-800 dark:text-gray-200 tabular-nums">
                              {slotLabel(slot)}
                              <span className="ml-2 text-gray-600 dark:text-slate-400">{slot.venue}</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        enrolled && (
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-2">
                            Pick your group to finish this module
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400 mt-3">{error}</p>}
        </section>
      )}

      {selectedSlots.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 loka-shell px-4 pb-4 pt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200 dark:border-slate-800 space-y-3 z-30">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 min-h-[2.75rem]">
            <input
              type="checkbox"
              className="w-5 h-5"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
            />
            Replace my current timetable with this one
          </label>
          {needGroup > 0 && (
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              {needGroup} module{needGroup === 1 ? ' still needs' : 's still need'} a group
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="loka-btn-primary w-full py-3 min-h-[3rem] text-base disabled:opacity-40"
          >
            {saving
              ? 'Saving...'
              : `Save ${selectedSlots.length} class${selectedSlots.length === 1 ? '' : 'es'} to timetable`}
          </button>
        </div>
      )}
    </div>
  )
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-all duration-150',
        on ? 'bg-blue-700 border-blue-700 scale-110' : 'border-gray-400 dark:border-slate-500',
      ].join(' ')}
    >
      {on && (
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
          <path d="M3.5 8.5 l3 3 l6 -7" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}
