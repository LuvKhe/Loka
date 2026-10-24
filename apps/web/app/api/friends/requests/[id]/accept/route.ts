import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'

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

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Accept friend request error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
