import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function rateLimited(
  userId: string,
  action: string,
  maxHits: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('hit_rate_limit', {
      p_user_id: userId,
      p_action: action,
      p_max_hits: maxHits,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.error('Rate limit check failed:', error.message)
      return null
    }

    if (data === false) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(windowSeconds) } },
      )
    }

    return null
  } catch (err) {
    console.error('Rate limit unavailable:', err instanceof Error ? err.message : err)
    return null
  }
}

export function keyToUuid(key: string): string {
  const h = createHash('sha256').update(key).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export async function rateLimitedByKey(
  key: string,
  action: string,
  maxHits: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  return rateLimited(keyToUuid(key), action, maxHits, windowSeconds)
}
