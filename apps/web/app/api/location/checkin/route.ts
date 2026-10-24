// POST /api/location/checkin  — set current campus location
// DELETE /api/location/checkin — leave campus (delete active location row)
//
// Security: raw GPS coordinates are NEVER accepted or stored.
// The client picks from a list of named campus buildings and sends only the
// campus_building_id + a human-readable place_label.

import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

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

    if (!campusBuildingId) {
      return NextResponse.json({ error: 'A campus location is required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('campus_id')
      .eq('id', user.id)
      .single()

    if (!profile?.campus_id) {
      return NextResponse.json({ error: 'No campus set for this profile' }, { status: 400 })
    }

    const { data: building } = await supabase
      .from('campus_buildings')
      .select('id, name, abbreviation')
      .eq('id', campusBuildingId)
      .eq('campus_id', profile.campus_id)
      .single()

    if (!building) {
      return NextResponse.json({ error: 'Unknown campus location' }, { status: 400 })
    }

    const resolvedLabel = building.abbreviation ?? building.name

    // Upsert — one row per user, updated in place
    const { error } = await supabase
      .from('active_locations')
      .upsert(
        {
          user_id: user.id,
          campus_building_id: campusBuildingId,
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

export async function DELETE(_request: Request) {
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
