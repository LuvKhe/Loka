// ============================================================
// Loka — Shared Validation
// ============================================================

import {
  LOKA_ID_REGEX,
  TIME_FORMAT_REGEX,
  TIMETABLE_IMAGE_MAX_SIZE_BYTES,
  TIMETABLE_IMAGE_ALLOWED_TYPES,
} from '../constants/index.js'

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }

export function validateLokaId(id: string): ValidationResult {
  if (!id || typeof id !== 'string') {
    return { ok: false, error: 'Loka ID is required' }
  }
  const clean = id.trim().toUpperCase()
  if (!LOKA_ID_REGEX.test(clean)) {
    return { ok: false, error: 'Invalid Loka ID format. Expected format: XXXX-XXXX' }
  }
  return { ok: true }
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { ok: false, error: 'Name is required' }
  }
  const clean = name.trim()
  if (clean.length < 1) return { ok: false, error: 'Name is required' }
  if (clean.length > 50) return { ok: false, error: 'Name must be 50 characters or fewer' }
  return { ok: true }
}

export function validateSubjectCode(code: string): ValidationResult {
  if (!code || typeof code !== 'string') {
    return { ok: false, error: 'Subject code is required' }
  }
  const clean = code.trim().toUpperCase()
  if (clean.length < 2) return { ok: false, error: 'Subject code too short' }
  if (clean.length > 20) return { ok: false, error: 'Subject code too long' }
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return { ok: false, error: 'Subject code must contain only letters and numbers' }
  }
  return { ok: true }
}

export function validateTime(time: string): ValidationResult {
  if (!time || typeof time !== 'string') {
    return { ok: false, error: 'Time is required' }
  }
  if (!TIME_FORMAT_REGEX.test(time.trim())) {
    return { ok: false, error: 'Time must be in HH:MM format (e.g. 14:00)' }
  }
  return { ok: true }
}

export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  const start = validateTime(startTime)
  if (!start.ok) return start
  const end = validateTime(endTime)
  if (!end.ok) return end

  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  if (eh! * 60 + em! <= sh! * 60 + sm!) {
    return { ok: false, error: 'End time must be after start time' }
  }
  return { ok: true }
}

export function validateDayOfWeek(day: number): ValidationResult {
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    return { ok: false, error: 'Day must be 1 (Monday) through 7 (Sunday)' }
  }
  return { ok: true }
}

export function validateTimetableImage(file: { size: number; type: string }): ValidationResult {
  if (file.size > TIMETABLE_IMAGE_MAX_SIZE_BYTES) {
    return { ok: false, error: 'Image must be smaller than 10 MB' }
  }
  if (!TIMETABLE_IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Image must be JPEG, PNG, or WebP' }
  }
  return { ok: true }
}
