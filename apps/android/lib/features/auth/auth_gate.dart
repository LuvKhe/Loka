// Auth gate — shows onboarding if the user is not signed in,
// otherwise shows the main app shell.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../home/main_shell.dart';
import 'onboarding_screen.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final session = snapshot.data?.session ??
            Supabase.instance.client.auth.currentSession;

        if (session == null) {
          return const OnboardingScreen();
        }

        // Check if the user has completed profile setup
        return FutureBuilder<bool>(
          future: _hasProfile(session.user.id),
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (snap.data == true) {
              return const MainShell();
            }
            return const OnboardingScreen();
          },
        );
      },
    );
  }

  Future<bool> _hasProfile(String userId) async {
    try {
      final result = await Supabase.instance.client
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
      return result['id'] != null;
    } catch (_) {
      return false;
    }
  }
}
