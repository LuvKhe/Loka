import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'
import { generateRecoveryCode, hashRecoveryCode } from '@/lib/recovery'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'recovery_regenerate', 5, 3600)
    if (limited) return limited

    const code = generateRecoveryCode()
    const admin = createAdminClient()
    const { error } = await admin.from('recovery_credentials').upsert(
      { user_id: user.id, recovery_hash: hashRecoveryCode(code), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('Recovery regenerate failed:', error.message)
      return NextResponse.json({ error: 'Could not create a recovery code right now' }, { status: 500 })
    }

    return NextResponse.json({ recoveryCode: code })
  } catch (err) {
    console.error('Recovery regenerate error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
