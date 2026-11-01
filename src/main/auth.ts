import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SCRYPT_KEYLEN = 64

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !plain) return false

  // Legacy plaintext passwords (migrate on next login/update)
  if (!stored.startsWith('scrypt:')) {
    return stored === plain
  }

  const parts = stored.split(':')
  if (parts.length !== 3) return false
  const [, salt, hash] = parts
  const derived = scryptSync(plain, salt, SCRYPT_KEYLEN)
  const expected = Buffer.from(hash, 'hex')
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

export function isPasswordHashed(stored: string | null | undefined): boolean {
  return !!stored?.startsWith('scrypt:')
}
