import { verify as verifySignature } from 'node:crypto'
import { validateRequest } from 'twilio'

export function validTwilioRequest(request: Request, form: FormData): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN
  const base = process.env.WEBHOOK_PUBLIC_ORIGIN || process.env.NEXT_PUBLIC_APP_URL
  const signature = request.headers.get('x-twilio-signature')
  if (!token || !base || !signature) return false
  try {
    const incoming = new URL(request.url)
    const origin = new URL(base)
    if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) return false
    const url = `${origin.origin}${incoming.pathname}${incoming.search}`
    const params: Record<string, string> = {}
    for (const [key, value] of form.entries()) {
      // These endpoints use form.get; reject ambiguous duplicate representations.
      if (typeof value !== 'string' || Object.hasOwn(params, key)) return false
      Object.defineProperty(params, key, { value, enumerable: true })
    }
    return validateRequest(token, signature, url, params)
  } catch { return false }
}

type SnsMessage = Record<string, unknown>
export function snsCanonicalMessage(message: SnsMessage): string | null {
  const keys = message.Type === 'Notification'
    ? ['Message', 'MessageId', ...(Object.hasOwn(message, 'Subject') ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
    : message.Type === 'SubscriptionConfirmation' || message.Type === 'UnsubscribeConfirmation'
      ? ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'] : null
  if (!keys || keys.some(key => typeof message[key] !== 'string')) return null
  return keys.map(key => `${key}\n${message[key]}\n`).join('')
}

function snsHost(topic: string): string | null {
  const match = /^arn:(aws|aws-cn):sns:([a-z]+-[a-z]+-\d):\d{12}:[A-Za-z0-9_-]+(?:\.fifo)?$/.exec(topic)
  return match ? `sns.${match[2]}.amazonaws.com${match[1] === 'aws-cn' ? '.cn' : ''}` : null
}

export function trustedSnsUrl(value: unknown, topic: string, certificate = false): boolean {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== snsHost(topic) || url.port || url.username || url.password || url.hash) return false
    return certificate
      ? /^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(url.pathname) && !url.search
      : url.pathname === '/' && url.searchParams.get('Action') === 'ConfirmSubscription' && url.searchParams.get('TopicArn') === topic
  } catch { return false }
}

// Dependency injection allows verification tests using locally generated RSA keys.
export async function validSnsMessage(value: unknown, expectedTopic: string | undefined, fetchCertificate: typeof fetch = fetch): Promise<boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !expectedTopic) return false
  const message = value as SnsMessage
  if (message.TopicArn !== expectedTopic || !trustedSnsUrl(message.SigningCertURL, expectedTopic, true)) return false
  if (message.SignatureVersion !== '1' && message.SignatureVersion !== '2') return false
  if (typeof message.Signature !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(message.Signature)) return false
  const canonical = snsCanonicalMessage(message)
  if (!canonical) return false
  if (message.Type !== 'Notification' && !trustedSnsUrl(message.SubscribeURL, expectedTopic)) return false
  try {
    const response = await fetchCertificate(message.SigningCertURL as string, { redirect: 'error', signal: AbortSignal.timeout(8000) })
    if (!response.ok) return false
    const certificate = await response.text()
    if (certificate.length > 32768) return false
    return verifySignature(message.SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256', Buffer.from(canonical), certificate, Buffer.from(message.Signature, 'base64'))
  } catch { return false }
}
