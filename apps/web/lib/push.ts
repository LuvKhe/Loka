import * as webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

export type PushType =
  | 'friend_request'
  | 'friend_accepted'
  | 'friend_checkin'
  | 'class_reminder'
  | 'morning_summary'
  | 'test'

export interface PushOptions {
  ttl?: number
  settingChecked?: boolean
}

export interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
}

export const SETTING_RULES: Record<Exclude<PushType, 'test'>, { column: string; fallback: boolean }> = {
  friend_request: { column: 'friend_requests', fallback: true },
  friend_accepted: { column: 'friend_accepted', fallback: true },
  friend_checkin: { column: 'friend_checkins', fallback: false },
  class_reminder: { column: 'class_reminders', fallback: false },
  morning_summary: { column: 'morning_summary', fallback: false },
}

let configured: boolean | null = null

function configure(): boolean {
  if (configured !== null) return configured
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) {
    configured = false
    return false
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function pushConfigured(): boolean {
  return configure()
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('push timeout')), ms)),
  ])
}

export async function sendPush(
  userId: string,
  type: PushType,
  payload: PushPayload,
  options: PushOptions = {},
): Promise<number> {
  try {
    if (!configure()) return 0
    const admin = createAdminClient()

    if (type !== 'test' && !options.settingChecked) {
      const rule = SETTING_RULES[type]
      const { data: settings, error } = await admin
        .from('notification_settings')
        .select(rule.column)
        .eq('user_id', userId)
        .maybeSingle()
      if (error) return 0
      const row = settings as unknown as Record<string, boolean> | null
      if ((row?.[rule.column] ?? rule.fallback) !== true) return 0
    }

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs || subs.length === 0) return 0

    const body = JSON.stringify(payload)
    const results = await Promise.allSettled(
      subs.map((s) =>
        withTimeout(
          webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: options.ttl ?? 3600 }),
          5000,
        ),
      ),
    )

    const dead: string[] = []
    let sent = 0
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        sent++
        return
      }
      const status = (r.reason as { statusCode?: number })?.statusCode
      if (status === 404 || status === 410) dead.push(subs[i]!.id)
    })

    if (dead.length > 0) await admin.from('push_subscriptions').delete().in('id', dead)
    return sent
  } catch (err) {
    console.error('Push send failed:', err instanceof Error ? err.message : err)
    return 0
  }
}
