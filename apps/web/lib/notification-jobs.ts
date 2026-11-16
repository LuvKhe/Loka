import { campusNow } from '@loka/shared/timetable'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import {
  dueReminders,
  reminderText,
  summaryDue,
  summaryText,
  toMinutes,
  type ScheduleEntry,
} from '@/lib/reminder-schedule'

interface SettingsRow {
  user_id: string
  class_reminders: boolean
  class_reminder_minutes: number
  morning_summary: boolean
}

interface EntryRow {
  id: string
  user_id: string
  subject_code: string
  subject_name: string | null
  start_time: string
  venue: string | null
  room: string | null
}

const CHUNK = 150
const MAX_USERS = 2000

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export interface JobResult {
  users: number
  classReminders: number
  summaries: number
}

export async function runScheduledNotifications(base: Date = new Date()): Promise<JobResult> {
  const admin = createAdminClient()
  const local = campusNow(base)
  const dow = local.getDay() === 0 ? 7 : local.getDay()
  const nowMinutes = local.getHours() * 60 + local.getMinutes()
  const dateKey = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`
  const result: JobResult = { users: 0, classReminders: 0, summaries: 0 }

  const { data: settingRows, error } = await admin
    .from('notification_settings')
    .select('user_id, class_reminders, class_reminder_minutes, morning_summary')
    .or('class_reminders.eq.true,morning_summary.eq.true')
    .limit(MAX_USERS)
  if (error || !settingRows || settingRows.length === 0) return result

  const settings = new Map<string, SettingsRow>()
  for (const row of settingRows as SettingsRow[]) settings.set(row.user_id, row)

  const subscribed = new Set<string>()
  for (const group of chunks(Array.from(settings.keys()), CHUNK)) {
    const { data } = await admin.from('push_subscriptions').select('user_id').in('user_id', group)
    for (const row of data ?? []) subscribed.add(row.user_id as string)
  }
  result.users = subscribed.size
  if (subscribed.size === 0) return result

  const byUser = new Map<string, ScheduleEntry[]>()
  for (const group of chunks(Array.from(subscribed), CHUNK)) {
    const { data } = await admin
      .from('timetable_entries')
      .select('id, user_id, subject_code, subject_name, start_time, venue, room')
      .in('user_id', group)
      .eq('day_of_week', dow)
      .eq('is_active', true)
    for (const row of (data ?? []) as EntryRow[]) {
      const list = byUser.get(row.user_id) ?? []
      list.push({
        id: row.id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        startTime: row.start_time,
        venue: row.venue,
        room: row.room,
      })
      byUser.set(row.user_id, list)
    }
  }

  async function claim(userId: string, key: string): Promise<boolean> {
    const { data } = await admin
      .from('notification_log')
      .upsert({ user_id: userId, key }, { onConflict: 'user_id,key', ignoreDuplicates: true })
      .select('key')
    return (data?.length ?? 0) > 0
  }

  for (const userId of Array.from(subscribed)) {
    const entries = byUser.get(userId)
    const prefs = settings.get(userId)
    if (!entries || entries.length === 0 || !prefs) continue

    if (prefs.class_reminders) {
      for (const { entry, minutes } of dueReminders(entries, nowMinutes, prefs.class_reminder_minutes)) {
        if (!(await claim(userId, `class:${entry.id}:${dateKey}`))) continue
        const text = reminderText(entry, minutes)
        const sent = await sendPush(
          userId,
          'class_reminder',
          { ...text, url: '/timetable', tag: `class-${entry.id}` },
          { ttl: Math.max(60, minutes * 60), settingChecked: true },
        )
        if (sent > 0) result.classReminders++
      }
    }

    if (prefs.morning_summary && summaryDue(nowMinutes)) {
      const upcoming = entries.filter((e) => toMinutes(e.startTime) > nowMinutes)
      if (upcoming.length > 0 && (await claim(userId, `summary:${dateKey}`))) {
        const sent = await sendPush(
          userId,
          'morning_summary',
          { ...summaryText(entries), url: '/timetable', tag: 'morning-summary' },
          { ttl: 3 * 3600, settingChecked: true },
        )
        if (sent > 0) result.summaries++
      }
    }
  }

  const cutoff = new Date(base.getTime() - 3 * 24 * 3600 * 1000).toISOString()
  await admin.from('notification_log').delete().lt('sent_at', cutoff)

  return result
}
