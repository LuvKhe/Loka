// Friends screen
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch friendships with friend profiles
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      id,
      user_a,
      user_b,
      created_at
    `)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  // Fetch pending incoming requests
  const { data: incomingRequests } = await supabase
    .from('friend_requests')
    .select(`
      id,
      from_user_id,
      created_at
    `)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')

  // Fetch profiles for friend IDs
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">Friends</h1>
        <Link href="/friends/add" className="loka-btn-primary py-2 px-3 text-xs">
          Add Friend
        </Link>
      </div>

      {/* Incoming requests */}
      {(incomingRequests ?? []).length > 0 && (
        <section>
          <p className="loka-section-label">Friend Requests</p>
          <div className="space-y-2">
            {incomingRequests!.map((req) => {
              const p = profileMap[req.from_user_id]
              return (
                <div key={req.id} className="loka-card flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {p?.display_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">{p?.loka_id ?? ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={`/api/friends/requests/${req.id}/accept`} method="POST">
                      <button type="submit" className="loka-btn-primary py-1.5 px-3 text-xs">
                        Accept
                      </button>
                    </form>
                    <form action={`/api/friends/requests/${req.id}/decline`} method="POST">
                      <button type="submit" className="loka-btn-secondary py-1.5 px-3 text-xs">
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <p className="loka-section-label">
          {friendIds.length > 0 ? `${friendIds.length} Friend${friendIds.length === 1 ? '' : 's'}` : 'Friends'}
        </p>

        {friendIds.length === 0 ? (
          <div className="loka-card">
            <p className="text-sm text-gray-400">
              No friends yet. Add a friend using their Loka ID or QR code.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friendIds.map((fid) => {
              const p = profileMap[fid]
              return (
                <Link key={fid} href={`/friends/${fid}`} className="loka-card block hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {p?.display_name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {p?.display_name ?? 'Unknown'}
                      </p>
                      {/* Live status loaded client-side in Phase 7 */}
                      <p className="text-xs text-gray-400">Tap to view profile</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
