import { createClient } from '@/lib/supabase/server'
import ProfileEditClient from './ProfileEditClient'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Edit profile</h1>
      </div>
      <ProfileEditClient
        userId={user.id}
        displayName={profile?.display_name ?? ''}
        bio={profile?.bio ?? ''}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  )
}
