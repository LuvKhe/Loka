// PATCH /api/timetable/[id] — update a timetable entry
// DELETE /api/timetable/[id] — delete (deactivate) a timetable entry

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validateSubjectCode,
  validateTime,
  validateTimeRange,
  validateDayOfWeek,
} from '@loka/shared/validation'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const codeResult = validateSubjectCode(body.subjectCode ?? '')
    if (!codeResult.ok) return NextResponse.json({ error: codeResult.error }, { status: 400 })

    const dayResult = validateDayOfWeek(body.dayOfWeek)
    if (!dayResult.ok) return NextResponse.json({ error: dayResult.error }, { status: 400 })

    const startResult = validateTime(body.startTime ?? '')
    if (!startResult.ok) return NextResponse.json({ error: startResult.error }, { status: 400 })

    const endResult = validateTime(body.endTime ?? '')
    if (!endResult.ok) return NextResponse.json({ error: endResult.error }, { status: 400 })

    const rangeResult = validateTimeRange(body.startTime, body.endTime)
    if (!rangeResult.ok) return NextResponse.json({ error: rangeResult.error }, { status: 400 })

    const { error } = await supabase
      .from('timetable_entries')
      .update({
        subject_code: body.subjectCode,
        subject_name: body.subjectName ?? null,
        day_of_week: body.dayOfWeek,
        start_time: body.startTime,
        end_time: body.endTime,
        group_name: body.groupName ?? null,
        venue: body.venue ?? null,
        room: body.room ?? null,
        lecturer: body.lecturer ?? null,
        notes: body.notes ?? null,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)  // RLS also enforces this, but explicit is safer

    if (error) {
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Hard delete — the user explicitly chose to remove this class
    const { error } = await supabase
      .from('timetable_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
