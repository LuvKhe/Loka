import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import Avatar from '@/components/ui/Avatar'
import { computeTimetableState, formatTime } from '@loka/shared/timetable'
import TimetableView from '@/components/timetable/TimetableView'
import type { TimetableEntry } from '@loka/shared/types'

interface Props {
  params: { id: string }
}

const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}

function describe(entry: TimetableEntry): string {
  return entry.subjectName ? `${entry.subjectCode} - ${entry.subjectName}` : entry.subjectCode
}

export default async function FriendProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const friendId = params.id
  const [userA, userB] = [user.id, friendId].sort()
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .maybeSingle()

  if (!friendship) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', friendId)
    .maybeSingle()

  if (!profile) notFound()

  const { data: privacy } = await supabase
    .from('privacy_settings')
    .select('share_location, share_current_class, share_next_class')
    .eq('user_id', friendId)
    .maybeSingle()

  const shareLocation = privacy?.share_location === true
  const shareClass = privacy?.share_current_class === true
  const shareNext = privacy?.share_next_class === true

  let friendLocation: string | null = null
  if (shareLocation) {
    const { data: locationRow } = await supabase
      .from('active_locations')
      .select('place_label')
      .eq('user_id', friendId)
      .maybeSingle()
    friendLocation = locationRow?.place_label ?? null
  }

  let entries: TimetableEntry[] = []
  if (shareClass || shareNext) {
    const { data: rows } = await supabase
      .from('timetable_entries')
      .select('*')
      .eq('user_id', friendId)
      .eq('is_active', true)

    entries = (rows ?? []).map((e) => ({
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
  }

  const state = computeTimetableState(entries, new Date(), profile.status_override ?? null)
  const status = shareClass || shareNext ? state.status : 'unknown'
  const nextClass = shareNext && state.nextClass ? describe(state.nextClass) : null

  const bio: string | null = profile.bio ?? null

  const suppressNow = profile.status_override === 'free'
  const showSmallNext = !shareClass && nextClass

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/friends" className="text-sm font-medium text-gray-700 dark:text-gray-200 min-h-[2.75rem] inline-flex items-center px-1 -ml-1">
          Back
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Friend</h1>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-16 bg-gradient-to-r from-blue-700 to-violet-800" aria-hidden="true" />
        <div className="px-4 pb-4 -mt-9">
          <div className="inline-block rounded-full p-1 bg-white dark:bg-slate-800">
            <Avatar url={profile.avatar_url ?? null} name={profile.display_name} size={64} />
          </div>
          <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 break-words mt-2" style={{ textWrap: 'balance' }}>
            {profile.display_name}
          </p>
          {profile.university && <p className="text-sm text-gray-600 dark:text-slate-400">{profile.university}</p>}
          {bio && <p className="text-sm text-gray-800 dark:text-slate-200 mt-3 break-words">{bio}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={status} />
            {(shareLocation || friendLocation) && (
              <span className="text-xs rounded-full px-2.5 py-1 bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200">
                {friendLocation ? `At ${friendLocation}` : 'Not checked in'}
              </span>
            )}
          </div>
        </div>
      </div>

      {showSmallNext && (
        <section>
          <p className="loka-section-label">Up next</p>
          <div className="loka-card">
            <p className="font-bold text-gray-900 dark:text-slate-100">{nextClass}</p>
            {state.nextClass && (
              <p className="text-sm text-gray-600 dark:text-slate-400 tabular-nums">
                {DAY_NAMES[state.nextClass.dayOfWeek]} {formatTime(state.nextClass.startTime)}
                {state.nextClass.venue ? ` - ${state.nextClass.venue}` : ''}
              </p>
            )}
          </div>
        </section>
      )}

      {!shareClass ? (
        <div className="loka-card">
          <p className="text-sm text-gray-600 dark:text-slate-400">This friend keeps their timetable private.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="loka-card">
          <p className="text-sm text-gray-600 dark:text-slate-400">No timetable added yet.</p>
        </div>
      ) : (
        <TimetableView entries={entries} readOnly suppressNow={suppressNow} />
      )}
    </div>
  )
}
