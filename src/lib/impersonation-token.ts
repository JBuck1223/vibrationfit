import crypto from 'crypto'

const EXPIRY_MS = 4 * 60 * 60 * 1000 // 4 hours

function getSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return secret
}

interface ReturnTokenPayload {
  adminUserId: string
  adminEmail: string
  exp: number
}

export function createReturnToken(adminUserId: string, adminEmail: string): string {
  const payload: ReturnTokenPayload = {
    adminUserId,
    adminEmail,
    exp: Date.now() + EXPIRY_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${signature}`
}

export function verifyReturnToken(token: string): ReturnTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, signature] = parts
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url')

  if (signature !== expected) return null

  try {
    const payload: ReturnTokenPayload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString()
    )
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
