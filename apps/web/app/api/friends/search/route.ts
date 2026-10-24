// GET /api/friends/search?lokaId=XXXX-XXXX
// Looks up a profile by Loka ID. Only returns profiles where show_in_search = true.
// Returns whether the found user is already a friend.

import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateLokaId } from '@loka/shared/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lokaId = searchParams.get('lokaId') ?? ''

    const validation = validateLokaId(lokaId)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'friend_search', 30, 60)
    if (limited) return limited

    // Use admin client to read privacy_settings of another user.
    // RLS on privacy_settings only allows users to read their own row, so we
    // use the service role to check show_in_search without exposing other fields.
    const admin = createAdminClient()

    // Find the profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, display_name, loka_id')
      .eq('loka_id', lokaId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Cannot add yourself
    if (profile.id === user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check show_in_search privacy setting
    const { data: privacy } = await admin
      .from('privacy_settings')
      .select('show_in_search')
      .eq('user_id', profile.id)
      .single()

    if (privacy && !privacy.show_in_search) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check if already friends (using user's auth client — RLS allows reading own friendships)
    const [userA, userB] = [user.id, profile.id].sort()
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_a', userA)
      .eq('user_b', userB)
      .single()

    // Check if a pending request already exists in either direction
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, status')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${profile.id}),and(from_user_id.eq.${profile.id},to_user_id.eq.${user.id})`)
      .eq('status', 'pending')
      .maybeSingle()

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        lokaId: profile.loka_id,
      },
      alreadyFriends: !!friendship,
      pendingRequest: existingRequest
        ? {
            id: existingRequest.id,
            direction: existingRequest.from_user_id === user.id ? 'outgoing' : 'incoming',
          }
        : null,
    })
  } catch (err) {
    console.error('Friend search error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
