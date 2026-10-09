// Friend profile screen — shows a friend's public info and status
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { computeTimetableState } from '@loka/shared/timetable'
import type { TimetableEntry } from '@loka/shared/types'

interface Props {
  params: { id: string }
}

export default async function FriendProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const friendId = params.id

  // Verify friendship
  const [userA, userB] = [user.id, friendId].sort()
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .single()

  if (!friendship) notFound()

  // Fetch friend's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, loka_id, university, status_override')
    .eq('id', friendId)
    .single()

  if (!profile) notFound()

  // Fetch friend's privacy settings
  const { data: privacy } = await supabase
    .from('privacy_settings')
    .select('share_location, share_current_class, share_next_class')
    .eq('user_id', friendId)
    .single()

  // Fetch friend's timetable if share_current_class is on
  let timetableStatus: string = 'unknown'
  let currentClass: string | null = null
  let nextClass: string | null = null

  if (privacy?.share_current_class || privacy?.share_next_class) {
    const { data: entries } = await supabase
      .from('timetable_entries')
      .select('*')
      .eq('user_id', friendId)
      .eq('is_active', true)

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

    const state = computeTimetableState(mapped, new Date(), profile.status_override)
    timetableStatus = state.status

    if (privacy.share_current_class && state.currentClass) {
      currentClass = `${state.currentClass.subjectCode}${state.currentClass.subjectName ? ` — ${state.currentClass.subjectName}` : ''}`
    }
    if (privacy.share_next_class && state.nextClass) {
      nextClass = `${state.nextClass.subjectCode}${state.nextClass.subjectName ? ` — ${state.nextClass.subjectName}` : ''}`
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/friends" className="text-sm text-gray-400 p-1 -ml-1">
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Friend</h1>
      </div>

      {/* Identity card */}
      <div className="loka-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-xl">
              {profile.display_name[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{profile.display_name}</p>
            {profile.university && (
              <p className="text-sm text-gray-500">{profile.university}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={timetableStatus} />
        </div>
      </div>

      {/* Class info */}
      {(currentClass || nextClass) && (
        <section>
          <p className="loka-section-label">Schedule</p>
          <div className="loka-card space-y-3">
            {currentClass && (
              <div>
                <p className="text-xs text-gray-400">Now</p>
                <p className="text-sm font-medium text-gray-900">{currentClass}</p>
              </div>
            )}
            {nextClass && (
              <div>
                <p className="text-xs text-gray-400">Next</p>
                <p className="text-sm font-medium text-gray-900">{nextClass}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
