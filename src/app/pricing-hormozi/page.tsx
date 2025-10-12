// /src/app/pricing-hormozi/page.tsx
// HORMOZI PRICING: $499 Intensive + Vision Pro Annual/28-Day

'use client'

import { useState } from 'react'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system/components'
import { Check, Sparkles, Clock, Zap, Crown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function PricingHormoziPage() {
  const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')
  const [isLoading, setIsLoading] = useState(false)

  const handleIntensivePurchase = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Create checkout session for intensive
      const response = await fetch('/api/stripe/checkout-intensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentPlan,
          continuityPlan: billingPeriod, // Pre-select continuity for upsell
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-16">
        
        {/* ================================================================ */}
        {/* STEP 1: 72-HOUR INTENSIVE */}
        {/* ================================================================ */}
        
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="premium" className="mb-4">
              <Clock className="w-4 h-4 inline mr-2" />
              72-Hour Activation
            </Badge>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              Vision Activation Intensive
            </h1>
            <p className="text-2xl text-neutral-300 max-w-3xl mx-auto">
              Go from blank slate to fully activated in 72 hours. Vision drafted, board built, audios recorded, protocol live.
            </p>
          </div>

          <Card className="max-w-5xl mx-auto p-12 border-2 border-primary-500 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            
            {/* Value Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              {/* Left: What You Get */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">What You Get in 72 Hours:</h3>
                <div className="space-y-4">
                  {[
                    { item: 'Life Vision Draft + Final', value: '$497' },
                    { item: 'Vision Board (Custom Built)', value: '$297' },
                    { item: 'Two Activation Audios', value: '$397' },
                    { item: '7-Day Streak Launcher', value: '$197' },
                    { item: 'Small-Group Calibration', value: '$197' },
                    { item: 'Template Vault', value: '$147' },
                    { item: 'Prompt Library', value: '$97' },
                  ].map(({ item, value }, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <span className="text-neutral-200">{item}</span>
                      </div>
                      <span className="text-neutral-400 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-700">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span className="text-white">Total Stack Value:</span>
                    <span className="text-primary-500">$1,829</span>
                  </div>
                </div>
              </div>

              {/* Right: Timeline */}
              <div className="bg-neutral-900 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Your 72-Hour Journey:</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 0-1: Instant Start</div>
                      <div className="text-sm text-neutral-400">Intake form → AI generates first draft</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-500/20 flex items-center justify-center text-secondary-500 font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 1-24: Draft + Build</div>
                      <div className="text-sm text-neutral-400">90-min builder session, finalize vision & board</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-500 font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 24-36: Record</div>
                      <div className="text-sm text-neutral-400">Calibration call + personalized audios</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-energy-500/20 flex items-center justify-center text-energy-500 font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 36-72: Activate</div>
                      <div className="text-sm text-neutral-400">Protocol live, streak tracker installed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8 py-8 border-y border-neutral-700">
              <div className="text-6xl font-bold text-white mb-2">
                $499
              </div>
              <div className="text-neutral-400 mb-6">
                One-time activation investment
              </div>

              {/* Payment Plan Options */}
              <div className="flex gap-3 justify-center mb-4">
                <button
                  onClick={() => setPaymentPlan('full')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    paymentPlan === 'full'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  Pay in Full
                </button>
                <button
                  onClick={() => setPaymentPlan('2pay')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    paymentPlan === '2pay'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  2 Payments
                </button>
                <button
                  onClick={() => setPaymentPlan('3pay')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    paymentPlan === '3pay'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  3 Payments
                </button>
              </div>

              {paymentPlan === '2pay' && (
                <div className="text-neutral-400 text-sm">
                  $249.50 × 2 payments (same total)
                </div>
              )}
              {paymentPlan === '3pay' && (
                <div className="text-neutral-400 text-sm">
                  $166.33 × 3 payments (same total)
                </div>
              )}
            </div>

            {/* Guarantee */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-white mb-2">72-Hour Activation Guarantee</div>
                  <div className="text-sm text-neutral-300">
                    Complete the checklist (intake, builder, calibration, activation protocol) and if your activation isn't live within 72 hours, get a full refund OR apply as credit to Vision Pro Annual.
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              size="xl"
              className="w-full text-xl py-6"
              onClick={handleIntensivePurchase}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Start Your 72-Hour Activation →'}
            </Button>

            <div className="text-center text-neutral-500 text-sm mt-4">
              Secure payment by Stripe • 14-day money-back guarantee
            </div>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* STEP 2: CONTINUITY (Vision Pro) */}
        {/* ================================================================ */}

        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge variant="success" className="mb-4">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Then Continue With
            </Badge>
            <h2 className="text-5xl font-bold mb-4 text-white">
              Vision Pro Membership
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
              Keep your vision active with ongoing access, tools, and support
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700">
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-8 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                  billingPeriod === 'annual'
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  Annual
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-energy-500 text-black shadow-md">
                    Save 17%
                  </span>
                </span>
              </button>
              <button
                onClick={() => setBillingPeriod('28day')}
                className={`px-8 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                  billingPeriod === '28day'
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                }`}
              >
                28-Day
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            {/* Annual Plan */}
            <Card
              className={`p-10 transition-all ${
                billingPeriod === 'annual'
                  ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 scale-105'
                  : 'border border-neutral-700 opacity-60'
              }`}
            >
              {billingPeriod === 'annual' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="success" className="px-4 py-1">
                    Best Value
                  </Badge>
                </div>
              )}

              <div className="text-center mb-8">
                <Crown className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                <p className="text-neutral-400 mb-6">Full year, full power</p>
                
                <div className="inline-flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">$83</span>
                  <span className="text-xl text-neutral-400">/month</span>
                </div>
                <div className="text-neutral-500 text-sm mb-1">
                  $999 billed annually
                </div>
                <div className="text-primary-500 text-sm font-semibold">
                  Buy 10 months, get 2 free
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  '5,000,000 tokens (granted immediately)',
                  '100GB storage',
                  'Unlimited life visions',
                  'VIVA assistant (unlimited)',
                  'Vibrational assessment',
                  'Journal & vision board',
                  'Audio generation',
                  'PDF exports',
                  'Actualization blueprints',
                  'Priority support',
                  'All future features',
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

            {/* 28-Day Plan */}
            <Card
              className={`p-10 transition-all ${
                billingPeriod === '28day'
                  ? 'border-2 border-secondary-500 bg-gradient-to-br from-secondary-500/5 to-accent-500/5 scale-105'
                  : 'border border-neutral-700 opacity-60'
              }`}
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
                  $3.54 per day • Billed every 4 weeks
                </div>
                <div className="text-neutral-400 text-sm">
                  $1,287 per year (13 cycles)
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  '375,000 tokens per cycle',
                  '25GB storage base',
                  'Rollover up to 3 cycles max',
                  'All Vision Pro features',
                  'Unlimited visions',
                  'VIVA assistant',
                  'Assessment & journal',
                  'Vision board',
                  'Audio generation',
                  'Standard support',
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
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-8 text-neutral-400">
            <p className="mb-2">
              Continuity membership bundled with your Intensive purchase
            </p>
            <p className="text-sm text-neutral-500">
              Cancel anytime • Secure payment by Stripe
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* FAQ / TRUST SIGNALS */}
        {/* ================================================================ */}

        <Card className="p-10 bg-neutral-900 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Common Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">What happens in the 72-hour intensive?</h3>
              <p className="text-neutral-400 text-sm">
                You'll move through 4 stages: (1) Instant Start with AI-generated draft, (2) 90-min builder to finalize your vision, (3) Calibration call + personalized audio generation, (4) Activation protocol goes live with reminders and streak tracking. Everything is operational in 72 hours.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Do I need the continuity membership after the intensive?</h3>
              <p className="text-neutral-400 text-sm">
                The intensive builds your foundation, but the continuity keeps it active. You'll need ongoing access to your audios, VIVA assistant, journal, and vision board to stay aligned. Think of intensive as the kickstart, continuity as the operating system.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">What are tokens and how do they work?</h3>
              <p className="text-neutral-400 text-sm">
                Tokens power all AI features (VIVA refinements, chat, audio, transcription). Annual gets 5M tokens immediately. 28-Day gets 375k per cycle with rollover up to 3 cycles. Most users use 300k-500k/month. You can buy token packs if you need more.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">What if I don't complete the intensive in 72 hours?</h3>
              <p className="text-neutral-400 text-sm">
                If you complete the required checklist (intake, builder, calibration, activation start) and your activation isn't live within 72 hours, you get a full refund OR we'll apply it as credit to your annual membership. No-risk guarantee.
              </p>
            </div>
          </div>
        </Card>

      </Container>
    </PageLayout>
  )
}

