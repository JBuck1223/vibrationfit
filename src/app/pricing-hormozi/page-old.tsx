// /src/app/pricing-hormozi/page.tsx
// HORMOZI PRICING: Single Offer + Continuity Toggle - $100M Playbook Structure

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
import { Check, Clock, Crown, Zap, ArrowRight, Sparkles, Shield, Star, Users, Activity, Brain, Mic, Image, BookOpen, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function PricingHormoziPage() {
  const [continuityPlan, setContinuityPlan] = useState<'annual' | '28day'>('annual')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const getPaymentAmount = () => {
    switch (paymentPlan) {
      case 'full': return 499
      case '2pay': return 249.50
      case '3pay': return 166.33
      default: return 499
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
    <PageLayout showHeader={true}>
      <Container size="lg" className="py-16">
        
        {/* ================================================================ */}
        COMMITMENT
        {/* ================================================================ */}
        
        <Card variant="elevated" className="max-w-4xl mx-auto p-12 mb-16 border-2 border-[#39FF14]">
          <Stack align="center" gap="lg">
            
            {/* OFFER HEADER */}
            <Stack align="center" gap="md">
              <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
                72‑Hour Vision Activation Intensive
              </h1>
              <div className="text-3xl md:text-4xl font-bold text-[#39FF14]">
                $499 today. Includes 8 weeks of Vision Pro access.
              </div>
              <p className="text-lg text-neutral-300 text-center max-w-2xl">
                Then continue at your choice below starting Day 56. Cancel anytime before Day 56 to avoid renewal.
              </p>
            </Stack>

            {/* CONTINUITY SELECTION */}
            <Card variant="default" className="p-8 w-full">
              <Stack gap="md">
                <h3 className="text-xl font-bold text-white text-center">
                  Choose how you want to continue after your 8 weeks
                </h3>
                
                <Grid minWidth="300px" gap="md">
                  {/* Annual Option (Default) */}
                  <Card 
                    variant={continuityPlan === 'annual' ? 'elevated' : 'default'}
                    hover
                    className={`cursor-pointer transition-all ${
                      continuityPlan === 'annual' ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''
                    }`}
                    onClick={() => setContinuityPlan('annual')}
                  >
                    <Stack gap="md">
                      <Inline align="center" gap="sm">
                        <Crown className="w-6 h-6 text-[#39FF14]" />
                        <h4 className="text-lg font-bold text-white">Annual</h4>
                        <Badge variant="success">Best Value</Badge>
                      </Inline>
                      <div className="text-2xl font-bold text-[#39FF14]">$999/year starting Day 56</div>
                      <div className="text-neutral-400">(save vs ongoing)</div>
                    </Stack>
                  </Card>

                  {/* Every 4 Weeks Option */}
                  <Card 
                    variant={continuityPlan === '28day' ? 'elevated' : 'default'}
                    hover
                    className={`cursor-pointer transition-all ${
                      continuityPlan === '28day' ? 'ring-2 ring-[#14B8A6] border-[#14B8A6]' : ''
                    }`}
                    onClick={() => setContinuityPlan('28day')}
                  >
                    <Stack gap="md">
                      <Inline align="center" gap="sm">
                        <Zap className="w-6 h-6 text-[#14B8A6]" />
                        <h4 className="text-lg font-bold text-white">Every 4 weeks</h4>
                      </Inline>
                      <div className="text-2xl font-bold text-[#14B8A6]">$99 per 28 days starting Day 56</div>
                      <div className="text-neutral-400">(flexible billing)</div>
                    </Stack>
                  </Card>
                </Grid>
              </Stack>
            </Card>

            {/* RENEWAL CLARITY BOX */}
            <Card variant="default" className="p-6 w-full bg-[#1F1F1F]/50 border-[#39FF14]/30">
              <Stack gap="sm">
                <h4 className="text-lg font-bold text-[#39FF14] text-center">Renewal Terms</h4>
                <div className="text-center space-y-2">
                  <div className="text-white">
                    <strong>Today:</strong> $499 for the 72‑Hour Intensive + 8 weeks included.
                  </div>
                  <div className="text-white">
                    <strong>Day 56:</strong> Your selected plan begins automatically.
                  </div>
                  <div className="text-white">
                    <strong>You can switch or cancel any time before Day 56 in one click.</strong>
                  </div>
                </div>
              </Stack>
            </Card>

            {/* PAYMENT PLAN OPTIONS */}
            <Stack align="center" gap="md">
              <h3 className="text-xl font-bold text-white">Payment Options</h3>
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
              {paymentPlan !== 'full' && (
                <div className="text-neutral-400 text-center">
                  {paymentPlan === '2pay' ? '$249.50 × 2 payments' : '$166.33 × 3 payments'} = $499 total
                </div>
              )}
            </Stack>

            {/* AGREEMENT CHECKBOX */}
            <Card variant="default" className="p-6 w-full">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-[#39FF14] bg-neutral-800 border-neutral-600 rounded focus:ring-[#39FF14] focus:ring-2"
                />
                <span className="text-sm text-neutral-300">
                  <span className="text-[#39FF14] font-semibold">I understand and agree my plan begins on Day 56 unless I cancel.</span>
                  <br />
                  I agree to the renewal terms above and understand that my Vision Pro membership will automatically renew starting Day 56 at the rate I selected. I can cancel anytime before Day 56 to avoid renewal.
                </span>
              </label>
            </Card>

            {/* CTA BUTTON */}
            <Button
              variant="primary"
              size="xl"
              className="w-full text-xl py-6"
              onClick={handleIntensivePurchase}
              disabled={isLoading || !agreedToTerms}
            >
              {isLoading ? 'Processing...' : (
                <Inline align="center" gap="sm">
                  Pay ${getPaymentAmount()} {paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? '× 2' : '× 3'} & Start My 72-Hour Journey
                  <ArrowRight className="w-6 h-6" />
                </Inline>
              )}
            </Button>
          </Stack>
        </Card>

        {/* ================================================================ */}
        {/* WHAT YOU GET TODAY (VALUE STACK) */}
        {/* ================================================================ */}
        
        <Card variant="elevated" className="max-w-6xl mx-auto p-12 mb-16">
          <Stack gap="lg">
            <h2 className="text-3xl font-bold text-white text-center">What You Get Today</h2>
            
            <Grid minWidth="300px" gap="lg">
              <ItemListCard
                title="72-Hour Vision Activation Intensive"
                items={[
                  'Vibration Assessment (84 questions)',
                  'Vision Builder (12 life categories)',
                  'VIVA AI guidance throughout',
                  'Vision Audio (AM/PM tracks)',
                  'Custom Vision Board',
                  'Journal & tracking tools',
                  '30-min Calibration Call',
                  'Activation Protocol'
                ]}
                iconColor="#39FF14"
                variant="default"
              />

              <ItemListCard
                title="8 Weeks of Vision Pro Access"
                items={[
                  'Full platform access',
                  'VIVA AI assistant',
                  'Unlimited visions',
                  'Audio generation',
                  'PDF exports',
                  'Actualization blueprints',
                  'Priority support',
                  'Community access'
                ]}
                iconColor="#14B8A6"
                variant="default"
              />
            </Grid>
          </Stack>
        </Card>

        {/* ================================================================ */}
        {/* GUARANTEE */}
        {/* ================================================================ */}
        
        <Card variant="default" className="max-w-4xl mx-auto p-8 mb-16 bg-[#1F1F1F]/50 border-[#39FF14]/30">
          <Stack align="center" gap="md">
            <Inline align="center" gap="sm">
              <Shield className="w-8 h-8 text-[#39FF14]" />
              <h3 className="text-2xl font-bold text-white">30-Day Money-Back Guarantee</h3>
            </Inline>
            <p className="text-lg text-neutral-300 text-center">
              Love it in 30 days or get a no‑questions‑asked refund.
            </p>
          </Stack>
        </Card>

        {/* ================================================================ */}
        {/* FAQ */}
        {/* ================================================================ */}
        
        <Card variant="elevated" className="max-w-4xl mx-auto p-12">
          <Stack gap="lg">
            <h2 className="text-3xl font-bold text-white text-center">Frequently Asked Questions</h2>
            
            <Stack gap="md">
              <Card variant="default" className="p-6">
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">When does billing start?</h4>
                  <p className="text-neutral-300">
                    You pay $499 today for the 72-Hour Intensive and 8 weeks of Vision Pro access. Your selected continuity plan (annual or every 4 weeks) begins automatically on Day 56.
                  </p>
                </Stack>
              </Card>

              <Card variant="default" className="p-6">
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">What if I cancel before Day 56?</h4>
                  <p className="text-neutral-300">
                    You can cancel anytime before Day 56 in one click from your dashboard. No charges will be made for your continuity plan if you cancel before then.
                  </p>
                </Stack>
              </Card>

              <Card variant="default" className="p-6">
                <Stack gap="sm">
                  <h4 className="text-lg font-bold text-white">Can I switch to annual later?</h4>
                  <p className="text-neutral-300">
                    Yes, you can upgrade to annual billing at any time from your dashboard. The savings will be prorated.
                  </p>
                </Stack>
              </Card>

              <Card variant="default" className="p-6">
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
      </Container>
    </PageLayout>
  )
}