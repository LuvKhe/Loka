// Home screen — "What's happening with me and my friends right now?"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'
import { computeTimetableState } from '@loka/shared/timetable'
import type { TimetableEntry, Profile, PrivacySettings } from '@loka/shared/types'

interface ActiveLocation {
  placeLabel: string
  campusBuildingId: string | null
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    university: (row.university as string) ?? '',
    campusId: (row.campus_id as string) ?? '',
    lokaId: row.loka_id as string,
    statusOverride: (row.status_override as 'free' | null) ?? null,
    statusOverrideSetAt: (row.status_override_set_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapPrivacy(row: Record<string, unknown>): PrivacySettings {
  return {
    userId: row.user_id as string,
    shareLocation: row.share_location as boolean,
    shareCurrentClass: row.share_current_class as boolean,
    shareNextClass: row.share_next_class as boolean,
    showInSearch: row.show_in_search as boolean,
    updatedAt: row.updated_at as string,
  }
}

function mapEntry(e: Record<string, unknown>): TimetableEntry {
  return {
    id: e.id as string,
    userId: e.user_id as string,
    dayOfWeek: e.day_of_week as TimetableEntry['dayOfWeek'],
    startTime: e.start_time as string,
    endTime: e.end_time as string,
    subjectCode: e.subject_code as string,
    subjectName: (e.subject_name as string | null) ?? null,
    groupName: (e.group_name as string | null) ?? null,
    venue: (e.venue as string | null) ?? null,
    room: (e.room as string | null) ?? null,
    lecturer: (e.lecturer as string | null) ?? null,
    notes: (e.notes as string | null) ?? null,
    isActive: e.is_active as boolean,
    createdAt: e.created_at as string,
    updatedAt: e.updated_at as string,
  }
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, timetableRes, privacyRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('is_active', true),
    supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
  ])

  const profile = profileRes.data ? mapProfile(profileRes.data) : null
  if (!profile) redirect('/onboarding')

  const timetableEntries = (timetableRes.data ?? []).map(mapEntry)
  const privacySettings = privacyRes.data ? mapPrivacy(privacyRes.data) : null

  const { data: locationRow } = await supabase
    .from('active_locations')
    .select('place_label, campus_building_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const activeLocation: ActiveLocation | null = locationRow
    ? { placeLabel: locationRow.place_label, campusBuildingId: locationRow.campus_building_id ?? null }
    : null

  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a,
  )

  let friendsData: Array<{
    id: string
    displayName: string
    status: string
    currentClass: string | null
    endsAt: number | null
  }> = []

  if (friendIds.length > 0) {
    const [friendProfilesRes, friendTimetablesRes, friendPrivacyRes] = await Promise.all([
      supabase.from('profiles').select('id, display_name, status_override').in('id', friendIds),
      supabase.from('timetable_entries').select('*').in('user_id', friendIds).eq('is_active', true),
      supabase.from('privacy_settings').select('user_id, share_current_class').in('user_id', friendIds),
    ])

    const friendProfiles = friendProfilesRes.data ?? []
    const friendTimetables = (friendTimetablesRes.data ?? []).map(mapEntry)
    const friendPrivacy = Object.fromEntries(
      (friendPrivacyRes.data ?? []).map((p) => [p.user_id, p]),
    )

    const entriesByUser: Record<string, TimetableEntry[]> = {}
    for (const e of friendTimetables) {
      if (!entriesByUser[e.userId]) entriesByUser[e.userId] = []
      entriesByUser[e.userId]!.push(e)
    }

    const now = new Date()
    friendsData = friendProfiles.map((fp) => {
      const entries = entriesByUser[fp.id] ?? []
      const state = computeTimetableState(entries, now, fp.status_override ?? null)
      const privacy = friendPrivacy[fp.id]
      const canSeeClass = privacy?.share_current_class !== false

      let currentClass: string | null = null
      let endsAt: number | null = null
      if (canSeeClass && state.currentClass) {
        currentClass = state.currentClass.subjectCode
        if (state.timeRemainingSeconds != null) endsAt = now.getTime() + state.timeRemainingSeconds * 1000
        if (state.currentClass.subjectName) {
          currentClass += ` — ${state.currentClass.subjectName}`
        }
      }

      return { id: fp.id, displayName: fp.display_name, status: state.status, currentClass, endsAt }
    })

    const ORDER: Record<string, number> = {
      free: 0, between_classes: 1, in_class: 2, no_classes_today: 3, weekend: 4, unknown: 5,
    }
    friendsData.sort((a, b) => (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5))
  }

  let friendLocations: Record<string, string> = {}
  if (friendIds.length > 0) {
    const { data: locationRows } = await supabase
      .from('active_locations')
      .select('user_id, place_label')
      .in('user_id', friendIds)

    for (const row of locationRows ?? []) {
      friendLocations[row.user_id] = row.place_label
    }
  }

  return (
    <HomeClient
      profile={profile}
      timetableEntries={timetableEntries}
      privacySettings={privacySettings}
      friendsData={friendsData}
      activeLocation={activeLocation}
      friendLocations={friendLocations}
    />
  )
}
