import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto'

const SCRYPT_KEYLEN = 64
const SYSTEM_SIGNING_PEPPER = 'AMIS-ETHIOPIA-GOV-PROPERTY-2024-PEPPER'

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function hashPin(plainPin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plainPin.trim(), salt, SCRYPT_KEYLEN).toString('hex')
  return `pin-scrypt:${salt}:${hash}`
}

export function verifyPin(plainPin: string, stored: string | null | undefined): boolean {
  if (!stored || !plainPin) return false
  const trimmed = plainPin.trim()

  if (stored.startsWith('pin-scrypt:')) {
    const parts = stored.split(':')
    if (parts.length !== 3) return false
    const [, salt, hash] = parts
    const derived = scryptSync(trimmed, salt, SCRYPT_KEYLEN)
    const expected = Buffer.from(hash, 'hex')
    if (derived.length !== expected.length) return false
    return timingSafeEqual(derived, expected)
  }

  // Fallback if stored is legacy scrypt or plaintext password
  return verifyPassword(trimmed, stored)
}

export function generateDocumentSignature(payload: any, signerId: number, signerName: string): string {
  const canonicalData = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const timestamp = new Date().toISOString()
  const message = `${signerId}|${signerName}|${timestamp}|${canonicalData}`
  const hmac = createHmac('sha256', SYSTEM_SIGNING_PEPPER)
  hmac.update(message)
  return `SIG-HMAC-${hmac.digest('hex').substring(0, 32).toUpperCase()}`
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
