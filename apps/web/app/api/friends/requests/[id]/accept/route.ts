// POST /api/friends/requests/[id]/accept
// Accepts a pending friend request and creates a friendship.
// The canonicalized friendship row (user_a < user_b) is inserted by the DB
// trigger or manually here, and the request status is updated to 'accepted'.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const requestId = params.id

    // Fetch the request — must be to_user_id = current user and status = pending
    const { data: req, error: fetchError } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, status')
      .eq('id', requestId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Update request to 'accepted'
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 })
    }

    // Create friendship with canonical ordering (user_a < user_b)
    const [userA, userB] = [req.from_user_id, req.to_user_id].sort()
    const { error: friendshipError } = await supabase.from('friendships').insert({
      user_a: userA,
      user_b: userB,
    })

    if (friendshipError) {
      // Friendship may already exist (idempotent)
      if (!friendshipError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Failed to create friendship' }, { status: 500 })
      }
    }

    return NextResponse.redirect(new URL('/friends', _request.url))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
