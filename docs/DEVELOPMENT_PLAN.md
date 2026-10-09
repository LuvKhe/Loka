# Loka — Development Plan

## Phase 0 Inspection Summary

**Date:** 2026-10-08  
**Inspector:** Claude Sonnet 4.6

### Environment

| Tool      | Version      | Status   |
|-----------|--------------|----------|
| Node.js   | v22.22.0     | Available |
| npm       | 10.9.4       | Available |
| git       | system       | Available |
| Python 3  | system       | Available |
| Flutter   | —            | NOT INSTALLED |
| Dart      | —            | NOT INSTALLED |

### Existing Repository

**Finding:** No existing Loka repository was found. This is a greenfield project.

- No existing framework detected
- No existing apps or packages
- No existing dependencies
- No existing database or backend work
- No configuration files
- No git history

### What Must Be Built

Everything. The full Loka application is built from scratch across 9 phases.

---

## Architecture Decision: Flutter Environment

Flutter/Dart is not installed in this build environment. The Android app
(`apps/android/`) will be scaffolded as a complete Flutter project with all
source files written correctly. The developer must install Flutter on their
local machine to run, build, and test the Android app.

**Developer prerequisite:** Install Flutter SDK >= 3.19.0 and Dart >= 3.3.0.
See [flutter.dev/get-started](https://flutter.dev/get-started).

The web app (`apps/web/`) is Next.js/TypeScript and runs fully in this
environment with Node 22.

---

## Implementation Phases

### PHASE 0 — INSPECTION ✅
- [x] Inspect environment
- [x] Identify toolchain availability
- [x] Document findings
- [x] Create monorepo scaffold
- [x] Create this DEVELOPMENT_PLAN.md

### PHASE 1 — FOUNDATION
- [ ] Monorepo root config (`.gitignore`, `package.json` workspace)
- [ ] Flutter Android app scaffold (`apps/android/`)
- [ ] Next.js web app scaffold (`apps/web/`)
- [ ] Supabase project config + migrations
  - `profiles` table
  - `friend_codes` table
  - `privacy_settings` table
  - `recovery_credentials` table
  - RLS policies
- [ ] Anonymous/device auth (Supabase anon auth)
- [ ] Shared types (`shared/types/`)
- [ ] Profile creation flow (Android + Web)
- [ ] Profile persistence
- [ ] Main navigation shell (Home / Friends / Timetable / Profile)
- [ ] Base UI design system (colors, typography, card components)
- [ ] Environment variable examples (`.env.example`)

### PHASE 2 — FRIEND SYSTEM
- [ ] Loka ID generation (random, non-sequential, human-readable)
- [ ] QR code generation from Loka ID
- [ ] QR code scanner
- [ ] Manual Loka ID entry
- [ ] Friend request creation
- [ ] Friend request notifications (Supabase Realtime)
- [ ] Accept / Decline flow
- [ ] Friendships table + RLS
- [ ] Friends screen
- [ ] Friend Profile screen
- [ ] `friend_requests` + `friendships` migrations

### PHASE 3 — TIMETABLE
- [ ] Timetable data model (`timetable_entries` table)
- [ ] Manual timetable entry UI
- [ ] Timetable editor (add / edit / delete entries)
- [ ] Deterministic timetable engine (`shared/timetable/`)
  - `getCurrentClass()`
  - `getNextClass()`
  - `getCurrentStatus()`
  - `getTimeUntilNextClass()`
  - `getTimeRemaining()`
- [ ] Free override (manual status)
- [ ] Return to automatic status
- [ ] Status broadcasting to Supabase

### PHASE 4 — CAMPUS
- [ ] Campus data model (`campuses`, `campus_buildings` tables)
- [ ] Campus boundary (polygon / radius)
- [ ] Campus seed data (configurable, not hard-coded)
- [ ] Android foreground location permission flow
- [ ] GPS → approximate campus place conversion
- [ ] Campus geofence logic
- [ ] `active_locations` table (upsert-only, no history)

### PHASE 5 — ANDROID BACKGROUND LOCATION
- [ ] Background location permission request
- [ ] Foreground service / WorkManager integration
- [ ] Battery-conscious update strategy
- [ ] Enter/leave campus detection
- [ ] Privacy enforcement (stop sharing on exit)
- [ ] App lifecycle handling (resume, minimize, kill)

### PHASE 6 — TIMETABLE SCANNER
- [ ] Image capture / upload UI
- [ ] Backend vision function (`backend/functions/scan-timetable/`)
- [ ] Vision provider abstraction (`TimetableScanner` interface)
- [ ] Structured JSON output schema
- [ ] Subject selection step
- [ ] Group disambiguation step
- [ ] Venue disambiguation step
- [ ] Confirmation + save step
- [ ] Image cleanup after processing

### PHASE 7 — REALTIME / OFFLINE
- [ ] Supabase Realtime subscriptions (friend status, location, requests)
- [ ] Live friend status cards
- [ ] `lastUpdatedAt` timestamps on all live data
- [ ] Stale-data thresholds and UI states
- [ ] Offline cache (timetable, profile, campus data)
- [ ] Network restoration sync
- [ ] Duplicate-write prevention

### PHASE 8 — SECURITY / PRIVACY AUDIT
- [ ] RLS policy audit (all tables)
- [ ] API authorization review
- [ ] Location exposure audit (no raw coords to clients)
- [ ] Data retention audit (no location history)
- [ ] Secret exposure audit (no keys in frontend)
- [ ] Input validation review
- [ ] Privacy settings enforcement end-to-end

### PHASE 9 — TESTING / RELEASE
- [ ] Unit tests — timetable engine (shared/timetable/)
- [ ] Unit tests — friend code generation
- [ ] Unit tests — campus geofence logic
- [ ] Integration tests — Supabase RLS
- [ ] Android build verification
- [ ] Web production build verification
- [ ] Final documentation review
- [ ] README completion
- [ ] Setup instructions verification

---

## Key Architectural Decisions

### Decision 1: Shared timetable engine in TypeScript
The timetable engine lives in `shared/timetable/` as plain TypeScript with
no framework dependencies. The Next.js web app imports it directly. The
Flutter Android app re-implements the same deterministic logic in Dart,
keeping the two in sync via the shared type definitions and test fixtures.

**Rationale:** Avoids a network call for a purely deterministic calculation.
The timetable engine must work fully offline.

### Decision 2: Loka ID format
Format: `XXXX-XXXX` where X is an uppercase alphanumeric character from a
safe alphabet (no O, 0, I, 1 to avoid confusion). Example: `K7M2-P9RQ`.

Generated server-side using cryptographically random bytes. Never derived
from the internal UUID.

**Rationale:** 8 characters from a 32-character alphabet = ~1 trillion
combinations. Collision probability is negligible for small user bases.

### Decision 3: active_locations is upsert-only
The `active_locations` table has exactly one row per user (upserted on
each update). There is no `location_history` table. When a user leaves
campus, their row is deleted (not updated to a "last known" value).

**Rationale:** Core privacy principle. Do not retain a trail.

### Decision 4: Vision provider abstraction
The timetable scanner is implemented behind a `TimetableScanner` interface.
The V1 implementation uses an LLM vision API (configurable via server env
var). The client never holds the API key.

### Decision 5: iOS via PWA in V1
No native iOS app in V1. The Next.js PWA serves iOS users with
best-effort foreground location. Background location limitations are
clearly documented and surfaced in the UI.

---

## Remaining Blockers After Phase 0

1. **Flutter not installed** in build environment — developer must install locally.
2. **Supabase project** not yet created — developer must provision and supply keys.
3. **Vision API key** not yet configured — required for timetable scanner (Phase 6).
4. **Timetable test images** not yet added — developer should add sanitized copies to `docs/test-data/timetable/` per the spec.
5. **Campus coordinates** not yet defined — developer supplies real campus boundary in Phase 4 seed data.
