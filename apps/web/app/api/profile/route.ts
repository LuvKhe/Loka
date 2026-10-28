// PATCH /api/profile
// Updates the authenticated user's profile fields.

import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateDisplayName, validateBio, validateAvatarDataUrl } from '@loka/shared/validation'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'profile_update', 30, 60)
    if (limited) return limited

    const body = await request.json()
    const update: Record<string, unknown> = {}

    if ('displayName' in body) {
      const result = validateDisplayName(body.displayName)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
      update.display_name = body.displayName
    }

    if ('avatarUrl' in body) {
      if (body.avatarUrl === null) {
        update.avatar_url = null
      } else {
        const result = validateAvatarDataUrl(body.avatarUrl)
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
        update.avatar_url = body.avatarUrl
      }
    }

    if ('bio' in body) {
      const result = validateBio(body.bio)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
      const clean = typeof body.bio === 'string' ? body.bio.trim() : ''
      update.bio = clean === '' ? null : clean
    }

    if ('statusOverride' in body) {
      const val = body.statusOverride
      if (val !== null && val !== 'free') {
        return NextResponse.json({ error: 'Invalid status override value' }, { status: 400 })
      }
      update.status_override = val
      // When clearing override, also clear the set_at timestamp
      if (val === null) {
        update.status_override_set_at = null
      } else {
        update.status_override_set_at = new Date().toISOString()
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'profile_delete', 3, 3600)
    if (limited) return limited

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    await admin.from('rate_limits').delete().eq('user_id', user.id)
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
