// POST /api/location/checkin  — set current campus location
// DELETE /api/location/checkin — leave campus (delete active location row)
//
// Security: raw GPS coordinates are NEVER accepted or stored.
// The client picks from a list of named campus buildings and sends only the
// campus_building_id + a human-readable place_label.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const campusBuildingId: string | null = body.campusBuildingId ?? null
    const placeLabel: string = (body.placeLabel ?? '').trim()

    if (!placeLabel) {
      return NextResponse.json({ error: 'Place label is required' }, { status: 400 })
    }
    if (placeLabel.length > 100) {
      return NextResponse.json({ error: 'Place label too long' }, { status: 400 })
    }

    // If a campusBuildingId is provided, verify it exists and belongs to a real campus building.
    // We do NOT trust the client's place_label when a building ID is given — we read the name
    // from the DB and use that instead.
    let resolvedLabel = placeLabel

    if (campusBuildingId) {
      const { data: building } = await supabase
        .from('campus_buildings')
        .select('id, name, abbreviation')
        .eq('id', campusBuildingId)
        .single()

      if (!building) {
        return NextResponse.json({ error: 'Unknown campus building' }, { status: 400 })
      }

      // Use the canonical building label from the DB, not the client-supplied label.
      // Prefer the abbreviation (the timetable code students recognise, e.g. "G.001")
      // with the full name as a fallback.
      resolvedLabel = building.abbreviation ?? building.name
    }

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
