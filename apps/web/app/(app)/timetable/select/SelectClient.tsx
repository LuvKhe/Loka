'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  UNESWA_PROGRAMMES,
  getModuleSlots,
  DAY_LABELS,
  type ProgrammeSlot,
} from '@/lib/uneswa-timetable'

type Phase = 'programme' | 'modules' | 'saving' | 'done'

function slotKey(slot: ProgrammeSlot) {
  return `${slot.moduleCode}|${slot.day}|${slot.startTime}|${slot.venue}`
}

export default function SelectClient() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('programme')
  const [programmeId, setProgrammeId] = useState('')
  const [deselected, setDeselected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const programme = UNESWA_PROGRAMMES.find((p) => p.id === programmeId)

  const moduleList = useMemo(() => {
    if (!programme) return []
    const codes = Array.from(new Set(programme.slots.map((s) => s.moduleCode))).sort()
    return codes.map((code) => ({
      code,
      slots: getModuleSlots(programme.id, code),
    }))
  }, [programme])

  const allSlots = useMemo(() => moduleList.flatMap((m) => m.slots), [moduleList])

  const selectedSlots = useMemo(
    () => allSlots.filter((s) => !deselected.has(slotKey(s))),
    [allSlots, deselected],
  )

  function handleProgrammeSelect(id: string) {
    setProgrammeId(id)
    setDeselected(new Set())
    if (id) setPhase('modules')
  }

  function toggleSlot(slot: ProgrammeSlot) {
    const key = slotKey(slot)
    setDeselected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleModule(code: string, slots: ProgrammeSlot[]) {
    const allSelected = slots.every((s) => !deselected.has(slotKey(s)))
    setDeselected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        slots.forEach((s) => next.add(slotKey(s)))
      } else {
        slots.forEach((s) => next.delete(slotKey(s)))
      }
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
    <div className="p-4 space-y-4 pb-32">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add from Programme</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Select your UNESWA programme to load all class times
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

      {phase === 'modules' && programme && (
        <>
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="loka-section-label mb-0">
                Modules — {selectedSlots.length} slot{selectedSlots.length === 1 ? '' : 's'} selected
              </p>
              <button
                className="text-xs text-blue-500"
                onClick={() => {
                  if (deselected.size === 0) {
                    setDeselected(new Set(allSlots.map(slotKey)))
                  } else {
                    setDeselected(new Set())
                  }
                }}
              >
                {deselected.size === 0 ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="space-y-3">
              {moduleList.map(({ code, slots }) => {
                const allSelected = slots.every((s) => !deselected.has(slotKey(s)))
                const someSelected = slots.some((s) => !deselected.has(slotKey(s)))

                return (
                  <div key={code} className="loka-card">
                    <button
                      className="w-full flex items-center justify-between mb-2"
                      onClick={() => toggleModule(code, slots)}
                    >
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{code}</p>
                      <div
                        className={[
                          'w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                          allSelected
                            ? 'bg-blue-500 border-blue-500'
                            : someSelected
                            ? 'bg-blue-200 border-blue-300 dark:bg-blue-900 dark:border-blue-700'
                            : 'border-gray-300 dark:border-gray-600',
                        ].join(' ')}
                      >
                        {(allSelected || someSelected) && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            {allSelected ? (
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
                        const selected = !deselected.has(slotKey(slot))
                        return (
                          <button
                            key={slotKey(slot)}
                            onClick={() => toggleSlot(slot)}
                            className={[
                              'w-full text-left flex items-center justify-between rounded-lg px-3 py-2 transition-colors',
                              selected
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'bg-gray-50 dark:bg-gray-800/50',
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
                                selected
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 dark:border-gray-600',
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
          </section>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </>
      )}

      {phase === 'modules' && selectedSlots.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-800">
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
