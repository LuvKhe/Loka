# Loka — Testing Guide

## Local Development Setup

### Prerequisites
- Node.js >= 22
- Flutter SDK >= 3.19.0 (for Android testing)
- Android Studio + Android SDK (for Android emulator/device)
- Supabase CLI (`npm install -g supabase`)
- A physical Android device (required for background location testing)

### Setup Steps
```bash
# Clone the repo
git clone <repo>
cd loka

# Install web dependencies
cd apps/web && npm install

# Install shared package
cd ../../shared && npm install

# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Copy env example
cp apps/web/.env.example apps/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# from: supabase status
```

---

## Timetable Engine Tests (shared/)

The timetable engine is pure TypeScript — no network, no Supabase. Tests
run with `vitest`.

```bash
cd shared
npm test
```

Key test cases:
- Current class mid-session
- Current class at exact start time
- Current class at exact end time (should NOT be in class)
- Next class today
- No more classes today
- First class tomorrow (should show next = first class tomorrow)
- Weekend — no classes
- Overlapping classes — should show the one that started first
- Free override — engine returns 'free' regardless of timetable
- Timezone boundary (midnight crossing)

---

## Web App Tests

```bash
cd apps/web
npm test          # unit tests (vitest)
npm run e2e       # Playwright end-to-end
npm run type-check
npm run lint
```

### Key web test areas
- Profile creation (anonymous auth flow)
- Loka ID display and copy
- QR code rendering
- Friend request send/receive/accept/decline
- Timetable CRUD
- Status display (in class / free / no class)
- Privacy settings persistence
- Offline banner display
- Stale data indicators

---

## Android Tests (Flutter)

```bash
cd apps/android
flutter test              # unit + widget tests
flutter analyze           # static analysis
flutter build apk --debug # verify build
```

### Key Android test areas
- Profile creation widget
- Navigation shell
- Timetable entry form validation
- Status card rendering
- Permission request flows (mocked)
- QR generation

---

## Real-Device Testing (Required)

### Background Location
Background location **cannot be reliably tested on emulators.**
Use a physical Android device for:

1. Grant foreground location permission
2. Grant background location permission (separate prompt)
3. Minimize the app
4. Walk outside the campus boundary
5. Verify location stops updating
6. Verify friends see "Off campus"
7. Re-enter campus
8. Verify location resumes

### Battery Optimization
1. On device: Settings > Apps > Loka > Battery > "Unrestricted"
2. Test background updates continue when battery optimization is applied
3. Document observed behavior

---

## Supabase / RLS Tests

Run against a local Supabase instance (supabase start).

Tests in `backend/supabase/tests/`:

```bash
supabase test db
```

Critical RLS scenarios:
- User A cannot read User B's timetable without friendship
- User A cannot read User B's active_location without friendship
- User A cannot read User B's privacy_settings at all
- User A cannot read User B's recovery_credentials at all
- User A cannot update User B's profile
- Friendship only grants access when privacy_settings allow it
- Deleted friendship immediately revokes location/timetable access
- User cannot create a friendship directly (must go through friend_request)

---

## Timetable Scanner Testing

The scanner requires a configured vision API key in the Edge Function.

### Test fixture
Add sanitized timetable images to `docs/test-data/timetable/`.
See `docs/test-data/timetable/README.md` for the expected test cases.

### Manual scanner flow test
1. Upload the test timetable image
2. Verify scanner returns candidate classes (not hard-coded)
3. Verify subject selection step is shown
4. Deselect some subjects
5. Verify group disambiguation appears for multi-group subjects
6. Verify venue disambiguation appears where needed
7. Confirm timetable
8. Verify only confirmed subjects are saved
9. Verify original image is not retained after processing

---

## PWA / iOS Testing

Test in Chrome (Android) and Safari (iOS):

1. Visit the web app URL
2. Add to home screen (PWA install)
3. Open from home screen
4. Grant location permission
5. Verify location works in foreground
6. Background tab / switch apps
7. Verify "Location paused while app is in background" message appears on iOS
8. Verify no stale location is shown

---

## Network / Offline Testing

1. Open Loka with network connected
2. Load the home screen and friends list
3. Disable network (airplane mode)
4. Verify: profile still shows
5. Verify: timetable still calculates current/next class
6. Verify: friends list shows last-cached data with staleness indicator
7. Verify: live location shows "Offline"
8. Re-enable network
9. Verify: live data resumes
10. Verify: no duplicate friend requests sent

---

## PWA Limitations Documentation (iOS)

When testing on iOS Safari, verify the UI shows:

- A one-time informational banner: "On iPhone, Loka can only share your
  location while this tab is open."
- The banner is dismissible and not shown again after dismissal
- No false claims about background location working on iOS
