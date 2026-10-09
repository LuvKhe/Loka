// App-wide constants for the Loka Android app.
//
// IMPORTANT: SUPABASE_URL and SUPABASE_ANON_KEY are read from compile-time
// --dart-define flags, not hardcoded. Build with:
//   flutter build apk \
//     --dart-define=SUPABASE_URL=https://your-project.supabase.co \
//     --dart-define=SUPABASE_ANON_KEY=your-anon-key
//
// The anon key is public-safe (enforced by RLS). The service role key must
// NEVER be embedded in the app.

class AppConstants {
  AppConstants._();

  // Supabase — set at build time via --dart-define
  static const supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  // Loka ID alphabet (must match shared/constants/index.ts)
  static const lokaIdAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  static const lokaIdSegmentLength = 4;

  // Location update intervals (milliseconds)
  static const locationForegroundMovingMs = 30000;
  static const locationForegroundStationaryMs = 120000;
  static const locationBackgroundMs = 180000;

  // Stale data thresholds (seconds)
  static const staleLocationSeconds = 300;
  static const unavailableLocationSeconds = 900;

  // WorkManager task names
  static const backgroundLocationTask = 'loka.location.update';

  // Notification channel IDs
  static const locationChannelId = 'loka_location';
  static const locationChannelName = 'Location updates';
}
