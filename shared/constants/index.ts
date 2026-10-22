// ============================================================
// Loka — Shared Constants
// ============================================================

// Loka ID format: 4 chars + hyphen + 4 chars
// Alphabet excludes O, 0, I, 1 to avoid visual confusion
export const LOKA_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const LOKA_ID_SEGMENT_LENGTH = 4
export const LOKA_ID_SEGMENTS = 2
export const LOKA_ID_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/

// Recovery code format: LOKA-XXXX-XXXX-XXXX-XXXX
export const RECOVERY_CODE_PREFIX = 'LOKA'
export const RECOVERY_CODE_SEGMENTS = 4
export const RECOVERY_CODE_SEGMENT_LENGTH = 4
export const RECOVERY_CODE_REGEX = /^LOKA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

// Location update intervals (milliseconds)
export const LOCATION_UPDATE_FOREGROUND_MOVING_MS = 30_000   // 30s
export const LOCATION_UPDATE_FOREGROUND_STATIONARY_MS = 120_000  // 2min
export const LOCATION_UPDATE_BACKGROUND_MS = 180_000  // 3min

// Stale data thresholds (seconds)
export const STALE_LOCATION_THRESHOLD_SECONDS = 300   // 5 min
export const UNAVAILABLE_LOCATION_THRESHOLD_SECONDS = 900  // 15 min

// Free override
export const FREE_OVERRIDE_VALUE = 'free' as const

// Timetable time format
export const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

// Image upload limits
export const TIMETABLE_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB
export const TIMETABLE_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Navigation routes (web)
export const ROUTES = {
  HOME: '/home',
  FRIENDS: '/friends',
  TIMETABLE: '/timetable',
  PROFILE: '/profile',
  FRIEND_PROFILE: (id: string) => `/friends/${id}`,
  ONBOARDING: '/onboarding',
  ONBOARDING_RECOVERY: '/onboarding/recovery',
  TIMETABLE_SCAN: '/timetable/scan',
} as const

// Status display labels
export const STATUS_LABELS: Record<string, string> = {
  in_class: 'In class',
  free: 'Free',
  between_classes: 'Between classes',
  no_classes_today: 'No classes today',
  weekend: 'No classes today',
  unknown: 'Unknown',
  off_campus: 'Off campus',
}
