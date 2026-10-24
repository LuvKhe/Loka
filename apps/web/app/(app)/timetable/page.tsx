// Timetable screen
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { TimetableEntry } from '@loka/shared/types'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function groupByDay(entries: TimetableEntry[]) {
  const grouped: Record<number, TimetableEntry[]> = {}
  for (const e of entries) {
    if (!grouped[e.dayOfWeek]) grouped[e.dayOfWeek] = []
    grouped[e.dayOfWeek]!.push(e)
  }
  // Sort within each day by start time
  for (const day of Object.keys(grouped)) {
    grouped[Number(day)]!.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return grouped
}

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: entries } = await supabase
    .from('timetable_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  // Map snake_case DB columns to camelCase type
  const mapped: TimetableEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    userId: e.user_id,
    dayOfWeek: e.day_of_week,
    startTime: e.start_time,
    endTime: e.end_time,
    subjectCode: e.subject_code,
    subjectName: e.subject_name,
    groupName: e.group_name,
    venue: e.venue,
    room: e.room,
    lecturer: e.lecturer,
    notes: e.notes,
    isActive: e.is_active,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }))

  const grouped = groupByDay(mapped)
  const activeDays = [1, 2, 3, 4, 5, 6, 7].filter((d) => grouped[d]?.length)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">Timetable</h1>
        <div className="flex gap-2">
          <Link href="/timetable/select" className="loka-btn-secondary py-2 px-3 text-xs">
            Browse
          </Link>
          <Link href="/timetable/new" className="loka-btn-primary py-2 px-3 text-xs">
            Add Class
          </Link>
        </div>
      </div>

      {mapped.length === 0 ? (
        <div className="loka-card">
          <p className="font-medium text-gray-900 text-sm mb-1">No classes yet</p>
          <p className="text-sm text-gray-400 mb-3">
            Browse official UNESWA class times by programme, or add a class manually.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/timetable/select" className="loka-btn-primary py-2 px-3 text-xs">
              Browse by programme
            </Link>
            <Link href="/timetable/new" className="loka-btn-secondary py-2 px-3 text-xs">
              Add manually
            </Link>
          </div>
        </div>
      ) : (
        activeDays.map((day) => (
          <section key={day}>
            <p className="loka-section-label">{DAY_NAMES[day]}</p>
            <div className="space-y-2">
              {grouped[day]!.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/timetable/${entry.id}/edit`}
                  className="loka-card block hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-right min-w-[4rem]">
                      <p className="text-xs font-mono text-gray-500">{entry.startTime.slice(0, 5)}</p>
                      <p className="text-xs font-mono text-gray-400">{entry.endTime.slice(0, 5)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900">{entry.subjectCode}</p>
                      {entry.subjectName && (
                        <p className="text-xs text-gray-500 truncate">{entry.subjectName}</p>
                      )}
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {entry.groupName && (
                          <p className="text-xs text-gray-400">Group {entry.groupName}</p>
                        )}
                        {entry.venue && (
                          <p className="text-xs text-gray-400">{entry.venue}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
