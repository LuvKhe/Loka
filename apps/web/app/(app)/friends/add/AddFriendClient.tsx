'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateLokaId } from '@loka/shared/validation'
import { useToast } from '@/components/ui/Toast'
import Avatar from '@/components/ui/Avatar'

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'found'; profile: { id: string; displayName: string; lokaId: string } }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }
  | { kind: 'sent' }
  | { kind: 'already_friends' }
  | { kind: 'request_pending'; direction: 'outgoing' | 'incoming' }

export default function AddFriendClient() {
  const { show } = useToast()
  const router = useRouter()
  const [lokaId, setLokaId] = useState('')
  const [idError, setIdError] = useState<string | null>(null)
  const [state, setState] = useState<SearchState>({ kind: 'idle' })

  function handleChange(value: string) {
    let formatted = value.toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789-]/g, '')
    if (formatted.length === 4 && !formatted.includes('-')) {
      formatted = formatted + '-'
    }
    if (formatted.length > 9) formatted = formatted.slice(0, 9)
    setLokaId(formatted)
    if (idError) setIdError(null)
    if (state.kind !== 'idle') setState({ kind: 'idle' })
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const result = validateLokaId(lokaId)
    if (!result.ok) {
      setIdError(result.error)
      return
    }

    setState({ kind: 'searching' })
    try {
      const res = await fetch(`/api/friends/search?lokaId=${encodeURIComponent(lokaId)}`)
      if (res.status === 404) {
        setState({ kind: 'not_found' })
        return
      }
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (data.alreadyFriends) {
        setState({ kind: 'already_friends' })
      } else if (data.pendingRequest) {
        setState({ kind: 'request_pending', direction: data.pendingRequest.direction })
      } else {
        setState({ kind: 'found', profile: data.profile })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      show(message, 'error')
      setState({ kind: 'error', message })
    }
  }

  async function handleSendRequest() {
    if (state.kind !== 'found') return
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: state.profile.id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to send request')
      }
      show('Friend request sent', 'success')
      setState({ kind: 'sent' })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }

  const message = (text: string, tone: 'neutral' | 'error' = 'neutral') => (
    <div role={tone === 'error' ? 'alert' : undefined} className="loka-card">
      <p className={['text-sm', tone === 'error' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'].join(' ')}>
        {text}
      </p>
    </div>
  )

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-sm font-medium text-gray-700 dark:text-gray-200 min-h-[2.75rem] px-1 -ml-1">
          Back
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Add friend</h1>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400" style={{ textWrap: 'balance' }}>
        Type your friend&apos;s Loka ID. It looks like <span className="font-mono">ABCD-1234</span>.
      </p>

      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <label htmlFor="friend-id" className="sr-only">Friend Loka ID</label>
          <input
            id="friend-id"
            type="text"
            value={lokaId}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="XXXX-XXXX"
            className={['loka-input w-full min-h-[3.5rem] font-mono text-center text-2xl tracking-widest', idError ? 'border-red-500' : ''].join(' ')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            aria-invalid={idError ? true : undefined}
            aria-describedby={idError ? 'friend-id-error' : undefined}
          />
          {idError && <p id="friend-id-error" role="alert" className="text-sm text-red-700 dark:text-red-400 mt-1.5">{idError}</p>}
        </div>
        <button
          type="submit"
          disabled={state.kind === 'searching' || lokaId.length < 9}
          className="loka-btn-primary w-full min-h-[3rem] text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state.kind === 'searching' ? 'Searching...' : 'Find friend'}
        </button>
      </form>

      {state.kind === 'found' && (
        <div className="loka-card space-y-4">
          <div className="flex items-center gap-3">
            <Avatar url={null} name={state.profile.displayName} size={56} />
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{state.profile.displayName}</p>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{state.profile.lokaId}</p>
            </div>
          </div>
          <button onClick={handleSendRequest} className="loka-btn-primary w-full min-h-[3rem] text-base">
            Send friend request
          </button>
        </div>
      )}

      {state.kind === 'not_found' && message('No one found with that Loka ID. Check it and try again.')}
      {state.kind === 'already_friends' && message('You are already friends with this person.')}
      {state.kind === 'request_pending' &&
        message(
          state.direction === 'outgoing'
            ? 'You already sent this person a friend request.'
            : 'This person has sent you a friend request. Open Friends to accept it.',
        )}

      {state.kind === 'sent' && (
        <div className="loka-card text-center py-8">
          <svg viewBox="0 0 64 64" className="w-16 h-16 mx-auto mb-3" aria-hidden="true">
            <circle cx="32" cy="32" r="30" className="fill-emerald-100 dark:fill-emerald-900/40" />
            <path d="M18 33 l9 9 l19 -20" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="stroke-emerald-700 dark:stroke-emerald-400 loka-draw" />
          </svg>
          <p className="font-bold text-gray-900 dark:text-gray-100">Request sent</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">They will see it when they open Loka.</p>
        </div>
      )}

      {state.kind === 'error' && message(state.message, 'error')}
    </div>
  )
}
