import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { pushConfigured } from '@/lib/push'
import { runScheduledNotifications } from '@/lib/notification-jobs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const header = request.headers.get('authorization') ?? ''
  const given = Buffer.from(header)
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  try {
    const result = await runScheduledNotifications()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('Scheduled notifications failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Job failed' }, { status: 500 })
  }
}
