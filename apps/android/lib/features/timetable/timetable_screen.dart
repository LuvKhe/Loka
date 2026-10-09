// Timetable screen scaffold — Phase 3 implementation.

import 'package:flutter/material.dart';

class TimetableScreen extends StatelessWidget {
  const TimetableScreen({super.key});

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
                  const Text('Timetable', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  FilledButton(
                    onPressed: () {}, // Phase 3: open add class form
                    child: const Text('Add Class'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text('No classes yet.', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
