// Authenticated app shell — wraps all main screens with bottom navigation
import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen max-w-lg mx-auto bg-gray-50">
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
