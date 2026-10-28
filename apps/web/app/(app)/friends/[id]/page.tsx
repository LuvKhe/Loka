import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import Avatar from '@/components/ui/Avatar'
import { computeTimetableState, formatTime } from '@loka/shared/timetable'
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
  const nowClass = shareClass && state.currentClass ? describe(state.currentClass) : null
  const nextClass = shareNext && state.nextClass ? describe(state.nextClass) : null

  const byDay: Record<number, TimetableEntry[]> = {}
  if (shareClass) {
    for (const e of entries) {
      if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = []
      byDay[e.dayOfWeek]!.push(e)
    }
    for (const list of Object.values(byDay)) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
  }
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b)
  const bio: string | null = profile.bio ?? null

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/friends" className="text-sm text-gray-400 p-1 -ml-1">
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Friend</h1>
      </div>

      <div className="loka-card">
        <div className="flex items-center gap-4 mb-4">
          <Avatar url={profile.avatar_url ?? null} name={profile.display_name} size={56} />
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-slate-100 break-words">{profile.display_name}</p>
            {profile.university && (
              <p className="text-sm text-gray-500 dark:text-slate-400">{profile.university}</p>
            )}
          </div>
        </div>

        {bio && <p className="text-sm text-gray-700 dark:text-slate-300 mb-4 break-words">{bio}</p>}

        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
        </div>

        {(shareLocation || friendLocation) && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-400 mb-0.5">Location</p>
            <p className="text-sm text-gray-700 dark:text-slate-300">
              {friendLocation ?? 'Not checked in'}
            </p>
          </div>
        )}
      </div>

      {(nowClass || nextClass) && (
        <section>
          <p className="loka-section-label">Right now</p>
          <div className="loka-card space-y-3">
            {nowClass && (
              <div>
                <p className="text-xs text-gray-400">Now</p>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{nowClass}</p>
                {state.currentClass?.venue && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">{state.currentClass.venue}</p>
                )}
              </div>
            )}
            {nextClass && (
              <div>
                <p className="text-xs text-gray-400">Next</p>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{nextClass}</p>
                {state.nextClass && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {DAY_NAMES[state.nextClass.dayOfWeek]} {formatTime(state.nextClass.startTime)}
                    {state.nextClass.venue ? ` - ${state.nextClass.venue}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <p className="loka-section-label">Timetable</p>
        {!shareClass ? (
          <div className="loka-card">
            <p className="text-sm text-gray-400">This friend keeps their timetable private.</p>
          </div>
        ) : days.length === 0 ? (
          <div className="loka-card">
            <p className="text-sm text-gray-400">No timetable added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((d) => (
              <div key={d} className="loka-card">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">{DAY_NAMES[d]}</p>
                <div className="space-y-2">
                  {byDay[d]!.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {e.subjectCode}
                          {e.groupName ? <span className="text-gray-400 font-normal"> Group {e.groupName}</span> : null}
                        </p>
                        {e.venue && <p className="text-xs text-gray-500 dark:text-slate-400">{e.venue}</p>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 shrink-0">
                        {formatTime(e.startTime)} - {formatTime(e.endTime)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
