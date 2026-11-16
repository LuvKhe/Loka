
import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'friend_request', 20, 3600)
    if (limited) return limited

    const body = await request.json()
    const toUserId: string = body.toUserId ?? ''

    if (!toUserId || toUserId === user.id) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
    }
    const { data: recipient } = await createAdminClient()
      .from('profiles')
      .select('id')
      .eq('id', toUserId)
      .maybeSingle()

    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const [userA, userB] = [user.id, toUserId].sort()
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_a', userA)
      .eq('user_b', userB)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 })
    }
    const { error: insertError } = await supabase.from('friend_requests').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      status: 'pending',
    })

    if (insertError) {
      console.error('Friend request insert failed:', insertError.message)
      if (insertError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
    }

    const { data: sender } = await createAdminClient()
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    await sendPush(toUserId, 'friend_request', {
      title: 'New friend request',
      body: `${sender?.display_name ?? 'Someone'} wants to be your friend on Loka.`,
      url: '/friends',
      tag: 'loka-friend-request',
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
