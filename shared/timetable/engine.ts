// ============================================================
// Loka — Deterministic Timetable Engine
//
// Pure function. No network. No side effects. Works offline.
// Given entries + current datetime → returns TimetableState.
//
// This is the canonical TypeScript implementation.
// The Flutter/Dart mirror lives in apps/android/lib/timetable/engine.dart
// ============================================================

import type { TimetableEntry, TimetableState, TimetableStatus, DayOfWeek } from '../types/index.js'
import { FREE_OVERRIDE_VALUE } from '../constants/index.js'

// Parse "HH:MM" into total minutes since midnight
function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// JS Date.getDay() returns 0=Sun. Convert to DayOfWeek (1=Mon, 7=Sun).
function jsDayToDayOfWeek(jsDay: number): DayOfWeek {
  return (jsDay === 0 ? 7 : jsDay) as DayOfWeek
}

// Current time as minutes since midnight (in local time of `now`)
function currentMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

function secondsUntilClass(
  entry: TimetableEntry,
  fromDow: DayOfWeek,
  fromMinutes: number,
): number {
  const dayOffset = (entry.dayOfWeek - fromDow + 7) % 7
  let minutes = dayOffset * 24 * 60 + parseTime(entry.startTime) - fromMinutes
  if (minutes <= 0) minutes += 7 * 24 * 60
  return minutes * 60
}

/**
 * Core timetable engine.
 *
 * @param entries   - The user's saved timetable entries (isActive === true)
 * @param now       - Current datetime in the campus timezone
 * @param statusOverride - 'free' for manual Free mode, null for automatic
 */
export function computeTimetableState(
  entries: TimetableEntry[],
  now: Date,
  statusOverride: 'free' | null,
): TimetableState {
  // Manual free override takes priority over everything
  if (statusOverride === FREE_OVERRIDE_VALUE) {
    return {
      status: 'free',
      currentClass: null,
      nextClass: null,
      timeRemainingSeconds: null,
      timeUntilNextSeconds: null,
      isManualOverride: true,
    }
  }

  const todayDow = jsDayToDayOfWeek(now.getDay())
  const nowMinutes = currentMinutes(now)

  // Filter to active entries only
  const activeEntries = entries.filter((e) => e.isActive)

  // Entries for today, sorted by start time
  const todayEntries = activeEntries
    .filter((e) => e.dayOfWeek === todayDow)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))

  // Weekend check — still show next class if there is one later in the week
  const isWeekend = todayDow === 6 || todayDow === 7

  if (todayEntries.length === 0) {
    const nextClass = findNextClass(activeEntries, todayDow, nowMinutes)
    return {
      status: isWeekend ? 'weekend' : 'no_classes_today',
      currentClass: null,
      nextClass,
      timeRemainingSeconds: null,
      timeUntilNextSeconds: nextClass
        ? secondsUntilClass(nextClass, todayDow, nowMinutes)
        : null,
      isManualOverride: false,
    }
  }

  // Find current class: started at or before now AND ends after now
  // If multiple overlap, take the one that started most recently
  const currentClasses = todayEntries.filter(
    (e) => parseTime(e.startTime) <= nowMinutes && parseTime(e.endTime) > nowMinutes,
  )
  const currentClass = currentClasses.length > 0
    ? currentClasses.reduce((latest, e) =>
        parseTime(e.startTime) > parseTime(latest.startTime) ? e : latest,
      )
    : null

  // Find next class: starts strictly after now (or after current class ends)
  const referenceMinutes = currentClass
    ? parseTime(currentClass.endTime)
    : nowMinutes

  const upcomingToday = todayEntries.filter(
    (e) => parseTime(e.startTime) > referenceMinutes,
  )
  const nextClassToday = upcomingToday.length > 0 ? upcomingToday[0] : null

  // If nothing upcoming today, look ahead in the week
  const nextClass = nextClassToday ?? findNextClass(activeEntries, todayDow, nowMinutes, true)

  let status: TimetableStatus
  if (currentClass) {
    status = 'in_class'
  } else if (upcomingToday.length > 0) {
    // We're between classes today
    const firstToday = todayEntries[0]
    if (nowMinutes < parseTime(firstToday.startTime)) {
      // Before any class today — treat as free until first class
      status = 'free'
    } else {
      status = 'between_classes'
    }
  } else {
    // Past all classes for today
    status = 'free'
  }

  const timeRemainingSeconds = currentClass
    ? (parseTime(currentClass.endTime) - nowMinutes) * 60
    : null

  const timeUntilNextSeconds = nextClass
    ? secondsUntilClass(nextClass, todayDow, nowMinutes)
    : null

  return {
    status,
    currentClass,
    nextClass,
    timeRemainingSeconds,
    timeUntilNextSeconds,
    isManualOverride: false,
  }
}

/**
 * Find the next class after today (or later today if skipToday=false).
 * Searches up to 7 days ahead.
 */
function findNextClass(
  entries: TimetableEntry[],
  fromDow: DayOfWeek,
  fromMinutes: number,
  skipToday = false,
): TimetableEntry | null {
  for (let offset = skipToday ? 1 : 0; offset <= 7; offset++) {
    const targetDow = (((fromDow - 1 + offset) % 7) + 1) as DayOfWeek
    const dayEntries = entries
      .filter((e) => e.dayOfWeek === targetDow)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))

    if (offset === 0) {
      // Same day — only future entries
      const future = dayEntries.filter((e) => parseTime(e.startTime) > fromMinutes)
      if (future.length > 0) return future[0]
    } else {
      if (dayEntries.length > 0) return dayEntries[0]
    }
  }
  return null
}

// ------------------------------------------------------------
// Formatting helpers (used by UI)
// ------------------------------------------------------------

/** Format seconds into human-readable: "1h 30m", "45m", "< 1m" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return '< 1 min'
  const mins = Math.floor(seconds / 60)
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hours === 0) return `${mins}m`
  if (remMins === 0) return `${hours}h`
  return `${hours}h ${remMins}m`
}

/** Format "HH:MM" to "14:00" (already is, but ensures no leading zero on hours if desired) */
export function formatTime(hhmm: string): string {
  return hhmm.slice(0, 5)
}

/** Seconds since lastUpdatedAt ISO string → staleness label */
export function formatStaleness(lastUpdatedAt: string, nowIso?: string): string {
  const now = nowIso ? new Date(nowIso) : new Date()
  const then = new Date(lastUpdatedAt)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return 'Updated just now'
  if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)} min ago`
  return `Updated ${Math.floor(seconds / 3600)}h ago`
}
