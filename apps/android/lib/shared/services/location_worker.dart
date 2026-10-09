// Background location worker — runs via WorkManager.
// This isolate has no UI context. It:
//   1. Gets the device's current GPS position
//   2. Calls the Edge Function to convert it to a place_label
//      (raw coordinates are never sent to or stored in Supabase)
//   3. Upserts active_locations with only the place_label
//
// Phase 5 implementation stub — full implementation in Phase 5.

import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../constants/app_constants.dart';

class LocationWorker {
  LocationWorker._();

  static const taskName = AppConstants.backgroundLocationTask;

  static Future<void> run() async {
    // Phase 5: Full implementation
    // 1. Check if location permission is still granted
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return;
    }

    try {
      // 2. Get current position with high accuracy
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      // 3. Call Edge Function — raw coordinates stay server-side
      //    The Edge Function returns a place_label string.
      final supabase = Supabase.instance.client;
      final response = await supabase.functions.invoke(
        'resolve-location',
        body: {
          'lat': position.latitude,
          'lng': position.longitude,
        },
      );

      final placeLabel = response.data?['place_label'] as String?;
      if (placeLabel == null) return;

      // 4. Upsert active_locations — only place_label, never coordinates
      await supabase.from('active_locations').upsert({
        'user_id': supabase.auth.currentUser?.id,
        'place_label': placeLabel,
        'updated_at': DateTime.now().toIso8601String(),
      });
    } catch (_) {
      // Silently fail — location updates are best-effort
    }
  }
}
