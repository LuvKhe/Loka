'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Props {
  requestId: string
}

export default function FriendRequestActions({ requestId }: Props) {
  const router = useRouter()
  const { show } = useToast()
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  async function handle(action: 'accept' | 'decline') {
    const setter = action === 'accept' ? setAccepting : setDeclining
    setter(true)

    try {
      const res = await fetch(`/api/friends/requests/${requestId}/${action}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Failed to ${action}`)
      }
      show(
        action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
        action === 'accept' ? 'success' : 'info',
      )
      router.refresh()
    } catch (err) {
      show(err instanceof Error ? err.message : 'Something went wrong', 'error')
      setter(false)
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        onClick={() => handle('accept')}
        disabled={accepting || declining}
        className="loka-btn-primary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {accepting ? '...' : 'Accept'}
      </button>
      <button
        type="button"
        onClick={() => handle('decline')}
        disabled={accepting || declining}
        className="loka-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {declining ? '...' : 'Decline'}
      </button>
    </div>
  )
}
