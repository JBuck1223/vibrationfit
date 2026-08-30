'use client'

// Save/update a card with NO purchase, via PayPal Vault setup tokens.
// Shown on the billing page for members on DB-driven (PayPal) billing.
// On success for past_due members, the server resets failures and schedules
// an immediate renewal retry.

import { useRef, useState } from 'react'
import {
  PayPalScriptProvider,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
} from '@paypal/react-paypal-js'
import { Card, Button } from '@/lib/design-system/components'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const cardFieldStyle = {
  input: {
    'font-size': '16px',
    'font-family': 'system-ui, sans-serif',
    color: '#FFFFFF',
    padding: '12px 16px',
  },
  '.invalid': { color: '#FF0040' },
  ':focus': { color: '#FFFFFF' },
}

const fieldWrapperClass =
  'bg-[#404040] rounded-xl border-2 border-[#666666] focus-within:border-[#39FF14] transition-colors min-h-[48px]'

function SaveCardButton({
  onClose,
  submitting,
  setSubmitting,
}: {
  onClose: () => void
  submitting: boolean
  setSubmitting: (v: boolean) => void
}) {
  const { cardFieldsForm } = usePayPalCardFields()

  async function handleSave() {
    if (!cardFieldsForm) {
      toast.error('Card form is still loading. Please wait.')
      return
    }
    const state = await cardFieldsForm.getState()
    if (!state.isFormValid) {
      toast.error('Please check your card details.')
      return
    }
    setSubmitting(true)
    try {
      // Triggers createVaultSetupToken → card tokenization → onApprove
      await cardFieldsForm.submit()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      toast.error(message || 'Failed to save card')
      setSubmitting(false)
    }
  }

  return (
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
  )
}

export default function PayPalAddCardForm({ isOpen, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const setupTokenRef = useRef<string | null>(null)

  if (!isOpen) return null

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  if (!clientId) {
    return (
      <Card className="p-6">
        <div className="py-4 text-center text-amber-500 text-sm">
          Payment form is not configured. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your environment.
        </div>
      </Card>
    )
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
    setupTokenRef.current = data.setupTokenId
    return data.setupTokenId
  }

  async function handleApprove(): Promise<void> {
    const setupTokenId = setupTokenRef.current
    if (!setupTokenId) {
      toast.error('Card session expired. Please try again.')
      setSubmitting(false)
      return
    }
    try {
      const res = await fetch('/api/paypal/vault-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', setupTokenId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save card')
      }
      toast.success(
        data.pastDueRetryScheduled
          ? 'Card saved — your renewal will retry shortly'
          : 'Card saved',
      )
      onSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      toast.error(message || 'Failed to save card')
    } finally {
      setSubmitting(false)
    }
  }

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

      <PayPalScriptProvider
        options={{ clientId, components: 'card-fields', currency: 'USD' }}
      >
        <PayPalCardFieldsProvider
          createVaultSetupToken={createVaultSetupToken}
          onApprove={handleApprove}
          onError={(err) => {
            console.error('[paypal vault card fields] error:', err)
            toast.error('Failed to save card. Please check your details and try again.')
            setSubmitting(false)
          }}
          style={cardFieldStyle}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Name on card</label>
              <div className={fieldWrapperClass}>
                <PayPalNameField />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Card number</label>
              <div className={fieldWrapperClass}>
                <PayPalNumberField />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Expiration</label>
                <div className={fieldWrapperClass}>
                  <PayPalExpiryField />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1">CVV</label>
                <div className={fieldWrapperClass}>
                  <PayPalCVVField />
                </div>
              </div>
            </div>

            <SaveCardButton onClose={onClose} submitting={submitting} setSubmitting={setSubmitting} />
          </div>
        </PayPalCardFieldsProvider>
      </PayPalScriptProvider>
    </Card>
  )
}
