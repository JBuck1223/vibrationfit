// /src/app/pricing-hormozi/page.tsx
// HORMOZI PRICING: $499 Intensive + Vision Pro Annual/28-Day - NEW DESIGN SYSTEM

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
  Grid
} from '@/lib/design-system/components'
import { Check, Clock, Crown, Zap, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function PricingHormoziPage() {
  const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')
  const [isLoading, setIsLoading] = useState(false)

  // Calculate payment amounts
  const getPaymentAmount = () => {
    switch (paymentPlan) {
      case 'full':
        return 499
      case '2pay':
        return 249.50
      case '3pay':
        return 166.33
      default:
        return 499
    }
  }

  const handleIntensivePurchase = async () => {
    setIsLoading(true)
    
    try {
      // Redirect to combined checkout page with pre-selected options
      const params = new URLSearchParams({
        intensivePaymentPlan: paymentPlan,
        continuityPlan: billingPeriod,
      })
      
      window.location.href = `/checkout?${params.toString()}`

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <PageLayout showHeader={true}>
      <Container size="xl" className="py-16">
        
        {/* ================================================================ */}
        {/* TOP PRICING STRUCTURE */}
        {/* ================================================================ */}
        
        <Card variant="elevated" className="max-w-4xl mx-auto p-10 mb-16 border-2 border-[#39FF14]">
          <Stack align="center" gap="lg">
            
            {/* Main Price */}
            <div className="text-center">
              <div className="text-7xl font-bold text-[#39FF14] mb-4">
                ${getPaymentAmount()}{paymentPlan === 'full' ? '' : paymentPlan === '2pay' ? ' × 2' : ' × 3'}
              </div>
              <div className="text-2xl text-white mb-2">
                72-Hour Vision Activation Intensive + 8 weeks Vision Pro access
              </div>
              <div className="text-xl text-neutral-300">
                Then {billingPeriod === 'annual' ? '$999/year' : '$99 every 28 days'} starting Day 56
              </div>
              {paymentPlan !== 'full' && (
                <div className="text-lg text-neutral-400 mt-2">
                  Total: $499 • {paymentPlan === '2pay' ? '2 payments' : '3 payments'}
                </div>
              )}
            </div>

            {/* Payment Plan Options */}
            <Inline gap="md" className="justify-center">
              <Button
                variant={paymentPlan === 'full' ? 'primary' : 'outline'}
                size="lg"
                onClick={() => setPaymentPlan('full')}
              >
                Pay in Full
              </Button>
              <Button
                variant={paymentPlan === '2pay' ? 'primary' : 'outline'}
                size="lg"
                onClick={() => setPaymentPlan('2pay')}
              >
                2 Payments
              </Button>
              <Button
                variant={paymentPlan === '3pay' ? 'primary' : 'outline'}
                size="lg"
                onClick={() => setPaymentPlan('3pay')}
              >
                3 Payments
              </Button>
            </Inline>

            {paymentPlan === '2pay' && (
              <div className="text-neutral-400 text-sm text-center">
                $249.50 × 2 payments (same total)
              </div>
            )}
            {paymentPlan === '3pay' && (
              <div className="text-neutral-400 text-sm text-center">
                $166.33 × 3 payments (same total)
              </div>
            )}
          </Stack>
        </Card>

        {/* ================================================================ */}
        {/* MAIN OFFER DETAILS */}
        {/* ================================================================ */}
        
        <Card variant="elevated" className="max-w-6xl mx-auto p-12 mb-16">
          <Grid minWidth="300px" gap="lg" className="mb-12">
            
            {/* Left: What You Get */}
            <div>
              <Stack gap="lg">
                <h2 className="text-3xl font-bold text-white">What You Get:</h2>
                
                {/* 72-Hour Intensive */}
                <div className="rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333]">
                  <div className="flex flex-col gap-6 items-stretch">
                    <h3 className="text-xl font-bold text-[#39FF14]">72-Hour Vision Activation Intensive</h3>
                    <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                      {[
                        'Life Vision Draft + Final',
                        'Vision Board (Custom Built)',
                        'Two Activation Audios',
                        '7-Day Streak Launcher',
                        'Small-Group Calibration',
                        'Template Vault + Prompt Library',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                          <span className="text-neutral-200 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 8 Weeks Vision Pro */}
                <div className="rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333]">
                  <div className="flex flex-col gap-6 items-stretch">
                    <h3 className="text-xl font-bold text-[#14B8A6]">8 Weeks of Vision Pro Access</h3>
                    <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                      {[
                        'Full platform access',
                        'VIVA AI assistant',
                        'Unlimited visions',
                        'Journal & vision board',
                        'Audio generation',
                        'PDF exports',
                        'Actualization blueprints',
                        'Priority support',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                          <span className="text-neutral-200 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Stack>
            </div>

            {/* Right: Continuity Selection */}
            <div>
              <Stack gap="lg">
                <h2 className="text-3xl font-bold text-white">Choose Your Continuity Plan:</h2>
                <p className="text-neutral-400">
                  After 8 weeks, your Vision Pro membership continues with your selected plan. You can cancel anytime before Day 56.
                </p>

                {/* Annual Plan */}
                <Card 
                  variant={billingPeriod === 'annual' ? 'elevated' : 'default'}
                  hover
                  className={`cursor-pointer transition-all ${
                    billingPeriod === 'annual' ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''
                  }`}
                  onClick={() => setBillingPeriod('annual')}
                >
                  <Stack gap="md">
                    <Inline align="center" gap="sm">
                      <Crown className="w-6 h-6 text-[#39FF14]" />
                      <h3 className="text-xl font-bold text-white">Vision Pro Annual</h3>
                      <Badge variant="success">Best Value</Badge>
                    </Inline>
                    <div className="text-3xl font-bold text-[#39FF14]">$999/year</div>
                    <div className="text-neutral-400">$83/month • Save vs. every-4-weeks</div>
                  </Stack>
                </Card>

                {/* 28-Day Plan */}
                <Card 
                  variant={billingPeriod === '28day' ? 'elevated' : 'default'}
                  hover
                  className={`cursor-pointer transition-all ${
                    billingPeriod === '28day' ? 'ring-2 ring-[#14B8A6] border-[#14B8A6]' : ''
                  }`}
                  onClick={() => setBillingPeriod('28day')}
                >
                  <Stack gap="md">
                    <Inline align="center" gap="sm">
                      <Zap className="w-6 h-6 text-[#14B8A6]" />
                      <h3 className="text-xl font-bold text-white">Vision Pro 28-Day</h3>
                    </Inline>
                    <div className="text-3xl font-bold text-[#14B8A6]">$99/28 days</div>
                    <div className="text-neutral-400">$3.54/day • Flexible billing</div>
                  </Stack>
                </Card>
              </Stack>
            </div>
          </Grid>
        </Card>

        {/* ================================================================ */}
        {/* GUARANTEE & CTA */}
        {/* ================================================================ */}
        
        <Card variant="elevated" className="max-w-4xl mx-auto p-10 mb-16">
          <Stack gap="lg" align="center">
            
            {/* Guarantee */}
            <Card variant="glass" className="p-6 w-full">
              <Inline align="center" gap="md">
                <Sparkles className="w-6 h-6 text-[#39FF14] flex-shrink-0" />
                <Stack gap="sm">
                  <h3 className="text-xl font-bold text-white">72-Hour Activation Guarantee</h3>
                  <p className="text-neutral-300 text-sm">
                    Complete the intensive checklist and if your activation isn't live within 72 hours, 
                    get a full refund OR apply as credit to your Vision Pro membership. Plus, you can cancel anytime before Day 56 to avoid renewal.
                  </p>
                </Stack>
              </Inline>
            </Card>

            {/* CTA Button */}
            <Button
              variant="primary"
              size="xl"
              className="w-full"
              onClick={handleIntensivePurchase}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
                <Inline align="center" gap="sm">
                  {paymentPlan === 'full' 
                    ? 'Pay $499 Today & Start My 72-Hour Journey'
                    : `Pay $${getPaymentAmount()} ${paymentPlan === '2pay' ? '× 2' : '× 3'} & Start My 72-Hour Journey`
                  }
                  <ArrowRight className="w-6 h-6" />
                </Inline>
              )}
            </Button>

            <div className="text-center text-neutral-500 text-sm">
              Secure payment by Stripe • 14-day money-back guarantee • Cancel before Day 56 to avoid renewal
            </div>
          </Stack>
        </Card>

        {/* ================================================================ */}
        {/* TRUST SIGNALS */}
        {/* ================================================================ */}
        
        <Stack align="center" gap="md">
          <p className="text-neutral-400 text-center">
            <span className="text-[#39FF14] font-semibold">No surprises.</span> Cancel anytime before Day 56 to avoid renewal.
          </p>
          <p className="text-neutral-500 text-sm text-center">
            Join thousands of conscious creators transforming their lives with VibrationFit
          </p>
        </Stack>

      </Container>
    </PageLayout>
  )
}