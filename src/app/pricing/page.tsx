// /src/app/pricing/page.tsx
// Pricing page with membership tiers

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system/components'
import { Check, Sparkles, Crown, Zap } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { toast } from 'sonner'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const infinitePlan = {
  name: 'Infinite',
  tier_type: 'infinite',
  description: 'Everything you need to create the life you choose',
  icon: Sparkles,
  color: 'primary',
  pricing: {
    monthly: {
      price: 99,
      period: 'month',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INFINITE_MONTHLY || '',
      saveText: null,
    },
    yearly: {
      price: 777,
      monthlyEquivalent: 65,
      period: 'year',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INFINITE_YEARLY || '',
      saveText: 'Save 34%',
    },
  },
  features: [
    'Complete profile system',
    'Unlimited life visions',
    'VIVA assistant (unlimited)',
    'Vibrational assessment',
    'Journal & vision board',
    'Audio generation',
    'PDF exports',
    'Actualization blueprints',
    'Priority support',
    'All future features',
  ],
  cta: 'Start Your Journey',
  trialDays: 7,
}

export default function PricingPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [isLoading, setIsLoading] = useState(false)
  
  // Extract promo code and referral code from URL
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const urlPromoCode = searchParams?.get('promo') || null
  const urlReferralCode = searchParams?.get('ref') || null

  const selectedPricing = infinitePlan.pricing[billingPeriod]

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const priceId = selectedPricing.stripePriceId

      if (!priceId) {
        toast.error('Stripe is not configured yet. Please contact support.')
        setIsLoading(false)
        return
      }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          tierType: infinitePlan.tier_type,
          promoCode: urlPromoCode,
          referralCode: urlReferralCode,
          trialDays: infinitePlan.trialDays,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container size="lg" className="py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Infinite Possibilities
          </h1>
          <p className="text-2xl text-neutral-300 max-w-3xl mx-auto mb-8">
            Everything you need to create the life you choose. No limits, no tiers, just transformation.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full mb-8 border border-neutral-700">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-8 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-8 py-3.5 rounded-full font-semibold transition-all duration-300 relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              <span className="flex items-center gap-2">
                Yearly
                {infinitePlan.pricing.yearly.saveText && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-energy-500 text-black shadow-md">
                    {infinitePlan.pricing.yearly.saveText}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Single Infinite Plan Card */}
        <Card
          variant="elevated"
          className="max-w-2xl mx-auto p-10 border-2 border-primary-500 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Name */}
          <h2 className="text-4xl font-bold text-center text-white mb-3">
            {infinitePlan.name}
          </h2>

          {/* Description */}
          <p className="text-center text-lg text-neutral-300 mb-8">
            {infinitePlan.description}
          </p>

          {/* Price */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold text-white">
                ${selectedPricing.monthlyEquivalent || selectedPricing.price}
              </span>
              <span className="text-2xl text-neutral-400">/month</span>
            </div>
            {selectedPricing.monthlyEquivalent && (
              <div className="text-neutral-400">
                ${selectedPricing.price} billed annually
              </div>
            )}
            {!selectedPricing.monthlyEquivalent && (
              <div className="text-neutral-400">
                Billed monthly
              </div>
            )}
            {infinitePlan.trialDays && (
              <div className="mt-3">
                <Badge variant="info" className="px-4 py-1.5">
                  {infinitePlan.trialDays}-day free trial
                </Badge>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            variant="primary"
            size="xl"
            className="w-full mb-10 text-lg py-4"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : infinitePlan.cta}
          </Button>

          {/* Features */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wider text-center mb-6">
              Everything Included
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {infinitePlan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Trust Signals */}
        <div className="text-center mt-12">
          <p className="text-neutral-400">
            7-day free trial • Cancel anytime • Secure payment by Stripe
          </p>
          <p className="text-neutral-500 text-sm mt-2">
            Join conscious creators transforming their lives with VibrationFit
          </p>
        </div>
      </Container>
    </PageLayout>
  )
}

