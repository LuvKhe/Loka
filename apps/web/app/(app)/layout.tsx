import { redirect } from 'next/navigation'
import BottomNav from '@/components/nav/BottomNav'
import { createClient } from '@/lib/supabase/server'
import { TERMS_VERSION } from '@/lib/legal'
import { ToastProvider } from '@/components/ui/Toast'
import FriendNotifier from '@/components/friends/FriendNotifier'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('terms_version')
      .eq('id', user.id)
      .maybeSingle()

    if (!error && !profile) {
      redirect('/onboarding')
    }

    if (!error && profile && profile.terms_version !== TERMS_VERSION) {
      redirect('/accept-terms')
    }
  }

  return (
    <ToastProvider>
    <FriendNotifier />
    <div className="relative max-w-lg mx-auto bg-gray-50 dark:bg-slate-900" style={{ minHeight: '100dvh' }}>
      <main className="min-h-screen" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
      <BottomNav />
    </div>
    </ToastProvider>
  )
}
