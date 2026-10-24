'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UNESWA_PROGRAMMES,
  getModuleCodes,
  getModuleSlots,
  DAY_LABELS,
  type ProgrammeSlot,
} from '@/lib/uneswa-timetable'

type Phase = 'programme' | 'module' | 'slots' | 'saving' | 'done'

export default function SelectClient() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('programme')
  const [programmeId, setProgrammeId] = useState('')
  const [moduleCode, setModuleCode] = useState('')
  const [selectedSlots, setSelectedSlots] = useState<ProgrammeSlot[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const programme = UNESWA_PROGRAMMES.find((p) => p.id === programmeId)
  const moduleCodes = programmeId ? getModuleCodes(programmeId) : []
  const moduleSlots = programmeId && moduleCode ? getModuleSlots(programmeId, moduleCode) : []

  function handleProgrammeSelect(id: string) {
    setProgrammeId(id)
    setModuleCode('')
    setSelectedSlots([])
    setPhase('module')
  }

  function handleModuleSelect(code: string) {
    setModuleCode(code)
    setSelectedSlots([])
    setPhase('slots')
  }

  function toggleSlot(slot: ProgrammeSlot) {
    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) => s.day === slot.day && s.startTime === slot.startTime && s.venue === slot.venue
      )
      if (exists) return prev.filter((s) => !(s.day === slot.day && s.startTime === slot.startTime && s.venue === slot.venue))
      return [...prev, slot]
    })
  }

  function isSlotSelected(slot: ProgrammeSlot) {
    return selectedSlots.some(
      (s) => s.day === slot.day && s.startTime === slot.startTime && s.venue === slot.venue
    )
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
          <p className="text-gray-900 font-semibold mb-1">Classes added</p>
          <p className="text-sm text-gray-500">Taking you to your timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Add from Programme</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select your UNESWA programme to browse official class times
        </p>
      </div>

      {/* Step 1 — Programme */}
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

      {/* Step 2 — Module */}
      {phase !== 'programme' && (
        <section>
          <p className="loka-section-label">Module</p>
          <div className="loka-card">
            <select
              className="loka-input w-full"
              value={moduleCode}
              onChange={(e) => handleModuleSelect(e.target.value)}
            >
              <option value="">Select a module code...</option>
              {moduleCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Step 3 — Slots */}
      {phase === 'slots' && moduleSlots.length > 0 && (
        <section>
          <p className="loka-section-label">
            Class times for {moduleCode}
          </p>
          <p className="text-xs text-gray-400 mb-2 -mt-1">
            Select the slots that match your group
          </p>
          <div className="space-y-2">
            {moduleSlots.map((slot, i) => {
              const selected = isSlotSelected(slot)
              return (
                <button
                  key={i}
                  onClick={() => toggleSlot(slot)}
                  className={[
                    'w-full text-left loka-card border-2 transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {DAY_LABELS[slot.day]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {slot.startTime} – {slot.endTime}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{slot.venue}</p>
                    </div>
                    <div
                      className={[
                        'w-5 h-5 rounded-full border-2 shrink-0 transition-colors',
                        selected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300',
                      ].join(' ')}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}

          {selectedSlots.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="loka-btn-primary w-full py-3 mt-4 disabled:opacity-40"
            >
              {saving
                ? 'Saving...'
                : `Add ${selectedSlots.length} slot${selectedSlots.length === 1 ? '' : 's'} to timetable`}
            </button>
          )}
        </section>
      )}

      {/* Back links */}
      {phase !== 'programme' && (
        <div className="pt-2">
          <button
            onClick={() => {
              if (phase === 'slots') {
                setModuleCode('')
                setSelectedSlots([])
                setPhase('module')
              } else {
                setProgrammeId('')
                setModuleCode('')
                setSelectedSlots([])
                setPhase('programme')
              }
            }}
            className="text-sm text-blue-500"
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}
