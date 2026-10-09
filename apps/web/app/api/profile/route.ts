// PATCH /api/profile
// Updates the authenticated user's profile fields.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateDisplayName } from '@loka/shared/validation'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const update: Record<string, unknown> = {}

    if ('displayName' in body) {
      const result = validateDisplayName(body.displayName)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
      update.display_name = body.displayName
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
