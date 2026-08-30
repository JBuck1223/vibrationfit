// PayPal webhook signature verification via the official verify endpoint.

import { paypalFetch, PAYPAL_CONFIG } from './client'

/**
 * Verify a webhook delivery. Returns true only when PayPal confirms the
 * signature. Requires PAYPAL_WEBHOOK_ID to be set (from the developer
 * dashboard after registering the webhook URL).
 */
export async function verifyWebhookSignature(params: {
  headers: Headers
  rawBody: string
}): Promise<boolean> {
  if (!PAYPAL_CONFIG.webhookId) {
    console.error('[paypal webhook] PAYPAL_WEBHOOK_ID not set — rejecting event')
    return false
  }

  const h = params.headers
  try {
    const result = await paypalFetch<{ verification_status: string }>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: {
          auth_algo: h.get('paypal-auth-algo'),
          cert_url: h.get('paypal-cert-url'),
          transmission_id: h.get('paypal-transmission-id'),
          transmission_sig: h.get('paypal-transmission-sig'),
          transmission_time: h.get('paypal-transmission-time'),
          webhook_id: PAYPAL_CONFIG.webhookId,
          webhook_event: JSON.parse(params.rawBody),
        },
      },
    )
    return result.verification_status === 'SUCCESS'
  } catch (err) {
    console.error('[paypal webhook] signature verification failed:', err)
    return false
  }
}
