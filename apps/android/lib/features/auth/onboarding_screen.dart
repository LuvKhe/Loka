// Onboarding — anonymous sign-in + display name entry.
// Mirrors the logic of apps/web/app/onboarding/OnboardingClient.tsx.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

enum _Step { welcome, name, creating, recovery, error }

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  _Step _step = _Step.welcome;
  final _nameController = TextEditingController();
  String? _nameError;
  String? _serverError;
  String? _recoveryCode;
  bool _recoveryConfirmed = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _createProfile() async {
    final name = _nameController.text.trim();
    if (name.isEmpty || name.length > 50) {
      setState(() => _nameError = 'Please enter a valid name (1–50 characters)');
      return;
    }

    setState(() {
      _step = _Step.creating;
      _serverError = null;
    });

    try {
      final supabase = Supabase.instance.client;

      // 1. Sign in anonymously
      await supabase.auth.signInAnonymously();

      // 2. Call the profile setup Edge Function
      final response = await supabase.functions.invoke(
        'setup-profile',
        body: {'displayName': name},
      );

      if (response.data == null || response.data['recoveryCode'] == null) {
        throw Exception('Profile setup failed');
      }

      setState(() {
        _recoveryCode = response.data['recoveryCode'] as String;
        _step = _Step.recovery;
      });
    } catch (e) {
      setState(() {
        _serverError = e.toString();
        _step = _Step.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: switch (_step) {
          _Step.welcome => _buildWelcome(),
          _Step.name => _buildName(),
          _Step.creating => _buildCreating(),
          _Step.recovery => _buildRecovery(),
          _Step.error => _buildError(),
        },
      ),
    );
  }

  Widget _buildWelcome() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 64,
            height: 64,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              'L',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Welcome to Loka',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Know when your friends are free — privately.',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          _bulletPoint('1', 'No email or password required.'),
          const SizedBox(height: 12),
          _bulletPoint('2', 'Your location is never stored raw.'),
          const SizedBox(height: 12),
          _bulletPoint('3', 'Only friends you approve can see your status.'),
          const SizedBox(height: 40),
          FilledButton(
            onPressed: () => setState(() => _step = _Step.name),
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: Text('Get started'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bulletPoint(String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFFDBEAFE),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(number, style: const TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
      ],
    );
  }

  Widget _buildName() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextButton(
            onPressed: () => setState(() => _step = _Step.welcome),
            child: const Align(alignment: Alignment.centerLeft, child: Text('Back')),
          ),
          const SizedBox(height: 16),
          const Text(
            'What should friends call you?',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'This is your display name. You can change it later.',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nameController,
            autofocus: true,
            maxLength: 40,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              hintText: 'Your name',
              errorText: _nameError,
              border: const OutlineInputBorder(),
            ),
            onChanged: (_) => setState(() => _nameError = null),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _nameController.text.trim().isEmpty ? null : _createProfile,
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCreating() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Setting up your profile...'),
        ],
      ),
    );
  }

  Widget _buildRecovery() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Save your recovery code',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'This is the only time you will see this code. If you lose access to this device, it is the only way to restore your profile.',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Recovery Code',
                  style: TextStyle(fontSize: 11, color: Colors.grey[500], letterSpacing: 1),
                ),
                const SizedBox(height: 8),
                Text(
                  _recoveryCode ?? '',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          CheckboxListTile(
            value: _recoveryConfirmed,
            onChanged: (v) => setState(() => _recoveryConfirmed = v ?? false),
            title: const Text('I have saved my recovery code somewhere safe.', style: TextStyle(fontSize: 14)),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _recoveryConfirmed
                ? () {
                    // Recovery code is now discarded — the session is live
                    setState(() => _recoveryCode = null);
                    // AuthGate will pick up the new session automatically
                  }
                : null,
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: Text('Done'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Something went wrong', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(_serverError ?? 'Unknown error', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => setState(() => _step = _Step.name),
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}
