// GET /api/location/buildings
// Returns the list of campus buildings for the authenticated user's campus.
// Used to populate the check-in location picker.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the user's campus_id from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('campus_id')
      .eq('id', user.id)
      .single()

    if (!profile?.campus_id) {
      return NextResponse.json({ buildings: [] })
    }

    const { data: buildings, error } = await supabase
      .from('campus_buildings')
      .select('id, name, abbreviation')
      .eq('campus_id', profile.campus_id)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load buildings' }, { status: 500 })
    }

    return NextResponse.json({
      buildings: (buildings ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        abbreviation: b.abbreviation ?? null,
        label: b.abbreviation ? `${b.name} (${b.abbreviation})` : b.name,
      })),
    })
  } catch (err) {
    console.error('Buildings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
