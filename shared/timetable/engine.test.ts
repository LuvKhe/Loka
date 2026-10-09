// ============================================================
// Loka — Timetable Engine Tests
// Run with: cd shared && npm test
// ============================================================

import { describe, it, expect } from 'vitest'
import { computeTimetableState } from './engine.js'
import type { TimetableEntry } from '../types/index.js'

// Helper: build a minimal TimetableEntry
function entry(overrides: Partial<TimetableEntry> & {
  dayOfWeek: TimetableEntry['dayOfWeek']
  startTime: string
  endTime: string
  subjectCode: string
}): TimetableEntry {
  return {
    id: 'test-' + Math.random(),
    userId: 'user-1',
    subjectName: null,
    groupName: null,
    venue: null,
    room: null,
    lecturer: null,
    notes: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper: create a Date on a specific weekday and time
// dayOfWeek: 1=Mon (JS getDay()=1), 7=Sun (JS getDay()=0)
function makeDate(dayOfWeek: 1|2|3|4|5|6|7, hour: number, minute = 0): Date {
  const d = new Date('2024-01-01T00:00:00') // Jan 1 2024 = Monday
  const jsDay = dayOfWeek === 7 ? 0 : dayOfWeek
  const currentJsDay = d.getDay() // 1 (Monday)
  const diff = (jsDay - currentJsDay + 7) % 7
  d.setDate(d.getDate() + diff)
  d.setHours(hour, minute, 0, 0)
  return d
}

const MON_CSC = entry({ dayOfWeek: 1, startTime: '10:00', endTime: '12:00', subjectCode: 'CSC111' })
const MON_MAT = entry({ dayOfWeek: 1, startTime: '13:00', endTime: '15:00', subjectCode: 'MAT111' })
const TUE_PHY = entry({ dayOfWeek: 2, startTime: '08:00', endTime: '10:00', subjectCode: 'PHY101' })
const WED_ASC = entry({ dayOfWeek: 3, startTime: '09:00', endTime: '11:00', subjectCode: 'ASC111' })

describe('computeTimetableState', () => {
  describe('current class detection', () => {
    it('returns in_class when now is inside a class', () => {
      const now = makeDate(1, 10, 30) // Monday 10:30 — inside CSC111 (10:00–12:00)
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.status).toBe('in_class')
      expect(state.currentClass?.subjectCode).toBe('CSC111')
    })

    it('is NOT in class at exact end time', () => {
      const now = makeDate(1, 12, 0) // Monday 12:00 — CSC111 ends exactly
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.currentClass).toBeNull()
    })

    it('is in class at exact start time', () => {
      const now = makeDate(1, 10, 0) // Monday 10:00 — CSC111 starts exactly
      const state = computeTimetableState([MON_CSC], now, null)
      expect(state.status).toBe('in_class')
      expect(state.currentClass?.subjectCode).toBe('CSC111')
    })
  })

  describe('next class detection', () => {
    it('returns next class later today', () => {
      const now = makeDate(1, 10, 30) // Inside CSC111, MAT111 is next
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.nextClass?.subjectCode).toBe('MAT111')
    })

    it('returns next class tomorrow when no more today', () => {
      const now = makeDate(1, 16, 0) // Monday 16:00 — past all Monday classes
      const state = computeTimetableState([MON_CSC, MON_MAT, TUE_PHY], now, null)
      expect(state.nextClass?.subjectCode).toBe('PHY101')
      expect(state.nextClass?.dayOfWeek).toBe(2)
    })

    it('returns null when no future classes exist', () => {
      const now = makeDate(1, 16, 0) // Monday 16:00, only Monday classes
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.nextClass).toBeNull()
    })
  })

  describe('status values', () => {
    it('returns free before first class of day', () => {
      const now = makeDate(1, 8, 0) // Monday 08:00, first class at 10:00
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.status).toBe('free')
    })

    it('returns between_classes between classes', () => {
      const now = makeDate(1, 12, 30) // Monday 12:30 — between CSC (ends 12) and MAT (starts 13)
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.status).toBe('between_classes')
    })

    it('returns no_classes_today on a weekday with no entries', () => {
      const now = makeDate(4, 10, 0) // Thursday — no entries
      const state = computeTimetableState([MON_CSC], now, null)
      expect(state.status).toBe('no_classes_today')
    })

    it('returns weekend on Saturday', () => {
      const now = makeDate(6, 10, 0) // Saturday
      const state = computeTimetableState([MON_CSC], now, null)
      expect(state.status).toBe('weekend')
    })

    it('returns weekend on Sunday', () => {
      const now = makeDate(7, 10, 0) // Sunday
      const state = computeTimetableState([], now, null)
      expect(state.status).toBe('weekend')
    })
  })

  describe('manual free override', () => {
    it('returns free status when override is set, regardless of timetable', () => {
      const now = makeDate(1, 10, 30) // Inside CSC111
      const state = computeTimetableState([MON_CSC], now, 'free')
      expect(state.status).toBe('free')
      expect(state.currentClass).toBeNull()
      expect(state.isManualOverride).toBe(true)
    })
  })

  describe('empty timetable', () => {
    it('handles empty timetable gracefully', () => {
      const now = makeDate(1, 10, 0)
      const state = computeTimetableState([], now, null)
      expect(state.currentClass).toBeNull()
      expect(state.nextClass).toBeNull()
      expect(['no_classes_today', 'free', 'weekend']).toContain(state.status)
    })
  })

  describe('overlapping classes', () => {
    it('shows the most recently started class when classes overlap', () => {
      const early = entry({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', subjectCode: 'EARLY' })
      const late  = entry({ dayOfWeek: 1, startTime: '10:00', endTime: '11:00', subjectCode: 'LATE' })
      const now = makeDate(1, 10, 30)
      const state = computeTimetableState([early, late], now, null)
      expect(state.status).toBe('in_class')
      // Most recently started = LATE
      expect(state.currentClass?.subjectCode).toBe('LATE')
    })
  })

  describe('time remaining / time until', () => {
    it('calculates time remaining in current class', () => {
      const now = makeDate(1, 10, 30) // 1.5h into CSC111 (10:00–12:00), 1.5h remaining
      const state = computeTimetableState([MON_CSC], now, null)
      expect(state.timeRemainingSeconds).toBe(90 * 60) // 90 minutes
    })

    it('calculates time until next class', () => {
      const now = makeDate(1, 12, 0) // CSC ends, MAT starts at 13:00 = 60 min
      const state = computeTimetableState([MON_CSC, MON_MAT], now, null)
      expect(state.timeUntilNextSeconds).toBe(60 * 60)
    })
  })

  describe('inactive entries', () => {
    it('ignores inactive entries', () => {
      const inactive = { ...MON_CSC, isActive: false }
      const now = makeDate(1, 10, 30)
      const state = computeTimetableState([inactive], now, null)
      expect(state.currentClass).toBeNull()
    })
  })

  describe('multi-week wrap (next class crosses week boundary)', () => {
    it('finds next class in next week when current week has no more', () => {
      // Friday 16:00, only entry is Monday
      const now = makeDate(5, 16, 0) // Friday
      const state = computeTimetableState([MON_CSC], now, null)
      // Should find next Monday's CSC111
      expect(state.nextClass?.subjectCode).toBe('CSC111')
      expect(state.nextClass?.dayOfWeek).toBe(1)
    })
  })
})
