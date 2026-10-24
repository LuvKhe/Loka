// Profile screen
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'
import type { Profile, PrivacySettings } from '@loka/shared/types'

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

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, privacyRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name, avatar_url, university, campus_id, loka_id, status_override, status_override_set_at, created_at, updated_at').eq('id', user.id).single(),
    supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
  ])

  const profile = profileRes.data ? mapProfile(profileRes.data) : null
  const privacySettings = privacyRes.data ? mapPrivacy(privacyRes.data) : null

  return (
    <ProfileClient
      profile={profile}
      privacySettings={privacySettings}
    />
  )
}
