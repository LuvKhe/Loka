import Link from 'next/link'
import RecoveryManager from './RecoveryManager'

export const metadata = { title: 'Recovery code | Loka' }

export default function ProfileRecoveryPage() {
  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/profile" className="text-sm font-medium text-gray-700 dark:text-gray-200 min-h-[2.75rem] inline-flex items-center px-1 -ml-1">
          Back
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Recovery code</h1>
      </div>
      <RecoveryManager />
    </div>
  )
}
