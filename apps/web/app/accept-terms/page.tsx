import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TERMS_VERSION } from '@/lib/legal'
import AcceptTermsClient from './AcceptTermsClient'

export default async function AcceptTermsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/onboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('terms_version')
    .eq('id', user.id)
    .single()

  if (!profile || profile.terms_version === TERMS_VERSION) redirect('/home')

  return <AcceptTermsClient />
}
