import { createHash, randomInt, timingSafeEqual } from 'crypto'
import {
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from '@loka/shared/constants'

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRecoveryCode(): string {
  const segments = Array.from({ length: RECOVERY_CODE_SEGMENTS }, () =>
    Array.from(
      { length: RECOVERY_CODE_SEGMENT_LENGTH },
      () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)],
    ).join(''),
  )
  return `${RECOVERY_CODE_PREFIX}-${segments.join('-')}`
}

export function normalizeRecoveryCode(input: string): string {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!compact.startsWith(RECOVERY_CODE_PREFIX)) return input.trim().toUpperCase()
  const body = compact.slice(RECOVERY_CODE_PREFIX.length)
  const parts = body.match(new RegExp(`.{1,${RECOVERY_CODE_SEGMENT_LENGTH}}`, 'g')) ?? []
  return [RECOVERY_CODE_PREFIX, ...parts].join('-')
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function hashesMatch(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex')
  const y = Buffer.from(b, 'hex')
  if (x.length !== y.length || x.length === 0) return false
  return timingSafeEqual(x, y)
}
