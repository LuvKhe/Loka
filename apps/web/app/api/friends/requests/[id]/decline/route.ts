// POST /api/friends/requests/[id]/decline
// Declines a pending friend request.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const requestId = params.id

    // Verify this request is to the current user and is pending
    const { data: req, error: fetchError } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('id', requestId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/friends', request.url))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
