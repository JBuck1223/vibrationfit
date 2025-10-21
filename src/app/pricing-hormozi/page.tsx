// /src/app/pricing-hormozi/page.tsx
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
import { Check, Clock, Crown, Zap, ArrowRight, Shield, Users, Sparkles } from 'lucide-react'
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
    <PageLayout showHeader={true} containerSize="md">
      
      {/* MAIN OFFER */}
      <Stack gap="xl">
        
        {/* ACTIVATION INTENSIVE TITLE - FULL WIDTH */}
        <div className="text-center -mx-6 px-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#39FF14] via-[#14B8A6] to-[#39FF14] bg-clip-text text-transparent">
            72‑Hour Vision Activation Intensive
          </h1>
        </div>

        {/* MAIN PRICING CARD */}
        <Card variant="elevated" className="border-2 border-[#39FF14]">
          <Stack align="center" gap="lg">
            
            {/* DYNAMIC PRICE */}
            <div className="text-center">
              <div className="text-6xl md:text-8xl font-bold text-[#39FF14] mb-4">
                ${getPaymentAmount()}
                      </div>
              <div className="text-xl text-white mb-2">
                {paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? '× 2 Payments' : '× 3 Payments'}
              </div>
              <div className="text-lg text-neutral-300">
                Includes 8 weeks of Vision Pro access
                    </div>
              {paymentPlan !== 'full' && (
                <div className="text-sm text-neutral-400 mt-2">
                  Total: $499 • {paymentPlan === '2pay' ? '2 payments' : '3 payments'}
                </div>
              )}
            </div>

            {/* PAYMENT OPTIONS INSIDE CARD */}
            <Stack align="center" gap="md">
              <h3 className="text-lg font-bold text-white">Payment Options</h3>
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
            </Stack>

            {/* SEPARATOR */}
            <div className="w-full h-px bg-neutral-600"></div>

            <p className="text-lg text-neutral-300 text-center max-w-2xl">
              Then continue at your choice below starting Day 56. Cancel anytime before Day 56 to avoid renewal.
            </p>

            {/* CONTINUITY SELECTION */}
            <Stack gap="md">
              <h3 className="text-xl font-bold text-white text-center">
                Choose how you want to continue after your 8 weeks
              </h3>
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* Annual Option (Default Selected) */}
                <Card 
                  variant={continuityPlan === 'annual' ? 'elevated' : 'default'}
                  hover
                  className={`cursor-pointer transition-all ${
                    continuityPlan === 'annual' ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''
                  }`}
                  onClick={() => setContinuityPlan('annual')}
                >
                  <div className="flex flex-col gap-6 items-center text-center">
                    <div className="flex flex-col gap-4 items-center">
                      <Crown className="w-6 h-6 text-[#39FF14]" />
                      <h4 className="text-xl font-bold text-white">Annual — $999/year</h4>
                      <Badge variant="success">Best Value</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                        <span className="text-sm text-[#39FF14] font-medium">22% Savings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">= $76.85/28 days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">Billed Annually</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">5M tokens granted immediately</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">100GB storage</span>
                      </div>
                    </div>
              </div>
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
                  <div className="flex flex-col gap-6 items-center text-center">
                    <div className="flex flex-col gap-4 items-center">
                      <Zap className="w-6 h-6 text-[#14B8A6]" />
                      <h4 className="text-xl font-bold text-white">$99 every 28 days</h4>
                      <Badge variant="info">Flexible</Badge>
                </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                        <span className="text-sm text-[#14B8A6] font-medium">Flexible Billing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">375k tokens per cycle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">25GB storage base</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">3-cycle rollover max</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                        <span className="text-sm text-neutral-300">Cancel anytime before Day 56</span>
                      </div>
                    </div>
                </div>
                </Card>
            </div>
            </Stack>

            {/* RENEWAL TERMS & ORDER SUMMARY COMBINED */}
            <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30">
              <Stack gap="md">
                <h4 className="text-lg font-bold text-[#39FF14] text-center">Order Summary & Renewal Terms</h4>
                
                {/* Order Summary */}
                <Stack gap="sm" align="center">
                  <div className="text-white text-center">
                    <strong>Today:</strong> ${getPaymentAmount()}{paymentPlan === 'full' ? '' : paymentPlan === '2pay' ? ' × 2' : ' × 3'} for the 72‑Hour Intensive + 8 weeks included.
                  </div>
                  <div className="text-white text-center">
                    <strong>Day 56:</strong> {continuityPlan === 'annual' 
                      ? '$999 Payment (=$76.84/28 days). Renews annually.'
                      : '$99 Payment. Renews every 28 days.'
                    }
                  </div>
                  <div className="text-white text-center">
                    <strong>You can switch or cancel any time before Day 56.</strong>
                  </div>
                </Stack>

                {/* Required Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#39FF14] bg-neutral-800 border-neutral-600 rounded focus:ring-[#39FF14] focus:ring-2"
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
                      Pay ${getPaymentAmount()} {paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? '× 2' : '× 3'} & Start My 72-Hour Journey
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left: What You Get - Value Stack */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Complete Value Stack:</h3>
                <div className="space-y-4">
                  {[
                    { item: 'Life Vision Draft + Final', value: '$497' },
                    { item: 'Vision Board (Custom Built)', value: '$297' },
                    { item: 'Two Activation Audios', value: '$397' },
                    { item: '7-Day Streak Launcher', value: '$197' },
                    { item: 'Small-Group Calibration', value: '$197' },
                    { item: 'Template Vault + Prompt Library', value: '$244' },
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
                    <span className="text-[#39FF14]">$1,829</span>
                  </div>
                  <div className="flex items-center justify-between text-lg mt-2">
                    <span className="text-neutral-400">Your Price Today:</span>
                    <span className="text-[#39FF14] font-bold">$499</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-neutral-500">You Save:</span>
                    <span className="text-[#39FF14] font-bold">$1,330 (73% OFF)</span>
                  </div>
                </div>
              </div>

              {/* Right: Timeline - Enhanced Journey */}
              <div className="bg-neutral-900 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Your 72-Hour Journey:</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 0-1: Instant Start</div>
                      <div className="text-sm text-neutral-400">Intake form → AI generates first draft</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 1-24: Draft + Build</div>
                      <div className="text-sm text-neutral-400">Complete assessment, finalize vision & board</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 24-48: Record & Create</div>
                      <div className="text-sm text-neutral-400">Calibration call + personalized audios</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFB701]/20 flex items-center justify-center text-[#FFB701] font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Hour 48-72: Activate</div>
                      <div className="text-sm text-neutral-400">Protocol live, streak tracker installed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Stack>
        </Card>

        {/* ACTIVATION PROTOCOL BREAKDOWN */}
        <Card>
          <Stack gap="lg">
            <Stack align="center" gap="md">
              <h2 className="text-3xl font-bold text-white text-center">Activation Protocol Breakdown</h2>
              <p className="text-lg text-neutral-300 text-center max-w-3xl">
                The step-by-step process that transforms your life in 72 hours
              </p>
            </Stack>
            
            <Grid minWidth="300px" gap="lg">
              <Card className="p-6 border-2 border-[#39FF14]/30 bg-[#39FF14]/5">
                <Stack gap="md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#39FF14] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Foundation Phase</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Complete Vibration Assessment (84 questions)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Build life profile across 12 categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Schedule 1-on-1 calibration call</span>
                    </div>
                  </div>
                </Stack>
              </Card>

              <Card className="p-6 border-2 border-[#14B8A6]/30 bg-[#14B8A6]/5">
                <Stack gap="md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#14B8A6] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Vision Creation</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Create complete life vision with VIVA AI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Generate personalized audio tracks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Build custom vision board</span>
                    </div>
                  </div>
                </Stack>
              </Card>

              <Card className="p-6 border-2 border-[#8B5CF6]/30 bg-[#8B5CF6]/5">
                <Stack gap="md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#8B5CF6] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Activation Launch</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Complete calibration call</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Launch activation protocol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Begin 7-day streak tracking</span>
                    </div>
                  </div>
                </Stack>
              </Card>
            </Grid>
          </Stack>
        </Card>

        {/* 72-HOUR ACTIVATION GUARANTEE - ENHANCED */}
        <Card className="border-2 border-[#39FF14]/50 bg-gradient-to-r from-[#39FF14]/10 to-[#14B8A6]/10">
          <Stack align="center" gap="lg">
            <Stack align="center" gap="md">
              <Shield className="w-12 h-12 text-[#39FF14]" />
              <h2 className="text-3xl font-bold text-white text-center">72-Hour Activation Guarantee</h2>
              <p className="text-xl text-neutral-300 text-center max-w-3xl">
                Complete your intensive in 72 hours or get a full refund
              </p>
            </Stack>
            
            <div className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-700">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">What You're Guaranteed</h3>
                <p className="text-lg text-neutral-300">
                  Complete your intensive in 72 hours and you'll have everything you need to transform your life
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-[#39FF14]/20 border-[#39FF14]/50">
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
                  If you don't complete your intensive in 72 hours, you get a full refund.
                </p>
                <p className="text-sm text-neutral-400">
                  No questions asked. We're that confident in our system.
                </p>
              </div>
            </div>
          </Stack>
        </Card>

        {/* THEN CONTINUE WITH VISION PRO MEMBERSHIP */}
        <Card>
          <Stack gap="lg">
            <Stack align="center" gap="md">
              <h2 className="text-3xl font-bold text-white text-center">Then Continue With Vision Pro Membership</h2>
              <p className="text-lg text-neutral-300 text-center max-w-3xl">
                Keep your vision active with ongoing access, tools, and support
              </p>
            </Stack>
            
            <Grid minWidth="300px" gap="lg">
              <Card className="p-6 border-2 border-[#39FF14]/30">
                <Stack gap="md">
                  <Inline align="center" gap="sm">
                    <Crown className="w-6 h-6 text-[#39FF14]" />
                    <h3 className="text-xl font-bold text-white">Vision Pro Annual</h3>
                    <Badge variant="success">Best Value</Badge>
                  </Inline>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-[#39FF14] font-medium">22% Savings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">5M tokens granted immediately</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">100GB storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Priority support</span>
                    </div>
                  </div>
                </Stack>
              </Card>

              <Card className="p-6 border-2 border-[#14B8A6]/30">
                <Stack gap="md">
                  <Inline align="center" gap="sm">
                    <Zap className="w-6 h-6 text-[#14B8A6]" />
                    <h3 className="text-xl font-bold text-white">Vision Pro 28-Day</h3>
                    <Badge variant="info">Flexible</Badge>
                  </Inline>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-[#14B8A6] font-medium">Flexible Billing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">375k tokens per cycle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">25GB storage base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                      <span className="text-sm text-neutral-300">Cancel anytime</span>
                    </div>
                  </div>
                </Stack>
              </Card>
            </Grid>
          </Stack>
        </Card>

        {/* GUARANTEE */}
        <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30">
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
