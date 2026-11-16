import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimited } from '@/lib/rate-limit'
import { pushConfigured, sendPush } from '@/lib/push'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const limited = await rateLimited(user.id, 'push_test', 5, 600)
    if (limited) return limited

    if (!pushConfigured()) {
      return NextResponse.json({ error: 'Notifications are not set up on the server yet' }, { status: 503 })
    }

    const sent = await sendPush(user.id, 'test', {
      title: 'Loka',
      body: 'Notifications are working.',
      url: '/profile',
      tag: 'loka-test',
    })

    if (sent === 0) {
      return NextResponse.json({ error: 'No device could be reached. Turn notifications off and on again.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('Push test error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
