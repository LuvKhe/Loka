import { describe, it, expect } from 'vitest'
import { validateCustomPlace } from './index'
import { campusNow } from '../timetable/engine'

describe('validateCustomPlace', () => {
  it('accepts normal place names', () => {
    expect(validateCustomPlace('Library steps').ok).toBe(true)
    expect(validateCustomPlace('MPH / SC.LEC.TH.II').ok).toBe(true)
  })
  it('rejects empty, long and unusual characters', () => {
    expect(validateCustomPlace('a').ok).toBe(false)
    expect(validateCustomPlace('x'.repeat(41)).ok).toBe(false)
    expect(validateCustomPlace('<script>').ok).toBe(false)
    expect(validateCustomPlace(5).ok).toBe(false)
  })
})

describe('campusNow', () => {
  it('shifts a UTC instant to Eswatini wall time', () => {
    const d = campusNow(new Date('2026-10-29T12:30:00Z'))
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(30)
  })
})
