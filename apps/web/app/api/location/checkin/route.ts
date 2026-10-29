// POST /api/location/checkin  — set current campus location
// DELETE /api/location/checkin — leave campus (delete active location row)
//
// Security: raw GPS coordinates are NEVER accepted or stored.
// The client picks from a list of named campus buildings and sends only the
// campus_building_id (or a short custom text label) + a human-readable place_label.

import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { validateCustomPlace } from '@loka/shared/validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'checkin', 60, 60)
    if (limited) return limited

    const body = await request.json()
    const campusBuildingId: string = typeof body.campusBuildingId === 'string' ? body.campusBuildingId : ''
    const customLabel: string = typeof body.customLabel === 'string' ? body.customLabel.trim() : ''

    if (!campusBuildingId && !customLabel) {
      return NextResponse.json({ error: 'A location is required' }, { status: 400 })
    }

    if (!campusBuildingId) {
      const check = validateCustomPlace(customLabel)
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('campus_id')
      .eq('id', user.id)
      .single()

    if (!profile?.campus_id) {
      return NextResponse.json({ error: 'No campus set for this profile' }, { status: 400 })
    }

    let resolvedBuildingId: string | null = null
    let resolvedLabel = ''

    if (campusBuildingId) {
      const { data: building } = await supabase
        .from('campus_buildings')
        .select('id, name, abbreviation')
        .eq('id', campusBuildingId)
        .eq('campus_id', profile.campus_id)
        .single()

      if (!building) {
        return NextResponse.json({ error: 'Unknown campus location' }, { status: 400 })
      }
      resolvedBuildingId = building.id
      resolvedLabel = building.abbreviation ?? building.name
    } else {
      const { data: buildings } = await supabase
        .from('campus_buildings')
        .select('id, name, abbreviation')
        .eq('campus_id', profile.campus_id)

      const needle = customLabel.toLowerCase()
      const match = (buildings ?? []).find(
        (b) => b.name.toLowerCase() === needle || (b.abbreviation ?? '').toLowerCase() === needle,
      )
      if (match) {
        resolvedBuildingId = match.id
        resolvedLabel = match.abbreviation ?? match.name
      } else {
        resolvedLabel = customLabel
      }
    }

    // Upsert — one row per user, updated in place
    const { error } = await supabase
      .from('active_locations')
      .upsert(
        {
          user_id: user.id,
          campus_building_id: resolvedBuildingId,
          place_label: resolvedLabel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    if (error) {
      console.error('Location upsert error:', error)
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, placeLabel: resolvedLabel })
  } catch (err) {
    console.error('Checkin error:', err)
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

    await supabase
      .from('active_locations')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Check-out error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
