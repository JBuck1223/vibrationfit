'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner, Badge } from '@/lib/design-system/components'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { Check, Sparkles, Shield, Calendar } from 'lucide-react'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function PaymentFormInner({ onSuccess }: { onSuccess: (data: any) => void }) {
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
          return_url: `${window.location.origin}/member/offers?setup_complete=true`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'Failed to save payment method')
        setSubmitting(false)
        return
      }

      const activateRes = await fetch('/api/billing/reactivate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })

      const data = await activateRes.json()
      if (!activateRes.ok) {
        toast.error(data.error || 'Failed to activate subscription')
        setSubmitting(false)
        return
      }

      onSuccess(data)
    } catch {
      toast.error('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 text-base font-bold"
        disabled={!stripe || submitting}
      >
        {submitting ? 'Processing...' : 'Start My Free Trial'}
      </Button>
      <p className="text-xs text-neutral-500 text-center">
        Your card will not be charged during the 28-day trial.
        After the trial, you&apos;ll be billed $49 every 28 days. Cancel anytime.
      </p>
    </form>
  )
}

export default function MemberOffersPage() {
  const [loading, setLoading] = useState(true)
  const [hasActiveSub, setHasActiveSub] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [success, setSuccess] = useState<{ trialEnd: string } | null>(null)

  useEffect(() => {
    fetch('/api/billing/membership')
      .then(res => res.json())
      .then(data => {
        const sub = data.subscription
        setHasActiveSub(
          !!sub && (sub.status === 'active' || sub.status === 'trialing')
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = async () => {
    setAccepted(true)
    setSetupLoading(true)
    try {
      const res = await fetch('/api/billing/reactivate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
      })
      const data = await res.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        toast.error(data.error || 'Failed to initialize payment form')
        setAccepted(false)
      }
    } catch {
      toast.error('Failed to load payment form')
      setAccepted(false)
    } finally {
      setSetupLoading(false)
    }
  }

  const handleSuccess = (data: any) => {
    setSuccess({ trialEnd: data.trialEnd })
    toast.success('Welcome back! Your trial has started.')
  }

  if (loading) {
    return (
      <Container size="md">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (success) {
    return (
      <Container size="md" className="py-12">
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">You&apos;re All Set!</h1>
            <p className="text-neutral-400">
              Your 28-day free trial has started. Your first payment of $49 will be on{' '}
              <span className="text-white font-medium">
                {new Date(success.trialEnd).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </span>.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/account/billing'}>
              View Billing
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  if (hasActiveSub) {
    return (
      <Container size="md" className="py-12">
        <Card className="p-8 text-center space-y-4">
          <Badge variant="success">Active Member</Badge>
          <h1 className="text-2xl font-bold text-white">You&apos;re Already Active!</h1>
          <p className="text-neutral-400">
            You already have an active Vision Pro membership.
          </p>
          <Button variant="ghost" onClick={() => window.location.href = '/account/billing'}>
            View Billing &amp; Plan
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="md" className="py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="warning" className="mx-auto">Special Offer</Badge>
          <h1 className="text-3xl font-bold text-white">
            Welcome Back to Vision Pro
          </h1>
          <p className="text-neutral-400 text-lg max-w-md mx-auto">
            We&apos;ve got a special deal just for you. Try it free for 28 days.
          </p>
        </div>

        {/* Offer Card */}
        <Card className="p-8 space-y-6 border border-[#39FF14]/20">
          {/* Pricing */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl text-neutral-500 line-through">$99</span>
              <span className="text-5xl font-bold text-white">$49</span>
              <span className="text-neutral-400 text-lg">/28 days</span>
            </div>
            <Badge variant="success">50% Off — Forever</Badge>
          </div>

          {/* Benefits */}
          <div className="grid gap-3 py-4">
            {[
              'Full access to Vision Pro platform',
              '375,000 VIVA tokens every 28 days',
              'AI-powered coaching & assessments',
              'All premium features included',
              '28-day free trial — cancel anytime',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#39FF14]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#39FF14]" />
                </div>
                <span className="text-neutral-300 text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 py-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> No commitment
            </span>
          </div>

          {/* Accept checkbox + payment form */}
          {!accepted ? (
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={() => handleAccept()}
                  className="mt-1 w-5 h-5 rounded border-neutral-600 bg-neutral-800 text-[#39FF14] focus:ring-[#39FF14] focus:ring-offset-0"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                  I&apos;d like to accept this offer and start my 28-day free trial.
                  After the trial, I&apos;ll be billed $49 every 28 days.
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-[#39FF14]">
                <Check className="w-4 h-4" />
                <span>Offer accepted — enter your card below</span>
              </div>

              {setupLoading && (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" />
                </div>
              )}

              {clientSecret && stripePromise && (
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
                  <PaymentFormInner onSuccess={handleSuccess} />
                </Elements>
              )}
            </div>
          )}
        </Card>
      </div>
    </Container>
  )
}
