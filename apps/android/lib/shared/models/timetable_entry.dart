// Dart mirror of TimetableEntry in shared/types/index.ts
// Must stay in sync with the TypeScript definition.

class TimetableEntry {
  final String id;
  final String userId;
  final int dayOfWeek; // 1=Mon..7=Sun
  final String startTime; // HH:MM
  final String endTime; // HH:MM
  final String subjectCode;
  final String? subjectName;
  final String? groupName;
  final String? venue;
  final String? room;
  final String? lecturer;
  final String? notes;
  final bool isActive;

  const TimetableEntry({
    required this.id,
    required this.userId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.subjectCode,
    this.subjectName,
    this.groupName,
    this.venue,
    this.room,
    this.lecturer,
    this.notes,
    this.isActive = true,
  });

  factory TimetableEntry.fromJson(Map<String, dynamic> json) {
    return TimetableEntry(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      dayOfWeek: json['day_of_week'] as int,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      subjectCode: json['subject_code'] as String,
      subjectName: json['subject_name'] as String?,
      groupName: json['group_name'] as String?,
      venue: json['venue'] as String?,
      room: json['room'] as String?,
      lecturer: json['lecturer'] as String?,
      notes: json['notes'] as String?,
      isActive: (json['is_active'] as bool?) ?? true,
    );
  }
}
