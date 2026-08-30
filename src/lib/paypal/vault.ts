// PayPal Vault v3 helpers — save a card WITHOUT a purchase (setup tokens).
// Used by the billing page "update card" flow. The resulting payment token
// is what the billing cron charges for renewals.

import { paypalFetch } from './client'

export type VaultedCardDetails = {
  vaultId: string
  paypalCustomerId: string | null
  brand: string | null
  last4: string | null
  expiry: string | null
}

/**
 * Create a setup token for the on-site card fields flow. The client SDK
 * collects the card details against this token; we then exchange it for a
 * permanent payment token.
 */
export async function createVaultSetupToken(): Promise<{ id: string }> {
  const setupToken = await paypalFetch('/v3/vault/setup-tokens', {
    method: 'POST',
    requestId: `setup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    body: {
      payment_source: {
        card: {
          verification_method: 'SCA_WHEN_REQUIRED',
        },
      },
    },
  })
  return { id: setupToken.id }
}

/** Exchange an approved setup token for a permanent vault payment token. */
export async function createPaymentTokenFromSetupToken(
  setupTokenId: string,
): Promise<VaultedCardDetails> {
  const paymentToken = await paypalFetch('/v3/vault/payment-tokens', {
    method: 'POST',
    requestId: `pt-${setupTokenId}`,
    body: {
      payment_source: {
        token: {
          id: setupTokenId,
          type: 'SETUP_TOKEN',
        },
      },
    },
  })

  const card = paymentToken?.payment_source?.card
  return {
    vaultId: paymentToken.id,
    paypalCustomerId: paymentToken?.customer?.id || null,
    brand: card?.brand || null,
    last4: card?.last_digits || null,
    expiry: card?.expiry || null,
  }
}
