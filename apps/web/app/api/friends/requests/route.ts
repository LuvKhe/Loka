// POST /api/friends/requests
// Sends a friend request to another user.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const toUserId: string = body.toUserId ?? ''

    if (!toUserId || toUserId === user.id) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
    }

    // Verify the recipient exists
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', toUserId)
      .single()

    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check not already friends
    const [userA, userB] = [user.id, toUserId].sort()
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_a', userA)
      .eq('user_b', userB)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 })
    }

    // Insert the friend request
    const { error: insertError } = await supabase.from('friend_requests').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      status: 'pending',
    })

    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
