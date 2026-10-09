// Home screen — "What's happening with me and my friends right now?"
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null // middleware handles redirect

  // Fetch own profile + timetable
  const [profileRes, timetableRes, privacyRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('is_active', true),
    supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <HomeClient
      profile={profileRes.data}
      timetableEntries={timetableRes.data ?? []}
      privacySettings={privacyRes.data}
    />
  )
}
