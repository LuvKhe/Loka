# Timetable Test Data

This directory holds sanitized timetable images used for testing the Loka
timetable scanner (Phase 6).

## Required Test Fixtures

Add the following files to this directory:

| File | Description |
|------|-------------|
| `combined_timetable.jpg` | A combined multi-group university timetable image similar to what the scanner will process in production |
| `single_subject.jpg` | A simple single-subject timetable (happy-path test) |
| `ambiguous_groups.jpg` | A timetable where multiple groups share a subject code |
| `missing_venues.jpg` | A timetable where some venue cells are blank |
| `low_quality.jpg` | A low-quality photo to test OCR failure handling |

## Expected Output for combined_timetable.jpg

The scanner must NOT automatically assume the following are the user's subjects.
The user must select from the detected candidates.

Expected user selections for testing:

```json
{
  "selectedSubjects": ["MAT111", "CSC111", "PHY101", "ASC111", "GSC111"],
  "groupSelections": {
    "CSC111": "F",
    "PHY101": "A"
  },
  "venueSelections": {
    "MAT111": "SLT.II"
  }
}
```

## Privacy Note

Do not add real student data to this directory.
Use only sanitized/anonymized timetable images that do not identify real individuals.
Images added here must be safe to commit to the repository.

## Adding Images

Place image files directly in this directory. Accepted formats: `.jpg`, `.jpeg`, `.png`.

After adding images, run the scanner test suite:

```bash
cd apps/web
npm run test:scanner
```
