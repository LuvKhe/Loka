// Friends screen scaffold — Phase 2 implementation.

import 'package:flutter/material.dart';

class FriendsScreen extends StatelessWidget {
  const FriendsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Friends', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  FilledButton.tonal(
                    onPressed: () {}, // Phase 2: open add friend screen
                    child: const Text('Add'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text('No friends yet.', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
