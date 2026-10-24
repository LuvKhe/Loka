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

function slotKey(slot: ProgrammeSlot) {
  return `${slot.moduleCode}|${slot.day}|${slot.startTime}|${slot.venue}`
}

function yearOf(code: string): number {
  const digit = code.match(/\d/)?.[0]
  return digit ? Number(digit) : 0
}

export default function SelectClient() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('pick')
  const [programmeId, setProgrammeId] = useState('')
  const [year, setYear] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const programme = UNESWA_PROGRAMMES.find((p) => p.id === programmeId)

  const modules = useMemo(() => {
    if (!programme) return []
    const codes = Array.from(new Set(programme.slots.map((s) => s.moduleCode))).sort()
    return codes.map((code) => ({
      code,
      year: yearOf(code),
      slots: getModuleSlots(programme.id, code),
    }))
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

  function toggleModule(slots: ProgrammeSlot[]) {
    const allOn = slots.every((s) => selected.has(slotKey(s)))
    setSelected((prev) => {
      const next = new Set(prev)
      slots.forEach((s) => (allOn ? next.delete(slotKey(s)) : next.add(slotKey(s))))
      return next
    })
  }

  async function handleSave() {
    if (selectedSlots.length === 0) return
    setSaving(true)
    setError(null)

    try {
      for (const slot of selectedSlots) {
        const res = await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectCode: slot.moduleCode,
            subjectName: null,
            dayOfWeek: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            groupName: programme?.name ?? null,
            venue: slot.venue,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Failed to save ${slot.moduleCode}`)
        }
      }

      setPhase('done')
      setTimeout(() => router.push('/timetable'), 1500)
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
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Classes added</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Taking you to your timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-40">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add from Programme</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Pick your programme, then your year, then tick your modules
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
            {visibleModules.map(({ code, slots }) => {
              const allOn = slots.every((s) => selected.has(slotKey(s)))
              const someOn = slots.some((s) => selected.has(slotKey(s)))

              return (
                <div key={code} className="loka-card">
                  <button
                    className="w-full flex items-center justify-between mb-2"
                    onClick={() => toggleModule(slots)}
                  >
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{code}</p>
                    <div
                      className={[
                        'w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                        allOn
                          ? 'bg-blue-500 border-blue-500'
                          : someOn
                          ? 'bg-blue-200 border-blue-300 dark:bg-blue-900 dark:border-blue-700'
                          : 'border-gray-300 dark:border-gray-600',
                      ].join(' ')}
                    >
                      {(allOn || someOn) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          {allOn ? (
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          ) : (
                            <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          )}
                        </svg>
                      )}
                    </div>
                  </button>

                  <div className="space-y-1.5">
                    {slots.map((slot) => {
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
                              {DAY_LABELS[slot.day]}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                              {slot.startTime}–{slot.endTime}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                              {slot.venue}
                            </span>
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
                  </div>
                </div>
              )
            })}
          </div>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </section>
      )}

      {selectedSlots.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-4 pt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="loka-btn-primary w-full py-3 disabled:opacity-40"
          >
            {saving
              ? 'Saving...'
              : `Add ${selectedSlots.length} slot${selectedSlots.length === 1 ? '' : 's'} to timetable`}
          </button>
        </div>
      )}
    </div>
  )
}
