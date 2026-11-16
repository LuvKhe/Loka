import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data } = await createAdminClient()
      .from('notification_settings')
      .select('friend_requests, friend_accepted, class_reminders, class_reminder_minutes, friend_checkins, morning_summary')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      friendRequests: data?.friend_requests ?? true,
      friendAccepted: data?.friend_accepted ?? true,
      classReminders: data?.class_reminders ?? false,
      classReminderMinutes: data?.class_reminder_minutes ?? 10,
      friendCheckins: data?.friend_checkins ?? false,
      morningSummary: data?.morning_summary ?? false,
    })
  } catch (err) {
    console.error('Push settings read error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const limited = await rateLimited(user.id, 'push_settings', 60, 3600)
    if (limited) return limited

    const body = await request.json().catch(() => null)
    const update: Record<string, boolean | number | string> = { user_id: user.id, updated_at: new Date().toISOString() }
    if (typeof body?.friendRequests === 'boolean') update.friend_requests = body.friendRequests
    if (typeof body?.friendAccepted === 'boolean') update.friend_accepted = body.friendAccepted
    if (typeof body?.classReminders === 'boolean') update.class_reminders = body.classReminders
    if (typeof body?.friendCheckins === 'boolean') update.friend_checkins = body.friendCheckins
    if (typeof body?.morningSummary === 'boolean') update.morning_summary = body.morningSummary
    if (typeof body?.classReminderMinutes === 'number') {
      if (![5, 10, 15, 30].includes(body.classReminderMinutes)) {
        return NextResponse.json({ error: 'Invalid reminder time' }, { status: 400 })
      }
      update.class_reminder_minutes = body.classReminderMinutes
    }

    const { error } = await createAdminClient()
      .from('notification_settings')
      .upsert(update, { onConflict: 'user_id' })

    if (error) {
      console.error('Push settings write failed:', error.message)
      return NextResponse.json({ error: 'Could not save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push settings write error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
