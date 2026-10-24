'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  UNESWA_PROGRAMMES,
  getModuleSlots,
  DAY_LABELS,
  type ProgrammeSlot,
} from '@/lib/uneswa-timetable'

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
  const [myGroup, setMyGroup] = useState<string | null>(null)
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

  const groupLetters = useMemo(
    () =>
      Array.from(
        new Set(modules.flatMap((m) => m.groups.map((g) => g.name))),
      ).sort(),
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
    setMyGroup(null)
    setError(null)
    const prog = UNESWA_PROGRAMMES.find((p) => p.id === id)
    if (!prog) {
      setYear(null)
      return
    }
    const ys = prog.slots.map((s) => yearOf(s.moduleCode)).sort((a, b) => a - b)
    setYear(ys[0] ?? null)
  }

  function chooseMyGroup(letter: string) {
    const next = myGroup === letter ? null : letter
    setMyGroup(next)
    if (!next) return
    setSelected((prev) => {
      const updated = new Set(prev)
      modules.forEach((m) => {
        if (m.groups.length === 0) return
        const enrolled = m.slots.some((s) => prev.has(slotKey(s)))
        if (!enrolled) return
        const match = m.groups.find((g) => g.name === next)
        if (!match) return
        m.groups.forEach((g) => g.slots.forEach((s) => updated.delete(slotKey(s))))
        match.slots.forEach((s) => updated.add(slotKey(s)))
      })
      return updated
    })
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
        const match = myGroup ? m.groups.find((g) => g.name === myGroup) : undefined
        match?.slots.forEach((s) => next.add(slotKey(s)))
      }
      return next
    })
  }

  function chooseGroup(groups: ModuleGroup[], name: string) {
    const chosen = groups.find((g) => g.name === name)
    if (!chosen) return
    const alreadyOn = chosen.slots.every((s) => selected.has(slotKey(s)))
    setSelected((prev) => {
      const next = new Set(prev)
      groups.forEach((g) => g.slots.forEach((s) => next.delete(slotKey(s))))
      if (!alreadyOn) chosen.slots.forEach((s) => next.add(slotKey(s)))
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

  if (phase === 'done') {
    return (
      <div className="p-4">
        <div className="loka-card text-center py-8">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Timetable saved</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Taking you to your timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-48">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add from Programme</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Pick your programme and group, then add your modules
        </p>
      </div>

      <section>
        <p className="loka-section-label">Programme</p>
        <div className="loka-card">
          <select
            className="loka-input w-full"
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
        </div>
      </section>

      {programme && groupLetters.length > 0 && (
        <section>
          <p className="loka-section-label">Your group</p>
          <div className="loka-card">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Labs and practicals are split into groups. Pick yours and it is applied to every
              module that has groups, so only your sessions appear on your timetable.
            </p>
            <div className="flex gap-2 flex-wrap">
              {groupLetters.map((letter) => {
                const active = myGroup === letter
                return (
                  <button
                    key={letter}
                    onClick={() => chooseMyGroup(letter)}
                    className={[
                      'min-w-[3.25rem] px-4 py-2 rounded-lg text-sm font-semibold border transition-colors',
                      active
                        ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-200',
                    ].join(' ')}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
            {!myGroup && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                Choose your group before adding modules.
              </p>
            )}
          </div>
        </section>
      )}

      {programme && years.length > 0 && (
        <section>
          <p className="loka-section-label">Year of study</p>
          <div className="flex gap-2 flex-wrap">
            {years.map((y) => {
              const active = y === year
              const count = countForYear(y)
              return (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                    active
                      ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-200',
                  ].join(' ')}
                >
                  Year {y}
                  {count > 0 && <span className="ml-1.5 opacity-80">({count})</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {programme && year !== null && (
        <section>
          <p className="loka-section-label">
            Year {year} modules — {visibleModules.length}
          </p>

          <div className="space-y-3">
            {visibleModules.map((m) => {
              const { code, lectures, groups } = m
              const enrolled = m.slots.some((s) => selected.has(slotKey(s)))
              const groupChosen = groups.some((g) => g.slots.every((s) => selected.has(slotKey(s))))
              const missingMyGroup =
                myGroup !== null && groups.length > 0 && !groups.some((g) => g.name === myGroup)

              return (
                <div key={code} className="loka-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{code}</p>
                    <button
                      className={[
                        'text-xs font-medium px-3 py-1 rounded-lg border transition-colors',
                        enrolled
                          ? 'border-gray-300 text-gray-600 dark:border-slate-600 dark:text-gray-300'
                          : 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500',
                      ].join(' ')}
                      onClick={() => toggleModule(m)}
                    >
                      {enrolled ? 'Remove' : 'Add module'}
                    </button>
                  </div>

                  {lectures.length > 0 && (
                    <div className="space-y-1.5">
                      {groups.length > 0 && (
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Lectures</p>
                      )}
                      {lectures.map((slot) => {
                        const on = selected.has(slotKey(slot))
                        return (
                          <button
                            key={slotKey(slot)}
                            onClick={() => toggleSlot(slot)}
                            className={[
                              'w-full text-left flex items-center justify-between rounded-lg px-3 py-2 transition-colors',
                              on ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-slate-700/40',
                            ].join(' ')}
                          >
                            <div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {slotLabel(slot)}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                                {slot.venue}
                              </span>
                            </div>
                            <div
                              className={[
                                'w-4 h-4 rounded border-2 shrink-0 transition-colors',
                                on ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600',
                              ].join(' ')}
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {groups.length > 0 && (
                    <div className={['space-y-1.5', lectures.length > 0 ? 'mt-3' : ''].join(' ')}>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        Group sessions
                      </p>
                      {groups.map((g) => {
                        const on = g.slots.every((s) => selected.has(slotKey(s)))
                        return (
                          <button
                            key={g.name}
                            onClick={() => chooseGroup(groups, g.name)}
                            className={[
                              'w-full text-left flex items-center justify-between rounded-lg px-3 py-2 transition-colors',
                              on ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-slate-700/40',
                            ].join(' ')}
                          >
                            <div>
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                Group {g.name}
                              </p>
                              {g.slots.map((slot) => (
                                <p
                                  key={slotKey(slot)}
                                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                                >
                                  {slotLabel(slot)}
                                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                                    {slot.venue}
                                  </span>
                                </p>
                              ))}
                            </div>
                            <div
                              className={[
                                'w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                                on ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600',
                              ].join(' ')}
                            />
                          </button>
                        )
                      })}
                      {missingMyGroup && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Group {myGroup} is not offered for this module. Pick one of the groups above.
                        </p>
                      )}
                      {enrolled && !groupChosen && !missingMyGroup && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Pick a group to finish this module
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </section>
      )}

      {selectedSlots.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-4 pt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200 dark:border-slate-800 space-y-3">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
            />
            Replace my current timetable with this one
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="loka-btn-primary w-full py-3 disabled:opacity-40"
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
