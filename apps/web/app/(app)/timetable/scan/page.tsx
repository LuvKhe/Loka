// Timetable scan screen — Phase 6 placeholder
// Full OCR/vision scanning is implemented in Phase 6.
import Link from 'next/link'

export default function TimetableScanPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/timetable" className="text-sm text-gray-400 p-1 -ml-1">
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Scan Timetable</h1>
      </div>

      <div className="loka-card space-y-3">
        <p className="text-sm font-medium text-gray-900">Timetable scanning</p>
        <p className="text-xs text-gray-500">
          Take a photo of your printed or digital timetable and Loka will read your classes
          automatically.
        </p>
        <p className="text-xs text-gray-400">
          Scanning will be available in a future update. Add your classes manually for now.
        </p>
        <Link href="/timetable/new" className="loka-btn-primary py-2.5 px-4 text-sm inline-block">
          Add manually instead
        </Link>
      </div>
    </div>
  )
}
