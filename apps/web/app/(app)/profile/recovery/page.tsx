// Profile recovery code page — user can view their recovery code
// They must enter a portion of it to prove they have it before we show it,
// but in Phase 1 we just show a UI stub indicating this is where it lives.
// Full verification flow is Phase 8 (security).
import Link from 'next/link'

export default function ProfileRecoveryPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/profile" className="text-sm text-gray-400 p-1 -ml-1">
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Recovery Code</h1>
      </div>

      <div className="loka-card space-y-3">
        <p className="text-sm font-medium text-gray-900">Your recovery code is stored securely</p>
        <p className="text-xs text-gray-500">
          Your recovery code was shown when you first set up Loka. It is stored as a one-way hash
          on our servers — we cannot show it to you again.
        </p>
        <p className="text-xs text-gray-500">
          If you have lost your code, you will need to create a new profile if you lose access to
          this device.
        </p>
        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          Recovery code verification is coming in a future update.
        </p>
      </div>
    </div>
  )
}
