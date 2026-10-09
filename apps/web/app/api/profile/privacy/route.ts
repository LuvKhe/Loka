// PATCH /api/profile/privacy
// Updates one or more privacy settings for the authenticated user.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AllowedField = 'share_location' | 'share_current_class' | 'share_next_class' | 'show_in_search'

// Map camelCase client keys to snake_case DB columns
const KEY_MAP: Record<string, AllowedField> = {
  shareLocation: 'share_location',
  shareCurrentClass: 'share_current_class',
  shareNextClass: 'share_next_class',
  showInSearch: 'show_in_search',
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    // Build the update object, only accepting known fields
    const update: Partial<Record<AllowedField, boolean>> = {}
    for (const [key, value] of Object.entries(body)) {
      const dbKey = KEY_MAP[key]
      if (dbKey && typeof value === 'boolean') {
        update[dbKey] = value
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { error } = await supabase
      .from('privacy_settings')
      .update(update)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
