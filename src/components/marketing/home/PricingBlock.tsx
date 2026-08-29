'use client'

import { useEffect, useState } from 'react'
import { Check, Shield, ShoppingCart, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/lib/design-system'
import { trackConversion } from '@/lib/tracking/pixels'
import { LAUNCH_SOLO_PROMO_CODE, resolveIntensiveLaunchPromoCode } from '@/lib/billing/launch-promo'
import { CTA_LABEL } from './primitives'

export function PricingBlock({ children }: { children?: React.ReactNode }) {
  const [planType, setPlanType] = useState<'solo' | 'household'>('solo')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay'>('full')
  const [isLoading, setIsLoading] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [referralSource, setReferralSource] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const promo = params.get('promo')
    const ref = params.get('ref') || params.get('source') || params.get('affiliate')
    let applied = false

    if (promo) {
      setPromoCode(promo)
      applied = true
    }
    if (ref) {
      setReferralSource(ref)
      if (!applied) {
        setPromoCode(LAUNCH_SOLO_PROMO_CODE)
        applied = true
      }
    }
    if (applied) setPaymentPlan('full')

    const campaign = params.get('campaign') || params.get('utm_campaign')
    if (campaign) setCampaignName(campaign)

    const type = params.get('plan') || params.get('type') || params.get('planType')
    if (type === 'solo' || type === 'household') setPlanType(type)
  }, [])

  const intensiveTotal = planType === 'solo' ? 499 : 699
  const twoPayInstallment = planType === 'solo' ? 275 : 399
  const twoPayTotal = planType === 'solo' ? 550 : 798
  const visionProPrice = planType === 'solo' ? 99 : 149
  const todayAmount = promoCode ? 1 : paymentPlan === '2pay' ? twoPayInstallment : intensiveTotal

  const features = [
    ...(planType === 'household' ? ['Everything for two logins under one roof'] : []),
    'Your Life I Choose™ — a vivid vision across all 12 life categories',
    'Your personalized Vision Audio to immerse yourself in your vision',
    'Your Vision Board to make the life you choose visible',
    'Your MAP (My Alignment Plan) to turn your vision into a daily practice',
    'Your Journal to help keep track of your journey.',
    'VIVA, your Vibrationally Intelligent Virtual Assistant, to help you turn contrast into clarity and return to your vision',
    'Your first 28 days of Vision Pro to practice living what you\'ve created',
    'The surrounding support of Vibe Tribe + Alignment Gym',
    `Then $${visionProPrice} every 28 days. Cancel any time.`,
  ]

  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      const visitorId = document.cookie.match(/(?:^|; )vf_visitor_id=([^;]*)/)?.[1]
      const sessionId = document.cookie.match(/(?:^|; )vf_session_id=([^;]*)/)?.[1]
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              product_key: 'intensive',
              plan: paymentPlan,
              continuity: '28day',
              plan_type: planType,
            },
          ],
          promoCode:
            paymentPlan === 'full' ? resolveIntensiveLaunchPromoCode(promoCode, planType) : undefined,
          referralSource: referralSource || undefined,
          campaignName: campaignName || undefined,
          visitorId,
          sessionId,
        }),
      })
      const data = await res.json()
      if (data.cartId) {
        trackConversion('initiate_checkout', { content_name: 'intensive', currency: 'USD', event_id: data.cartId })
        window.location.href = `/checkout/${data.cartId}`
        return
      }
      toast.error('Failed to create checkout session')
    } catch {
      toast.error('Network error. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <div id="pricing" className="scroll-mt-28">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 p-1.5">
            <button
              type="button"
              onClick={() => setPlanType('solo')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                planType === 'solo'
                  ? 'bg-[#39FF14] text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              Solo
            </button>
            <button
              type="button"
              onClick={() => setPlanType('household')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                planType === 'household'
                  ? 'bg-[#00FFFF] text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              Household
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
          {planType === 'solo' ? '1 login' : '2 logins'}
        </p>

        {promoCode ? (
          <div className="mt-5 text-center">
            <p className="text-3xl font-extrabold text-neutral-500 line-through">${intensiveTotal}</p>
            <p className="text-6xl font-extrabold leading-none text-[#39FF14] md:text-7xl">$1</p>
            <p className="mt-3 text-sm text-neutral-400">
              {promoCode.toUpperCase()} applied. Pay $1 today to verify your payment method.
            </p>
          </div>
        ) : (
          <div className="mt-5 text-center">
            <p className="text-6xl font-extrabold leading-none text-[#39FF14] md:text-7xl">${todayAmount}</p>
            {paymentPlan === '2pay' ? (
              <p className="mt-3 text-neutral-300">
                x 2 payments = ${twoPayTotal}
                <span className="mt-1 block text-sm text-neutral-500">14 days apart</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">today · best value</p>
            )}
          </div>
        )}

        {!promoCode ? (
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setPaymentPlan('full')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                paymentPlan === 'full'
                  ? 'bg-[#39FF14] text-black'
                  : 'border border-white/15 text-neutral-300 hover:text-white'
              }`}
            >
              Pay in Full
            </button>
            <button
              type="button"
              onClick={() => setPaymentPlan('2pay')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                paymentPlan === '2pay'
                  ? 'bg-[#39FF14] text-black'
                  : 'border border-white/15 text-neutral-300 hover:text-white'
              }`}
            >
              2 Payments
            </button>
          </div>
        ) : null}

        <p className="mt-8 text-left text-neutral-200">
          Over 72 hours, you&rsquo;ll build and activate your personal Conscious Creation System:
        </p>
        <ul className="mt-4 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex gap-3 text-left text-neutral-200">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm leading-relaxed text-neutral-400">
          {promoCode
            ? `$1 today verifies your card. The 72-Hour Vision Activation and your first 28 days of Vision Pro are included.`
            : paymentPlan === '2pay'
              ? `$${twoPayInstallment} today, then $${twoPayInstallment} in 14 days. Your first 28 days of Vision Pro are included.`
              : `$${intensiveTotal} today for the 72-Hour Vision Activation. Your first 28 days of Vision Pro are included.`}
        </p>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Day 28, Vision Pro continues at ${visionProPrice} every 28 days if you love it. Cancel any time
          before then.
        </p>

        <div className="mt-8 flex flex-col items-center">
          <Button variant="primary" size="lg" onClick={handlePurchase} disabled={isLoading}>
            {isLoading ? 'Processing...' : CTA_LABEL}
          </Button>
          <p className="mt-3 flex items-center gap-2 text-xs text-[#39FF14]">
            <ShoppingCart className="h-3.5 w-3.5" />
            Next step: secure checkout
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
            <Shield className="h-3.5 w-3.5 text-[#FFFF00]" />
            72-Hour Activation Guarantee
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Questions? Email{' '}
        <a href="mailto:team@vibrationfit.com" className="text-[#39FF14] underline underline-offset-4">
          team@vibrationfit.com
        </a>{' '}
        or see the{' '}
        <a href="#full-faq" className="text-[#39FF14] underline underline-offset-4">
          full FAQ
        </a>
        .
      </p>

      {children}
    </div>
  )
}
