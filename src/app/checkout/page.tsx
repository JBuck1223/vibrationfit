'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Container, Card } from '@/lib/design-system/components'
import { Spinner } from '@/lib/design-system/components'
import OrderSummary from '@/components/checkout/OrderSummary'
import CheckoutForm, { type AccountDetails } from '@/components/checkout/CheckoutForm'
import { resolveCheckoutProduct, type CheckoutProduct } from '@/lib/checkout/products'
import { getVisitorId, getSessionId } from '@/lib/tracking/client'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  const product = useMemo<CheckoutProduct | null>(() => {
    return resolveCheckoutProduct({
      product: searchParams.get('product') || '',
      plan: searchParams.get('plan') || undefined,
      continuity: searchParams.get('continuity') || undefined,
      planType: searchParams.get('planType') || undefined,
      packKey: searchParams.get('packKey') || undefined,
    })
  }, [searchParams])

  // Auto-create a cart session and redirect to the cart-based checkout URL
  useEffect(() => {
    if (!product || redirecting) return
    const productKey = searchParams.get('product')
    if (!productKey) return

    setRedirecting(true)

    const item: Record<string, string> = { product_key: productKey }
    const plan = searchParams.get('plan')
    const continuity = searchParams.get('continuity')
    const planType = searchParams.get('planType')
    const packKey = searchParams.get('packKey')
    if (plan) item.plan = plan
    if (continuity) item.continuity = continuity
    if (planType) item.plan_type = planType
    if (packKey) item.pack_key = packKey

    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [item],
        promoCode: searchParams.get('promo') || undefined,
        referralSource: searchParams.get('ref') || undefined,
        campaignName: searchParams.get('campaign') || undefined,
        visitorId: getVisitorId() || undefined,
        sessionId: getSessionId() || undefined,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.cartId) {
          router.replace(`/checkout/${data.cartId}`)
        } else {
          setRedirecting(false)
        }
      })
      .catch(() => {
        setRedirecting(false)
      })
  }, [product, searchParams, router, redirecting])

  const [promoCode, setPromoCode] = useState(searchParams.get('promo') || '')
  const [promoDiscount, setPromoDiscount] = useState<{ label: string; amountOff: number } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const referralSource = searchParams.get('ref') || ''
  const campaignName = searchParams.get('campaign') || ''

  async function validatePromo() {
    if (!promoCode.trim()) return
    setValidatingPromo(true)
    try {
      const res = await fetch('/api/billing/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          productKey: searchParams.get('product') || undefined,
          purchaseAmount: product?.amount,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        toast.error(data.error || 'Invalid promo code')
        setPromoDiscount(null)
        return
      }
      const amountOff = data.discountAmount
        ?? (data.percent_off
          ? Math.round((product?.amount || 0) * data.percent_off / 100)
          : data.amount_off || 0)
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
          visitorId: getVisitorId() || undefined,
          sessionId: getSessionId() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to process checkout')
        setIsProcessing(false)
        return null
      }

      return { clientSecret: data.clientSecret, redirectUrl: data.redirectUrl }
    } catch {
      toast.error('Network error. Please try again.')
      setIsProcessing(false)
      return null
    }
  }

  if (redirecting) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner size="lg" />
      </Container>
    )
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
    <Container size="xl" className="py-8 md:py-12">
      <div className="mb-8">
        <a href="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
          &larr; Back to VibrationFit
        </a>
      </div>

      <Elements stripe={stripePromise} options={elementsOptions}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <OrderSummary
              product={product}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              promoDiscount={promoDiscount}
              onValidatePromo={validatePromo}
              validatingPromo={validatingPromo}
            />
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="p-6 md:p-8">
              <CheckoutForm
                onSubmit={handleFormSubmit}
                isProcessing={isProcessing}
                submitLabel={`Pay $${((product.amount - (promoDiscount?.amountOff || 0)) / 100).toFixed(product.amount % 100 === 0 ? 0 : 2)}`}
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
