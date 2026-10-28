import Link from 'next/link'
import { SUPPORT_EMAIL, TERMS_VERSION } from '@/lib/legal'

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-600 dark:text-slate-300">{children}</div>
    </section>
  )
}

export default function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-lg px-5 py-8 space-y-6">
        <div>
          <Link href="/onboarding" className="text-sm text-gray-500 dark:text-slate-400">
            Back
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-slate-100">{title}</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Version {TERMS_VERSION}</p>
        </div>
        {children}
        {SUPPORT_EMAIL && (
          <LegalSection title="Contact">
            <p>
              Questions about this document can be sent to{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 dark:text-blue-400 underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </LegalSection>
        )}
        <div className="flex gap-4 border-t border-gray-100 dark:border-slate-800 pt-4 text-xs text-gray-500 dark:text-slate-400">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </div>
  )
}
