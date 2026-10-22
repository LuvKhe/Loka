import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Root route — redirect based on auth + profile state
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/onboarding')
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  redirect('/home')
}
