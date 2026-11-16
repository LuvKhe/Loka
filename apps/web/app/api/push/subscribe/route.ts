import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'

function validEndpoint(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('https://') && value.length <= 1000
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const limited = await rateLimited(user.id, 'push_subscribe', 20, 3600)
    if (limited) return limited

    const body = await request.json().catch(() => null)
    const endpoint = body?.endpoint
    const p256dh = body?.keys?.p256dh
    const auth = body?.keys?.auth

    if (!validEndpoint(endpoint) || typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 200 || auth.length > 100) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('push_subscriptions')
      .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' })

    if (error) {
      console.error('Push subscribe failed:', error.message)
      return NextResponse.json({ error: 'Could not turn on notifications' }, { status: 500 })
    }

    await admin
      .from('notification_settings')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push subscribe error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!validEndpoint(body?.endpoint)) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })

    await createAdminClient()
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', body.endpoint)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push unsubscribe error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
