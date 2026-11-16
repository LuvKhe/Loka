
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateDisplayName } from '@loka/shared/validation'
import {
  LOKA_ID_ALPHABET,
  LOKA_ID_SEGMENT_LENGTH,
} from '@loka/shared/constants'
import { randomInt } from 'crypto'
import { generateRecoveryCode, hashRecoveryCode } from '@/lib/recovery'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimited } from '@/lib/rate-limit'
import { TERMS_VERSION } from '@/lib/legal'
function generateLokaId(): string {
  const chars = LOKA_ID_ALPHABET
  function segment(): string {
    return Array.from({ length: LOKA_ID_SEGMENT_LENGTH }, () =>
      chars[randomInt(chars.length)],
    ).join('')
  }
  return `${segment()}-${segment()}`
}
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
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, loka_id')
      .eq('id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ lokaId: existing.loka_id })
    }
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
    const recoveryCode = generateRecoveryCode()
    const recoveryHash = hashRecoveryCode(recoveryCode)
    const DEFAULT_CAMPUS_ID = 'a0000000-0000-0000-0000-000000000001'
    const university = 'University of Eswatini'
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
    const { error: privacyError } = await supabase.from('privacy_settings').insert({
      user_id: user.id,
      share_location: true,
      share_current_class: true,
      share_next_class: true,
      show_in_search: true,
    })

    if (privacyError) {
      console.error('Privacy settings insert failed:', privacyError.message)
    }

    const { error: recoveryError } = await admin.from('recovery_credentials').upsert(
      { user_id: user.id, recovery_hash: recoveryHash },
      { onConflict: 'user_id' },
    )

    if (recoveryError) {
      console.error('Recovery credential insert failed:', recoveryError.message)
      return NextResponse.json({ lokaId, recoveryCode: null })
    }

    return NextResponse.json({ lokaId, recoveryCode })
  } catch (err) {
    console.error('Onboarding setup error:', JSON.stringify(err), err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
