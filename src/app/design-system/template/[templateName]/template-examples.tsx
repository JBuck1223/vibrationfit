'use client'

import { useState } from 'react'
import {
  Card,
  CategoryCard,
  Stack,
  TwoColumn,
  Heading,
  Text,
  Icon,
  Button,
  Badge,
} from '@/lib/design-system/components'
import { Clock, Shield, Crown, Zap, Check, Filter, CheckCircle } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export function renderTemplateExample(templateId: string) {
  switch (templateId) {
    case 'guarantee-cards':
      return (
        <Card variant="elevated" className="bg-[#1F1F1F] border-[#333] p-6 md:p-8">
          <Stack gap="xs" className="md:gap-3" align="center">
            <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <Heading level={2} className="text-center mb-0 md:mb-8">Our Guarantees</Heading>
            
            <TwoColumn gap="lg">
              {/* 72-Hour Activation Guarantee */}
              <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 relative !pt-24 md:!pt-24 lg:!pt-24 mt-24 md:mt-28">
                <div className="absolute -top-[88px] md:-top-[104px] left-1/2 -translate-x-1/2 w-44 h-44 md:w-52 md:h-52 z-10">
                  <img 
                    src="https://media.vibrationfit.com/site-assets/brand/guarantees/72-hour-activation-guarantee.png" 
                    alt="72 Hour Activation Guarantee"
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '100%' }}
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
              <Card variant="elevated" className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-[#14B8A6]/30 relative !pt-24 md:!pt-24 lg:!pt-24 mt-24 md:mt-28">
                <div className="absolute -top-[88px] md:-top-[104px] left-1/2 -translate-x-1/2 w-44 h-44 md:w-52 md:h-52 z-10">
                  <img 
                    src="https://media.vibrationfit.com/site-assets/brand/guarantees/membership-guarantee.png"
                    alt="Membership Guarantee"
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '100%' }}
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

    case 'category-selection-grid':
      const CategorySelectionGridDemo = () => {
        const [selectedCategories, setSelectedCategories] = useState<string[]>([])

        const handleCategoryToggle = (categoryKey: string) => {
          setSelectedCategories(prev => 
            prev.includes(categoryKey)
              ? prev.filter(key => key !== categoryKey)
              : [...prev, categoryKey]
          )
        }

        const handleSelectAll = () => {
          if (selectedCategories.length === VISION_CATEGORIES.length) {
            setSelectedCategories([])
          } else {
            setSelectedCategories(VISION_CATEGORIES.map(c => c.key))
          }
        }

        return (
          <Stack gap="md">
            <Card className="p-6">
              <div className="text-center mb-6">
                <Heading level={3} className="text-white mb-2">
                  Life Vision Category Selection Grid
                </Heading>
                <p className="text-sm text-neutral-400 mb-4">
                  Live example from /life-vision/[id] - 4 cols mobile, 5 cols tablet, 7 cols iPad landscape, 14 cols desktop
                </p>
              </div>

              {/* Select All Button */}
              <div className="flex justify-center mb-6">
                <Button
                  onClick={handleSelectAll}
                  variant={selectedCategories.length === VISION_CATEGORIES.length ? "primary" : "outline"}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {selectedCategories.length === VISION_CATEGORIES.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Category Grid - Matches /life-vision/[id] exactly */}
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1">
                {VISION_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.key)
                  return (
                    <CategoryCard 
                      key={category.key} 
                      category={category} 
                      selected={isSelected} 
                      onClick={() => handleCategoryToggle(category.key)}
                      variant="outlined"
                      selectionStyle="border"
                      iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                      selectedIconColor="#39FF14"
                      className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : ''}
                    />
                  )
                })}
              </div>
            </Card>
          </Stack>
        )
      }
      return <CategorySelectionGridDemo />

    case 'vision-board-filter-grid':
      const VisionBoardFilterGridDemo = () => {
        const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])

        const toggleCategory = (key: string) => {
          if (key === 'all') {
            setSelectedCategories(['all'])
          } else if (selectedCategories.includes(key)) {
            const newSelection = selectedCategories.filter(cat => cat !== key)
            setSelectedCategories(newSelection.length === 0 ? ['all'] : newSelection)
          } else {
            const filtered = selectedCategories.filter(cat => cat !== 'all')
            setSelectedCategories([...filtered, key])
          }
        }

        return (
          <Stack gap="md">
            <div>
              <Heading level={3} className="text-white mb-4">
                Filter Categories
              </Heading>
              <p className="text-sm text-neutral-400 mb-4">
                4 columns mobile, 12 columns desktop - square aspect ratio cards
              </p>
              
              {/* All Categories button */}
              <div 
                className={`rounded-2xl p-4 border-2 cursor-pointer mb-4 transition-all ${
                  selectedCategories.includes('all') || selectedCategories.length === 0
                    ? 'border-[#39FF14] bg-[#39FF14]/10'
                    : 'border-[#333] bg-[#1F1F1F] hover:border-[#333]'
                }`}
                onClick={() => toggleCategory('all')}
              >
                <div className="flex items-center justify-center gap-3 px-4 py-2">
                  <Icon 
                    icon={Filter} 
                    size="sm" 
                    color={selectedCategories.includes('all') || selectedCategories.length === 0 ? '#39FF14' : '#00FFFF'} 
                  />
                  <h4 className="text-sm font-medium text-neutral-300">All Categories</h4>
                </div>
              </div>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                  const IconComponent = category.icon
                  const isSelected = selectedCategories.includes(category.key)
                  return (
                    <Card 
                      key={category.key} 
                      variant={isSelected ? 'elevated' : 'default'} 
                      hover 
                      className={`cursor-pointer aspect-square ${isSelected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''}`}
                      onClick={() => toggleCategory(category.key)}
                    >
                      <Stack align="center" gap="xs" className="text-center px-2 justify-center h-full">
                        <Icon icon={IconComponent} size="sm" color={isSelected ? '#39FF14' : '#00FFFF'} />
                        <h4 className="text-xs font-medium text-neutral-300">{category.label}</h4>
                      </Stack>
                    </Card>
                  )
                })}
              </div>

              {selectedCategories.length > 0 && !selectedCategories.includes('all') && (
                <p className="text-sm text-primary-500 mt-4">
                  Selected {selectedCategories.length} categories
                </p>
              )}
            </div>
          </Stack>
        )
      }
      return <VisionBoardFilterGridDemo />

    case 'single-category-selector':
      const SingleCategorySelectorDemo = () => {
        const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

        return (
          <Stack gap="md">
            <div>
              <Heading level={3} className="text-white mb-4">
                Select a Category
              </Heading>
              <p className="text-sm text-neutral-400 mb-4">
                Simple single-select picker - one category at a time
              </p>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                  const IconComponent = category.icon
                  const isSelected = selectedCategory === category.key
                  return (
                    <Card 
                      key={category.key} 
                      variant={isSelected ? 'elevated' : 'default'} 
                      hover 
                      className={`cursor-pointer aspect-square ${isSelected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''}`}
                      onClick={() => setSelectedCategory(category.key)}
                    >
                      <Stack align="center" gap="xs" className="text-center px-2 justify-center h-full">
                        <Icon icon={IconComponent} size="sm" color={isSelected ? '#39FF14' : '#00FFFF'} />
                        <h4 className="text-xs font-medium text-neutral-300">{category.label}</h4>
                      </Stack>
                    </Card>
                  )
                })}
              </div>

              {selectedCategory && (
                <p className="text-sm text-primary-500 mt-4">
                  Selected: {VISION_CATEGORIES.find(c => c.key === selectedCategory)?.label}
                </p>
              )}
            </div>
          </Stack>
        )
      }
      return <SingleCategorySelectorDemo />

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

