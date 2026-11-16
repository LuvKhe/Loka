import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import FriendRequestActions from './_components/FriendRequestActions'
import MyLokaId from './_components/MyLokaId'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, created_at')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  const { data: me } = await supabase.from('profiles').select('loka_id').eq('id', user.id).maybeSingle()

  const { data: incomingRequests } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, created_at')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')

  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a,
  )
  const requesterIds = (incomingRequests ?? []).map((r) => r.from_user_id)
  const allIds = Array.from(new Set([...friendIds, ...requesterIds]))

  const { data: profiles } = allIds.length > 0
    ? await supabase.from('profiles').select('id, display_name, loka_id, avatar_url').in('id', allIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-3 pt-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Friends</h1>
        <Link href="/friends/add" className="loka-btn-primary py-2.5 px-4 text-sm min-h-[2.75rem] inline-flex items-center">
          Add friend
        </Link>
      </div>

      {me?.loka_id && <MyLokaId lokaId={me.loka_id} />}

      {(incomingRequests ?? []).length > 0 && (
        <section aria-label="Friend requests">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="loka-section-label mb-0">Requests</h2>
            <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-blue-700 text-white tabular-nums">
              {incomingRequests!.length}
            </span>
          </div>
          <div className="loka-list">
            {incomingRequests!.map((req) => {
              const p = profileMap[req.from_user_id]
              return (
                <div key={req.id} className="loka-card space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar url={p?.avatar_url} name={p?.display_name} size={44} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {p?.display_name ?? 'Unknown'}
                      </p>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{p?.loka_id ?? ''}</p>
                    </div>
                  </div>
                  <FriendRequestActions requestId={req.id} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section aria-label="Your friends">
        <h2 className="loka-section-label">
          {friendIds.length > 0 ? `${friendIds.length} friend${friendIds.length === 1 ? '' : 's'}` : 'Friends'}
        </h2>

        {friendIds.length === 0 ? (
          <div className="loka-card text-center py-8">
            <p className="font-bold text-gray-900 dark:text-gray-100">No friends yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" style={{ textWrap: 'balance' }}>
              Send your Loka ID to a friend, or add theirs, and you will see when they are free.
            </p>
          </div>
        ) : (
          <div className="loka-list">
            {friendIds.map((fid) => {
              const p = profileMap[fid]
              return (
                <Link
                  key={fid}
                  href={`/friends/${fid}`}
                  className="loka-card flex items-center gap-3 min-h-[4.5rem] transition-transform duration-150 active:scale-[0.98]"
                >
                  <Avatar url={p?.avatar_url} name={p?.display_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {p?.display_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">View timetable</p>
                  </div>
                  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true">
                    <path d="M6 3 l5 5 l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
