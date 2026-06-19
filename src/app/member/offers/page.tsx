'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner, Badge, Stack } from '@/lib/design-system/components'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { Check, Sparkles, Shield, Calendar, CheckSquare, Square } from 'lucide-react'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

type PlanKey = 'annual' | '28day'

const PLAN_INFO: Record<PlanKey, {
  name: string
  original: string
  price: string
  cadence: string
  tagline: string
  tag: string | null
  chargeText: string
}> = {
  annual: {
    name: 'Annual',
    original: '$990',
    price: '$495',
    cadence: '/year',
    tagline: 'Billed once a year',
    tag: '3 billing periods free',
    chargeText: "You'll be charged $495 today, then $495 every year. Cancel anytime.",
  },
  '28day': {
    name: '28-Day',
    original: '$99',
    price: '$49.50',
    cadence: '/28 days',
    tagline: 'Billed every 28 days',
    tag: null,
    chargeText: "You'll be charged $49.50 today, then $49.50 every 28 days. Cancel anytime.",
  },
}

function PaymentFormInner({
  subscriptionId,
  plan,
  onSuccess,
}: {
  subscriptionId: string
  plan: PlanKey
  onSuccess: (data: any) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const info = PLAN_INFO[plan]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/member/offers?reactivation=success&sub=${subscriptionId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
        setSubmitting(false)
        return
      }

      // Card charged inline (no redirect required). Finalize the subscription:
      // attach the card to the customer + set as default for future billing.
      const finalizeRes = await fetch('/api/billing/reactivate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', subscriptionId }),
      })

      const data = await finalizeRes.json()
      if (!finalizeRes.ok) {
        toast.error(data.error || 'Payment succeeded but activation failed. Please contact support.')
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
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={!stripe || submitting}
      >
        {submitting ? 'Processing...' : `Pay ${info.price} & Activate`}
      </Button>
      <p className="text-xs text-neutral-500 text-center">
        {info.chargeText}
      </p>
    </form>
  )
}

export default function MemberOffersPage() {
  const [loading, setLoading] = useState(true)
  const [hasActiveSub, setHasActiveSub] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [plan, setPlan] = useState<PlanKey>('annual')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [success, setSuccess] = useState<{ nextBilling: string } | null>(null)

  useEffect(() => {
    // Returning from a redirect-based payment confirmation (e.g. 3D Secure):
    // finalize the subscription so the card is attached for future billing.
    const params = new URLSearchParams(window.location.search)
    if (params.get('reactivation') === 'success' && params.get('sub')) {
      const sub = params.get('sub') as string
      fetch('/api/billing/reactivate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', subscriptionId: sub }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSuccess({ nextBilling: data.nextBilling })
            toast.success('Your founders rate is locked in!')
          } else {
            toast.error(data.error || 'Activation failed. Please contact support.')
          }
        })
        .catch(() => toast.error('Activation failed. Please contact support.'))
        .finally(() => setLoading(false))
      return
    }

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
        body: JSON.stringify({ action: 'create', plan }),
      })
      const data = await res.json()
      if (data.clientSecret && data.subscriptionId) {
        setClientSecret(data.clientSecret)
        setSubscriptionId(data.subscriptionId)
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
    setSuccess({ nextBilling: data.nextBilling })
    toast.success('Your founders rate is locked in!')
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (success) {
    return (
      <Container size="xl">
        <Card className="mx-auto max-w-md text-center">
          <Stack gap="lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#39FF14]/10">
              <Check className="h-8 w-8 text-[#39FF14]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Welcome, Founder!</h1>
              <p className="text-neutral-400 leading-relaxed text-pretty">
                Your founders rate is locked in and your {PLAN_INFO[plan].price} payment is confirmed.
                {success.nextBilling && !Number.isNaN(new Date(success.nextBilling).getTime()) && (
                  <>
                    {' '}Your next payment is on{' '}
                    <span className="font-medium text-white">
                      {new Date(success.nextBilling).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </span>.
                  </>
                )}
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
          </Stack>
        </Card>
      </Container>
    )
  }

  if (hasActiveSub) {
    return (
      <Container size="xl">
        <Card className="mx-auto max-w-md text-center">
          <Stack gap="md">
            <Badge variant="success" className="mx-auto">Active Member</Badge>
            <h1 className="text-2xl font-bold text-white">You&apos;re Already Active!</h1>
            <p className="text-neutral-400 leading-relaxed text-pretty">
              You already have an active Vision Pro membership.
            </p>
            <Button variant="ghost" onClick={() => window.location.href = '/account/billing'}>
              View Billing &amp; Plan
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <div className="mx-auto w-full max-w-xl min-h-[calc(100vh-12rem)] flex flex-col justify-center">
        <Stack gap="lg">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="success" className="mx-auto">Founders Offer</Badge>
            <h1 className="text-4xl font-bold text-white tracking-tight text-balance">
              A Thank You to Our Founders
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed text-pretty">
              You were here from the beginning. Your feedback shaped Vibration Fit into what it is today — so we&apos;re locking in a founders-only rate as our way of saying thank you.
            </p>
          </div>

          {/* Offer Card */}
          <Card variant="elevated">
            {!accepted ? (
              <Stack gap="lg">
                {/* Plan selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['annual', '28day'] as PlanKey[]).map((key) => {
                    const p = PLAN_INFO[key]
                    const selected = plan === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPlan(key)}
                        aria-pressed={selected}
                        className={`group relative rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                          selected
                            ? 'border-[#39FF14] bg-[#39FF14]/[0.06] shadow-[0_0_24px_-6px_rgba(57,255,20,0.45)]'
                            : 'border-[#333] bg-black/30 hover:border-neutral-600'
                        }`}
                      >
                        <span
                          className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? 'border-[#39FF14] bg-[#39FF14] text-black' : 'border-neutral-600'
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>

                        <div className="flex items-center gap-2 pr-7">
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                          {p.tag && (
                            <span className="rounded-full bg-[#BF00FF]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#D67BFF]">
                              {p.tag}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold text-white leading-none">{p.price}</span>
                          <span className="text-xs text-neutral-500">{p.cadence}</span>
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          <span className="line-through">{p.original}</span>
                          <span className="mx-1.5">·</span>
                          {p.tagline}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                  <Badge variant="success">Founders Rate · 50% Off, Locked Forever</Badge>
                  <p className="text-sm text-neutral-400">Full access to Vision Pro. Cancel anytime.</p>
                </div>

                <div className="border-t border-[#333]" />

                {/* Accept */}
                <div
                  role="checkbox"
                  aria-checked={accepted}
                  tabIndex={0}
                  onClick={() => handleAccept()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleAccept()
                    }
                  }}
                  className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                    accepted
                      ? 'border-[#39FF14]/30 bg-[#39FF14]/5'
                      : 'border-[#333] hover:border-[#39FF14]/50'
                  }`}
                >
                  {accepted ? (
                    <CheckSquare className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-[1px]" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-[1px]" />
                  )}
                  <span className="text-sm text-neutral-300 leading-relaxed text-pretty group-hover:text-white transition-colors">
                    I&apos;d like to claim my founders rate. {PLAN_INFO[plan].chargeText}
                  </span>
                </div>
              </Stack>
            ) : (
              <Stack gap="lg">
                {/* Selected plan summary */}
                <div className="flex items-center justify-between rounded-xl border-2 border-[#39FF14]/40 bg-[#39FF14]/[0.06] p-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{PLAN_INFO[plan].name} plan</div>
                    <div className="mt-0.5 text-xs text-neutral-400">{PLAN_INFO[plan].tagline}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">{PLAN_INFO[plan].price}</span>
                    <span className="text-xs text-neutral-500">{PLAN_INFO[plan].cadence}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-[#39FF14]">
                  <Check className="h-4 w-4 flex-shrink-0" />
                  <span>Enter your card to activate</span>
                </div>

                {setupLoading && (
                  <div className="flex justify-center py-8">
                    <Spinner size="md" />
                  </div>
                )}

                {clientSecret && subscriptionId && stripePromise && (
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
                    <PaymentFormInner subscriptionId={subscriptionId} plan={plan} onSuccess={handleSuccess} />
                  </Elements>
                )}
              </Stack>
            )}
          </Card>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Secure checkout
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Founders rate
            </span>
          </div>
        </Stack>
      </div>
    </Container>
  )
}
