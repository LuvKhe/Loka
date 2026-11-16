import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitedByKey } from '@/lib/rate-limit'
import { hashRecoveryCode, hashesMatch, normalizeRecoveryCode } from '@/lib/recovery'
import { validateLokaId } from '@loka/shared/validation'
import { RECOVERY_CODE_REGEX } from '@loka/shared/constants'

const NO_MATCH = 'That Loka ID and recovery code do not match.'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const lokaId = typeof body?.lokaId === 'string' ? body.lokaId.trim().toUpperCase() : ''
    const code = typeof body?.recoveryCode === 'string' ? normalizeRecoveryCode(body.recoveryCode) : ''

    if (!validateLokaId(lokaId).ok || !RECOVERY_CODE_REGEX.test(code)) {
      return NextResponse.json(
        { error: 'Check the format. A Loka ID looks like ABCD-1234 and a recovery code like LOKA-ABCD-EFGH-JKLM-NPQR.' },
        { status: 400 },
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const ipLimited = await rateLimitedByKey(`restore-ip:${ip}`, 'restore_ip', 10, 900)
    if (ipLimited) return ipLimited
    const idLimited = await rateLimitedByKey(`restore-id:${lokaId}`, 'restore_id', 5, 3600)
    if (idLimited) return idLimited

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('loka_id', lokaId)
      .maybeSingle()

    const { data: credential } = profile
      ? await admin
          .from('recovery_credentials')
          .select('recovery_hash')
          .eq('user_id', profile.id)
          .maybeSingle()
      : { data: null }

    const stored = credential?.recovery_hash ?? ''
    const matches = hashesMatch(hashRecoveryCode(code), stored)

    if (!profile || !matches) {
      return NextResponse.json({ error: NO_MATCH }, { status: 401 })
    }

    const email = `${profile.id}@restore.loka.invalid`
    const password = randomBytes(32).toString('hex')

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      email,
      password,
      email_confirm: true,
    })

    if (updateError) {
      console.error('Restore: could not prepare session:', updateError.message)
      return NextResponse.json({ error: 'Could not restore right now. Please try again later.' }, { status: 500 })
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      console.error('Restore: sign-in failed:', signInError.message)
      return NextResponse.json({ error: 'Could not restore right now. Please try again later.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Restore error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
