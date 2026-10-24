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
import { createHash, randomInt } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'
import { TERMS_VERSION } from '@/lib/legal'

// ---------------------------------------------------------------------------
// Loka ID generation
// ---------------------------------------------------------------------------
function generateLokaId(): string {
  const chars = LOKA_ID_ALPHABET
  function segment(): string {
    return Array.from({ length: LOKA_ID_SEGMENT_LENGTH }, () =>
      chars[randomInt(chars.length)],
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
      () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)],
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
    const displayName: string = typeof body.displayName === 'string' ? body.displayName : ''

    if (body.acceptedTerms !== true) {
      return NextResponse.json(
        { error: 'You must accept the Terms and Privacy Policy to continue' },
        { status: 400 },
      )
    }

    const nameResult = validateDisplayName(displayName.trim())
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limited = await rateLimited(user.id, 'onboarding_setup', 5, 3600)
    if (limited) return limited

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
    const admin = createAdminClient()
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateLokaId()
      const { data: collision } = await admin
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

    // Default campus — all users start on the main campus.
    // Will become user-selectable in a future update.
    const DEFAULT_CAMPUS_ID = 'a0000000-0000-0000-0000-000000000001'
    const university = 'University of Eswatini'

    // Insert profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: displayName.trim(),
      loka_id: lokaId,
      university,
      campus_id: DEFAULT_CAMPUS_ID,
    })

    if (profileError) {
      console.error('Profile insert error:', JSON.stringify(profileError))
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    const { error: termsError } = await supabase
      .from('profiles')
      .update({ terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() })
      .eq('id', user.id)

    if (termsError) {
      console.error('Terms acceptance not recorded:', termsError.message)
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
    console.error('Onboarding setup error:', JSON.stringify(err), err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
