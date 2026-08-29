'use client'

/**
 * Self-contained pricing + checkout section for the life-first sales page.
 * Replicates the homepage's commerce exactly (pricing math, promo/referral
 * URL handling, $1 launch-promo remap, /api/cart flow) without touching
 * src/app/page.tsx. When the life-first page is promoted to /, the homepage
 * can adopt this component as part of that swap.
 */

import React, { useState, useEffect } from 'react'
import { User, Users, Check, Clock, Shield, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import {
  Stack,
  Container,
  Card,
  Button,
  Badge,
  Grid,
  Heading,
  Text,
} from '@/lib/design-system'
import { trackConversion } from '@/lib/tracking/pixels'
import { resolveIntensiveLaunchPromoCode, LAUNCH_SOLO_PROMO_CODE } from '@/lib/billing/launch-promo'

// The $1 offer only applies via promo/referral links (?promo= or ?ref=).
// The plain page always shows full pricing.
const DOLLAR_OFFER_CODE = LAUNCH_SOLO_PROMO_CODE

export function IntensiveCheckout() {
  const [planType, setPlanType] = useState<'solo' | 'household'>('solo')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay'>('full')
  const [isLoading, setIsLoading] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [referralSource, setReferralSource] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState<string | null>(null)

  // Read promo code and affiliate params from URL on mount (mirrors homepage)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)

    const promo = params.get('promo')
    let promoApplied = false
    if (promo) {
      setPromoCode(promo)
      promoApplied = true
    }

    const ref = params.get('ref') || params.get('source') || params.get('affiliate')
    if (ref) {
      setReferralSource(ref)
      if (!promoApplied) {
        setPromoCode(DOLLAR_OFFER_CODE)
        promoApplied = true
      }
    }

    // $1 launch offer only applies to pay-in-full.
    if (promoApplied) {
      setPaymentPlan('full')
    }

    const campaign = params.get('campaign') || params.get('utm_campaign')
    if (campaign) {
      setCampaignName(campaign)
    }

    const type = params.get('plan') || params.get('type') || params.get('planType')
    if (type === 'solo' || type === 'household') {
      setPlanType(type)
    }
  }, [])

  // Pricing: $499 solo / $699 household PIF, or 2 payments of $275 / $399
  // (14 days apart). Continuity: $99 / $149 every 28 days.
  const getPaymentAmount = () => {
    if (paymentPlan === '2pay') return planType === 'solo' ? '275' : '399'
    return planType === 'solo' ? '499' : '699'
  }
  const getIntensiveTotal = () => (planType === 'solo' ? '499' : '699')
  const getTwoPayInstallment = () => (planType === 'solo' ? '275' : '399')
  const getTwoPayTotal = () => (planType === 'solo' ? '550' : '798')
  const getVisionProPrice = () => (planType === 'solo' ? '99' : '149')
  const getPromoDiscount = () => {
    const total = planType === 'solo' ? 499 : 699
    return (total - 1).toString()
  }

  const handleIntensivePurchase = async () => {
    setIsLoading(true)
    try {
      const visitorId = typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|; )vf_visitor_id=([^;]*)/)?.[1] || undefined
        : undefined
      const sessionId = typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|; )vf_session_id=([^;]*)/)?.[1] || undefined
        : undefined

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            product_key: 'intensive',
            plan: paymentPlan,
            continuity: '28day',
            plan_type: planType,
          }],
          // The $1 launch offer only applies to pay-in-full. Remap
          // LAUNCH2026 <-> HOUSEHOLD2026 so household stays $1, not $201.
          promoCode: paymentPlan === 'full'
            ? resolveIntensiveLaunchPromoCode(promoCode, planType)
            : undefined,
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
      } else {
        toast.error('Failed to create checkout session')
        setIsLoading(false)
      }
    } catch {
      toast.error('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Guarantees — part of the room, before the number */}
      <section id="our-guarantees">
        <Container size="xl">
          <div className="bg-[#1F1F1F] border-[#333] border-2 rounded-2xl p-4 md:p-6 lg:p-8">
            <Stack gap="xs" className="md:gap-3" align="center">
              <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <Heading level={2} className="text-center mb-0 md:mb-8">You Are Covered Twice</Heading>

              <Grid responsiveCols={{ mobile: 1, desktop: 2 }} gap="lg" className="w-full md:items-stretch">
                <div className="relative mt-28 md:mt-28 md:flex md:flex-col">
                  <div className="absolute -top-20 md:-top-24 left-1/2 -translate-x-1/2 w-40 h-40 md:w-48 md:h-48 z-10">
                    <img
                      src="https://media.vibrationfit.com/site-assets/brand/guarantees/72-hour-activation-guarantee.png"
                      alt="72 Hour Activation Guarantee"
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '100%' }}
                    />
                  </div>
                  <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 !pt-20 md:!pt-24 lg:!pt-24 md:flex-1 md:flex md:flex-col">
                    <Stack gap="md" align="center" className="pb-4 md:pb-0 md:flex-1">
                      <Heading level={3} className="text-base md:text-lg lg:text-xl text-white text-center !mb-0">
                        72-Hour Activation Guarantee
                      </Heading>
                      <div className="text-center">
                        <p className="text-sm md:text-base text-[#39FF14] font-semibold flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" />
                          Clock starts today
                        </p>
                      </div>
                      <Text size="sm" className="md:text-base text-white text-center">
                        Complete the guided Intensive in 72 hours. Not satisfied? Full refund of your ${getIntensiveTotal()} Intensive fee. No questions asked.
                      </Text>
                      <Text size="xs" className="md:text-sm text-neutral-300 text-center">
                        Completion = all 14 guided Activation Intensive steps done within 72 hours: Account Settings &amp; Baseline Intake, Profile complete, 12-category Life Vision built (with VIVA), Vision Audio &amp; Mix ready, Vision Board built (12 images), 1 journal entry logged, Vibe Tribe post + community engagement, Alignment Gym tour complete, MAP activated
                      </Text>
                    </Stack>
                  </Card>
                </div>

                <div className="relative mt-28 md:mt-28 md:flex md:flex-col">
                  <div className="absolute -top-20 md:-top-24 left-1/2 -translate-x-1/2 w-40 h-40 md:w-48 md:h-48 z-10">
                    <img
                      src="https://media.vibrationfit.com/site-assets/brand/guarantees/membership-guarantee.png"
                      alt="Membership Guarantee"
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '100%' }}
                    />
                  </div>
                  <Card variant="elevated" className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-[#14B8A6]/30 !pt-20 md:!pt-24 lg:!pt-24 md:flex-1 md:flex md:flex-col">
                    <Stack gap="md" align="center" className="pb-4 md:pb-0 md:flex-1">
                      <Heading level={3} className="text-base md:text-lg lg:text-xl text-white text-center !mb-0">
                        Membership Guarantee
                      </Heading>
                      <div className="text-center">
                        <p className="text-sm md:text-base text-[#8B5CF6] font-semibold flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" />
                          Clock starts today
                        </p>
                      </div>
                      <div className="text-sm md:text-base text-white text-center space-y-1">
                        <p>You have a 16-week satisfaction guarantee from your checkout date, no matter which plan you&apos;re on.</p>
                      </div>
                      <div className="text-xs md:text-sm text-neutral-300 text-center space-y-2">
                        <p className="font-semibold">Not satisfied within your 16-week window?</p>
                        <p>If your membership <strong className="font-semibold">hasn&apos;t billed yet</strong> (first charge is Day 28), we cancel the upcoming charge and end your membership at the end of the current paid period.</p>
                        <p>If it <strong className="font-semibold">has billed</strong> inside your 16-week window, we refund that charge and cancel all future renewals.</p>
                      </div>
                    </Stack>
                  </Card>
                </div>
              </Grid>
            </Stack>
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <Container size="xl">
          <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
            <Stack gap="xl" className="md:gap-12">
              <div className="text-center">
                <Heading level={2} className="text-white text-3xl md:text-5xl font-bold mb-6 md:mb-8">
                  Start Living the Life You Choose
                </Heading>
                <div className="w-full h-px bg-gradient-to-r from-[#39FF14]/0 via-[#39FF14]/60 to-[#39FF14]/0 mx-auto mb-6 md:mb-8"></div>
                <Heading level={3} className="mb-3 bg-gradient-to-r from-[#39FF14] via-[#14B8A6] to-[#8B5CF6] bg-clip-text text-transparent">
                  72-Hour Vision Activation Intensive
                </Heading>
                <Text size="xl" className="text-neutral-300 max-w-3xl mx-auto">
                  In 72 hours your Life Vision gets written, heard, seen, and scheduled. Then Vision Pro keeps it the signal you live from.
                </Text>
              </div>

              <Stack align="center" gap="md">
                {/* Solo / Household toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex w-auto items-center gap-1.5 p-1.5 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setPlanType('solo')}
                      className={`px-5 md:px-6 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 ${
                        planType === 'solo'
                          ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                      }`}
                    >
                      <span className="flex flex-col items-center gap-0">
                        <span className="flex items-center gap-1.5 md:gap-2">
                          <User className="w-4 h-4" />
                          <span>Solo</span>
                          <span className="hidden md:inline">·</span>
                          <span className="hidden md:inline">1 Login</span>
                        </span>
                        <span className="text-xs md:hidden">1 Login</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType('household')}
                      className={`px-5 md:px-6 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 ${
                        planType === 'household'
                          ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/30'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                      }`}
                    >
                      <span className="flex flex-col items-center gap-0">
                        <span className="flex items-center gap-1.5 md:gap-2">
                          <Users className="w-4 h-4" />
                          <span>Household</span>
                          <span className="hidden md:inline">·</span>
                          <span className="hidden md:inline">2 Logins</span>
                        </span>
                        <span className="text-xs md:hidden">2 Logins</span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <Heading level={3} className="text-white !mb-3">
                    {planType === 'solo'
                      ? 'Solo Activation Intensive + Vision Pro Membership'
                      : 'Household Activation Intensive + Vision Pro Membership'}
                  </Heading>
                  <Text size="base" className="text-neutral-300 max-w-3xl mx-auto">
                    {planType === 'solo'
                      ? 'Perfect if you are activating your own vision. Includes your first 28 days of Vision Pro Membership — then continues so your vision stays activated.'
                      : 'Best if you are activating with a partner or family. Includes your first 28 days of Household Vision Pro Membership — then continues so your vision stays activated.'}
                  </Text>
                </div>

                {promoCode && (
                  <div className="flex justify-center w-full px-2">
                    <Badge variant="premium" className="text-center whitespace-normal max-w-full">
                      {promoCode.toUpperCase()} Applied - Pay $1 Today to Verify Payment Method
                    </Badge>
                  </div>
                )}

                {/* Price + payment options */}
                <div className="text-center w-full max-w-2xl mx-auto">
                  {promoCode ? (
                    <div className="flex flex-col items-center gap-2 mb-2">
                      <div className="text-4xl md:text-6xl font-bold text-neutral-500 line-through opacity-50">
                        ${getIntensiveTotal()}
                      </div>
                      <div className="text-5xl md:text-7xl font-bold text-[#39FF14]">
                        $1
                      </div>
                      <div className="text-base md:text-xl text-white text-center">
                        ${getPromoDiscount()} Off - Pay $1 to Verify Payment Method
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 mb-2">
                      <div className="text-4xl md:text-6xl font-bold text-[#39FF14]">
                        ${getPaymentAmount()}
                      </div>
                      {paymentPlan === '2pay' ? (
                        <div className="text-lg md:text-xl text-white text-center">
                          × 2 Payments = ${getTwoPayTotal()}
                          <span className="block text-sm text-neutral-400 mt-1">14 days apart</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-400">today · best value</div>
                      )}
                    </div>
                  )}

                  {!promoCode && (
                    <Stack align="center" gap="sm" className="mt-3 md:mt-4 mb-3 md:mb-4">
                      <h3 className="text-lg font-bold text-white">Payment Options</h3>
                      <div className="flex flex-row gap-2 justify-center flex-wrap">
                        <Button
                          variant={paymentPlan === 'full' ? 'primary' : 'outline'}
                          size="md"
                          className="px-4 py-2 text-sm flex-shrink-0"
                          onClick={() => setPaymentPlan('full')}
                        >
                          Pay in Full
                        </Button>
                        <Button
                          variant={paymentPlan === '2pay' ? 'primary' : 'outline'}
                          size="md"
                          className="px-4 py-2 text-sm flex-shrink-0"
                          onClick={() => setPaymentPlan('2pay')}
                        >
                          2 Payments
                        </Button>
                      </div>
                    </Stack>
                  )}

                  <Card className="bg-[#1F1F1F]/80 border-2 border-[#39FF14]/30 rounded-xl p-3 md:p-4 w-full mt-4">
                    <div>
                      <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                        <div className="h-px flex-1 max-w-12 md:max-w-16 bg-gradient-to-r from-transparent to-[#39FF14]/50" />
                        <p className="text-sm md:text-base font-bold uppercase tracking-[0.18em] bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#39FF14] bg-clip-text text-transparent">
                          You&apos;ll Get
                        </p>
                        <div className="h-px flex-1 max-w-12 md:max-w-16 bg-gradient-to-l from-transparent to-[#39FF14]/50" />
                      </div>
                      <div className="flex flex-col gap-2.5 text-left">
                        {(planType === 'solo'
                          ? [
                              'Your Life Vision written across all 12 categories, with VIVA',
                              'Vision Audio, Vision Board, and your My Alignment Plan — the life, heard, seen, and scheduled',
                              'Private community + weekly live group coaching',
                              'Includes your first 28 days of Vision Pro Vibration Fit Membership',
                              `Then continues at $${getVisionProPrice()} every 28 days, cancel any time`,
                            ]
                          : [
                              'Everything in Solo, for your household',
                              'Vision tools for multiple members under one roof',
                              'Shared practices and accountability',
                              'Includes your first 28 days of Household Vision Pro Membership',
                              `Then continues at $${getVisionProPrice()} every 28 days, cancel any time`,
                            ]
                        ).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0 mt-0.5" />
                            <p className="text-white font-medium text-sm">{feature}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 pt-3 border-t border-[#39FF14]/20 text-xs text-neutral-500 text-center leading-relaxed">
                        After your first 28 days included, Vision Pro continues at ${getVisionProPrice()} every 28 days. Cancel anytime before Day 28 to avoid renewal.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Order summary + CTA */}
                <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                  <Stack gap="md" className="md:gap-8">
                    <Heading level={4} className="text-[#39FF14] text-center">Order Summary &amp; Renewal Terms</Heading>

                    <Stack gap="sm" align="center">
                      {promoCode && (
                        <Badge variant="premium" className="mb-2">
                          {promoCode.toUpperCase()} Applied - ${getPromoDiscount()} Off!
                        </Badge>
                      )}
                      <div className="text-white text-center text-sm md:text-base space-y-2">
                        <p>
                          <strong>Today:</strong>{' '}
                          {promoCode
                            ? <><span className="text-[#39FF14] font-bold">$1</span> payment verification + FREE 72-Hour Activation Intensive ({planType === 'solo' ? 'Solo' : 'Household'}) + your first 28 days of Vision Pro included.</>
                            : paymentPlan === '2pay'
                              ? <>${getTwoPayInstallment()} today, then ${getTwoPayInstallment()} in 14 days (total ${getTwoPayTotal()}) for the 72-Hour Activation Intensive ({planType === 'solo' ? 'Solo' : 'Household'}) + your first 28 days of Vision Pro included.</>
                              : <>${getIntensiveTotal()} for the 72-Hour Activation Intensive ({planType === 'solo' ? 'Solo' : 'Household'}) + your first 28 days of Vision Pro included.</>
                          }
                        </p>
                      </div>
                      <p className="text-neutral-400 text-xs text-center">
                        <Shield className="w-3 h-3 text-[#FFFF00] inline-block align-middle -mt-[2px] mr-1" aria-hidden />
                        72-Hour Activation Guarantee
                      </p>
                      <div className="text-white text-center text-sm md:text-base space-y-2">
                        <p>
                          <strong>Day 28:</strong>{' '}If you love it and do nothing, your Vision Pro membership continues at ${getVisionProPrice()} every 28 days.
                        </p>
                        <p className="text-neutral-400 text-sm">
                          You can cancel any time before Day 28 in your account settings — one click, no hoops.
                        </p>
                      </div>
                      <p className="text-neutral-400 text-xs text-center">
                        <Shield className="w-3 h-3 text-[#FFFF00] inline-block align-middle -mt-[2px] mr-1" aria-hidden />
                        16-week Membership Satisfaction Guarantee from today.
                      </p>
                    </Stack>

                    <div className="flex flex-col items-center">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={() => handleIntensivePurchase()}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? 'Processing...'
                          : promoCode
                            ? `Pay $1 & Start ${planType === 'solo' ? 'Solo' : 'Household'} Activation Intensive`
                            : paymentPlan === '2pay'
                              ? `Start with $${getTwoPayInstallment()} Today`
                              : 'Start Living the Life You Choose'}
                      </Button>
                      <p className="flex items-center justify-center gap-2 text-xs text-[#39FF14] text-center mt-2">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Next Step: Secure Checkout
                      </p>
                    </div>
                  </Stack>
                </Card>

                {/* Questions */}
                <Card className="bg-black/80 border-[#39FF14]/30 w-full max-w-5xl mx-auto text-center">
                  <Stack gap="sm" className="md:gap-4" align="center">
                    <Heading level={4} className="text-white">
                      Questions?
                    </Heading>
                    <Text size="base" className="text-neutral-300">
                      Email{' '}
                      <a
                        href="mailto:team@vibrationfit.com"
                        className="text-[#39FF14] underline underline-offset-4 hover:text-[#5EC49A] transition-colors"
                      >
                        team@vibrationfit.com
                      </a>{' '}
                      — first reply within 1 business day.
                    </Text>
                  </Stack>
                </Card>

                {/* FAQ — destination questions first, billing second */}
                <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                  <Stack gap="md">
                    <div className="text-center">
                      <Heading level={4} className="text-white font-bold border-b-2 border-[#39FF14] pb-2 inline-block">FAQ</Heading>
                    </div>
                    <Stack gap="sm" className="text-left">
                      {[
                        {
                          q: 'What if I don\u2019t know what I want?',
                          a: 'That is one of the two doors this was built for. You arrive knowing what hurts, and VIVA turns that contrast into clarity — a Life Vision drafted with you across all 12 categories within your 72 hours. You do not have to show up with a dream. You have to show up.',
                        },
                        {
                          q: 'What makes this different from other manifestation programs?',
                          a: 'Most programs hand you a sequence of internal shifts to master before you are allowed to align with what you want. We skip that. Alignment is alignment — the shifts happen naturally as you align with the wholeness of your true self. You start living from your vision on day one, and the system keeps it the dominant signal.',
                        },
                        {
                          q: 'What if I\u2019ve written visions before and nothing moved?',
                          a: 'Then you already know the document is not the destination. The difference here is not a better journal — it is a vision written in language you can live inside, then heard, seen, and scheduled every day until it is the signal you live from. Belief was never your missing piece. The daily signal was.',
                        },
                        {
                          q: 'When does billing start?',
                          a: `$${getIntensiveTotal()} today (or 2 payments of $${getTwoPayInstallment()}) for the Intensive + first 28 days of Vision Pro included. Day 28 your membership continues automatically at $${getVisionProPrice()} every 28 days.`,
                        },
                        {
                          q: 'Can I cancel my membership before Day 28?',
                          a: 'Yes — 1-click cancel anytime before Day 28 in your account.',
                        },
                        {
                          q: 'When do guarantees start?',
                          a: 'All guarantees start from your checkout date. Your 72-hour window begins the moment you enroll in the Intensive, and your Membership Satisfaction Guarantee runs for 16 weeks from that same checkout date, no matter which plan you choose.',
                        },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                            <h5 className="text-white font-semibold">{item.q}</h5>
                          </div>
                          <div className="ml-4 mb-0 text-justify">
                            <p className="text-neutral-300 text-sm">{item.a}</p>
                          </div>
                        </div>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </div>
        </Container>
      </section>
    </>
  )
}
