'use client'

// Save/update a card with NO purchase, via PayPal Vault setup tokens and the
// JS SDK v6 save-payment card fields. Shown on the billing page for members
// on DB-driven (PayPal) billing.
//
// Flow: server creates a setup token → SDK submits the card against it
// (handles 3-D Secure) → server exchanges it for a permanent vault token and
// points the member's subscriptions at the new card. For past_due members the
// server also resets failures and schedules an immediate renewal retry.

import { useEffect, useRef, useState } from 'react'
import { usePayPalCardFieldsSavePaymentSession } from '@paypal/react-paypal-js/sdk-v6'
import { Card, Button, Input } from '@/lib/design-system/components'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PayPalCardFieldsFrame, CardFieldBox, useCardFieldsStatus } from '@/components/checkout/PayPalCardFields'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

async function createVaultSetupToken(): Promise<string> {
  const res = await fetch('/api/paypal/vault-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setup' }),
  })
  const data = await res.json()
  if (!res.ok || !data.setupTokenId) {
    throw new Error(data.error || 'Failed to initialize card form')
  }
  return data.setupTokenId as string
}

async function confirmVaultSetupToken(setupTokenId: string): Promise<{ pastDueRetryScheduled: boolean }> {
  const res = await fetch('/api/paypal/vault-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', setupTokenId }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save card')
  }
  return { pastDueRetryScheduled: Boolean(data.pastDueRetryScheduled) }
}

function AddCardFields({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { submit, submitResponse, error: submitError } = usePayPalCardFieldsSavePaymentSession()
  const fieldsStatus = useCardFieldsStatus()
  const [cardName, setCardName] = useState('')
  const [cardNameError, setCardNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const awaitingRef = useRef(false)

  async function handleSave() {
    setCardNameError('')
    if (!cardName.trim()) {
      setCardNameError('Name on card is required')
      return
    }
    if (fieldsStatus.kind !== 'ready') {
      toast.error(fieldsStatus.kind === 'error' ? fieldsStatus.message : 'Card form is still loading. Please wait.')
      return
    }

    setSubmitting(true)
    let setupTokenId: string
    try {
      setupTokenId = await createVaultSetupToken()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Failed to initialize card form')
      setSubmitting(false)
      return
    }

    awaitingRef.current = true
    await submit(setupTokenId, { name: cardName.trim() })
  }

  useEffect(() => {
    if (!awaitingRef.current) return
    if (!submitResponse && !submitError) return
    awaitingRef.current = false

    if (submitError) {
      toast.error(submitError.message || 'Failed to save card. Please check your details and try again.')
      setSubmitting(false)
      return
    }
    if (!submitResponse) return

    if (submitResponse.state === 'succeeded') {
      confirmVaultSetupToken(submitResponse.data.vaultSetupToken)
        .then(({ pastDueRetryScheduled }) => {
          toast.success(pastDueRetryScheduled ? 'Card saved — your renewal will retry shortly' : 'Card saved')
          onSuccess()
          onClose()
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error && err.message ? err.message : 'Failed to save card')
        })
        .finally(() => setSubmitting(false))
      return
    }
    if (submitResponse.state === 'canceled') {
      toast.error('Card verification was cancelled. Please try again.')
    } else {
      toast.error(submitResponse.data.message || 'Please check your card details and try again.')
    }
    setSubmitting(false)
  }, [submitResponse, submitError, onClose, onSuccess])

  return (
    <div className="space-y-4">
      <Input
        label="Name on card"
        value={cardName}
        onChange={(e) => setCardName(e.target.value)}
        error={cardNameError}
        placeholder="Name on card"
        autoComplete="cc-name"
      />
      <CardFieldBox type="number" label="Card number" placeholder="Card number" />
      <div className="grid grid-cols-2 gap-5">
        <CardFieldBox type="expiry" label="Expiration" placeholder="MM / YY" />
        <CardFieldBox type="cvv" label="CVV" placeholder="CVV" />
      </div>
      {fieldsStatus.kind === 'error' && <p className="text-sm text-[#FF0040]">{fieldsStatus.message}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" variant="primary" className="flex-1" onClick={handleSave} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Card'
          )}
        </Button>
      </div>
    </div>
  )
}

export default function PayPalAddCardForm({ isOpen, onClose, onSuccess }: Props) {
  if (!isOpen) return null

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Add Payment Method</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <PayPalCardFieldsFrame>
        <AddCardFields onClose={onClose} onSuccess={onSuccess} />
      </PayPalCardFieldsFrame>
    </Card>
  )
}
