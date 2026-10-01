// PayPal Orders v2 helpers.
// One-time card payments + vaulting + merchant-initiated recurring charges.
// Amounts always come from our database — never from PayPal catalogs.

import { paypalFetch } from './client'

export type PayPalCaptureResult = {
  orderId: string
  captureId: string | null
  status: string
  amountCents: number
  currency: string
  vault: {
    vaultId: string
    paypalCustomerId: string | null
    brand: string | null
    last4: string | null
    expiry: string | null
  } | null
  raw: any
}

function toAmountString(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** PayPal merchant_customer_id: 1–64 chars, limited character set. */
const MERCHANT_CUSTOMER_ID = /^[0-9a-zA-Z-_.^*$@#]{1,64}$/

/**
 * Id PayPal stores on the vault customer so a later
 * VAULT.PAYMENT-TOKEN.CREATED webhook can find our user.
 * Email when it fits the pattern; otherwise the cart session id.
 */
export function paypalMerchantCustomerId(
  email?: string | null,
  cartSessionId?: string | null,
): string | undefined {
  if (email && MERCHANT_CUSTOMER_ID.test(email)) return email
  if (cartSessionId && MERCHANT_CUSTOMER_ID.test(cartSessionId)) return cartSessionId
  return undefined
}

export function vaultFromPayPalOrder(order: any): PayPalCaptureResult['vault'] {
  const card = order?.payment_source?.card
  const vaultAttrs = card?.attributes?.vault
  if (!vaultAttrs?.id) return null
  return {
    vaultId: vaultAttrs.id,
    paypalCustomerId: vaultAttrs.customer?.id || null,
    brand: card?.brand || null,
    last4: card?.last_digits || null,
    expiry: card?.expiry || null,
  }
}

function parseCapture(order: any): PayPalCaptureResult {
  const pu = order?.purchase_units?.[0]
  const capture = pu?.payments?.captures?.[0] || null
  return {
    orderId: order?.id,
    captureId: capture?.id || null,
    status: capture?.status || order?.status || 'UNKNOWN',
    amountCents: capture?.amount?.value ? Math.round(parseFloat(capture.amount.value) * 100) : 0,
    currency: (capture?.amount?.currency_code || 'USD').toLowerCase(),
    vault: vaultFromPayPalOrder(order),
    raw: order,
  }
}

/**
 * Create an order for the on-site card fields flow. The card is vaulted on
 * successful capture so our billing cron can charge renewals later.
 */
export async function createCardOrder(params: {
  amountCents: number
  currency?: string
  description: string
  /** Our internal reference (e.g. cart session id) — echoed back on capture/webhooks */
  customId: string
  /** Stored on PayPal's vault customer so the token webhook can find this buyer. */
  merchantCustomerId?: string
  /** Existing PayPal vault customer. Additional cards attach to this customer. */
  paypalCustomerId?: string
  requestId?: string
}): Promise<{ id: string; status: string }> {
  const merchantCustomerId = params.merchantCustomerId && MERCHANT_CUSTOMER_ID.test(params.merchantCustomerId)
    ? params.merchantCustomerId
    : undefined
  const paypalCustomerId = params.paypalCustomerId && MERCHANT_CUSTOMER_ID.test(params.paypalCustomerId)
    ? params.paypalCustomerId
    : undefined

  const order = await paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    requestId: params.requestId,
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: (params.currency || 'usd').toUpperCase(),
            value: toAmountString(params.amountCents),
          },
          description: params.description.slice(0, 127),
          custom_id: params.customId.slice(0, 127),
        },
      ],
      payment_source: {
        card: {
          attributes: {
            ...(paypalCustomerId
              ? { customer: { id: paypalCustomerId } }
              : merchantCustomerId
                ? { customer: { merchant_customer_id: merchantCustomerId } }
                : {}),
            vault: { store_in_vault: 'ON_SUCCESS' },
            verification: { method: 'SCA_WHEN_REQUIRED' },
          },
        },
      },
    },
  })
  return { id: order.id, status: order.status }
}

/** Capture an approved order (called after the buyer submits card fields). */
export async function captureOrder(orderId: string): Promise<PayPalCaptureResult> {
  const order = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    requestId: `capture-${orderId}`,
  })
  return parseCapture(order)
}

export async function getOrder(orderId: string): Promise<any> {
  return paypalFetch(`/v2/checkout/orders/${orderId}`)
}

/**
 * Merchant-initiated charge against a vaulted card (subscription renewals).
 * Creating an order with a vault_id processes the payment in one call.
 */
export async function chargeVaultedCard(params: {
  vaultId: string
  amountCents: number
  currency?: string
  description: string
  customId: string
  /** Idempotency key, e.g. `renewal-{subscriptionId}-{periodStartISO}` */
  requestId: string
}): Promise<PayPalCaptureResult> {
  const order = await paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    requestId: params.requestId,
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: (params.currency || 'usd').toUpperCase(),
            value: toAmountString(params.amountCents),
          },
          description: params.description.slice(0, 127),
          custom_id: params.customId.slice(0, 127),
        },
      ],
      payment_source: {
        card: {
          vault_id: params.vaultId,
          stored_credential: {
            payment_initiator: 'MERCHANT',
            payment_type: 'RECURRING',
            usage: 'SUBSEQUENT',
          },
        },
      },
    },
  })
  return parseCapture(order)
}

/** Refund a capture, fully (no amount) or partially. */
export async function refundCapture(params: {
  captureId: string
  amountCents?: number
  currency?: string
  note?: string
}): Promise<{ id: string; status: string }> {
  const body: any = {}
  if (params.amountCents !== undefined) {
    body.amount = {
      currency_code: (params.currency || 'usd').toUpperCase(),
      value: toAmountString(params.amountCents),
    }
  }
  if (params.note) body.note_to_payer = params.note.slice(0, 255)

  const refund = await paypalFetch(`/v2/payments/captures/${params.captureId}/refund`, {
    method: 'POST',
    requestId: `refund-${params.captureId}-${params.amountCents ?? 'full'}`,
    body: Object.keys(body).length > 0 ? body : undefined,
  })
  return { id: refund.id, status: refund.status }
}
