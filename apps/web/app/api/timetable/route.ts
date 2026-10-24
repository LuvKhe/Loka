import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import {
  validateSubjectCode,
  validateTime,
  validateTimeRange,
  validateDayOfWeek,
} from '@loka/shared/validation'

interface EntryInput {
  subjectCode?: string
  subjectName?: string | null
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  groupName?: string | null
  venue?: string | null
  room?: string | null
  lecturer?: string | null
  notes?: string | null
}

function validateEntry(body: EntryInput): string | null {
  const codeResult = validateSubjectCode(body.subjectCode ?? '')
  if (!codeResult.ok) return codeResult.error

  const dayResult = validateDayOfWeek(body.dayOfWeek as number)
  if (!dayResult.ok) return dayResult.error

  const startResult = validateTime(body.startTime ?? '')
  if (!startResult.ok) return startResult.error

  const endResult = validateTime(body.endTime ?? '')
  if (!endResult.ok) return endResult.error

  const rangeResult = validateTimeRange(body.startTime as string, body.endTime as string)
  if (!rangeResult.ok) return rangeResult.error

  return null
}

function toRow(userId: string, body: EntryInput) {
  return {
    user_id: userId,
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
    is_active: true,
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'timetable_write', 20, 60)
    if (limited) return limited

    const body = await request.json()

    if (Array.isArray(body.entries)) {
      const entries = body.entries as EntryInput[]
      if (entries.length === 0 || entries.length > 200) {
        return NextResponse.json({ error: 'Invalid number of entries' }, { status: 400 })
      }

      for (const entry of entries) {
        const problem = validateEntry(entry)
        if (problem) return NextResponse.json({ error: problem }, { status: 400 })
      }

      let oldIds: string[] = []
      if (body.replace === true) {
        const { data: existing, error: existingError } = await supabase
          .from('timetable_entries')
          .select('id')
          .eq('user_id', user.id)
        if (existingError) {
          return NextResponse.json({ error: 'Failed to read existing entries' }, { status: 500 })
        }
        oldIds = (existing ?? []).map((r) => r.id as string)
      }

      const { error: insertError } = await supabase
        .from('timetable_entries')
        .insert(entries.map((e) => toRow(user.id, e)))

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create entries' }, { status: 500 })
      }

      if (oldIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('timetable_entries')
          .delete()
          .in('id', oldIds)
          .eq('user_id', user.id)
        if (deleteError) {
          return NextResponse.json({ error: 'Added new classes but could not remove old ones' }, { status: 500 })
        }
      }

      return NextResponse.json({ ok: true }, { status: 201 })
    }

    const problem = validateEntry(body)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })

    const { error } = await supabase.from('timetable_entries').insert(toRow(user.id, body))

    if (error) {
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
