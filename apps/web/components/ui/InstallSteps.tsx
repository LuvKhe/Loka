'use client'

import type { Platform } from '@/lib/install'

export default function InstallSteps({ platform }: { platform: Platform }) {
  if (platform === 'ios') {
    return (
      <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-slate-300">
        <li>Open this page in Safari.</li>
        <li>Tap the Share button at the bottom of the screen.</li>
        <li>Choose Add to Home Screen, then tap Add.</li>
        <li>Open Loka from the new icon on your home screen.</li>
      </ol>
    )
  }
  if (platform === 'android') {
    return (
      <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-slate-300">
        <li>Open this page in Chrome.</li>
        <li>Tap the three dots at the top right.</li>
        <li>Choose Install app or Add to Home screen.</li>
        <li>Open Loka from the new icon on your home screen.</li>
      </ol>
    )
  }
  return (
    <p className="text-xs text-gray-600 dark:text-slate-300">
      Open Loka on your phone, then use your browser menu to add it to your home screen.
    </p>
  )
}
