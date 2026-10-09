# Loka — Architecture

## Overview

Loka is a monorepo containing:

- `apps/android/` — Flutter Android application
- `apps/web/` — Next.js 14 TypeScript PWA (also serves iOS v1)
- `backend/supabase/` — Database migrations, RLS policies, seed data
- `backend/functions/` — Supabase Edge Functions (server-side logic)
- `shared/` — Framework-agnostic TypeScript: types, constants, timetable engine, validation

---

## Frontend Architecture

### Android (Flutter)
- Framework: Flutter / Dart
- State management: Riverpod
- Navigation: go_router
- Supabase client: supabase_flutter
- Location: geolocator + permission_handler
- QR generation: qr_flutter
- QR scanning: mobile_scanner
- Camera: image_picker (for timetable scan upload)
- Local storage: flutter_secure_storage (auth tokens), shared_preferences (settings cache)

### Web / PWA (Next.js)
- Framework: Next.js 14 (App Router), TypeScript
- Styling: Tailwind CSS
- State: React Context + SWR for server state
- Supabase client: @supabase/ssr
- QR generation: qrcode
- QR scanning: @zxing/browser (WebRTC camera access)
- PWA: next-pwa (service worker, offline cache)
- Map (optional): MapLibre GL JS + OpenStreetMap tiles

---

## Backend Architecture

### Supabase
All backend state lives in Supabase (PostgreSQL + Realtime + Auth + Storage).

**Authentication:** Supabase anonymous auth. On first launch, the client
calls `supabase.auth.signInAnonymously()`. The resulting JWT is used for all
subsequent requests. No email, password, or social login.

**Edge Functions** handle server-side logic that must not run on the client:
- `scan-timetable` — calls vision API, returns structured candidate data
- `generate-friend-code` — generates a cryptographically random Loka ID
- `resolve-location` — converts GPS coordinates to campus place name (so
  raw GPS never leaves the server)

---

## Database

### Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = auth.uid() |
| display_name | text | |
| avatar_url | text | nullable |
| university | text | |
| campus_id | uuid FK | → campuses.id |
| loka_id | text UNIQUE | public friend code (e.g. K7M2-P9RQ) |
| status_override | text | null = automatic, 'free' = manual free |
| status_override_set_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `recovery_credentials`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | → auth.users.id |
| recovery_hash | text | bcrypt hash of recovery code |
| created_at | timestamptz | |

Recovery code shown once to user. Never returned via normal API.

#### `privacy_settings`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid PK FK | → auth.users.id |
| location_sharing | boolean | default true |
| show_current_class | boolean | default true |
| show_timetable | boolean | default false |
| show_availability | boolean | default true |
| friends_can_see_me | boolean | default true |
| updated_at | timestamptz | |

#### `friend_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| from_user_id | uuid FK | |
| to_user_id | uuid FK | |
| status | text | 'pending', 'accepted', 'declined' |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| UNIQUE (from_user_id, to_user_id) | | prevents duplicates |

#### `friendships`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_a | uuid FK | smaller UUID first (canonical ordering) |
| user_b | uuid FK | |
| created_at | timestamptz | |
| UNIQUE (user_a, user_b) | | |

#### `timetable_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| day_of_week | smallint | 1=Mon … 7=Sun |
| start_time | time | |
| end_time | time | |
| subject_code | text | |
| subject_name | text | nullable |
| group_name | text | nullable |
| venue | text | nullable |
| room | text | nullable |
| lecturer | text | nullable |
| notes | text | nullable |
| is_active | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `campuses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| university_name | text | |
| campus_name | text | |
| timezone | text | IANA timezone string |
| boundary_center_lat | double precision | |
| boundary_center_lng | double precision | |
| boundary_radius_metres | integer | geofence circle radius |
| created_at | timestamptz | |

#### `campus_buildings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| campus_id | uuid FK | → campuses.id |
| name | text | display name e.g. "Science Block" |
| abbreviation | text | nullable e.g. "SCI" |
| lat | double precision | |
| lng | double precision | |
| radius_metres | integer | proximity match radius |
| created_at | timestamptz | |

#### `active_locations`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid PK FK | one row per user |
| campus_building_id | uuid FK | nullable → campus_buildings.id |
| place_label | text | "Science Block", "On campus", etc. |
| updated_at | timestamptz | |

**Critical:** No `lat`/`lng` columns. Raw GPS is processed server-side in
the Edge Function and only the resolved place label is stored.
No location history. Row is deleted when user leaves campus.

---

## Authentication

1. App launches → `supabase.auth.signInAnonymously()`
2. JWT stored securely on device (flutter_secure_storage / cookie)
3. All Supabase queries use the JWT automatically
4. RLS ensures each user can only read/write their own data
5. Friendships open read access to specific friend data per RLS policy

### Recovery
- On profile creation, server generates a recovery code (`LOKA-XXXX-XXXX-XXXX`)
- Code is shown once in the UI with a copy button and a clear warning
- Only the bcrypt hash is stored in `recovery_credentials`
- Recovery code links a new anonymous session to the original profile

---

## Realtime

Supabase Realtime channels used:

| Channel | Events | Subscribers |
|---------|--------|-------------|
| `friend_requests:{user_id}` | INSERT on friend_requests | recipient |
| `friendships:{user_id}` | INSERT on friendships | both users |
| `active_locations` | UPDATE/DELETE filtered by friend IDs | friends |
| `profiles:{friend_id}` | UPDATE (status_override) | friends |

RLS applies to Realtime channels: a user only receives events for rows
they are permitted to read.

---

## Timetable Engine

Location: `shared/timetable/engine.ts` (TypeScript) + `apps/android/lib/timetable/engine.dart` (Dart mirror)

The engine is a pure function — no network, no side effects:

```
TimetableState computeStatus({
  required List<TimetableEntry> entries,
  required DateTime now,          // in campus timezone
  String? statusOverride,
})
```

Returns:
- `currentClass` — active entry or null
- `nextClass` — next entry today or null
- `status` — 'in_class' | 'free' | 'between_classes' | 'no_classes_today' | 'weekend'
- `timeRemainingSeconds` — in current class
- `timeUntilNextSeconds` — until next class starts

Edge cases handled: overlapping entries, missing entries, weekend days,
timezone-aware comparison, manual Free override.

---

## Timetable Scanner

The scanner is isolated behind an interface:

```typescript
interface TimetableScanner {
  scan(imageBuffer: Buffer, mimeType: string): Promise<ScanResult>
}
```

`ScanResult`:
```typescript
{
  classes: ScannedClass[]
  ambiguities: Ambiguity[]
  confidence: number
  rawText?: string   // for debugging only, never shown to user
}
```

The V1 implementation (`VisionTimetableScanner`) calls a configurable
vision API via a Supabase Edge Function. The API key lives only in the
Edge Function environment — never in the client.

---

## Location & Privacy

### GPS flow (Android)
1. Foreground service requests GPS
2. GPS coordinates sent to `resolve-location` Edge Function over HTTPS
3. Function computes: inside campus? which building?
4. Returns `{ insideCampus: bool, placeLabel: string, buildingId: uuid | null }`
5. Client upserts `active_locations` with the resolved label only
6. Raw GPS coordinates are never stored

### Geofence
- Simple circle geofence: distance from `campus.boundary_center` < `campus.boundary_radius_metres`
- Haversine formula used for distance calculation
- On exit: client deletes own row from `active_locations`

### Update frequency
| State | Interval |
|-------|----------|
| Foreground, moving | 30 seconds |
| Foreground, stationary | 2 minutes |
| Background (Android) | 3 minutes |
| Outside campus | No updates |

---

## Offline Strategy

| Data | Offline behaviour |
|------|-------------------|
| Profile | Cached locally, fully usable |
| Timetable | Cached locally, engine runs offline |
| Campus data | Cached after first load |
| Privacy settings | Cached locally |
| Friend list | Cached (last known state shown with staleness indicator) |
| Live friend location/status | Not available — show "Offline" |
| Friend requests | Queued for sync on reconnect |

---

## Android Background Location

- Uses `geolocator` plugin with `LocationSettings(accuracy: LocationAccuracy.balanced)`
- Background permission requested separately with explicit explanation UI
- Foreground Service declared in `AndroidManifest.xml`
- Battery optimization: exponential backoff when stationary
- On app kill: WorkManager periodic task maintains geofence monitoring

---

## Web / PWA Limitations (iOS v1)

- Background location: **not available** in iOS PWA
- Location is best-effort while app tab is active
- Service worker caches static assets and last-known timetable/profile
- UI shows a one-time banner on iOS explaining the limitation
- No false promises about background capability

---

## Security

- All tables have RLS enabled
- `auth.uid()` used in every policy — client cannot spoof identity
- Edge Functions validate ownership before acting
- No client-side API secrets
- Input validated at Edge Function boundary (zod schemas)
- Rate limiting on `send-friend-request` and `scan-timetable` functions
- Friend data only accessible when a confirmed friendship row exists
