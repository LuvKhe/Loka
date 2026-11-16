import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'
import { sendPush } from '@/lib/push'

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

    const limited = await rateLimited(user.id, 'friend_accept', 30, 60)
    if (limited) return limited

    const admin = createAdminClient()
    const { data: original } = await admin
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('id', params.id)
      .maybeSingle()

    const { error } = await admin.rpc('accept_friend_request', {
      p_request_id: params.id,
      p_user_id: user.id,
    })

    if (error) {
      console.error('Accept friend request failed:', error.message)
      if (error.message.includes('friend_request_not_found')) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to create friendship' }, { status: 500 })
    }

    if (original && original.to_user_id === user.id) {
      const { data: me } = await admin.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      await sendPush(original.from_user_id, 'friend_accepted', {
        title: 'Friend request accepted',
        body: `${me?.display_name ?? 'Someone'} is now your friend on Loka.`,
        url: '/friends',
        tag: 'loka-friend-accepted',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Accept friend request error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
