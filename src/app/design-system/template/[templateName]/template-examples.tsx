'use client'

import { useState } from 'react'
import {
  Card,
  Stack,
  TwoColumn,
  Heading,
  Text,
  Icon,
  Button,
  Badge,
} from '@/lib/design-system/components'
import { Clock, Shield, Crown, Zap, Check } from 'lucide-react'

export function renderTemplateExample(templateId: string) {
  switch (templateId) {
    case 'guarantee-cards':
      return (
        <Card variant="elevated" className="bg-[#1F1F1F] border-[#333] p-6 md:p-8">
          <Stack gap="xs" className="md:gap-3" align="center">
            <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <Heading level={2} className="text-center mb-0">Our Guarantees</Heading>
            
            <TwoColumn gap="lg">
              {/* 72-Hour Activation Guarantee */}
              <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 relative pt-28 md:pt-32 mt-24 md:mt-28">
                <div className="absolute -top-[88px] md:-top-[104px] left-1/2 -translate-x-1/2 w-44 h-44 md:w-52 md:h-52 z-10">
                  <img 
                    src="https://media.vibrationfit.com/site-assets/brand/guarantees/72-hour-activation-guarantee.png" 
                    alt="72 Hour Activation Guarantee"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Stack gap="md" align="center" className="pb-2">
                  <Heading level={3} className="text-white text-center">
                    72‑Hour Activation Guarantee
                  </Heading>
                  <div className="text-center mb-2">
                    <p className="text-base text-[#39FF14] font-semibold flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Clock starts today
                    </p>
                  </div>
                  <Text size="base" className="text-white text-center">
                    If you complete all 10 steps in 72 hours and aren't satisfied, we'll refund you in full.
                  </Text>
                  <Text size="sm" className="text-neutral-300 text-center">
                    Completion = 70%+ Profile, 84‑Q Assessment, 12‑category Vision (with VIVA), AM/PM Vision Audio, Vision Board (12 images), 3 journal entries, Calibration call booked.
                  </Text>
                </Stack>
              </Card>

              {/* Membership Guarantee */}
              <Card variant="elevated" className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-[#14B8A6]/30 relative pt-28 md:pt-32 mt-24 md:mt-28">
                <div className="absolute -top-[88px] md:-top-[104px] left-1/2 -translate-x-1/2 w-44 h-44 md:w-52 md:h-52 z-10">
                  <img 
                    src="https://media.vibrationfit.com/site-assets/brand/guarantees/membership-guarantee.png"
                    alt="Membership Guarantee"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Stack gap="md" align="center">
                  <Heading level={3} className="text-white text-center">
                    Membership Guarantee
                  </Heading>
                  <div className="text-center mb-2">
                    <p className="text-base text-[#8B5CF6] font-semibold flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Clock starts today
                    </p>
                  </div>
                  <Text size="base" className="text-white text-center">
                    28‑Day Plan: 12‑week satisfaction guarantee from checkout.
                  </Text>
                  <Text size="base" className="text-white text-center">
                    Annual Plan: 16‑week satisfaction guarantee from checkout.
                  </Text>
                  <Text size="base" className="text-white text-center">
                    Not satisfied within your window? We'll refund the plan and cancel future renewals.
                  </Text>
                </Stack>
              </Card>
            </TwoColumn>
          </Stack>
        </Card>
      )

    case 'pricing-cards-toggle':
      const PricingCardsToggleDemo = () => {
        const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')

        return (
          <Stack gap="lg">
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

            {/* Pricing Cards - Show selected card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {billingPeriod === 'annual' && (
                <Card
                  className="border-2 border-[#39FF14] bg-gradient-to-br from-primary-500/5 to-secondary-500/5 scale-105 ring-2 ring-[#39FF14]"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="success">Best Value</Badge>
                  </div>

                  <div className="text-center mb-8">
                    <Icon icon={Crown} size="lg" color="#39FF14" className="mx-auto mb-4" />
                    <Heading level={3} className="mb-2">Vision Pro Annual</Heading>
                    <Text size="base" className="text-neutral-400 mb-6">Full year, full power</Text>
                    
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
                      'Platform access with all features',
                      '5M VIVA tokens/year + 100GB storage',
                      'Priority response queue',
                      '4 bonus calibration check-ins per year',
                      '60-day satisfaction guarantee',
                      '12-month rate lock',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Icon icon={Check} size="sm" color="#39FF14" className="flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {billingPeriod === '28day' && (
                <Card
                  className="border-2 border-[#00FFFF] bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 scale-105 ring-2 ring-[#00FFFF]"
                >
                  <div className="text-center mb-8">
                    <Icon icon={Zap} size="lg" color="#00FFFF" className="mx-auto mb-4" />
                    <Heading level={3} className="mb-2">Vision Pro 28-Day</Heading>
                    <Text size="base" className="text-neutral-400 mb-6">Flexible billing cycle</Text>
                    
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
                      'Platform access: same as Annual',
                      '375k VIVA tokens per 28 days + 25GB storage',
                      'Standard support queue',
                      '30-day satisfaction guarantee',
                      'Flexible — cancel any cycle',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Icon icon={Check} size="sm" color="#00FFFF" className="flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </Stack>
        )
      }
      return <PricingCardsToggleDemo />

    case 'payment-options':
      const PaymentOptionsDemo = () => {
        const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')

        return (
          <Stack gap="md" align="center">
            <Heading level={3} className="text-white">Payment Options</Heading>
            <div className="flex flex-row flex-wrap gap-2 justify-center w-full">
              <Button
                variant={paymentPlan === 'full' ? 'primary' : 'outline'}
                size="sm"
                className="px-2 py-2 text-xs flex-shrink-0 flex-1 min-w-0"
                onClick={() => setPaymentPlan('full')}
              >
                Pay in Full
              </Button>
              <Button
                variant={paymentPlan === '2pay' ? 'primary' : 'outline'}
                size="sm"
                className="px-2 py-2 text-xs flex-shrink-0 flex-1 min-w-0"
                onClick={() => setPaymentPlan('2pay')}
              >
                2 Payments
              </Button>
              <Button
                variant={paymentPlan === '3pay' ? 'primary' : 'outline'}
                size="sm"
                className="px-2 py-2 text-xs flex-shrink-0 flex-1 min-w-0"
                onClick={() => setPaymentPlan('3pay')}
              >
                3 Payments
              </Button>
            </div>
            <Text size="sm" className="text-neutral-400 text-center">
              Selected: {paymentPlan === 'full' ? 'Pay in Full' : paymentPlan === '2pay' ? '2 Payments' : '3 Payments'}
            </Text>
          </Stack>
        )
      }
      return <PaymentOptionsDemo />

    default:
      return (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">
            Template example coming soon for {templateId}
          </p>
        </Card>
      )
  }
}

