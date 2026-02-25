'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Container, Card } from '@/lib/design-system/components'
import { Spinner } from '@/lib/design-system/components'
import OrderSummary from '@/components/checkout/OrderSummary'
import CheckoutForm, { type AccountDetails } from '@/components/checkout/CheckoutForm'
import { toast } from 'sonner'
import { getVisitorId, getSessionId } from '@/lib/tracking/client'
import type { CheckoutProduct } from '@/lib/checkout/products'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartData {
  id: string
  items: Array<{
    product_key: string
    plan?: string
    continuity?: string
    plan_type?: string
    pack_key?: string
    resolved: {
      key: string
      name: string
      description: string
      mode: 'payment' | 'subscription'
      amount: number
      currency: string
      features: string[]
    } | null
  }>
  promoCode: string | null
  referralSource: string | null
  campaignName: string | null
  status: string
  expiresAt: string
}

export default function CartCheckoutPage() {
  const { cartId } = useParams<{ cartId: string }>()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<{ label: string; amountOff: number } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch(`/api/cart/${cartId}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Cart not found')
          return
        }
        const data = await res.json()
        setCart(data)
        if (data.promoCode) setPromoCode(data.promoCode)
      } catch {
        setError('Failed to load cart')
      } finally {
        setLoading(false)
      }
    }
    if (cartId) loadCart()
  }, [cartId])

  // Mark cart as checkout_started
  useEffect(() => {
    if (!cart || cart.status !== 'active') return
    fetch(`/api/cart/${cartId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checkout_started' }),
    }).catch(() => {})
  }, [cart, cartId])

  const product = useMemo<CheckoutProduct | null>(() => {
    if (!cart?.items?.[0]?.resolved) return null
    const item = cart.items[0]
    const r = item.resolved!
    return {
      key: r.key,
      name: r.name,
      description: r.description,
      mode: r.mode,
      amount: r.amount,
      currency: r.currency,
      features: r.features,
      redirectAfterSuccess: '/intensive/dashboard',
      getPriceEnvKey: () => undefined,
      metadata: {},
    }
  }, [cart])

  async function validatePromo() {
    if (!promoCode.trim() || !product) return
    setValidatingPromo(true)
    try {
      const item = cart!.items[0]
      const res = await fetch('/api/billing/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          productKey: item.product_key,
          purchaseAmount: product.amount,
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
          ? Math.round(product.amount * data.percent_off / 100)
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
    if (!cart || !product) return null
    setIsProcessing(true)
    try {
      const item = cart.items[0]

      // Capture email on the cart for abandoned cart recovery
      if (accountDetails.email) {
        fetch(`/api/cart/${cartId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: accountDetails.email }),
        }).catch(() => {})
      }

      const res = await fetch('/api/checkout/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...accountDetails,
          product: item.product_key,
          plan: item.plan,
          continuity: item.continuity,
          planType: item.plan_type,
          packKey: item.pack_key,
          promoCode: promoCode || undefined,
          referralSource: cart.referralSource || undefined,
          campaignName: cart.campaignName || undefined,
          cartSessionId: cart.id,
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

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !product) {
    return (
      <Container size="md" className="py-20">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {error === 'Cart expired' ? 'Cart Expired' : error === 'Cart already completed' ? 'Already Completed' : 'Invalid Cart'}
          </h2>
          <p className="text-neutral-400">
            {error === 'Cart expired'
              ? 'This checkout link has expired. Please create a new cart from the homepage.'
              : error === 'Cart already completed'
                ? 'This order has already been completed.'
                : 'This checkout link is invalid.'}{' '}
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
