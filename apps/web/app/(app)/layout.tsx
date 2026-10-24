import { redirect } from 'next/navigation'
import BottomNav from '@/components/nav/BottomNav'
import { createClient } from '@/lib/supabase/server'
import { TERMS_VERSION } from '@/lib/legal'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('terms_version')
      .eq('id', user.id)
      .single()

    if (!error && profile && profile.terms_version !== TERMS_VERSION) {
      redirect('/accept-terms')
    }
  }

  return (
    <div className="relative min-h-screen max-w-lg mx-auto bg-gray-50 dark:bg-slate-900">
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
