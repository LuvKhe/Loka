import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimited } from '@/lib/rate-limit'
import { TERMS_VERSION } from '@/lib/legal'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'terms_accept', 10, 60)
    if (limited) return limited

    const body = await request.json().catch(() => ({}))
    if (body.accepted !== true) {
      return NextResponse.json({ error: 'Acceptance is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to record acceptance' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
