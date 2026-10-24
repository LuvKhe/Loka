'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={filled ? 2.25 : 1.75} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const UsersIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={filled ? 2.25 : 1.75} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const CalendarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={filled ? 2.25 : 1.75} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const UserCircleIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={filled ? 2.25 : 1.75} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function BottomNav() {
  const pathname = usePathname()

  const items: NavItem[] = [
    {
      href: '/home',
      label: 'Home',
      icon: <HomeIcon filled={false} />,
      activeIcon: <HomeIcon filled={true} />,
    },
    {
      href: '/friends',
      label: 'Friends',
      icon: <UsersIcon filled={false} />,
      activeIcon: <UsersIcon filled={true} />,
    },
    {
      href: '/timetable',
      label: 'Timetable',
      icon: <CalendarIcon filled={false} />,
      activeIcon: <CalendarIcon filled={true} />,
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: <UserCircleIcon filled={false} />,
      activeIcon: <UserCircleIcon filled={true} />,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800
                    max-w-lg mx-auto">
      <div className="flex">
        {items.map((item) => {
          const isActive = item.href === '/home'
            ? pathname === '/home'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1
                          text-xs font-medium transition-colors duration-150
                          ${isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-10 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
              {isActive ? item.activeIcon : item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-safe-area-inset-bottom bg-white dark:bg-slate-900" />
    </nav>
  )
}
