# Loka

> Know where your friends are, what they're doing, and when they're free — without turning the app into a surveillance system.

Loka is a private university-campus coordination app for a small group of friends.

---

## Architecture

| Component | Technology |
|-----------|-----------|
| Android app | Flutter / Dart |
| Web / PWA (incl. iOS v1) | Next.js 14, TypeScript |
| Backend | Supabase (PostgreSQL, Realtime, Auth, Storage) |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) |
| Shared logic | TypeScript (timetable engine, types, validation) |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture.

---

## Prerequisites

### All platforms
- Git
- A Supabase project (cloud or local CLI)

### Web / PWA
- Node.js >= 22
- npm >= 10

### Android
- Flutter SDK >= 3.19.0
- Dart >= 3.3.0
- Android Studio + Android SDK (API level 26+)
- A physical Android device (recommended for location testing)

---

## Installation

```bash
git clone <repo-url>
cd loka
```

### Web app
```bash
cd apps/web
npm install
cp .env.example .env.local
# Fill in environment variables — see below
npm run dev
```

### Android app
```bash
cd apps/android
flutter pub get
# Connect Android device or start emulator
flutter run
```

---

## Environment Variables

### `apps/web/.env.local`

```
# Supabase — public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `backend/functions/.env` (Edge Functions — never exposed to client)

```
# Vision API for timetable scanner
VISION_PROVIDER=openai          # or: google, anthropic
VISION_API_KEY=your-secret-key

# Supabase service role (for admin operations inside edge functions)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### `apps/android/` — `lib/config/env.dart` (generated from build config)

```dart
// Set via --dart-define at build time:
// flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
```

**Never commit real keys. Never put the service role key or vision API key in any client.**

---

## Supabase Setup

### Local development

```bash
npm install -g supabase
supabase start
supabase db push
```

### Cloud

1. Create a project at [supabase.com](https://supabase.com)
2. Copy URL and anon key into `.env.local`
3. Run migrations:

```bash
supabase db push --db-url postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
```

---

## Database Migrations

Migrations live in `backend/supabase/migrations/`. They are applied in
filename order. Each migration is a plain SQL file with RLS policies included.

```bash
# Apply all migrations to local Supabase
supabase db push

# Create a new migration
supabase migration new <name>
```

---

## Android Build

```bash
cd apps/android

# Debug build
flutter build apk --debug

# Release build (requires signing config)
flutter build apk --release
```

Output: `apps/android/build/app/outputs/flutter-apk/app-release.apk`

---

## Web Production Build

```bash
cd apps/web
npm run build
npm start          # serve locally
```

### Deployment

The web app is a standard Next.js application. Deploy to:
- Vercel (recommended — zero config)
- Any Node.js host
- Docker container

---

## Development Commands

| Command | What it does |
|---------|-------------|
| `cd apps/web && npm run dev` | Start web dev server on :3000 |
| `cd apps/web && npm test` | Run web unit tests |
| `cd apps/web && npm run type-check` | TypeScript check |
| `cd apps/web && npm run lint` | ESLint |
| `cd shared && npm test` | Run timetable engine tests |
| `cd apps/android && flutter run` | Run Android debug |
| `cd apps/android && flutter test` | Run Flutter tests |
| `cd apps/android && flutter analyze` | Flutter static analysis |
| `supabase start` | Start local Supabase |
| `supabase db push` | Apply migrations |
| `supabase test db` | Run database/RLS tests |

---

## Testing

See [docs/TESTING.md](docs/TESTING.md) for full testing instructions,
including background location testing requirements (real Android device required).

---

## Privacy

See [docs/PRIVACY.md](docs/PRIVACY.md) for a plain-language explanation of
what Loka stores, what friends can see, and how location data is handled.

---

## iOS Note

V1 iOS support is via the web/PWA. Open the Loka web URL in Safari on iPhone
and add to your home screen for the best experience. Background location is
not available in iOS PWA — location sharing only works while the app is open.

A native iOS app may be added in a future version.
