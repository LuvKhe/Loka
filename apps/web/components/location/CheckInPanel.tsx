'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomPlace } from '@loka/shared/validation'

interface Building {
  id: string
  name: string
  abbreviation: string | null
  label: string
}

interface ActiveLocation {
  placeLabel: string
  campusBuildingId: string | null
}

interface Props {
  activeLocation: ActiveLocation | null
  currentClass?: { key: string; venue: string } | null
}

type PanelState =
  | { kind: 'idle' }
  | { kind: 'loading_buildings' }
  | { kind: 'picking'; buildings: Building[]; query: string }
  | { kind: 'checking_in' }
  | { kind: 'error'; message: string }

// Group buildings into sections for the picker.
// A building falls into the first group whose prefix it starts with.
const GROUPS: { label: string; prefix: string }[] = [
  { label: 'G-Block',              prefix: 'G-Block' },
  { label: 'A-Block',              prefix: 'A-Block' },
  { label: 'B-Block',              prefix: 'B-Block' },
  { label: 'C-Block',              prefix: 'C-Block' },
  { label: 'Science Block',        prefix: 'Science Block' },
  { label: 'Chemistry Labs',       prefix: 'Chemistry' },
  { label: 'Physics Labs',         prefix: 'Physics' },
  { label: 'Biology Labs',         prefix: 'Biology' },
  { label: 'EE Labs',              prefix: 'EE Lab' },
  { label: 'Materials Science',    prefix: 'Materials' },
  { label: 'SC Lecture Theatres',  prefix: 'SC Lecture' },
  { label: 'MFAC',                 prefix: 'MFAC' },
  { label: 'Other Venues',         prefix: 'Venue' },
]

function groupBuildings(buildings: Building[]): { label: string; items: Building[] }[] {
  const grouped: Map<string, Building[]> = new Map()
  for (const g of GROUPS) grouped.set(g.label, [])
  grouped.set('Other', [])

  for (const b of buildings) {
    let placed = false
    for (const g of GROUPS) {
      if (b.name.startsWith(g.prefix)) {
        grouped.get(g.label)!.push(b)
        placed = true
        break
      }
    }
    if (!placed) grouped.get('Other')!.push(b)
  }

  return Array.from(grouped.entries())
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

export default function CheckInPanel({ activeLocation, currentClass = null }: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<PanelState>({ kind: 'idle' })
  const [leavingCampus, setLeavingCampus] = useState(false)
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [auto, setAuto] = useState(false)

  async function openPicker() {
    setPanel({ kind: 'loading_buildings' })
    try {
      const res = await fetch('/api/location/buildings')
      if (!res.ok) throw new Error('Failed to load locations')
      const data = await res.json()
      setPanel({ kind: 'picking', buildings: data.buildings ?? [], query: '' })
    } catch (err) {
      setPanel({ kind: 'error', message: err instanceof Error ? err.message : 'Could not load locations' })
    }
  }

  function markManual() {
    if (!currentClass) return
    try {
      localStorage.setItem('loka-auto-last', currentClass.key)
    } catch {}
  }

  async function post(body: Record<string, string>): Promise<string | null> {
    const res = await fetch('/api/location/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return typeof data.error === 'string' ? data.error : 'Failed to update location'
    }
    return null
  }

  async function checkIn(building: Building) {
    setPanel({ kind: 'checking_in' })
    markManual()
    try {
      const err = await post({ campusBuildingId: building.id })
      if (err) throw new Error(err)
      router.refresh()
      setPanel({ kind: 'idle' })
    } catch (err) {
      setPanel({ kind: 'error', message: err instanceof Error ? err.message : 'Could not check in' })
    }
  }

  async function checkInCustom() {
    const check = validateCustomPlace(custom)
    if (!check.ok) {
      setCustomError(check.error)
      return
    }
    setCustomError(null)
    setPanel({ kind: 'checking_in' })
    markManual()
    try {
      const err = await post({ customLabel: custom.trim() })
      if (err) throw new Error(err)
      setCustom('')
      router.refresh()
      setPanel({ kind: 'idle' })
    } catch (err) {
      setPanel({ kind: 'error', message: err instanceof Error ? err.message : 'Could not check in' })
    }
  }

  async function leaveCampus() {
    setLeavingCampus(true)
    markManual()
    try {
      await fetch('/api/location/checkin', { method: 'DELETE' })
      router.refresh()
    } finally {
      setLeavingCampus(false)
    }
  }

  function toggleAuto(on: boolean) {
    setAuto(on)
    try {
      localStorage.setItem('loka-auto-venue', on ? '1' : '0')
      if (on) localStorage.removeItem('loka-auto-last')
    } catch {}
  }

  useEffect(() => {
    try {
      setAuto(localStorage.getItem('loka-auto-venue') === '1')
    } catch {}
  }, [])

  const classKey = currentClass?.key ?? null
  const classVenue = currentClass?.venue ?? null
  const currentLabel = activeLocation?.placeLabel ?? null

  useEffect(() => {
    if (!auto || !classKey || !classVenue) return
    try {
      if (localStorage.getItem('loka-auto-last') === classKey) return
      localStorage.setItem('loka-auto-last', classKey)
    } catch {
      return
    }
    if (currentLabel === classVenue) return
    post({ customLabel: classVenue }).then((err) => {
      if (!err) router.refresh()
    })
  }, [auto, classKey, classVenue])

  const busy = panel.kind === 'picking' || panel.kind === 'loading_buildings' || panel.kind === 'checking_in'

  const autoToggle = (
    <label className="flex items-start gap-3 min-h-[2.75rem] pt-3 mt-3 border-t border-gray-100 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200">
      <input
        type="checkbox"
        className="w-5 h-5 mt-0.5 shrink-0"
        checked={auto}
        onChange={(e) => toggleAuto(e.target.checked)}
      />
      <span>
        Set my location to my class venue when a class starts
        <span className="block text-xs text-gray-600 dark:text-gray-400">
          Friends who can see your location will see it. You can change it any time.
        </span>
      </span>
    </label>
  )

  // If checked in — show current location + leave button
  if (activeLocation && !busy) {
    return (
      <div className="loka-card">
        {panel.kind === 'error' && (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400 mb-2">{panel.message}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">On campus</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{activeLocation.placeLabel}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={openPicker} className="loka-btn-primary py-2 px-3 text-sm min-h-[2.75rem]">
              Change
            </button>
            <button
              onClick={leaveCampus}
              disabled={leavingCampus}
              className="loka-btn-secondary py-2 px-3 text-sm min-h-[2.75rem] disabled:opacity-40"
            >
              {leavingCampus ? '...' : 'Leave'}
            </button>
          </div>
        </div>
        {autoToggle}
      </div>
    )
  }

  // Not checked in
  if (panel.kind === 'idle' || panel.kind === 'error') {
    return (
      <div className="loka-card">
        {panel.kind === 'error' && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">{panel.message}</p>
        )}
        <button
          onClick={openPicker}
          className="loka-btn-primary w-full py-2.5 text-sm min-h-[2.75rem]"
        >
          Check in to campus
        </button>
        {autoToggle}
      </div>
    )
  }

  if (panel.kind === 'loading_buildings' || panel.kind === 'checking_in') {
    return (
      <div className="loka-card">
        <p className="text-sm text-gray-500 text-center py-1">
          {panel.kind === 'loading_buildings' ? 'Loading locations...' : 'Checking in...'}
        </p>
      </div>
    )
  }

  // Building picker
  if (panel.kind === 'picking') {
    const { buildings, query } = panel

    if (buildings.length === 0) {
      return (
        <div className="loka-card">
          <p className="text-sm text-gray-500">No campus locations set up yet.</p>
          <button
            onClick={() => setPanel({ kind: 'idle' })}
            className="text-xs text-gray-500 mt-2"
          >
            Cancel
          </button>
        </div>
      )
    }

    // Filter by search query
    const q = query.toLowerCase().trim()
    const filtered = q
      ? buildings.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            (b.abbreviation?.toLowerCase().includes(q) ?? false),
        )
      : buildings

    const sections = q ? null : groupBuildings(filtered)

    return (
      <div className="loka-card space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Where are you?</p>
          <button
            onClick={() => setPanel({ kind: 'idle' })}
            className="text-xs text-gray-500"
          >
            Cancel
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={query}
          onChange={(e) =>
            setPanel((prev) =>
              prev.kind === 'picking' ? { ...prev, query: e.target.value } : prev,
            )
          }
          aria-label="Search rooms"
          placeholder="Search rooms..."
          className="loka-input min-h-[2.75rem]"
        />

        <div className="rounded-xl bg-gray-50 dark:bg-slate-900 p-3 space-y-2">
          <label htmlFor="custom-place" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Somewhere else
          </label>
          <div className="flex gap-2">
            <input
              id="custom-place"
              type="text"
              value={custom}
              maxLength={40}
              onChange={(e) => {
                setCustom(e.target.value)
                setCustomError(null)
              }}
              placeholder="e.g. Library steps, Cafeteria"
              className="loka-input flex-1 min-h-[2.75rem]"
            />
            <button
              type="button"
              onClick={checkInCustom}
              disabled={custom.trim().length < 2}
              className="loka-btn-primary px-4 min-h-[2.75rem] disabled:opacity-40"
            >
              Set
            </button>
          </div>
          {customError && <p role="alert" className="text-xs text-red-700 dark:text-red-400">{customError}</p>}
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-3">
          {/* Grouped view */}
          {sections &&
            sections.map((section) => (
              <div key={section.label}>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide px-1 mb-1">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((b) => (
                    <BuildingRow key={b.id} building={b} onSelect={checkIn} />
                  ))}
                </div>
              </div>
            ))}

          {/* Flat search results */}
          {!sections &&
            (filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-3">No results</p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((b) => (
                  <BuildingRow key={b.id} building={b} onSelect={checkIn} />
                ))}
              </div>
            ))}
        </div>
      </div>
    )
  }

  return null
}

function BuildingRow({
  building,
  onSelect,
}: {
  building: Building
  onSelect: (b: Building) => void
}) {
  return (
    <button
      onClick={() => onSelect(building)}
      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-between gap-2"
    >
      <span className="font-medium text-gray-900">{building.name}</span>
      {building.abbreviation && (
        <span className="text-gray-500 text-xs shrink-0">{building.abbreviation}</span>
      )}
    </button>
  )
}
