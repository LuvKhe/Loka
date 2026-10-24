'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function CheckInPanel({ activeLocation }: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<PanelState>({ kind: 'idle' })
  const [leavingCampus, setLeavingCampus] = useState(false)

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

  async function checkIn(building: Building) {
    setPanel({ kind: 'checking_in' })
    try {
      const res = await fetch('/api/location/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusBuildingId: building.id, placeLabel: building.label }),
      })
      if (!res.ok) throw new Error('Failed to check in')
      router.refresh()
      setPanel({ kind: 'idle' })
    } catch (err) {
      setPanel({ kind: 'error', message: err instanceof Error ? err.message : 'Could not check in' })
    }
  }

  async function leaveCampus() {
    setLeavingCampus(true)
    try {
      await fetch('/api/location/checkin', { method: 'DELETE' })
      router.refresh()
    } finally {
      setLeavingCampus(false)
    }
  }

  // If checked in — show current location + leave button
  if (activeLocation) {
    return (
      <div className="loka-card">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">On campus</p>
            <p className="text-sm font-medium text-gray-900 truncate">{activeLocation.placeLabel}</p>
          </div>
          <button
            onClick={leaveCampus}
            disabled={leavingCampus}
            className="loka-btn-secondary py-1.5 px-3 text-xs shrink-0 disabled:opacity-40"
          >
            {leavingCampus ? '...' : 'Leave campus'}
          </button>
        </div>
      </div>
    )
  }

  // Not checked in
  if (panel.kind === 'idle' || panel.kind === 'error') {
    return (
      <div className="loka-card">
        {panel.kind === 'error' && (
          <p className="text-xs text-red-500 mb-2">{panel.message}</p>
        )}
        <button
          onClick={openPicker}
          className="loka-btn-primary w-full py-2.5 text-sm"
        >
          Check in to campus
        </button>
      </div>
    )
  }

  if (panel.kind === 'loading_buildings' || panel.kind === 'checking_in') {
    return (
      <div className="loka-card">
        <p className="text-sm text-gray-400 text-center py-1">
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
            className="text-xs text-gray-400 mt-2"
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
            className="text-xs text-gray-400"
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
          placeholder="Search rooms..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          autoFocus
        />

        {/* List */}
        <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-3">
          {/* Grouped view */}
          {sections &&
            sections.map((section) => (
              <div key={section.label}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mb-1">
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
              <p className="text-sm text-gray-400 text-center py-3">No results</p>
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
        <span className="text-gray-400 text-xs shrink-0">{building.abbreviation}</span>
      )}
    </button>
  )
}
