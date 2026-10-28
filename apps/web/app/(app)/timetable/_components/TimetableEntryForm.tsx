'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TimetableEntry } from '@loka/shared/types'
import {
  validateSubjectCode,
  validateTime,
  validateTimeRange,
  validateDayOfWeek,
} from '@loka/shared/validation'

const DAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

interface Props {
  existing?: TimetableEntry
}

interface FormErrors {
  subjectCode?: string
  dayOfWeek?: string
  startTime?: string
  endTime?: string
  timeRange?: string
}

export default function TimetableEntryForm({ existing }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const [form, setForm] = useState({
    subjectCode: existing?.subjectCode ?? '',
    subjectName: existing?.subjectName ?? '',
    dayOfWeek: existing?.dayOfWeek ?? 1,
    startTime: existing?.startTime ?? '',
    endTime: existing?.endTime ?? '',
    groupName: existing?.groupName ?? '',
    venue: existing?.venue ?? '',
    room: existing?.room ?? '',
    lecturer: existing?.lecturer ?? '',
    notes: existing?.notes ?? '',
  })

  function set(key: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined, timeRange: undefined }))
    setServerError(null)
  }

  function validate(): FormErrors {
    const e: FormErrors = {}

    const codeResult = validateSubjectCode(form.subjectCode)
    if (!codeResult.ok) e.subjectCode = codeResult.error

    const dayResult = validateDayOfWeek(form.dayOfWeek)
    if (!dayResult.ok) e.dayOfWeek = dayResult.error

    const startResult = validateTime(form.startTime)
    if (!startResult.ok) e.startTime = startResult.error

    const endResult = validateTime(form.endTime)
    if (!endResult.ok) e.endTime = endResult.error

    if (!e.startTime && !e.endTime) {
      const rangeResult = validateTimeRange(form.startTime, form.endTime)
      if (!rangeResult.ok) e.timeRange = rangeResult.error
    }

    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const url = existing ? `/api/timetable/${existing.id}` : '/api/timetable'
      const method = existing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: form.subjectCode.trim().toUpperCase(),
          subjectName: form.subjectName.trim() || null,
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          groupName: form.groupName.trim() || null,
          venue: form.venue.trim() || null,
          room: form.room.trim() || null,
          lecturer: form.lecturer.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save')
      }

      router.push('/timetable')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm('Delete this class?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/timetable/${existing.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/timetable')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject code */}
      <div>
        <label htmlFor="field-subject-code" className="block text-xs font-medium text-gray-500 mb-1">Subject code *</label>
        <input id="field-subject-code"
          type="text"
          value={form.subjectCode}
          onChange={(e) => set('subjectCode', e.target.value)}
          placeholder="e.g. CS101"
          className={['loka-input w-full', errors.subjectCode ? 'border-red-400' : ''].join(' ')}
          autoCapitalize="characters"
        />
        {errors.subjectCode && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.subjectCode}</p>}
      </div>

      {/* Subject name */}
      <div>
        <label htmlFor="field-subject-name" className="block text-xs font-medium text-gray-500 mb-1">Subject name</label>
        <input id="field-subject-name"
          type="text"
          value={form.subjectName}
          onChange={(e) => set('subjectName', e.target.value)}
          placeholder="e.g. Introduction to Computer Science"
          className="loka-input w-full"
        />
      </div>

      {/* Day */}
      <div>
        <label htmlFor="field-day" className="block text-xs font-medium text-gray-500 mb-1">Day *</label>
        <select id="field-day"
          value={form.dayOfWeek}
          onChange={(e) => set('dayOfWeek', Number(e.target.value))}
          className={['loka-input w-full', errors.dayOfWeek ? 'border-red-400' : ''].join(' ')}
        >
          {DAY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        {errors.dayOfWeek && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.dayOfWeek}</p>}
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="field-start-time" className="block text-xs font-medium text-gray-500 mb-1">Start time *</label>
          <input id="field-start-time"
            type="time"
            value={form.startTime}
            onChange={(e) => set('startTime', e.target.value)}
            className={['loka-input w-full font-mono', errors.startTime ? 'border-red-400' : ''].join(' ')}
          />
          {errors.startTime && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.startTime}</p>}
        </div>
        <div>
          <label htmlFor="field-end-time" className="block text-xs font-medium text-gray-500 mb-1">End time *</label>
          <input id="field-end-time"
            type="time"
            value={form.endTime}
            onChange={(e) => set('endTime', e.target.value)}
            className={['loka-input w-full font-mono', errors.endTime ? 'border-red-400' : ''].join(' ')}
          />
          {errors.endTime && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.endTime}</p>}
        </div>
      </div>
      {errors.timeRange && <p className="text-xs text-red-600 dark:text-red-400 -mt-2">{errors.timeRange}</p>}

      {/* Optional fields */}
      <div>
        <label htmlFor="field-group-section" className="block text-xs font-medium text-gray-500 mb-1">Group / section</label>
        <input id="field-group-section"
          type="text"
          value={form.groupName}
          onChange={(e) => set('groupName', e.target.value)}
          placeholder="e.g. A"
          className="loka-input w-full"
        />
      </div>

      <div>
        <label htmlFor="field-venue" className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
        <input id="field-venue"
          type="text"
          value={form.venue}
          onChange={(e) => set('venue', e.target.value)}
          placeholder="e.g. Science Block"
          className="loka-input w-full"
        />
      </div>

      <div>
        <label htmlFor="field-room" className="block text-xs font-medium text-gray-500 mb-1">Room</label>
        <input id="field-room"
          type="text"
          value={form.room}
          onChange={(e) => set('room', e.target.value)}
          placeholder="e.g. SB-201"
          className="loka-input w-full"
        />
      </div>

      <div>
        <label htmlFor="field-lecturer" className="block text-xs font-medium text-gray-500 mb-1">Lecturer</label>
        <input id="field-lecturer"
          type="text"
          value={form.lecturer}
          onChange={(e) => set('lecturer', e.target.value)}
          placeholder="e.g. Dr Smith"
          className="loka-input w-full"
        />
      </div>

      <div>
        <label htmlFor="field-notes" className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea id="field-notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any additional notes..."
          rows={3}
          className="loka-input w-full resize-none"
        />
      </div>

      {serverError && (
        <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>
      )}

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : existing ? 'Save changes' : 'Add class'}
        </button>

        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="loka-btn-danger w-full py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete class'}
          </button>
        )}
      </div>
    </form>
  )
}
