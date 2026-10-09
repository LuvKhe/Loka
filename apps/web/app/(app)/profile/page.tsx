// Profile screen
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, privacyRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <ProfileClient
      profile={profileRes.data}
      privacySettings={privacyRes.data}
    />
  )
}
