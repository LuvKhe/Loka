// Profile edit screen
import { createClient } from '@/lib/supabase/server'
import ProfileEditClient from './ProfileEditClient'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
      </div>
      <ProfileEditClient
        userId={user.id}
        displayName={profile?.display_name ?? ''}
      />
    </div>
  )
}
