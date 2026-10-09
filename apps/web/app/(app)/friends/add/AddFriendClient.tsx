'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateLokaId } from '@loka/shared/validation'

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'found'; profile: { id: string; displayName: string; lokaId: string } }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }
  | { kind: 'sent' }
  | { kind: 'already_friends' }

export default function AddFriendClient() {
  const router = useRouter()
  const [lokaId, setLokaId] = useState('')
  const [idError, setIdError] = useState<string | null>(null)
  const [state, setState] = useState<SearchState>({ kind: 'idle' })

  function handleChange(value: string) {
    // Auto-insert hyphen after 4 characters
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
      } else {
        setState({ kind: 'found', profile: data.profile })
      }
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
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
      if (!res.ok) throw new Error('Failed to send request')
      setState({ kind: 'sent' })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-sm text-gray-400 p-1 -ml-1">
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Add Friend</h1>
      </div>

      <p className="text-sm text-gray-500">
        Enter a Loka ID to find and add a friend. IDs look like <span className="font-mono">ABCD-1234</span>.
      </p>

      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <input
            type="text"
            value={lokaId}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="XXXX-XXXX"
            className={['loka-input w-full font-mono text-center text-lg tracking-widest', idError ? 'border-red-400' : ''].join(' ')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
        </div>
        <button
          type="submit"
          disabled={state.kind === 'searching' || lokaId.length < 9}
          className="loka-btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state.kind === 'searching' ? 'Searching...' : 'Search'}
        </button>
      </form>

      {state.kind === 'found' && (
        <div className="loka-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold text-lg">
                {state.profile.displayName[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{state.profile.displayName}</p>
              <p className="text-xs font-mono text-gray-400">{state.profile.lokaId}</p>
            </div>
          </div>
          <button
            onClick={handleSendRequest}
            className="loka-btn-primary w-full py-2.5 text-sm"
          >
            Send friend request
          </button>
        </div>
      )}

      {state.kind === 'not_found' && (
        <div className="loka-card">
          <p className="text-sm text-gray-500">No user found with that Loka ID.</p>
        </div>
      )}

      {state.kind === 'already_friends' && (
        <div className="loka-card">
          <p className="text-sm text-gray-500">You are already friends with this person.</p>
        </div>
      )}

      {state.kind === 'sent' && (
        <div className="loka-card">
          <p className="text-sm text-gray-900 font-medium">Friend request sent</p>
          <p className="text-xs text-gray-400 mt-0.5">They will see it when they open the app.</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="loka-card border-red-100 bg-red-50">
          <p className="text-sm text-red-600">{state.message}</p>
        </div>
      )}
    </div>
  )
}
