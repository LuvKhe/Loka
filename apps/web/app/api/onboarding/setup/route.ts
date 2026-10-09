// POST /api/onboarding/setup
// Called immediately after anonymous sign-in. Creates the profile row,
// privacy_settings row, and recovery credential.
//
// Server-side only — the recovery code plaintext and Loka ID generation
// happen here so no secrets need to reach the client.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateDisplayName } from '@loka/shared/validation'
import {
  LOKA_ID_ALPHABET,
  LOKA_ID_SEGMENT_LENGTH,
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from '@loka/shared/constants'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Loka ID generation
// ---------------------------------------------------------------------------
function generateLokaId(): string {
  const chars = LOKA_ID_ALPHABET
  function segment(): string {
    return Array.from({ length: LOKA_ID_SEGMENT_LENGTH }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join('')
  }
  return `${segment()}-${segment()}`
}

// ---------------------------------------------------------------------------
// Recovery code generation
// The plaintext uses a wider charset for higher entropy.
// Only the SHA-256 hash is stored in the DB (bcrypt would be better but
// requires a native module; SHA-256 of a 128-bit random token is sufficient).
// ---------------------------------------------------------------------------
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateRecoveryCode(): string {
  const segments = Array.from({ length: RECOVERY_CODE_SEGMENTS }, () =>
    Array.from(
      { length: RECOVERY_CODE_SEGMENT_LENGTH },
      () => RECOVERY_ALPHABET[Math.floor(Math.random() * RECOVERY_ALPHABET.length)],
    ).join(''),
  )
  return `${RECOVERY_CODE_PREFIX}-${segments.join('-')}`
}

function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const displayName: string = body.displayName ?? ''

    const nameResult = validateDisplayName(displayName.trim())
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if profile already exists (idempotency — don't double-create)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, loka_id')
      .eq('id', user.id)
      .single()

    if (existing) {
      // Profile already set up — just return (no recovery code shown again)
      return NextResponse.json({ lokaId: existing.loka_id })
    }

    // Generate Loka ID — retry up to 5 times if collision
    let lokaId: string | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateLokaId()
      const { data: collision } = await supabase
        .from('profiles')
        .select('id')
        .eq('loka_id', candidate)
        .single()
      if (!collision) {
        lokaId = candidate
        break
      }
    }

    if (!lokaId) {
      return NextResponse.json({ error: 'Could not generate unique Loka ID' }, { status: 500 })
    }

    // Generate recovery code
    const recoveryCode = generateRecoveryCode()
    const recoveryHash = hashRecoveryCode(recoveryCode)

    // Determine university from campus (placeholder — will be user-selected in Phase 4)
    const university = 'My University'

    // Insert profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: displayName.trim(),
      loka_id: lokaId,
      university,
    })

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Insert privacy settings with defaults (all sharing on)
    const { error: privacyError } = await supabase.from('privacy_settings').insert({
      user_id: user.id,
      share_location: true,
      share_current_class: true,
      share_next_class: true,
      show_in_search: true,
    })

    if (privacyError) {
      // Non-fatal — privacy settings have defaults
      console.error('Privacy settings insert failed:', privacyError.message)
    }

    // Store recovery credential hash
    const { error: recoveryError } = await supabase.from('recovery_credentials').insert({
      user_id: user.id,
      code_hash: recoveryHash,
    })

    if (recoveryError) {
      console.error('Recovery credential insert failed:', recoveryError.message)
    }

    // Return the plaintext recovery code — this is the ONLY time it leaves the server.
    // The client will display it once and discard it.
    return NextResponse.json({ lokaId, recoveryCode })
  } catch (err) {
    console.error('Onboarding setup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
