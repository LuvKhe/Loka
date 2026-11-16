'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function MyLokaId({ lokaId }: { lokaId: string }) {
  const { show } = useToast()
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(lokaId)
      show('Loka ID copied', 'success')
    } catch {
      show('Could not copy. Select the ID and copy it.', 'error')
    }
  }

  async function share() {
    try {
      await navigator.share({ text: `Add me on Loka. My Loka ID is ${lokaId}`, url: window.location.origin })
    } catch {}
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-violet-900 text-white p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider">Your Loka ID</p>
      <p className="text-3xl font-extrabold font-mono tracking-widest mt-1 select-all">{lokaId}</p>
      <p className="text-sm mt-1">Share it so friends can find you.</p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={copy}
          className="min-h-[2.75rem] px-4 rounded-full text-sm font-semibold bg-black/30 active:scale-95 transition-transform duration-150"
        >
          Copy
        </button>
        {canShare && (
          <button
            onClick={share}
            className="min-h-[2.75rem] px-4 rounded-full text-sm font-semibold bg-black/30 active:scale-95 transition-transform duration-150"
          >
            Share
          </button>
        )}
      </div>
    </div>
  )
}
