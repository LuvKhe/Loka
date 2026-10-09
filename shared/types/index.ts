// ============================================================
// Loka — Shared Types
// Used by: apps/web (directly), apps/android (mirrored in Dart)
// ============================================================

// ------------------------------------------------------------
// Campus
// ------------------------------------------------------------

export interface Campus {
  id: string
  universityName: string
  campusName: string
  timezone: string
  boundaryCenterLat: number
  boundaryCenterLng: number
  boundaryRadiusMetres: number
}

export interface CampusBuilding {
  id: string
  campusId: string
  name: string
  abbreviation: string | null
  lat: number
  lng: number
  radiusMetres: number
}

// ------------------------------------------------------------
// Profile
// ------------------------------------------------------------

export interface Profile {
  id: string // = auth.uid()
  displayName: string
  avatarUrl: string | null
  university: string
  campusId: string
  lokaId: string // public friend code e.g. "K7M2-P9RQ"
  statusOverride: 'free' | null
  statusOverrideSetAt: string | null // ISO timestamp
  createdAt: string
  updatedAt: string
}

export interface PrivacySettings {
  userId: string
  shareLocation: boolean
  shareCurrentClass: boolean
  shareNextClass: boolean
  showInSearch: boolean
  updatedAt: string
}

// ------------------------------------------------------------
// Friends
// ------------------------------------------------------------

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined'

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: FriendRequestStatus
  createdAt: string
  updatedAt: string
  // Joined fields (not in DB columns)
  fromProfile?: PublicProfile
}

export interface Friendship {
  id: string
  userA: string
  userB: string
  createdAt: string
}

// ------------------------------------------------------------
// Public profile (what friends see)
// ------------------------------------------------------------

export interface PublicProfile {
  id: string
  displayName: string
  avatarUrl: string | null
  lokaId: string
  university: string
  campusId: string
}

// ------------------------------------------------------------
// Timetable
// ------------------------------------------------------------

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7 // 1=Mon, 7=Sun

export interface TimetableEntry {
  id: string
  userId: string
  dayOfWeek: DayOfWeek
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  subjectCode: string
  subjectName: string | null
  groupName: string | null
  venue: string | null
  room: string | null
  lecturer: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TimetableEntryInput {
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  subjectCode: string
  subjectName?: string
  groupName?: string
  venue?: string
  room?: string
  lecturer?: string
  notes?: string
}

// ------------------------------------------------------------
// Timetable engine output
// ------------------------------------------------------------

export type TimetableStatus =
  | 'in_class'
  | 'free'
  | 'between_classes'
  | 'no_classes_today'
  | 'weekend'
  | 'unknown'

export interface TimetableState {
  status: TimetableStatus
  currentClass: TimetableEntry | null
  nextClass: TimetableEntry | null
  timeRemainingSeconds: number | null   // in current class
  timeUntilNextSeconds: number | null   // until next class
  isManualOverride: boolean
}

// ------------------------------------------------------------
// Active location
// ------------------------------------------------------------

export interface ActiveLocation {
  userId: string
  campusBuildingId: string | null
  placeLabel: string // "Science Block" | "On campus" | "Off campus"
  updatedAt: string
}

// Friend-facing live data (combined from multiple tables)
export interface FriendLiveData {
  userId: string
  profile: PublicProfile
  location: {
    placeLabel: string
    updatedAt: string
  } | null
  timetableState: TimetableState | null
  isOnline: boolean
  lastSeenAt: string | null
}

// ------------------------------------------------------------
// Timetable scanner
// ------------------------------------------------------------

export interface ScannedClass {
  subjectCode: string
  subjectName: string | null
  group: string | null
  venue: string | null
  day: string | null        // "Monday" etc.
  startTime: string | null  // "HH:MM"
  endTime: string | null    // "HH:MM"
  confidence: number        // 0–1
}

export interface ScanAmbiguity {
  field: 'group' | 'venue' | 'day' | 'time' | 'subject_code'
  subjectCode: string
  options: string[]
  message: string
}

export interface ScanResult {
  classes: ScannedClass[]
  ambiguities: ScanAmbiguity[]
  overallConfidence: number
  error: string | null
}

// User's confirmed selections after the scan wizard
export interface ScanConfirmation {
  selectedSubjectCodes: string[]
  groupSelections: Record<string, string>   // subjectCode → group
  venueSelections: Record<string, string>   // subjectCode → venue
}

// ------------------------------------------------------------
// Stale data thresholds
// ------------------------------------------------------------

export const STALE_LOCATION_SECONDS = 300   // 5 min → show "Last updated X ago"
export const UNAVAILABLE_LOCATION_SECONDS = 900  // 15 min → show "Location unavailable"
