// Timetable screen
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { TimetableEntry } from '@loka/shared/types'
import TimetableView from '@/components/timetable/TimetableView'

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

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between pt-2 gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Timetable</h1>
        <div className="flex gap-2">
          <Link href="/timetable/select" className="loka-btn-secondary py-2.5 px-3.5 text-sm min-h-[2.75rem]">
            Browse
          </Link>
          <Link href="/timetable/new" className="loka-btn-primary py-2.5 px-3.5 text-sm min-h-[2.75rem]">
            Add class
          </Link>
        </div>
      </div>

      {mapped.length === 0 ? (
        <div className="loka-card text-center py-10">
          <svg viewBox="0 0 120 80" className="w-32 mx-auto mb-4" aria-hidden="true">
            <rect x="8" y="10" width="104" height="62" rx="10" className="fill-blue-100 dark:fill-blue-900/40" />
            <rect x="20" y="22" width="22" height="14" rx="4" className="fill-blue-500" />
            <rect x="48" y="22" width="30" height="14" rx="4" className="fill-emerald-500" />
            <rect x="20" y="42" width="34" height="14" rx="4" className="fill-violet-500" />
            <rect x="60" y="42" width="22" height="14" rx="4" className="fill-amber-500" />
          </svg>
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">Your week is a blank page</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-5">
            Pick your programme to load official UNESWA times, or add a class yourself.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link href="/timetable/select" className="loka-btn-primary min-h-[2.75rem]">Browse by programme</Link>
            <Link href="/timetable/new" className="loka-btn-secondary min-h-[2.75rem]">Add manually</Link>
          </div>
        </div>
      ) : (
        <TimetableView entries={mapped} />
      )}
    </div>
  )
}
