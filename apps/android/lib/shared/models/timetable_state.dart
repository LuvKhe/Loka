// Dart mirror of TimetableState/TimetableStatus in shared/types/index.ts

enum TimetableStatus {
  inClass,
  free,
  betweenClasses,
  noClassesToday,
  weekend,
  unknown,
  offCampus,
}

extension TimetableStatusLabel on TimetableStatus {
  String get label {
    switch (this) {
      case TimetableStatus.inClass:
        return 'In class';
      case TimetableStatus.free:
        return 'Free';
      case TimetableStatus.betweenClasses:
        return 'Between classes';
      case TimetableStatus.noClassesToday:
        return 'No classes today';
      case TimetableStatus.weekend:
        return 'No classes today';
      case TimetableStatus.offCampus:
        return 'Off campus';
      case TimetableStatus.unknown:
        return 'Unknown';
    }
  }

  static TimetableStatus fromString(String value) {
    switch (value) {
      case 'in_class':
        return TimetableStatus.inClass;
      case 'free':
        return TimetableStatus.free;
      case 'between_classes':
        return TimetableStatus.betweenClasses;
      case 'no_classes_today':
        return TimetableStatus.noClassesToday;
      case 'weekend':
        return TimetableStatus.weekend;
      case 'off_campus':
        return TimetableStatus.offCampus;
      default:
        return TimetableStatus.unknown;
    }
  }
}
