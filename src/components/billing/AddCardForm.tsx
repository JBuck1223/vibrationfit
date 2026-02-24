'use client'

import { useState, useEffect } from 'react'
import { Card, Button } from '@/lib/design-system/components'
import { X } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function AddCardFormInner({ onClose, onSuccess }: Omit<Props, 'isOpen'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account/billing?card_added=true`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'Failed to add card')
      } else {
        toast.success('Payment method added')
        onSuccess()
        onClose()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={!stripe || submitting}>
          {submitting ? 'Saving...' : 'Save Card'}
        </Button>
      </div>
    </form>
  )
}

export default function AddCardForm({ isOpen, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null)
      return
    }

    setLoading(true)
    fetch('/api/billing/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          toast.error(data.error || 'Failed to initialize')
          onClose()
        }
      })
      .catch(() => {
        toast.error('Failed to load card form')
        onClose()
      })
      .finally(() => setLoading(false))
  }, [isOpen, onClose])

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

      {loading && (
        <div className="py-8 text-center text-neutral-400 text-sm">Loading...</div>
      )}

      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#39FF14',
                colorBackground: '#171717',
                colorText: '#ffffff',
                borderRadius: '12px',
              },
            },
          }}
        >
          <AddCardFormInner onClose={onClose} onSuccess={onSuccess} />
        </Elements>
      )}
    </Card>
  )
}
