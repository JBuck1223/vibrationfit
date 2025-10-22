// /src/app/pricing/page.tsx
// HORMOZI PRICING: Single Offer + Continuity Toggle - Design System Only

'use client'

import { useState } from 'react'
import { 
  PageLayout, 
  Container, 
  Card, 
  Button, 
  Badge,
  Stack,
  Inline,
  Grid,
  ItemListCard
} from '@/lib/design-system/components'
import { Check, Clock, Crown, Zap, ArrowRight, Shield, Users, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function PricingPage() {
  const [continuityPlan, setContinuityPlan] = useState<'annual' | '28day'>('annual')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')

  const getPaymentAmount = () => {
    switch (paymentPlan) {
      case 'full': return '499'
      case '2pay': return '249.50'
      case '3pay': return '166.33'
      default: return '499'
    }
  }

  const handleIntensivePurchase = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the renewal terms before proceeding.')
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        intensivePaymentPlan: paymentPlan,
        continuityPlan: continuityPlan,
      })
      window.location.href = `/checkout?${params.toString()}`
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <PageLayout containerSize="lg">
      
      {/* MAIN OFFER */}
      <Stack gap="xl">
        
        {/* ACTIVATION INTENSIVE TITLE - ENHANCED */}
        <div className="text-center">
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-gradient-to-r from-[#BF00FF]/20 to-[#8B5CF6]/20 text-[#BF00FF] border-[#BF00FF]/30 mb-4">
              <Clock className="w-4 h-4 inline mr-2" />
              72-Hour Activation
          </span>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#39FF14] via-[#14B8A6] to-[#8B5CF6] bg-clip-text text-transparent">
              Vision Activation Intensive
            </h1>
            <p className="text-2xl text-neutral-300 max-w-3xl mx-auto">
            Go from blank slate to fully activated in 72 hours. Vision drafted, board built, audios recorded, conscious creation system live.
            </p>
          </div>

        {/* MAIN PRICING CARD */}
        <Card variant="elevated" className="border-2 border-[#39FF14]">
          <Stack align="center" gap="lg">
            
            {/* DYNAMIC PRICE */}
            <div className="text-center">
              <div className="text-6xl md:text-8xl font-bold text-[#39FF14] mb-4">
                ${getPaymentAmount()}
                      </div>
              <div className="text-xl text-white mb-2 text-center">
                {paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? '× 2 Payments' : '× 3 Payments'}
              </div>
              <div className="text-lg text-neutral-300 text-center">
                Includes 8 weeks of Vision Pro access
                    </div>
              {paymentPlan !== 'full' && (
                <div className="text-sm text-neutral-400 mt-2 text-center">
                  Total: $499 • {paymentPlan === '2pay' ? '2 payments' : '3 payments'}
                </div>
              )}
            </div>

            {/* PAYMENT OPTIONS INSIDE CARD */}
            <Stack align="center" gap="md">
              <h3 className="text-lg font-bold text-white">Payment Options</h3>
              <div className="flex flex-row gap-2 justify-center flex-wrap">
                <Button
                  variant={paymentPlan === 'full' ? 'primary' : 'outline'}
                  size="md"
                  className="px-2 py-2 text-xs flex-shrink-0"
                  onClick={() => setPaymentPlan('full')}
                >
                  Pay in Full
                </Button>
                <Button
                  variant={paymentPlan === '2pay' ? 'primary' : 'outline'}
                  size="md"
                  className="px-2 py-2 text-xs flex-shrink-0"
                  onClick={() => setPaymentPlan('2pay')}
                >
                  2 Payments
                </Button>
                <Button
                  variant={paymentPlan === '3pay' ? 'primary' : 'outline'}
                  size="md"
                  className="px-2 py-2 text-xs flex-shrink-0"
                  onClick={() => setPaymentPlan('3pay')}
                >
                  3 Payments
                </Button>
              </div>
            </Stack>

            {/* SEPARATOR */}
            <div className="w-full h-px bg-neutral-600"></div>

            <p className="text-lg text-neutral-300 text-center max-w-2xl">
              Then continue at your choice below starting Day 56. Cancel anytime before Day 56 to avoid renewal.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700 mx-auto mb-8">
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                  billingPeriod === 'annual'
                    ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30 scale-105'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  Annual
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFB701] text-black shadow-md">
                    Save 22%
                  </span>
                </span>
              </button>
              <button
                onClick={() => setBillingPeriod('28day')}
                className={`px-4 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                  billingPeriod === '28day'
                    ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/30 scale-105'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                }`}
              >
                28-Day
              </button>
          </div>

            {/* VISION PRO MEMBERSHIP CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6 gap-y-12 max-w-5xl mx-auto mb-8">
              
              {/* Annual Plan - Show first on mobile if selected */}
              {billingPeriod === 'annual' && (
                <Card 
                  className={`p-10 transition-all relative cursor-pointer md:order-1 order-1 ${
                    billingPeriod === 'annual'
                      ? 'border-2 border-[#39FF14] bg-gradient-to-br from-primary-500/5 to-secondary-500/5 scale-105 ring-2 ring-[#39FF14]'
                      : 'border border-neutral-700 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setBillingPeriod('annual')}
                >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-[#39FF14] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                    Best Value
                    </div>
                </div>

              <div className="text-center mb-8">
                <Crown className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                <p className="text-neutral-400 mb-6">Full year, full power</p>
                
                <div className="inline-flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">$999</span>
                      <span className="text-xl text-neutral-400">/year</span>
                </div>
                <div className="text-neutral-500 text-sm mb-1">
                      $76.85/28 days, billed annually
                </div>
                <div className="text-primary-500 text-sm font-semibold">
                      Save 22% vs $99 every 28 days
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                      'VibrationFit platform access',
                      'Life Vision Builder and Assistant (12 Categories)',
                      'Vision Boards, Vision Audio, Immersion Tracks',
                      'VIVA AI assistant (5M tokens)',
                      'Journal, community access',
                      'Activation history & progress tracking',
                      'Library access & future features',
                      'Transparent renewal timing (starts Day 56)',
                      'Priority response queue',
                      '60-day satisfaction guarantee',
                      'Price locked for 12 months',
                      '4 bonus calibration check-ins per year',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-200 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-neutral-500 text-center mb-4">
                Tokens reset annually at renewal
              </div>
            </Card>
              )}

              {/* 28-Day Plan - Show first on mobile if selected */}
              {billingPeriod === '28day' && (
            <Card
                  className={`p-10 transition-all cursor-pointer md:order-2 order-1 ${
                billingPeriod === '28day'
                      ? 'border-2 border-[#00FFFF] bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 scale-105 ring-2 ring-[#00FFFF]'
                      : 'border border-neutral-700 opacity-60 hover:opacity-80'
              }`}
                  onClick={() => setBillingPeriod('28day')}
            >
              <div className="text-center mb-8">
                <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">Vision Pro 28-Day</h3>
                <p className="text-neutral-400 mb-6">Flexible billing cycle</p>
                
                <div className="inline-flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">$99</span>
                  <span className="text-xl text-neutral-400">/28 days</span>
                </div>
                <div className="text-neutral-500 text-sm mb-1">
                      Billed every 4 weeks
                </div>
                <div className="text-neutral-400 text-sm">
                  $1,287 per year (13 cycles)
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                      'VibrationFit platform access',
                      'Life Vision Builder and Assistant (12 Categories)',
                      'Vision Boards, Vision Audio, Immersion Tracks',
                      'VIVA AI assistant (375k tokens per 28 days)',
                      'Journal, community access',
                      'Activation history & progress tracking',
                      'Library access & future features',
                      'Transparent renewal timing (starts Day 56)',
                      '25GB storage',
                      'Standard support queue',
                      '30-day satisfaction guarantee',
                      'Flexible - cancel any cycle',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-200 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-neutral-500 text-center mb-4">
                Unused tokens roll over (max 3 cycles)
              </div>
            </Card>
              )}

              {/* Show unselected cards */}
              {billingPeriod !== 'annual' && (
                <Card 
                  className={`p-10 transition-all relative cursor-pointer md:order-1 order-2 ${
                    'border border-neutral-700 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setBillingPeriod('annual')}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-[#39FF14] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                      Best Value
                    </div>
          </div>

                  <div className="text-center mb-8">
                    <Crown className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                    <p className="text-neutral-400 mb-6">Full year, full power</p>
                    
                    <div className="inline-flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">$999</span>
                      <span className="text-xl text-neutral-400">/year</span>
                    </div>
                    <div className="text-neutral-500 text-sm mb-1">
                      $76.85/28 days, billed annually
                    </div>
                    <div className="text-primary-500 text-sm font-semibold">
                      Save 22% vs $99 every 28 days
          </div>
        </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'VibrationFit platform access',
                      'Life Vision Builder and Assistant (12 Categories)',
                      'Vision Boards, Vision Audio, Immersion Tracks',
                      'VIVA AI assistant (5M tokens)',
                      'Journal, community access',
                      'Activation history & progress tracking',
                      'Library access & future features',
                      'Transparent renewal timing (starts Day 56)',
                      '100GB storage',
                      'Priority response queue',
                      '60-day satisfaction guarantee',
                      'Price locked for 12 months',
                      '4 bonus calibration check-ins per year',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-neutral-500 text-center mb-4">
                    Tokens reset annually at renewal
                  </div>
                </Card>
              )}

              {billingPeriod !== '28day' && (
                <Card 
                  className={`p-10 transition-all cursor-pointer md:order-2 order-2 ${
                    'border border-neutral-700 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setBillingPeriod('28day')}
                >
                  <div className="text-center mb-8">
                    <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-white mb-2">Vision Pro 28-Day</h3>
                    <p className="text-neutral-400 mb-6">Flexible billing cycle</p>
                    
                    <div className="inline-flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">$99</span>
                      <span className="text-xl text-neutral-400">/28 days</span>
                    </div>
                    <div className="text-neutral-500 text-sm mb-1">
                      Billed every 4 weeks
                    </div>
                    <div className="text-neutral-400 text-sm">
                      $1,287 per year (13 cycles)
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'VibrationFit platform access',
                      'Life Vision Builder and Assistant (12 Categories)',
                      'Vision Boards, Vision Audio, Immersion Tracks',
                      'VIVA AI assistant (375k tokens per 28 days)',
                      'Journal, community access',
                      'Activation history & progress tracking',
                      'Library access & future features',
                      'Transparent renewal timing (starts Day 56)',
                      '25GB storage',
                      'Standard support queue',
                      '30-day satisfaction guarantee',
                      'Flexible - cancel any cycle',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-neutral-500 text-center mb-4">
                    Unused tokens roll over (max 3 cycles)
                  </div>
                </Card>
              )}
            </div>

            {/* RENEWAL TERMS & ORDER SUMMARY COMBINED */}
            <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30">
              <Stack gap="md">
                <h4 className="text-lg font-bold text-[#39FF14] text-center">Order Summary & Renewal Terms</h4>
                
                {/* Order Summary */}
                <Stack gap="sm" align="center">
                  <div className="text-white text-center">
                    {paymentPlan === 'full' ? (
                      <><strong>Today:</strong> $499 for the 72‑Hour Intensive + 8 weeks included.</>
                    ) : paymentPlan === '2pay' ? (
                      <>
                        <strong>Today:</strong> $249.50 for the 72‑Hour Intensive + 8 weeks included.<br />
                        <strong>In 4 weeks:</strong> $249.50 (final payment)
                      </>
                    ) : (
                      <>
                        <strong>Today:</strong> $166.33 for the 72‑Hour Intensive + 8 weeks included.<br />
                        <strong>In 4 weeks:</strong> $166.33<br />
                        <strong>In 8 weeks:</strong> $166.33 (final payment)
                      </>
                    )}
                  </div>
                  <div className="text-white text-center">
                    <strong>Day 56:</strong> {continuityPlan === 'annual' 
                      ? '$999 Payment (=$76.85/28 days). Renews annually.'
                      : '$99 Payment. Renews every 28 days.'
                    }
                  </div>
                  <div className="text-white text-center">
                    <strong>You can switch or cancel any time before Day 56.</strong>
                  </div>
                </Stack>

                {/* Required Checkbox */}
                <label className="flex items-center justify-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 text-[#39FF14] bg-neutral-800 border-neutral-600 rounded focus:ring-[#39FF14] focus:ring-2"
                  />
                  <span className="text-sm text-neutral-300">
                    <span className="text-[#39FF14] font-semibold">I agree to the renewal terms above.</span>
                  </span>
                </label>

                {/* CTA BUTTON */}
            <Button
              variant="primary"
              size="xl"
                  className="w-full"
              onClick={handleIntensivePurchase}
                  disabled={isLoading || !agreedToTerms}
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      <span className="hidden md:inline">Pay ${getPaymentAmount()} {paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? '× 2' : '× 3'} & Start My Journey</span>
                      <span className="md:hidden">Pay ${getPaymentAmount()} & Start</span>
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
            </Button>
              </Stack>
            </Card>
          </Stack>
          </Card>


        {/* WHAT YOU GET IN 72 HOURS - VALUE FOCUSED */}
        <Card variant="elevated" className="border-2 border-[#39FF14]/50 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
          <Stack gap="xl">
            <Stack align="center" gap="md">
              <h2 className="text-3xl font-bold text-white text-center">What You Get in 72 Hours</h2>
              <p className="text-lg text-neutral-300 text-center max-w-3xl">
                Your complete transformation toolkit delivered in just 3 days
              </p>
            </Stack>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left: 10-Step Journey */}
              <div className="bg-neutral-900 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Your 10-Step Activation Journey:</h3>
                <div className="space-y-4">
                  {[
                    { phase: 'Phase 1: Foundation (Hours 0-24)', steps: [
                      'Complete Profile - 70%+ completion required',
                      'Take Vibration Assessment - 84-question deep dive', 
                      'Book Calibration Call - 1-on-1 coach connection'
                    ]},
                    { phase: 'Phase 2: Vision Creation (Hours 24-48)', steps: [
                      'Build Life Vision - All 12 categories with VIVA AI',
                      'Refine Vision - Polish with custom tools & VIVA'
                    ]},
                    { phase: 'Phase 3: Activation Tools (Hours 48-72)', steps: [
                      'Generate Vision Audio - Morning & evening tracks',
                      'Create Vision Board - 1 image per category (12 total)',
                      'First 3 Journal Entries - Structured conscious creation'
                    ]},
                    { phase: 'Phase 4: Calibration & Launch', steps: [
                      'Attend Calibration Call - Live 30-minute session',
                      'Complete Activation Protocol - Daily rituals & ceremony'
                    ]}
                  ].map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="mb-6">
                      <div className="text-lg font-bold text-[#39FF14] mb-3">{phase.phase}</div>
                      <div className="space-y-2 ml-4">
                        {phase.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-neutral-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: What You Get - Value Stack */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Complete Value Stack:</h3>
                <div className="space-y-4">
                  {[
                    { item: 'Life Vision Locked In (12 Categories)', value: 'Priceless' },
                    { item: 'Personalized Vision Activation Audios', value: 'Priceless' },
                    { item: 'Vision Board (Custom Built with VIVA)', value: 'Priceless' },
                    { item: 'Conscious Creation Journal Established', value: 'Priceless' },
                    { item: 'Vibration Activation Streak Tracker', value: 'Priceless' },
                    { item: '1-on-1 Calibration Call (30 min)', value: 'Priceless' },
                    { item: 'Template Vault + VIVA Prompt Library', value: 'Priceless' },
                    { item: 'VIVA AI Assistant (1,000,000 tokens)', value: 'Priceless' },
                    { item: '8 Weeks Vision Pro Access Included', value: 'Priceless' },
                    { item: '72-Hour Intensive Dashboard & Tracking', value: 'Priceless' },
                    { item: 'World Class Support From Real People Who Care', value: 'Priceless' },
                  ].map(({ item, value }, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
                        <span className="text-neutral-200">{item}</span>
                      </div>
                      <span className="text-neutral-400 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-700">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span className="text-white">Total Stack Value:</span>
                    <span className="text-[#39FF14]">Infinite</span>
                  </div>
                  <div className="flex items-center justify-between text-lg mt-2">
                    <span className="text-neutral-400">Your Price Today:</span>
                    <span className="text-[#39FF14] font-bold">$499</span>
                  </div>
                  
                </div>
              </div>
            </div>
          </Stack>
        </Card>

        

        {/* 72-HOUR ACTIVATION GUARANTEE - ENHANCED */}
        <Card className="border-2 border-[#39FF14]/50 bg-gradient-to-r from-[#39FF14]/10 to-[#14B8A6]/10">
          <Stack align="center" gap="lg">
            <Stack align="center" gap="md">
              <Shield className="w-12 h-summary text-[#39FF14]" />
              <h2 className="text-3xl font-bold text-white text-center">72-Hour Activation Guarantee</h2>
              <p className="text-xl text-neutral-300 text-center max-w-3xl">
                Complete your intensive in 72 hours. If you're not completely satisfied, you get a full refund. No questions asked.    
              </p>
            </Stack>
            
            <div className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-700">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">What You're Guaranteed</h3>
                <p className="text-lg text-neutral-300">
                  Complete your intensive in 72 hours and you'll have a conscious creation system in your life.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-调度 bg-[#39FF14]/20 border-[#39FF14]/50">
                  <Stack gap="sm" align="center">
                    <Clock className="w-8 h-8 text-[#39FF14]" />
                    <h4 className="text-lg font-bold text-white">Time Commitment</h4>
                    <p className="text-neutral-300 text-center text-sm">Just 2-3 hours per day for 3 days</p>
                  </Stack>
                </Card>

                <Card className="p-6 bg-[#14B8A6]/20 border-[#14B8A6]/50">
                  <Stack gap="sm" align="center">
                    <Users className="w-8 h-8 text-[#14B8A6]" />
                    <h4 className="text-lg font-bold text-white">Personal Support</h4>
                    <p className="text-neutral-300 text-center text-sm">1-on-1 calibration call included</p>
                  </Stack>
                </Card>

                <Card className="p-6 bg-[#8B5CF6]/20 border-[#8B5CF6]/50">
                  <Stack gap="sm" align="center">
                    <Sparkles className="w-8 h-8 text-[#8B5CF6]" />
                    <h4 className="text-lg font-bold text-white">Guaranteed Results</h4>
                    <p className="text-neutral-300 text-center text-sm">Complete vision + activation tools</p>
                  </Stack>
                </Card>
            </div>

              <div className="mt-6 pt-6 border-t border-neutral-700 text-center">
                <p className="text-lg text-white font-semibold mb-2">
                  If you aren't satisfied in 72 hours, you get a full refund.
                </p>
                <p className="text-sm text-neutral-400">
                  No questions asked. We're that confident in our system.
              </p>
            </div>
          </div>
          </Stack>
        </Card>

        {/* FAQ */}
        <Card>
          <Stack gap="lg">
            <h2 className="text-3xl font-bold text-white text-center">Frequently Asked Questions</h2>
            
            <Stack gap="md">
              <Card>
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">When does billing start?</h4>
                  <p className="text-neutral-300">
                    You pay $499 today for the 72-Hour Intensive and 8 weeks of Vision Pro access. Your selected continuity plan (annual or every 4 weeks) begins automatically on Day 56.
                  </p>
                </Stack>
              </Card>

              <Card>
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">What if I cancel before Day 56?</h4>
                  <p className="text-neutral-300">
                    You can cancel anytime before Day 56 in one click from your dashboard. No charges will be made for your continuity plan if you cancel before then.
                  </p>
                </Stack>
              </Card>

              <Card>
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">Can I switch to annual later?</h4>
                  <p className="text-neutral-300">
                    Yes, you can upgrade to annual billing at any time from your dashboard. The savings will be prorated.
                  </p>
                </Stack>
              </Card>

              <Card>
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">What if I've tried Law of Attraction and failed?</h4>
                  <p className="text-neutral-300">
                    This is different. VibrationFit focuses on vibrational alignment and conscious creation, not just positive thinking. The 30-day guarantee ensures you can try risk-free.
                  </p>
                </Stack>
              </Card>
            </Stack>
          </Stack>
        </Card>

      </Stack>
    </PageLayout>
  )
}