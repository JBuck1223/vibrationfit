'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Container, Card, Stack } from '@/lib/design-system/components'
import { Spinner } from '@/lib/design-system/components'
import OrderSummary from '@/components/checkout/OrderSummary'
import CheckoutForm, { type AccountDetails } from '@/components/checkout/CheckoutForm'
import { resolveCheckoutProduct, type CheckoutProduct } from '@/lib/checkout/products'
import { toast } from 'sonner'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function CheckoutContent() {
  const searchParams = useSearchParams()

  const product = useMemo<CheckoutProduct | null>(() => {
    return resolveCheckoutProduct({
      product: searchParams.get('product') || '',
      plan: searchParams.get('plan') || undefined,
      continuity: searchParams.get('continuity') || undefined,
      planType: searchParams.get('planType') || undefined,
      packKey: searchParams.get('packKey') || undefined,
    })
  }, [searchParams])

  const [promoCode, setPromoCode] = useState(searchParams.get('promo') || '')
  const [promoDiscount, setPromoDiscount] = useState<{ label: string; amountOff: number } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const referralSource = searchParams.get('ref') || ''
  const campaignName = searchParams.get('campaign') || ''

  const isIntensive =
    product?.metadata?.purchase_type === 'intensive' || product?.key?.startsWith('intensive-')
  const paymentPlan = (product?.metadata?.intensive_payment_plan as 'full' | '2pay' | '3pay') || 'full'
  const fullPrice =
    !product
      ? 0
      : paymentPlan === 'full'
        ? product.amount
        : paymentPlan === '2pay'
          ? product.amount * 2
          : product.amount * 3
  const total = Math.max(0, fullPrice - (promoDiscount?.amountOff ?? 0))
  const todayCents =
    paymentPlan === 'full' ? total : paymentPlan === '2pay' ? Math.round(total / 2) : Math.round(total / 3)
  const todayDollars =
    todayCents % 100 === 0 ? (todayCents / 100).toString() : (todayCents / 100).toFixed(2)
  const submitLabel =
    product && isIntensive
      ? `Pay $${todayDollars} & Start the Activation Intensive`
      : product
        ? `Pay $${todayDollars}`
        : undefined
  const submitLabelShort = product ? `Pay $${todayDollars}` : undefined

  async function validatePromo() {
    if (!promoCode.trim()) return
    setValidatingPromo(true)
    try {
      const res = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        toast.error('Invalid promo code')
        setPromoDiscount(null)
        return
      }
      const amountOff = data.percent_off
        ? Math.round((product?.amount || 0) * data.percent_off / 100)
        : data.amount_off || 0
      setPromoDiscount({ label: data.name || promoCode, amountOff })
      toast.success('Promo code applied')
    } catch {
      toast.error('Could not validate promo code')
      setPromoDiscount(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  async function handleFormSubmit(accountDetails: AccountDetails): Promise<{ clientSecret: string; redirectUrl: string } | null> {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/checkout/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...accountDetails,
          product: searchParams.get('product'),
          plan: searchParams.get('plan'),
          continuity: searchParams.get('continuity'),
          planType: searchParams.get('planType'),
          packKey: searchParams.get('packKey'),
          promoCode: promoCode || undefined,
          referralSource: referralSource || undefined,
          campaignName: campaignName || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to process checkout')
        setIsProcessing(false)
        return null
      }

      return { clientSecret: data.clientSecret, redirectUrl: data.redirectUrl }
    } catch (err) {
      toast.error('Network error. Please try again.')
      setIsProcessing(false)
      return null
    }
  }

  if (!product) {
    return (
      <Container size="md" className="py-20">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Invalid checkout link</h2>
          <p className="text-neutral-400">
            This checkout URL is missing product information.{' '}
            <a href="/" className="text-[#39FF14] hover:underline">Return to homepage</a>
          </p>
        </Card>
      </Container>
    )
  }

  if (!stripePromise) {
    return (
      <Container size="md" className="py-20">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Checkout not configured</h2>
          <p className="text-neutral-400">
            Payment is not available right now. Please add <code className="text-neutral-300 bg-neutral-800 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your environment.
          </p>
          <a href="/" className="mt-4 inline-block text-[#39FF14] hover:underline">Return to homepage</a>
        </Card>
      </Container>
    )
  }

  const elementsOptions = {
    mode: product.mode as 'payment' | 'subscription',
    amount: product.amount,
    currency: product.currency,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#39FF14',
        colorBackground: '#2A2A2A',
        colorText: '#FFFFFF',
        colorTextSecondary: '#9CA3AF',
        colorDanger: '#FF0040',
        borderRadius: '12px',
        fontFamily: 'system-ui, sans-serif',
      },
      rules: {
        '.Input': {
          border: '2px solid #666666',
          backgroundColor: '#404040',
          padding: '12px 16px',
        },
        '.Input:focus': {
          border: '2px solid #39FF14',
          boxShadow: 'none',
        },
        '.Label': {
          color: '#E5E7EB',
          fontSize: '14px',
          fontWeight: '500',
        },
      },
    },
  }

  return (
    <Container size="xl">
      <Elements stripe={stripePromise} options={elementsOptions}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Order Summary - first on mobile, left on desktop */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <OrderSummary
              product={product}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              promoDiscount={promoDiscount}
              onValidatePromo={validatePromo}
              validatingPromo={validatingPromo}
            />
          </div>

          {/* Checkout Form - second on mobile, right on desktop */}
          <div className="lg:col-span-3 order-2 lg:order-2">
            <Card className="p-6 md:p-8">
              <CheckoutForm
                onSubmit={handleFormSubmit}
                isProcessing={isProcessing}
                submitLabel={submitLabel}
                submitLabelShort={submitLabelShort}
                continuity={(searchParams.get('continuity') as 'annual' | '28day') || undefined}
                planType={(searchParams.get('planType') as 'solo' | 'household') || undefined}
              />
            </Card>
          </div>
        </div>
      </Elements>
    </Container>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <Container size="md" className="py-20 flex justify-center">
        <Spinner size="lg" />
      </Container>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
