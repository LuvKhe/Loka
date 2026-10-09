// GET /api/friends/search?lokaId=XXXX-XXXX
// Looks up a profile by Loka ID. Only returns profiles where show_in_search = true.
// Returns whether the found user is already a friend.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Find the profile — must have show_in_search enabled
    const { data: profile, error: profileError } = await supabase
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
    const { data: privacy } = await supabase
      .from('privacy_settings')
      .select('show_in_search')
      .eq('user_id', profile.id)
      .single()

    if (privacy && !privacy.show_in_search) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check if already friends
    const [userA, userB] = [user.id, profile.id].sort()
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_a', userA)
      .eq('user_b', userB)
      .single()

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        lokaId: profile.loka_id,
      },
      alreadyFriends: !!friendship,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
