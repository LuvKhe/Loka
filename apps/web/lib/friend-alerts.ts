import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'

const COOLDOWN_MS = 60 * 60 * 1000
const MAX_RECIPIENTS = 60

export async function notifyFriendsOfCheckin(userId: string, placeLabel: string): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: privacy } = await admin
      .from('privacy_settings')
      .select('location_sharing, friends_can_see_me')
      .eq('user_id', userId)
      .maybeSingle()
    if (privacy && (privacy.location_sharing === false || privacy.friends_can_see_me === false)) return

    const { data: ships } = await admin
      .from('friendships')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .limit(500)
    const friendIds = (ships ?? []).map((f) => (f.user_a === userId ? f.user_b : f.user_a) as string)
    if (friendIds.length === 0) return

    const { data: optedIn } = await admin
      .from('notification_settings')
      .select('user_id')
      .in('user_id', friendIds)
      .eq('friend_checkins', true)
      .limit(MAX_RECIPIENTS)
    const recipients = (optedIn ?? []).map((r) => r.user_id as string)
    if (recipients.length === 0) return

    const key = `checkin:${userId}`
    const since = new Date(Date.now() - COOLDOWN_MS).toISOString()
    const { data: recent } = await admin
      .from('notification_log')
      .select('user_id')
      .in('user_id', recipients)
      .eq('key', key)
      .gt('sent_at', since)
    const cooling = new Set((recent ?? []).map((r) => r.user_id as string))
    const targets = recipients.filter((id) => !cooling.has(id))
    if (targets.length === 0) return

    const { data: profile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
    const name = profile?.display_name ?? 'A friend'

    await admin
      .from('notification_log')
      .upsert(
        targets.map((id) => ({ user_id: id, key, sent_at: new Date().toISOString() })),
        { onConflict: 'user_id,key' },
      )

    await Promise.allSettled(
      targets.map((id) =>
        sendPush(
          id,
          'friend_checkin',
          { title: `${name} is on campus`, body: `Now at ${placeLabel}.`, url: `/friends/${userId}`, tag: `checkin-${userId}` },
          { ttl: 1800, settingChecked: true },
        ),
      ),
    )
  } catch (err) {
    console.error('Friend check-in alert failed:', err instanceof Error ? err.message : err)
  }
}
