'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ScanResult, ScannedClass, ScanAmbiguity } from '@loka/shared/types'

// ---------------------------------------------------------------------------
// Day name → DayOfWeek number
// ---------------------------------------------------------------------------
const DAY_MAP: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 7,
}

function dayNameToNumber(day: string | null): number | null {
  if (!day) return null
  return DAY_MAP[day.toLowerCase()] ?? null
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Phase = 'pick' | 'scanning' | 'review' | 'saving' | 'done'

interface ClassRow {
  scanned: ScannedClass
  selected: boolean
  // resolved values (user may have overridden ambiguous fields)
  resolvedDay: string | null
  resolvedGroup: string | null
  resolvedVenue: string | null
}

// ---------------------------------------------------------------------------
// Confidence pill
// ---------------------------------------------------------------------------
function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 80 ? 'bg-green-100 text-green-700' :
    pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ScanClient() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('pick')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [rows, setRows] = useState<ClassRow[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  // -------------------------------------------------------------------------
  // Image selection
  // -------------------------------------------------------------------------
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (!picked) return

    // Validate client-side first
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowed.includes(picked.type)) {
      setScanError('Please choose a JPEG, PNG, or WebP image.')
      return
    }
    if (picked.size > 10 * 1024 * 1024) {
      setScanError('Image must be under 10 MB.')
      return
    }

    setScanError(null)
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  // -------------------------------------------------------------------------
  // Scan — upload to /api/timetable/scan
  // -------------------------------------------------------------------------
  async function handleScan() {
    if (!file) return
    setPhase('scanning')
    setScanError(null)

    try {
      const form = new FormData()
      form.append('image', file)

      const res = await fetch('/api/timetable/scan', { method: 'POST', body: form })
      const data: ScanResult = await res.json()

      if (!res.ok) {
        setScanError((data as { error?: string }).error ?? 'Scan failed. Please try again.')
        setPhase('pick')
        return
      }

      if (data.error) {
        setScanError(data.error)
        setPhase('pick')
        return
      }

      if (data.classes.length === 0) {
        setScanError('No classes found in the image. Try a clearer photo.')
        setPhase('pick')
        return
      }

      // Build rows — resolve ambiguities where there's only one option
      const initialRows: ClassRow[] = data.classes.map((c) => {
        // Find any ambiguities for this class
        const ambig = (data.ambiguities ?? []).filter((a) => a.subjectCode === c.subjectCode)
        const dayAmbig = ambig.find((a) => a.field === 'day')
        const groupAmbig = ambig.find((a) => a.field === 'group')
        const venueAmbig = ambig.find((a) => a.field === 'venue')

        return {
          scanned: c,
          selected: true,
          resolvedDay: dayAmbig ? dayAmbig.options[0] : c.day,
          resolvedGroup: groupAmbig ? groupAmbig.options[0] : c.group,
          resolvedVenue: venueAmbig ? venueAmbig.options[0] : c.venue,
        }
      })

      setResult(data)
      setRows(initialRows)
      setPhase('review')
    } catch {
      setScanError('Network error. Check your connection and try again.')
      setPhase('pick')
    }
  }

  // -------------------------------------------------------------------------
  // Toggle row selection
  // -------------------------------------------------------------------------
  function toggleRow(idx: number) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  function setResolvedDay(idx: number, day: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, resolvedDay: day } : r))
  }

  function setResolvedGroup(idx: number, group: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, resolvedGroup: group } : r))
  }

  function setResolvedVenue(idx: number, venue: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, resolvedVenue: venue } : r))
  }

  // -------------------------------------------------------------------------
  // Save confirmed entries
  // -------------------------------------------------------------------------
  async function handleSave() {
    const selected = rows.filter((r) => r.selected)
    if (selected.length === 0) return

    setPhase('saving')
    setSaveError(null)

    let saved = 0
    const errors: string[] = []

    for (const row of selected) {
      const dayNum = dayNameToNumber(row.resolvedDay)
      if (!dayNum || !row.scanned.startTime || !row.scanned.endTime) {
        errors.push(`${row.scanned.subjectCode}: missing day or time — skipped`)
        continue
      }

      try {
        const res = await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectCode: row.scanned.subjectCode,
            subjectName: row.scanned.subjectName ?? null,
            dayOfWeek: dayNum,
            startTime: row.scanned.startTime,
            endTime: row.scanned.endTime,
            groupName: row.resolvedGroup ?? null,
            venue: row.resolvedVenue ?? null,
          }),
        })

        if (res.ok) {
          saved++
        } else {
          const body = await res.json().catch(() => ({}))
          errors.push(`${row.scanned.subjectCode}: ${body.error ?? 'failed'}`)
        }
      } catch {
        errors.push(`${row.scanned.subjectCode}: network error`)
      }
    }

    setSavedCount(saved)
    if (errors.length > 0) {
      setSaveError(errors.join('\n'))
    }
    setPhase('done')
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // DONE
  if (phase === 'done') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/timetable" className="text-sm text-gray-400 p-1 -ml-1">Back</Link>
          <h1 className="text-xl font-bold text-gray-900">Scan Timetable</h1>
        </div>

        <div className="loka-card space-y-3 text-center py-8">
          <p className="text-base font-semibold text-gray-900">
            {savedCount} {savedCount === 1 ? 'class' : 'classes'} added
          </p>
          {saveError && (
            <p className="text-xs text-red-500 whitespace-pre-line text-left">{saveError}</p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={() => router.push('/timetable')} className="loka-btn-primary w-full py-2.5">
              View timetable
            </button>
            <button
              onClick={() => {
                setPhase('pick')
                setFile(null)
                setPreview(null)
                setResult(null)
                setRows([])
                setScanError(null)
                setSaveError(null)
              }}
              className="loka-btn-secondary w-full py-2.5 text-sm"
            >
              Scan another image
            </button>
          </div>
        </div>
      </div>
    )
  }

  // SAVING
  if (phase === 'saving') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <h1 className="text-xl font-bold text-gray-900">Scan Timetable</h1>
        </div>
        <div className="loka-card text-center py-12 space-y-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Saving classes...</p>
        </div>
      </div>
    )
  }

  // SCANNING
  if (phase === 'scanning') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <h1 className="text-xl font-bold text-gray-900">Scan Timetable</h1>
        </div>
        <div className="loka-card text-center py-12 space-y-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Reading your timetable...</p>
          <p className="text-xs text-gray-400">This usually takes a few seconds</p>
        </div>
        {preview && (
          <div className="loka-card overflow-hidden p-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Timetable being scanned" className="w-full object-contain max-h-64 bg-gray-50" />
          </div>
        )}
      </div>
    )
  }

  // REVIEW
  if (phase === 'review' && result) {
    const selected = rows.filter((r) => r.selected)
    const cannotSave = selected.some(
      (r) => !r.resolvedDay || !r.scanned.startTime || !r.scanned.endTime
    )

    // Gather ambiguities for display
    const ambigByCode: Record<string, ScanAmbiguity[]> = {}
    for (const a of result.ambiguities ?? []) {
      if (!ambigByCode[a.subjectCode]) ambigByCode[a.subjectCode] = []
      ambigByCode[a.subjectCode].push(a)
    }

    return (
      <div className="p-4 space-y-4 pb-32">
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => setPhase('pick')} className="text-sm text-gray-400 p-1 -ml-1">
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Review Classes</h1>
        </div>

        {/* Overall confidence banner */}
        {result.overallConfidence < 0.7 && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs text-yellow-800 font-medium">Low confidence scan</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              The image may be blurry or unclear. Check each class carefully before saving.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500">
          {rows.length} {rows.length === 1 ? 'class' : 'classes'} found. Deselect any that are wrong.
        </p>

        <div className="space-y-3">
          {rows.map((row, idx) => {
            const ambigs = ambigByCode[row.scanned.subjectCode] ?? []
            const dayAmbig = ambigs.find((a) => a.field === 'day')
            const groupAmbig = ambigs.find((a) => a.field === 'group')
            const venueAmbig = ambigs.find((a) => a.field === 'venue')
            const missingDay = !row.resolvedDay
            const missingTime = !row.scanned.startTime || !row.scanned.endTime

            return (
              <div
                key={idx}
                className={[
                  'loka-card space-y-3 transition-opacity',
                  !row.selected ? 'opacity-40' : '',
                ].join(' ')}
              >
                {/* Header row */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleRow(idx)}
                    className="mt-0.5 shrink-0"
                    aria-label={row.selected ? 'Deselect' : 'Select'}
                  >
                    <div className={[
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      row.selected
                        ? 'bg-gray-900 border-gray-900'
                        : 'bg-white border-gray-300',
                    ].join(' ')}>
                      {row.selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-gray-900 text-sm">
                        {row.scanned.subjectCode}
                      </span>
                      <ConfidencePill value={row.scanned.confidence} />
                      {(missingDay || missingTime) && row.selected && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          Incomplete
                        </span>
                      )}
                    </div>
                    {row.scanned.subjectName && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{row.scanned.subjectName}</p>
                    )}
                  </div>
                </div>

                {/* Time + day */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Day</span>
                    {dayAmbig ? (
                      <select
                        value={row.resolvedDay ?? ''}
                        onChange={(e) => setResolvedDay(idx, e.target.value)}
                        className="loka-input w-full text-xs py-1.5"
                        disabled={!row.selected}
                      >
                        <option value="">Select day</option>
                        {dayAmbig.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={missingDay ? 'text-red-500' : 'text-gray-800 font-medium'}>
                        {row.resolvedDay ?? 'Not detected'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Time</span>
                    <span className={missingTime ? 'text-red-500' : 'text-gray-800 font-medium font-mono'}>
                      {row.scanned.startTime && row.scanned.endTime
                        ? `${row.scanned.startTime} – ${row.scanned.endTime}`
                        : 'Not detected'}
                    </span>
                  </div>
                </div>

                {/* Group */}
                {(row.resolvedGroup || groupAmbig) && (
                  <div className="text-xs text-gray-600">
                    <span className="text-gray-400 block mb-0.5">Group</span>
                    {groupAmbig ? (
                      <select
                        value={row.resolvedGroup ?? ''}
                        onChange={(e) => setResolvedGroup(idx, e.target.value)}
                        className="loka-input w-full text-xs py-1.5"
                        disabled={!row.selected}
                      >
                        <option value="">Select group</option>
                        {groupAmbig.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-800 font-medium">{row.resolvedGroup}</span>
                    )}
                  </div>
                )}

                {/* Venue */}
                {(row.resolvedVenue || venueAmbig) && (
                  <div className="text-xs text-gray-600">
                    <span className="text-gray-400 block mb-0.5">Venue</span>
                    {venueAmbig ? (
                      <select
                        value={row.resolvedVenue ?? ''}
                        onChange={(e) => setResolvedVenue(idx, e.target.value)}
                        className="loka-input w-full text-xs py-1.5"
                        disabled={!row.selected}
                      >
                        <option value="">Select venue</option>
                        {venueAmbig.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-800 font-medium">{row.resolvedVenue}</span>
                    )}
                  </div>
                )}

                {/* Non-day/group/venue ambiguity messages */}
                {ambigs
                  .filter((a) => a.field !== 'day' && a.field !== 'group' && a.field !== 'venue')
                  .map((a, ai) => (
                    <p key={ai} className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-2.5 py-1.5">
                      {a.message}
                    </p>
                  ))}
              </div>
            )
          })}
        </div>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 space-y-2">
          {cannotSave && selected.length > 0 && (
            <p className="text-xs text-red-500 text-center">
              Some selected classes are missing day or time. Deselect them or go back and retake.
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={selected.length === 0 || cannotSave}
            className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selected.length === 0
              ? 'Select at least one class'
              : `Add ${selected.length} ${selected.length === 1 ? 'class' : 'classes'}`}
          </button>
          <button
            onClick={() => router.push('/timetable/new')}
            className="loka-btn-secondary w-full py-2.5 text-sm"
          >
            Add manually instead
          </button>
        </div>
      </div>
    )
  }

  // PICK (default)
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/timetable" className="text-sm text-gray-400 p-1 -ml-1">Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Scan Timetable</h1>
      </div>

      <div className="loka-card space-y-2">
        <p className="text-sm font-medium text-gray-900">Photo of your timetable</p>
        <p className="text-xs text-gray-500">
          Take or upload a clear photo of your printed or on-screen timetable. Loka will read
          your classes automatically — you confirm before anything is saved.
        </p>
      </div>

      {/* Image preview / drop zone */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={[
          'w-full rounded-2xl border-2 border-dashed transition-colors overflow-hidden',
          preview ? 'border-gray-200' : 'border-gray-200 hover:border-gray-400',
        ].join(' ')}
      >
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt="Selected timetable"
            className="w-full object-contain max-h-72 bg-gray-50"
          />
        ) : (
          <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium">Choose image</span>
            <span className="text-xs">JPEG, PNG or WebP, max 10 MB</span>
          </div>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="loka-btn-secondary w-full py-2.5 text-sm"
        >
          Choose a different image
        </button>
      )}

      {scanError && (
        <p className="text-xs text-red-500 rounded-xl bg-red-50 px-3 py-2">{scanError}</p>
      )}

      <button
        onClick={handleScan}
        disabled={!file}
        className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Scan timetable
      </button>

      <p className="text-xs text-gray-400 text-center">
        The image is sent to Google Gemini for reading and is not stored.
      </p>
    </div>
  )
}
