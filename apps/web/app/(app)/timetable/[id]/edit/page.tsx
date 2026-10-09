// Edit timetable entry
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TimetableEntryForm from '../../_components/TimetableEntryForm'
import Link from 'next/link'
import type { TimetableEntry } from '@loka/shared/types'

interface Props {
  params: { id: string }
}

export default async function EditTimetableEntryPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: e } = await supabase
    .from('timetable_entries')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!e) notFound()

  const entry: TimetableEntry = {
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
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/timetable" className="text-sm text-gray-400 p-1 -ml-1">
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Class</h1>
      </div>
      <TimetableEntryForm existing={entry} />
    </div>
  )
}
