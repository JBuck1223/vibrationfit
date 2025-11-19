// /src/app/checkout/page.tsx
// Combined Checkout: $499 Intensive + Vision Pro Continuity

'use client'

import React, { useState } from 'react'
import {  Container, Card, Button, Badge, Checkbox } from '@/lib/design-system/components'
import { Check, Clock, Crown, Zap, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const [continuityPlan, setContinuityPlan] = useState<'annual' | '28day'>('annual')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')
  const [isLoading, setIsLoading] = useState(false)

  // Read URL parameters for pre-selection
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlContinuityPlan = params.get('continuityPlan')
      const urlPaymentPlan = params.get('intensivePaymentPlan')
      
      if (urlContinuityPlan && ['annual', '28day'].includes(urlContinuityPlan)) {
        setContinuityPlan(urlContinuityPlan as 'annual' | '28day')
      }
      
      if (urlPaymentPlan && ['full', '2pay', '3pay'].includes(urlPaymentPlan)) {
        setPaymentPlan(urlPaymentPlan as 'full' | '2pay' | '3pay')
      }
    }
  }, [])

  const handleCombinedCheckout = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/checkout-combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensivePaymentPlan: paymentPlan,
          continuityPlan: continuityPlan,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`Failed to create checkout session: ${errorData.error || 'Unknown error'}`)
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  const getContinuityPrice = () => {
    if (continuityPlan === 'annual') {
      return { price: 999, period: 'year', monthlyEquivalent: 83 }
    } else {
      return { price: 99, period: '28 days', monthlyEquivalent: null }
    }
  }

  const getTotalPrice = () => {
    const intensivePrice = paymentPlan === 'full' ? 499 : paymentPlan === '2pay' ? 249.50 : 166.33
    const continuityPrice = getContinuityPrice().price
    return intensivePrice + continuityPrice
  }

  const continuityPrice = getContinuityPrice()

  return (
    <>
      <Container size="lg" className="py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="premium" className="mb-4">
            <Clock className="w-4 h-4 inline mr-2" />
            72-Hour Vision Activation Intensive
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Start Your Transformation
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
            Pay $499 today for the 72-Hour Vision Activation Intensive. Includes 8 weeks of Vision Pro access.
          </p>
        </div>

        {/* Combined Order Summary */}
        <Card className="max-w-4xl mx-auto p-10 border-2 border-primary-500 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 mb-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Intensive Details */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary-500" />
                72-Hour Vision Activation Intensive
              </h2>
              
              <div className="space-y-4 mb-6">
                {[
                  'Life Vision Draft + Final ($497 value)',
                  'Vision Board (Custom Built) ($297 value)', 
                  'Two Activation Audios ($397 value)',
                  '7-Day Streak Launcher ($197 value)',
                  'Small-Group Calibration ($197 value)',
                  'Template Vault + Prompt Library ($244 value)',
                  '8 weeks of VibrationFit membership included',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-200 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              {/* Intensive Payment Plan */}
              <div className="bg-neutral-900 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-white mb-3">Payment Plan:</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentPlan('full')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      paymentPlan === 'full'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    Pay in Full
                  </button>
                  <button
                    onClick={() => setPaymentPlan('2pay')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      paymentPlan === '2pay'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    2 Payments
                  </button>
                  <button
                    onClick={() => setPaymentPlan('3pay')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      paymentPlan === '3pay'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    3 Payments
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500 mb-1">
                  ${paymentPlan === 'full' ? '499' : paymentPlan === '2pay' ? '249.50' : '166.33'}
                </div>
                <div className="text-neutral-400 text-sm">
                  {paymentPlan === 'full' ? 'One-time payment' : 
                   paymentPlan === '2pay' ? '$249.50 × 2 payments' : 
                   '$166.33 × 3 payments'}
                </div>
              </div>
            </div>

            {/* Right: Continuity Selection */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Crown className="w-6 h-6 text-secondary-500" />
                Vision Pro Membership
              </h2>

              {/* Continuity Plan Selection */}
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setContinuityPlan('annual')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    continuityPlan === 'annual'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-bold text-white mb-1">Vision Pro Annual</div>
                      <div className="text-sm text-neutral-400">Best Value • Save 17%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">$999</div>
                      <div className="text-xs text-neutral-400">$83/month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setContinuityPlan('28day')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    continuityPlan === '28day'
                      ? 'border-secondary-500 bg-secondary-500/10'
                      : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-bold text-white mb-1">Vision Pro 28-Day</div>
                      <div className="text-sm text-neutral-400">Flexible billing</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">$99</div>
                      <div className="text-xs text-neutral-400">every 28 days</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continuity Features */}
              <div className="space-y-2 mb-6">
                <div className="text-sm font-semibold text-neutral-400 mb-3">What's Included:</div>
                {continuityPlan === 'annual' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>5,000,000 tokens (granted immediately)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>100GB storage</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>All Vision Pro features</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <span>375,000 tokens per cycle</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <span>25GB storage base</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <span>Rollover up to 3 cycles max</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-500 mb-1">
                  ${continuityPrice.price}
                </div>
                <div className="text-neutral-400 text-sm">
                  {continuityPrice.period}
                  {continuityPrice.monthlyEquivalent && ` • $${continuityPrice.monthlyEquivalent}/month`}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-neutral-700 pt-8 mt-8">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary-500 mb-2">
                $499 Today
              </div>
              <div className="text-neutral-300 mb-4">
                72-Hour Vision Activation Intensive
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-neutral-900 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-white mb-4 text-center">What Happens Next:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold text-sm mt-0.5">1</div>
                  <div>
                    <div className="font-semibold text-white">Today: Complete Your Order</div>
                    <div className="text-sm text-neutral-400">Pay $499 for your 72-Hour Vision Activation Intensive</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary-500/20 flex items-center justify-center text-secondary-500 font-bold text-sm mt-0.5">2</div>
                  <div>
                    <div className="font-semibold text-white">Includes: 8 Weeks of Vision Pro Access</div>
                    <div className="text-sm text-neutral-400">Full platform access with all features during your intensive</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-500 font-bold text-sm mt-0.5">3</div>
                  <div>
                    <div className="font-semibold text-white">Day 56: Continue with Vision Pro</div>
                    <div className="text-sm text-neutral-400">
                      {continuityPlan === 'annual' 
                        ? '$999/year (save vs. every-4-weeks)'
                        : '$99 every 4 weeks beginning Day 56'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renewal Terms */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="font-bold text-white mb-2">Renewal Terms You Agree To Now:</div>
                <div className="text-sm text-neutral-300">
                  {continuityPlan === 'annual' ? (
                    <>
                      <span className="text-primary-500 font-semibold">$999 per year starting Day 56</span>
                      <br />
                      <span className="text-neutral-400">(Save vs. every-4-weeks pricing)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-primary-500 font-semibold">$99 every 4 weeks beginning Day 56</span>
                      <br />
                      <span className="text-neutral-400">(13 cycles per year)</span>
                    </>
                  )}
                  <br />
                  <span className="text-neutral-400">You can cancel anytime before Day 56 to avoid renewal.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold text-white mb-2">72-Hour Activation Guarantee</div>
                <div className="text-sm text-neutral-300">
                  Complete the intensive checklist and if your activation isn't live within 72 hours, 
                  get a full refund OR apply as credit to your Vision Pro membership.
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Checkbox
                  required
                />
              </div>
              <span className="text-sm text-neutral-300">
                <span className="text-primary-500 font-semibold">I agree to the renewal terms above.</span>
                <br />
                I understand that my Vision Pro membership will automatically renew starting Day 56 at the rate I selected above. I can cancel anytime before Day 56 to avoid renewal.
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            variant="primary"
            size="xl"
            className="w-full text-xl py-6 mb-4"
            onClick={handleCombinedCheckout}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (
              <span className="flex items-center justify-center gap-3">
                Pay $499 Today & Start My 72-Hour Journey
                <ArrowRight className="w-6 h-6" />
              </span>
            )}
          </Button>

          <div className="text-center text-neutral-500 text-sm">
            Secure payment by Stripe • 14-day money-back guarantee • Cancel before Day 56 to avoid renewal
          </div>
        </Card>

        {/* Trust Signals */}
        <div className="text-center mt-8">
          <p className="text-neutral-400 mb-2">
            <span className="text-primary-500 font-semibold">No surprises.</span> Cancel anytime before Day 56 to avoid renewal.
          </p>
          <p className="text-neutral-500 text-sm">
            Join thousands of conscious creators transforming their lives with VibrationFit
          </p>
        </div>
      </Container>
    </>
  )
}
