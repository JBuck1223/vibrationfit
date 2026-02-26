'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Card, Spinner } from '@/lib/design-system/components'

const POLL_INTERVAL_MS = 1500
const MAX_ATTEMPTS = 40 // ~60 seconds

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  const orderId = searchParams.get('order_id')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentIntentId && !orderId) {
      setError('Invalid checkout session')
      return
    }

    let attempts = 0

    const poll = async () => {
      if (attempts >= MAX_ATTEMPTS) {
        setError('Setup is taking longer than usual. Please check your email or contact support.')
        return
      }
      attempts += 1

      try {
        const qs = paymentIntentId
          ? `payment_intent_id=${encodeURIComponent(paymentIntentId)}`
          : `order_id=${encodeURIComponent(orderId!)}`
        const res = await fetch(`/api/checkout/status?${qs}`)
        const data = await res.json()

        if (data.ready && data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }

        if (res.status !== 200 || data.error) {
          setError(data.error || 'Something went wrong')
          return
        }
      } catch {
        setError('Network error. Please refresh the page.')
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
  }, [paymentIntentId, orderId])

  if (error) {
    return (
      <Container size="sm" className="py-16">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Checkout issue</h1>
          <p className="text-neutral-300 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block rounded-full bg-[#39FF14] text-black font-semibold px-6 py-2 hover:opacity-90"
          >
            Return home
          </a>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="sm" className="py-16">
      <Card className="p-8 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Setting up your account</h1>
        <p className="text-neutral-400">
          You&apos;ll be redirected to set your password in a moment.
        </p>
      </Card>
    </Container>
  )
}
