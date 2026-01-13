'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, ArrowRight, Star, Target,
  Brain, TrendingUp, Shield, Play, Award, Globe, Crown, Check, Clock, User, Dumbbell,
  Headphones, Image, BookOpen, CalendarDays, Lock, HelpCircle, Eye,
  RefreshCw, Maximize2, Minimize2, Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { 
  TOKEN_GRANTS, 
  STORAGE_QUOTAS, 
  ROLLOVER_LIMITS,
  formatTokens,
  formatTokensShort,
  PLAN_METADATA,
} from '@/lib/billing/config'
import {
  Stack,
  Inline,
  Grid,
  TwoColumn,
  Cover,
  Container,
  Card,
  FeatureCard,
  ItemListCard,
  FlowCards,
  Button,
  VIVAButton,
  Icon,
  Badge,
  Video,
  OfferStack,
  SwipeableCards,
  Heading,
  Text,
  Title,
  BulletedList,
  ListItem,
} from '@/lib/design-system'
import {
  ActionButtons,
  Frame,
  Input,
  Modal,
  PageLayout,
  PricingCard,
  ProofWall,
  Select,
  Checkbox,
} from '@/lib/design-system/components'

// Vision Categories
const VISION_CATEGORIES = [
  { key: 'forward', label: 'Forward', icon: Sparkles, description: 'Personal growth & development' },
  { key: 'fun', label: 'Fun / Recreation', icon: PartyPopper, description: 'Joy & leisure activities' },
  { key: 'travel', label: 'Travel / Adventure', icon: Plane, description: 'Exploration & experiences' },
  { key: 'home', label: 'Home / Environment', icon: Home, description: 'Living space & surroundings' },
  { key: 'family', label: 'Family / Parenting', icon: Users, description: 'Relationships & family' },
  { key: 'romance', label: 'Love / Romance', icon: Heart, description: 'Intimate relationships' },
  { key: 'health', label: 'Health / Vitality', icon: Activity, description: 'Physical & mental wellness' },
  { key: 'money', label: 'Money / Wealth', icon: DollarSign, description: 'Financial abundance' },
  { key: 'business', label: 'Business / Career', icon: Briefcase, description: 'Professional success' },
  { key: 'social', label: 'Social / Friends', icon: UserPlus, description: 'Friendships & connections' },
  { key: 'possessions', label: 'Stuff', icon: Package, description: 'Material abundance' },
  { key: 'giving', label: 'Giving / Legacy', icon: Gift, description: 'Impact & contribution' },
  { key: 'spirituality', label: 'Spirituality', icon: Zap, description: 'Inner connection & purpose' },
  { key: 'conclusion', label: 'Conclusion', icon: CheckCircle, description: 'Integration & completion' },
]

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [planType, setPlanType] = useState<'solo' | 'household'>('solo')
  const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay' | '3pay'>('full')
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [selfCheckAnswers, setSelfCheckAnswers] = useState<boolean[]>([false, false, false, false, false])
  const [isYesHeld, setIsYesHeld] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [burgerOrderPlaced, setBurgerOrderPlaced] = useState(false)
  const [burgerOrderCanceled, setBurgerOrderCanceled] = useState(false)
  const [burgerTimer, setBurgerTimer] = useState<NodeJS.Timeout | null>(null)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [currentHash, setCurrentHash] = useState<string>('')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [referralSource, setReferralSource] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState<string | null>(null)

  // Read promo code and affiliate params from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      
      // Promo code
      const promo = params.get('promo')
      if (promo) {
        setPromoCode(promo)
        console.log('🎉 Promo code applied:', promo)
      }
      
      // Affiliate/referral source
      const ref = params.get('ref') || params.get('source') || params.get('affiliate')
      if (ref) {
        setReferralSource(ref)
        console.log('📊 Referral source:', ref)
      }
      
      // Campaign name
      const campaign = params.get('campaign') || params.get('utm_campaign')
      if (campaign) {
        setCampaignName(campaign)
        console.log('📊 Campaign:', campaign)
      }
      
      // Pre-select plan type (solo or household)
      const type = params.get('plan') || params.get('type') || params.get('planType')
      if (type && ['solo', 'household'].includes(type)) {
        setPlanType(type as 'solo' | 'household')
        console.log('👥 Plan type:', type)
      }
      
      // Pre-select continuity plan if provided
      const continuity = params.get('continuity')
      if (continuity && ['annual', '28day'].includes(continuity)) {
        setBillingPeriod(continuity as 'annual' | '28day')
      }
    }
  }, [])

  // Track hash changes
  useEffect(() => {
    // Set initial hash
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash)
    }

    // Handle hash changes (e.g., navigating to #pricing)
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        setCurrentHash(window.location.hash)
        // Reset checkbox when navigating to pricing
        if (window.location.hash.includes('pricing')) {
          setAgreedToTerms(false)
        }
      }
    }

    // Handle popstate (browser back/forward buttons)
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentHash(window.location.hash)
      }
      setAgreedToTerms(false)
    }

    // Handle browser back/forward navigation
    const handlePageShow = (e: PageTransitionEvent) => {
      if (typeof window !== 'undefined') {
        setCurrentHash(window.location.hash)
      }
      setAgreedToTerms(false)
    }

    // Reset checkbox on mount
    setAgreedToTerms(false)

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handleHashChange)

    // Cleanup
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // Reset checkbox when hash includes pricing
  useEffect(() => {
    if (currentHash.includes('pricing')) {
      setAgreedToTerms(false)
    }
  }, [currentHash])

  const calculateChaosScore = () => {
    const total = selfCheckAnswers.filter(Boolean).length
    if (total === 0 || total === 1) return { score: total, label: 'Stable', color: '#39FF14' }
    if (total === 2 || total === 3) return { score: total, label: 'Shaky', color: '#FFB701' }
    return { score: total, label: 'Chaos', color: '#FF0040' }
  }

  const getPrescription = () => {
    const prescriptions = []
    if (selfCheckAnswers[1]) prescriptions.push('Jump to VIVA Vision (Train)')
    if (selfCheckAnswers[2]) prescriptions.push('Start Activation Protocol (Tune)')
    if (selfCheckAnswers[3]) prescriptions.push('Build Vision Board + Journal x3 (Track)')
    return prescriptions
  }

  const handleYesMouseDown = () => {
    setIsYesHeld(true)
    setHoldProgress(0)
    setBurgerOrderPlaced(false)
    setBurgerOrderCanceled(false)

    // Start progress interval (update every 50ms for smooth animation)
    const interval = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + (100 / 60) // 60 frames over 3 seconds (3000ms / 50ms)
      })
    }, 50)
    setProgressInterval(interval)

    // Start 3-second timer
    const timer = setTimeout(() => {
      // Vibrate on mobile for success
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      setBurgerOrderPlaced(true)
      setBurgerOrderCanceled(false)
      setHoldProgress(100)
    }, 3000)
    
    setBurgerTimer(timer)
  }

  const handleYesMouseUp = () => {
    // Clear timers
    if (burgerTimer) {
      clearTimeout(burgerTimer)
      setBurgerTimer(null)
    }
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }

    setIsYesHeld(false)
    
    // Only cancel if user actually started holding (progress > 0)
    // and didn't complete (progress < 100)
    if (holdProgress > 0 && holdProgress < 100) {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
      setBurgerOrderCanceled(true)
      setBurgerOrderPlaced(false)
      setHoldProgress(0)
    } else {
      // Reset to idle state
      setHoldProgress(0)
      setBurgerOrderCanceled(false)
      setBurgerOrderPlaced(false)
    }
  }

  const handleNoClick = () => {
    // Clear timers
    if (burgerTimer) {
      clearTimeout(burgerTimer)
      setBurgerTimer(null)
    }
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }

    setIsYesHeld(false)
    setHoldProgress(0)
    
    // Cancel order
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
    setBurgerOrderCanceled(true)
    setBurgerOrderPlaced(false)
  }

  const resetBurgerTest = () => {
    // Clear any existing timers
    if (burgerTimer) {
      clearTimeout(burgerTimer)
      setBurgerTimer(null)
    }
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }
    setIsYesHeld(false)
    setHoldProgress(0)
    setBurgerOrderPlaced(false)
    setBurgerOrderCanceled(false)
  }

  const getPaymentAmount = () => {
    const prices = planType === 'solo' 
      ? { full: 499, twoPayment: 249.50, threePayment: 166.33 }
      : { full: 699, twoPayment: 349.50, threePayment: 233 }
    
    switch (paymentPlan) {
      case 'full': return prices.full.toString()
      case '2pay': return prices.twoPayment.toString()
      case '3pay': return prices.threePayment.toString()
      default: return prices.full.toString()
    }
  }
  
  const getIntensiveTotal = () => {
    return planType === 'solo' ? '499' : '699'
  }
  
  const getVisionProAnnualPrice = () => {
    return planType === 'solo' ? '999' : '1,499'
  }
  
  const getVisionProMonthlyPrice = () => {
    return planType === 'solo' ? '99' : '149'
  }
  
  const getVisionProAnnualPerCycle = () => {
    return planType === 'solo' ? '76.85' : '115.31'
  }
  
  const getVisionProAnnualSavings = () => {
    return planType === 'solo' ? '22%' : '23%'
  }
  
  const getPlanSeatsText = () => {
    return planType === 'solo' ? '1 seat' : '2 seats included'
  }

  const handleIntensivePurchase = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the renewal terms before proceeding.')
      return
    }

    setIsLoading(true)
    try {
      // Directly create Stripe checkout session with plan type, promo code, and affiliate tracking
      const response = await fetch('/api/stripe/checkout-combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensivePaymentPlan: paymentPlan,
          continuityPlan: billingPeriod,
          planType: planType, // 'solo' or 'household'
          promoCode: promoCode || undefined, // Apply promo code if present
          referralSource: referralSource || undefined, // Track affiliate/referral source
          campaignName: campaignName || undefined, // Track campaign name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API Error:', data)
        const errorMessage = data.error || 'Unknown error'
        const errorDetails = data.details ? `\n\nDetails: ${JSON.stringify(data.details, null, 2)}` : ''
        throw new Error(`Failed to create checkout session: ${errorMessage}${errorDetails}`)
      }

      if (!data.url) {
        console.error('No checkout URL in response:', data)
        throw new Error('No checkout URL returned from server')
      }

      // Redirect directly to Stripe checkout
      window.location.href = data.url

    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.'
      toast.error(errorMessage)
      setIsLoading(false)
    }
  }

  return (
      <Stack gap="xl">
        
        {/* Hero Section */}
        <section>
          <Cover minHeight="500px" className="!p-0">
            <Container size="xl" className="w-full">
              <Stack gap="md" className="items-center">
                {/* Headline at top */}
                <div className="text-center">
                  <Heading level={1} className="text-white leading-tight !mb-0.5 md:!mb-3">
                    Thoughts become things…<br />so why isn't it working?
                  </Heading>
                </div>
                
                {/* Two column layout for desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
                  {/* Left column - Content */}
                  <div className="space-y-6 text-center lg:text-left flex flex-col justify-center">
                    <Heading level={3} className="text-neutral-200 text-center md:text-center">
                      Bridge the woo-woo with the how-to.
                    </Heading>
                    
                    <Heading level={4} className="text-[#39FF14] text-center md:text-center">
                      Activate your Life Vision in <span className="font-bold text-[#39FF14]">72 hours</span>
                      <br />
                      with the Activation Intensive.
                    </Heading>
                    
                    <BulletedList className="leading-relaxed lg:text-left lg:ml-6">
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        Conscious Creation System: Train → Tune → Track
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Plus Graduate Unlocks:</strong> Advanced audio suite, The Alignment Gym (weekly live coaching), and Vibe Tribe community when you complete your 72‑Hour Activation
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        VIVA AI turns contrast into clarity—even if you don't know what you want
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        Powered by the 4‑Layer Conscious Creation Writing Architecture inside VIVA Vision
                      </ListItem>
                    </BulletedList>
                    
                    <div className="flex flex-col items-center md:items-center">
                      <Button variant="primary" size="xl" className="mt-1 mb-2 md:mt-2" asChild>
                        <a href="#pricing">
                          Start the Activation Intensive
                        </a>
                      </Button>
                      <Text size="xs" className="text-neutral-400 text-center">
                        $499 today. Includes 8 weeks of Vision Pro. Day 56: auto‑continue at your selected plan.
                      </Text>
                    </div>
                  </div>
                  
                  {/* Right column - Video */}
                  <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-3xl mx-auto w-full order-last lg:order-last lg:mt-4">
                    <Video
                      src="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-1080p.mp4"
                      poster="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-poster.jpg"
                      variant="hero"
                      trackingId="homepage-hero-video"
                      saveProgress={true}
                      onMilestoneReached={(milestone, time) => {
                        // Track milestone for marketing analytics
                        console.log(`Video milestone: ${milestone}% at ${time}s`)
                        // TODO: Send to your marketing platform (Facebook Pixel, Google Analytics, etc.)
                        // Example: fbq('track', 'VideoView', { milestone, time })
                      }}
                      onPlay={() => {
                        console.log('Hero video started playing')
                        // TODO: Track video play event
                      }}
                      onComplete={() => {
                        console.log('Hero video completed')
                        // TODO: Track video completion
                      }}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </Stack>
            </Container>
          </Cover>
        </section>

        {/* Two Column Section with Item List Card */}
        <section>
          <Container size="xl">
            <TwoColumn gap="lg" className="gap-8 md:gap-12">
              <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 relative overflow-hidden flex items-center">
                {/* Thunderbolt Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <Zap className="w-48 h-48 md:w-64 md:h-64 text-[#39FF14]" strokeWidth={0.5} />
                </div>
                {/* Content */}
                <div className="relative z-10 w-full">
                  <Heading level={3} className="text-white text-center mb-8 md:mb-10">
                    What &quot;active in 72 hours&quot; means
                </Heading>
                  <div className="flex flex-col gap-4 items-start mx-auto text-left md:text-left">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Profile 70%+ complete</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">84‑question Vibration Assessment submitted</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">12‑category Life Vision completed (with VIVA)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">First refinement pass saved</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">AM/PM Vision Audios generated</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Vision Board built (12 images, 1 per category)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">3 journal entries logged (one written, one voice, one video)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Calibration Call booked</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Activation Protocol scheduled</Text>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6">
                <FlowCards
                  items={[
                    {
                      label: 'Train (0–72h)',
                      description: 'Complete your 72‑Hour Activation Intensive: profile + 84‑Q assessment + 12‑category Life Vision with VIVA, plus your first audios, board, journals, protocol, and Calibration Call booked.',
                      icon: Brain,
                      iconColor: '#39FF14'
                    },
                    {
                      label: 'Tune',
                      description: 'Keep your signal aligned as life evolves: refine your vision, regenerate AM/PM audios, and follow your daily Activation Protocol.',
                      icon: Target,
                      iconColor: '#14B8A6'
                    },
                    {
                      label: 'Track',
                      description: 'Build visible momentum: journal, log iterations and wins, update your Vision Board, and watch your streaks grow in the dashboard, Vibe Tribe, and at The Alignment Gym (weekly live coaching).',
                      icon: TrendingUp,
                      iconColor: '#8B5CF6'
                    }
                  ]}
                  arrowColor="#39FF14"
                />
              </div>
            </TwoColumn>
          </Container>
        </section>

        {/* 72-Hour Activation Path */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8">
                <Heading level={2} className="text-white text-center !mb-0 md:!mb-1">
                  Your 72‑Hour Activation Path
                </Heading>
                
                {/* Desktop Layout on Mobile for Comparison */}
                <div className="md:hidden mb-4">
                  <div className="relative">
                    {/* Gradient Connecting Line */}
                    <div className="absolute left-[10px] w-0.5 h-[98%] bg-gradient-to-b from-[#39FF14] via-[#00FFFF] via-[#BF00FF] to-[#FFFF00] top-[10px]"></div>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#39FF14] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <div className="font-semibold text-white text-base">
                            <div>Phase 1</div>
                            <div>Foundation (0–24h)</div>
                          </div>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Profile — 70%+ complete</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Assessment — 84 Qs submitted</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Calibration — 1:1 call scheduled</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#00FFFF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <div className="font-semibold text-white text-base">
                            <div>Phase 2</div>
                            <div>Vision Creation (24–48h)</div>
                          </div>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Life Vision — 12 categories drafted (with VIVA)</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Refine — polished with VIVA + tool</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#BF00FF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <div className="font-semibold text-white text-base">
                            <div>Phase 3</div>
                            <div>Activation Tools (48–72h)</div>
                          </div>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Vision Audio — AM + PM tracks created</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Vision Board — 12 images added</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Journal x3 — written, voice & video entries logged</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#FFFF00] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <div className="font-semibold text-white text-base">
                            <div>Phase 4</div>
                            <div>Graduation & Integration (after 72h)</div>
                          </div>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Attend Calibration — 30‑min live call</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Activation Protocol — daily rituals scheduled & ready to run</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Graduate Unlocks go live: advanced audio suite, Vibe Tribe community, and access to The Alignment Gym (weekly live group coaching)</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Layout */}
                <div className="hidden md:flex md:gap-8">
                  {/* Left Side - Bulleted List (50%) */}
                  <div className="w-1/2">
                    <div className="relative">
                      {/* Gradient Connecting Line */}
                      <div className="absolute left-[10px] w-0.5 h-[98%] bg-gradient-to-b from-[#39FF14] via-[#00FFFF] via-[#BF00FF] to-[#FFFF00] top-[10px]"></div>
                      
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#39FF14] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 1 — Foundation (0–24h)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Profile — 70%+ complete</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Assessment — 84 Qs submitted</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Calibration — 1:1 call scheduled</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#00FFFF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 2 — Vision Creation (24–48h)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Life Vision — 12 categories drafted (with VIVA)</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Refine — polished with VIVA + tool</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#BF00FF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 3 — Activation Tools (48–72h)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Vision Audio — AM + PM tracks created</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Vision Board — 12 images added</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Journal x3 — written, voice & video entries logged</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#FFFF00] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 4 — Graduation & Integration (after 72h)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Attend Calibration — 30‑min live call</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Activation Protocol — daily rituals scheduled & ready to run</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Graduate Unlocks go live: advanced audio suite, Vibe Tribe community, and access to The Alignment Gym (weekly live group coaching)</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - 2x2 Grid (50%) */}
                  <div className="w-1/2">
                    <div className="grid grid-cols-2 gap-4 h-full">
                      {/* Phase 1 - Electric Green */}
                      <div className="bg-gradient-to-br from-[#39FF14]/10 to-[#39FF14]/5 border-[#39FF14]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#39FF14] rounded-full flex items-center justify-center mb-3">
                          <span className="text-black font-bold text-lg">1</span>
                        </div>
                        <Heading level={4} className="text-[#39FF14] mb-2 text-center">Foundation</Heading>
                        <Text size="sm" className="text-neutral-400 text-center">Hours 0–24</Text>
                      </div>
                      
                      {/* Phase 2 - Neon Cyan */}
                      <div className="bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 border-[#00FFFF]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#00FFFF] rounded-full flex items-center justify-center mb-3">
                          <span className="text-black font-bold text-lg">2</span>
                        </div>
                        <Heading level={4} className="text-[#00FFFF] mb-2 text-center">Vision Creation</Heading>
                        <Text size="sm" className="text-neutral-400 text-center">Hours 24–48</Text>
                      </div>
                      
                      {/* Phase 3 - Neon Purple */}
                      <div className="bg-gradient-to-br from-[#BF00FF]/10 to-[#BF00FF]/5 border-[#BF00FF]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#BF00FF] rounded-full flex items-center justify-center mb-3">
                          <span className="text-white font-bold text-lg">3</span>
                        </div>
                        <Heading level={4} className="text-[#BF00FF] mb-2 text-center">Activation Tools</Heading>
                        <Text size="sm" className="text-neutral-400 text-center">Hours 48–72</Text>
                      </div>
                      
                      {/* Phase 4 - Energy Yellow */}
                      <div className="bg-gradient-to-br from-[#FFFF00]/10 to-[#FFFF00]/5 border-[#FFFF00]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#FFFF00] rounded-full flex items-center justify-center mb-3">
                          <span className="text-black font-bold text-lg">4</span>
                        </div>
                        <Heading level={4} className="text-[#FFFF00] mb-2 text-center">Calibration & Launch</Heading>
                        <Text size="sm" className="text-neutral-400 text-center">Hours 72+</Text>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="text-center">
                  <Button variant="primary" size="xl" asChild>
                    <a href="#pricing">
                      Start the Activation Intensive
                    </a>
                  </Button>
                </div>
              </Stack>
          </div>
          </Container>
        </section>

        {/* Dashboard Preview Section */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8">
                  <div className="text-center mb-6">
                    <Heading level={2} className="text-white mb-2">What you'll see on your dashboard:</Heading>
                    <Text size="sm" className="text-neutral-400">Your personalized activation journey</Text>
                  </div>
                  
                  {/* Dashboard Preview Container */}
                  <div className="bg-gradient-to-br from-[#1F1F1F] to-[#0F0F0F] rounded-2xl border-2 border-[#39FF14]/20 p-6 space-y-6">
                    
                    {/* Header Section */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full px-4 py-2 mb-4">
                        <Clock className="w-4 h-4 text-[#39FF14]" />
                        <span className="text-sm font-semibold text-[#39FF14]">Activation Intensive</span>
                      </div>
                      <Heading level={4} className="text-white mb-2">Your Activation Journey</Heading>
                      <Text size="sm" className="text-neutral-400">Current Phase: <span className="text-[#39FF14]">Foundation</span></Text>
                    </div>
                    
                    {/* Countdown & Progress Card */}
                    <div className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border border-[#39FF14]/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time Remaining
                          </h5>
                          <Text size="xl" className="font-bold text-[#39FF14]">68h 23m 45s</Text>
                          <Text size="xs" className="text-neutral-400 mt-1">Deadline: Dec 15, 2024 11:59 PM</Text>
                        </div>
                        <div className="text-right">
                          <Text size="xs" className="text-neutral-400 mb-1">Overall Progress</Text>
                          <Text size="2xl" className="font-bold text-[#14B8A6]">25%</Text>
                          <Text size="xs" className="text-neutral-400 mt-1">3 of 12 steps</Text>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-[#39FF14] to-[#14B8A6]" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    
                    {/* Next Step Card */}
                    <div className="bg-gradient-to-br from-[#BF00FF]/10 to-purple-500/10 border border-[#BF00FF]/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#BF00FF] rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="inline-flex items-center gap-1 bg-[#BF00FF]/20 rounded-full px-2 py-1 mb-1">
                            <span className="text-xs font-semibold text-[#BF00FF]">Next Step</span>
                          </div>
                          <h5 className="text-sm font-bold text-white">Complete Your Profile</h5>
                          <Text size="xs" className="text-neutral-400">Set up your personal info, goals, and values</Text>
                        </div>
                        <button className="text-xs bg-[#39FF14] text-black px-3 py-1 rounded-full font-semibold hover:bg-[#39FF14]/80 transition-colors">
                          Continue
                        </button>
                      </div>
                    </div>
                    
                    {/* Phase Progress Cards */}
                    <div className="space-y-4">
                      {/* Phase 1 - Foundation */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="text-sm font-semibold text-[#39FF14]">Foundation</h6>
                          <span className="text-xs bg-[#39FF14]/20 text-[#39FF14] px-2 py-1 rounded-full">1/3 Complete</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#39FF14] rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-black" />
                              </div>
                              <div>
                                <Text size="xs" className="font-semibold text-white">Complete Your Profile</Text>
                                <Text size="xs" className="text-neutral-400">Set up your personal info, goals, and values</Text>
                              </div>
                            </div>
                            <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                          </div>
                          
                          <div className="flex items-center justify-between bg-neutral-800/30 border border-neutral-600/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#14B8A6] rounded-lg flex items-center justify-center">
                                <Target className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <Text size="xs" className="font-semibold text-white">Take Vibration Assessment</Text>
                                <Text size="xs" className="text-neutral-400">Discover your current vibration score</Text>
                              </div>
                            </div>
                            <button className="text-xs bg-[#39FF14] text-black px-2 py-1 rounded-full font-semibold">
                              Start
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between bg-neutral-800/30 border border-neutral-600/30 rounded-lg p-2 opacity-50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-neutral-600 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <Text size="xs" className="font-semibold text-neutral-400">Book Your Calibration Call</Text>
                                <Text size="xs" className="text-neutral-500">Schedule your 1-on-1 session</Text>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-neutral-500">
                              <span className="text-xs">Locked</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Phase 2 - Vision Creation */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="text-sm font-semibold text-[#00FFFF]">Vision Creation</h6>
                          <span className="text-xs bg-[#00FFFF]/20 text-[#00FFFF] px-2 py-1 rounded-full">0/2 Complete</span>
                        </div>
                        <div className="space-y-2 opacity-60">
                          <div className="flex items-center justify-between bg-neutral-800/30 border border-neutral-600/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-neutral-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <Text size="xs" className="font-semibold text-neutral-400">Build Your Life Vision</Text>
                                <Text size="xs" className="text-neutral-500">Create your 12-category vision with VIVA</Text>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-neutral-500">
                              <span className="text-xs">Locked</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between bg-neutral-800/30 border border-neutral-600/30 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-neutral-600 rounded-lg flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <Text size="xs" className="font-semibold text-neutral-400">Refine Your Vision</Text>
                                <Text size="xs" className="text-neutral-500">Polish with VIVA + refinement tool</Text>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-neutral-500">
                              <span className="text-xs">Locked</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Completion Message */}
                    <div className="text-center bg-gradient-to-r from-[#39FF14]/5 to-[#14B8A6]/5 border border-[#39FF14]/20 rounded-xl p-4">
                      <Text size="xs" className="text-neutral-300 mb-2">
                        <strong className="text-[#39FF14]">Complete all phases</strong> to unlock your membership and continue your journey
                      </Text>
                      <Text size="xs" className="text-neutral-400">
                        Your membership will automatically activate on Day 56
                      </Text>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="text-center">
                    <Button variant="primary" size="xl" asChild>
                      <a href="#pricing">
                        Start the Activation Intensive
                      </a>
                    </Button>
                  </div>
                </Stack>
            </div>
          </Container>
        </section>

        {/* Vision Transformations - From Vision to Actualized Reality */}
        <section>
          <Container size="xl">
            <ProofWall
              heading="Lock It In and Let It Flow"
              showHeadingOutside={false}
              showStoryHighlight={false}
              items={[
                {
                  id: 'homepage-proof',
                  beforeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg',
                  afterImage: 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg',
                  story: '',
                },
              ]}
            />
          </Container>
        </section>

        {/* Vision Transformations - From Vision to Actualized Reality */}
        <section>
          <Container size="xl">
            <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-black/40 border-[#39FF14]/20 border-2">
              <SwipeableCards
                title="Vision Transformations"
                subtitle="From Vision to Actualized Reality"
                cards={[
                  {
                    id: 'vision-profit',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/gross-profit-vision.jpg',
                    activeImageAlt: 'Active vision journal entry outlining gross profit targets',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/gross-profit-actualized.jpg',
                    actualizedImageAlt: 'Actualized proof of gross profit aligned with the vision',
                    title: '$1M Actualized',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          We experienced an amazingly awful day that changed our lives forever. We had just gotten married and were living in Japan. We woke up one morning and had no milk, no eggs, no bread, and no money. Our available capital that day was $4.87 (not even enough money to pay the ATM fee). And at the time we owed over $100,000 in debt: student loans, car loans, a dirt bike loan, home improvement loans, family loans, and infinite credit card debt.
                        </Text>
                        <Text size="sm" className="text-justify">
                          But this day was when everything changed vibrationally for us. We could no longer afford to play the vibrational hokey pokey. This is when we decided to fully commit the Vibration Fit Conscious Creation System. We started a new business doing what we loved and added a pretend $1,000,000 bill to our vision board. And boy are we glad we did!
                        </Text>
                        <Text size="sm" className="text-justify">
                          We went from no money in the bank and over 6 figures in debt to completely debt free with 6 figures in the bank. We made our first $1,000,000 in our own business from home. We achieved time, location, financial and inner freedom.
                        </Text>
                        <Text size="sm" className="font-semibold text-white">
                          Our lives were forever changed!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-italy',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-active.jpg',
                    activeImageAlt: 'Active vision storyboard showing the Italy dream experience',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-actualized.jpg',
                    actualizedImageAlt: 'Actualized photo from the Italy dream trip',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Exact Italy Destination Actualized (without any planning)',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">😳 You can’t make this stuff up…</span>
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">🇮🇹</span> So here we are in Amalfi, sitting at dinner on Day 2 talking about how surreal it is that we’re in Italy marking off another place from our vision board. Jordan pulls up the exact photo from our vision board and we wonder where it was taken. We knew it was somewhere along the Amalfi Coast, but little did we know when we got here that the Amalfi coast is actually 34 miles long and spans across many towns. Jordan asks our waiter if he knows where our vision board photo was taken and he says, “That’s Atrani. Only one minute north of Amalfi.”
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">🚙</span> It turned out that we had driven right through Atrani on our way to Ravello earlier that day 😂 And that we were only staying about 12 minutes away the whole time!
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">☀️</span> So on Day 3, a bright, beautiful, sunny day, we started the morning off by driving straight to Atrani to get our very own photo in the exact same location as the one we’ve been staring at and dreaming about from our vision board for years!
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">😱</span> The first photo is proof of us there, the second one is the photo from our vision board!
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">💫</span> This vision stuff truly works… we are constantly surprised and delighted by the Universe! We are across the world and somehow line up with the exact right places, people, and circumstances to experience the place we’ve had on our vision board for years. With no planning ahead of time… Now that’s manifestation at its best!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-home',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/house-vision.jpg',
                    activeImageAlt: 'Active vision storyboard for the aligned dream home',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/house-actualized.jpg',
                    actualizedImageAlt: 'Actualized photo of the aligned dream home',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Dream Home Actualized',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          We were recently married, living in a tiny apartment in Japan (for what was ultimately a failed business venture), thousands of miles from America when we put this picture of a home in Florida on our vision board.
                        </Text>
                        <Text size="sm" className="text-justify">
                          We had no idea where we ultimately wanted to live, but knew we wanted to be near the beach. As more clarity filled in on what kind of home we wanted, I (Vanessa) wrote a detailed letter to the Universe about what our home would look and feel like.
                        </Text>
                        <Text size="sm" className="text-justify">
                          Jordan found my letter I wrote to the Universe after we moved into our home, thinking I had written a gratitude letter for our house because it described every room and space in detail- then he looked at the date I wrote it - 2 years before we bought our home!
                        </Text>
                        <Text size="sm" className="text-justify">
                          Looking back at the letter and the picture we had on our vision board of our home gives us goose bumps! Everything we envisioned and dreamed about in a home actualized (in the destination of our dreams)- and even better than we imagined!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-van-life',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/van-board-1.jpg',
                    activeImageAlt: 'Active vision storyboard featuring the dream van lifestyle',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/van-actualized-2.jpg',
                    actualizedImageAlt: 'Actualized photo showing the dream van lifestyle realized',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Paid CASH for our Minivan',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          March 23, 2022: The day we paid CASH for a brand new 2022 White Honda Odyssey Elite mini van! The same one that has been on our vision board for 7 years and on Jordan’s for over a decade! Today is the day it came to fruition. 🚐😍💫
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">👶🏼</span> When Oliver was born we knew we needed something bigger for our family of 3. One day while driving to Oliver’s 3 month checkup, we saw a 2011 blue Honda Odyssey with 160,000 miles on the side of the road. We test drove it and the For Sale signs on the doors flew off while we were driving down the road. We took that as a sign (literally) that it was ours. So we paid cash for it and drove it to over 200,000 miles. Sadly, we had to put a lot of money into it to keep it running. It was perfect for what we needed at the time, and fit into our financial situation. Recently though, our mechanic had been driving it more than us 😂
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">👨‍👩‍👧‍👦</span> We finally decided the other day after we got our old van out of the shop once again, and that dang engine light came on, that it was time for an upgrade… to something new that we actually felt safe driving our kids around in, and that was more in alignment with where we are now.
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">💫</span> We called a few Honda dealerships and finally found one in the exact exterior and interior color we wanted. It wasn’t even showing in their system, but they saw that it was on an incoming delivery. We put a deposit on the new van, went out to drive the old van, and noticed the check engine light went off. It was as if it came on just long enough one last time for us to actually make the decision to go for it on a new car. And that new car was waiting for us!
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">🙏🏼</span> We are so grateful for all the miles we had in our old van, and can’t wait for all the memories to come rolling down the road in our vision board car 😍
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-beach-wedding',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/beach-wedding-vision.jpg',
                    activeImageAlt: 'Active vision storyboard for the aligned beach wedding',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/beach-wedding-actualized.jpg',
                    actualizedImageAlt: 'Actualized photo from the aligned beach wedding',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Dream Wedding Actualized',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          We knew we were getting married right away when we met. We were engaged within 6 months of meeting, so naturally we had started dreaming about what kind of wedding we wanted.
                        </Text>
                        <Text size="sm" className="text-justify">
                          We both love the beach, so we talked and dreamed about having a destination wedding at a beach somewhere in the world. We put a random beach wedding photo on our vision board that we found on the internet, and went on with our life.
                        </Text>
                        <Text size="sm" className="text-justify">
                          One thing led to another - I bought a book online called "Destination Weddings" and within that book was a beautiful resort in Cabo, Mexico. We connected with an amazing travel agent online who had booked many similar group trips and she was able to get our group of 40 people an amazing deal for our destination wedding.
                        </Text>
                        <Text size="sm" className="text-justify">
                          When we look back now it is mind-blowing how exact our actual wedding matched our vision board wedding photo! They may have both even been taken in the exact same spot in Cabo, Mexico!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-japan',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/japan-vision.jpg',
                    activeImageAlt: 'Active vision storyboard for the Japan alignment trip',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/japan-friends.jpg',
                    actualizedImageAlt: 'Actualized photo from the Japan alignment trip',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Japan Actualized',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          Our work at the time was expanding into Japan, and we really wanted to go spearhead the market. We had no money, but we had a dream so we did the most powerful thing we knew to do - added Japan to our vision document and vision board!
                        </Text>
                        <Text size="sm" className="text-justify">
                          One day, we get a call from the owners of the company saying they are picking three couples from the company to sponsor in Japan and we are one of them - they paid for us to live in a luxurious business apartment in Osaka and paid us an extra stipend to offset the expenses while living there - for over a year!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-australia',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/australia-vision.jpg',
                    activeImageAlt: 'Active vision storyboard for the Australia alignment adventure',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/australia-actualized.jpg',
                    actualizedImageAlt: 'Actualized photo from the Australia alignment adventure',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Australia Actualized (for a whole month!)',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          We had always dreamed of visiting Australia and had it in our vision document and vision board. We were pregnant with our first child, and were free to work from wherever there was internet, so for Christmas, instead of getting gifts for each other, we decided to go on an adventure/babymoon.
                        </Text>
                        <Text size="sm" className="text-justify">
                          We applied for an American Airlines credit card and received enough points to buy our tickets to Australia for free. We had a friend from college who married an Aussie and they were thrilled to host us at their home close to Sydney. We rented a car and drove all the way up the East coast from Sydney to Mackay in a month. We had the most magical time!!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-fit-couple',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/fit-couple-active.jpg',
                    activeImageAlt: 'Active vision photo of Jordan and Vanessa focusing on fitness',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/fit-3-actualized.jpg',
                    actualizedImageAlt: 'Actualized photo showing Jordan and Vanessa fit and aligned',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Fit Couple Actualized',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          I (Jordan) gained 30 pounds after we had our second child. I was in denial for a while about the extra weight I was holding, but finally got into harmony with wanting a better body. Vanessa and I booked a cruise and I honed in on getting fit before we set sail. We did P90X, went to the gym, and ate healthy. When it was time to board the cruise ship, I had lost the 30 pounds!!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-mountain-chalet',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/mountain-lodge-active.jpg',
                    activeImageAlt: 'Active vision storyboard for mountain chalet vacation',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/mountain-lodge-actualized.jpg',
                    actualizedImageAlt: 'Actualized photo from the mountain chalet vacation',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Gifted Family a Mountain Chalet Vacation (in Aspen, CO)',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">😃</span> More vision board items have been marked off the list:
                        </Text>
                        <Text size="sm" className="text-justify">
                          ✅ Rent a chalet in the mountains
                        </Text>
                        <Text size="sm" className="text-justify">
                          ✅ Treat our family
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">🥳</span> We celebrated my father in law’s 75th birthday and my step-mom’s retirement together in a chalet on 40 acres near Aspen, Colorado. It was so dreamy! We spent most of the time playing Scrabble indoors, taking in the views from the hot tub (mountains by day, stars by night - even some shooting stars!), watching the deer graze around the property, going to the hot springs, going skiing, eating amazing home-cooked food, playing in the snow, and sledding on one of the hills on the property.
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">😁</span> I may have worn my pajamas more than regular clothes and no makeup for the week we were there. It was a wonderful celebration for the family and reset for everyone.
                        </Text>
                        <Text size="sm" className="text-justify">
                          <span className="text-white font-semibold">🏔️</span> My favorite part of the mountains and snow is the peace and silence. It’s so quiet and serene up there that time seems to slow down and appreciation speeds up. The mountains will always hold a special place in our hearts, as will this trip 💙
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  },
                  {
                    id: 'vision-breville',
                    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/breville-active.jpg',
                    activeImageAlt: 'Active vision photo of Breville coffee maker',
                    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/breville-actualized.jpg',
                    actualizedImageAlt: 'Actualized Breville coffee maker gifted to Jordan and Vanessa',
                    memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                    title: 'Breville Coffee Maker Actualized (as a gift!)',
                    content: (
                      <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                        <Text size="sm" className="text-justify">
                          We had this expensive coffee machine on our vision board and in our vision document. In our document we wrote about how amazing it feels to wake up and enjoy a luxurious cup of coffee in the comfort of our own home, and that it tastes even better than Starbucks! The thing was that it never felt like the right time to drop over $400 on a coffee machine.
                        </Text>
                        <Text size="sm" className="text-justify">
                          Then our baby shower came. There was one gift that was very large. We opened it and inside was a much more expensive model of the coffee machine we had put on our vision board! The one our friends gave us was nearly $2,000 and came with all the fancy features!! And we had never even told anyone about wanting this coffee machine. Talk about the Universe delivering something even better!!
                        </Text>
                      </Stack>
                    ),
                    showTitleOnCard: false,
                    showContentOnCard: false,
                    showModalImages: false
                  }
                ]}
                mobileOnly={false}
                autoScroll
                autoScrollInterval={7000}
                desktopCardsPerView={3}
                swipeThreshold={0.25}
                hapticFeedback={true}
                autoSnap={true}
                showIndicators={true}
                cardVariant="elevated"
              />
            </Card>
          </Container>
        </section>

        {/* Offer Stack Section */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8">
                <div className="text-center">
                  <Heading level={2} className="text-white mb-4">
                    Exactly What You Get Today
                  </Heading>
                  <div className="max-w-2xl mx-auto text-center">
                    <Text size="lg" className="text-neutral-400">
                      72‑Hour Activation Intensive + 8 weeks of Vision Pro included
                    </Text>
                    <Text size="sm" className="text-neutral-500 mt-1">
                      (your plan auto‑starts Day 56)
                    </Text>
                  </div>
                </div>
                
                <OfferStack
                  items={[
                    {
                      id: 'profile-baseline',
                      title: 'Profile & Baseline',
                      description: 'What it is: Your personal snapshot so VIVA can guide you.\nOutcome: Personalized prompts and next steps (no guesswork).\nDone when: Profile is 70%+ complete and your 84‑Q assessment is submitted.',
                      icon: User,
                      included: true
                    },
                    {
                      id: 'vibration-assessment',
                      title: 'Vibration Assessment (84‑Q)',
                      description: 'What it is: Deep dive on your current vibration.\nOutcome: Map your point of attraction for tailored guidance.\nDone when: All 84 questions are submitted and your score is recorded.',
                      icon: Brain,
                      included: true
                    },
                    {
                      id: 'unlock-message',
                      title: 'The tools below unlock after you complete Profile & Assessment.',
                      description: '',
                      icon: null,
                      included: true,
                      isMessage: true
                    },
                    {
                      id: 'viva-vision',
                      title: 'VIVA Vision (Life I Choose)',
                      description: 'What it is: 12‑category Life Vision builder with VIVA.\nOutcome: Turn "I don\'t know what I want" into a vivid Life I Choose™.\nDone when: First Life Vision draft is completed across all 12 categories with VIVA.',
                      icon: Sparkles,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-refinement',
                      title: 'Vision Refinement',
                      description: 'What it is: Polishing pass for clarity and believability.\nOutcome: Tighter language, clear targets, aligned next steps.\nDone when: Your first refinement pass is saved (version 2 live).',
                      icon: Target,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-audio',
                      title: 'Vision Audio (AM/PM)',
                      description: 'What it is: Personalized morning and evening tracks.\nOutcome: Daily embodiment of your Life Vision.\nDone when: AM and PM audio files are generated and saved.',
                      icon: Headphones,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-board',
                      title: 'Vision Board',
                      description: 'What it is: Visual proof, one image per category.\nOutcome: Desire → In Progress → Actualized pipeline for your goals.\nDone when: 12 images are added (1 per category) and your board is saved.',
                      icon: Image,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'journal',
                      title: 'Conscious Creation Journal',
                      description: 'What it is: Multi‑format journal (written, voice, video).\nOutcome: See your progress and patterns as you reflect.\nDone when: 3 entries are logged—one written, one voice, one video—so you know your preferred mode.',
                      icon: BookOpen,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'calibration-call',
                      title: '30‑Minute Calibration Call',
                      description: 'What it is: 1:1 alignment call with a coach.\nOutcome: Review your assets and finalize your Activation Protocol.\nDone when: Your call is booked within the 72‑Hour Intensive and completed within your first 7 days.',
                      icon: CalendarDays,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'activation-protocol',
                      title: 'Activation Protocol',
                      description: 'What it is: Your simple daily ritual plan.\nOutcome: Stay in harmony with your vision without guesswork.\nDone when: You and your coach finalize a simple 30‑day Activation Protocol on your Calibration Call.',
                      icon: Zap,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'graduate-unlocks',
                      title: 'Graduate Unlocks',
                      description: 'What it is: Rewards that unlock the moment you complete your Activation Checklist.\nOutcome: Extra firepower and support to keep compounding after the Intensive.\nDone when: Your checklist is complete. You\'ll instantly unlock:\n  - Advanced Audio Suite: power tracks, meditation tracks, and solfeggio‑backed "Life I Choose" audios\n  - Vibe Tribe Community: private, tagged feed for wins, struggles, visions, and practices\n  - The Alignment Gym: weekly live group coaching & practice session (first month included)\n  - Graduate Coaching Pass: 1 private "Constraint Clearing" call or Ask‑a‑Coach access in your first 30 days',
                      icon: Gift,
                      included: true,
                      locked: true
                    },
                    {
                      id: '8-weeks-included',
                      title: '8 Weeks of Vision Pro Included',
                      description: 'What it is: Full access to VIVA and your Graduate Unlocks. Vibe Tribe, The Alignment Gym, and advanced audios open as soon as you graduate.\nOutcome: Keep compounding after activation before your plan starts.\nDone when: Your access is live now, and your selected plan is scheduled to begin automatically on Day 56 (Annual or Every 28 Days).',
                      icon: Crown,
                      included: true
                    }
                  ]}
                  defaultExpanded={['profile-baseline', 'vibration-assessment']}
                  allowMultiple={true}
                />
                
                <div className="text-center">
                  <Button variant="primary" size="xl" asChild>
                    <a href="#pricing">
                      Start the Activation Intensive
                    </a>
                  </Button>
                </div>
              </Stack>
            </div>
          </Container>
        </section>

        {/* Meet the Mechanism */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#333] border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="sm" className="md:gap-6" align="center">
                <div className="text-center space-y-4">
                  <Heading level={2} className="text-white !mb-0">
                    Meet the Engine Behind VIVA Vision
                  </Heading>
                  <Text size="lg" className="text-neutral-400 font-semibold !mt-4">
                    The 4‑Layer Conscious Creation Writing Architecture (encoded in VIVA)
                  </Text>
                  <Text size="base" className="text-neutral-300 w-full !mt-4">
                    In 2011, Jordan wrote his first Life I Choose™. In 2014, he did it again—and the same pattern showed up. When Vanessa joined, structure met soul. We realized our writing always followed a hidden creation rhythm—then we taught VIVA to guide anyone through it.
                  </Text>
                </div>
                <Grid responsiveCols={{ mobile: 1, desktop: 4 }} minWidth="200px" gap="sm">
                  <FeatureCard 
                    icon={Sparkles} 
                    title={<><span>Layer 1</span><br /><span className="text-[#39FF14]">5‑Phase Flow</span></>}
                    iconColor="#39FF14"
                    variant="outlined"
                    className="!bg-[#39FF14]/10 !border-[#39FF14]/30"
                  >
                    Gratitude → Sensory → Embodiment → Essence → Surrender. This is the emotional arc each vision paragraph follows.
                  </FeatureCard>
                  <FeatureCard 
                    icon={Image} 
                    title={<><span>Layer 2</span><br /><span className="text-[#14B8A6]">Scene Builder</span></>}
                    iconColor="#14B8A6"
                    variant="outlined"
                    className="!bg-[#14B8A6]/10 !border-[#14B8A6]/30"
                  >
                    Turn vague goals into vivid scenes. VIVA prompts for characters, action, setting, and meaning so your vision feels like a real experience.
                  </FeatureCard>
                  <FeatureCard 
                    icon={RefreshCw} 
                    title={<><span>Layer 3</span><br /><span className="text-[#BF00FF]">Flow Loops</span></>}
                    iconColor="#BF00FF"
                    variant="outlined"
                    className="!bg-[#BF00FF]/10 !border-[#BF00FF]/30"
                  >
                    Balance identity, action, and allowing so momentum compounds instead of stalling out.
                  </FeatureCard>
                  <FeatureCard 
                    icon={Maximize2} 
                    title={<><span>Layer 4</span><br /><span className="text-[#FFB701]">Breathing Pace</span></>}
                    iconColor="#FFB701"
                    variant="outlined"
                    className="!bg-[#FFB701]/10 !border-[#FFB701]/30"
                  >
                    Zoom into sensory detail, zoom out to meaning—writing that feels alive (and sticks).
                  </FeatureCard>
                </Grid>
                <Text size="base" className="text-neutral-300 text-center w-full">
                  VIVA now walks you through this 4-Layer Architecture across all 12 life categories—so in 72 hours you finish "active" with your complete vision, AM/PM vision audios, vision board built, 3 journal entries logged, calibration call booked, and your Activation Protocol scheduled.
                </Text>
                <Button variant="primary" size="lg">
                  Start the Activation Intensive
                </Button>
              </Stack>
            </div>
          </Container>
        </section>

        {/* Guarantees Section */}
        <section id="our-guarantees">
          <Container size="xl">
            <div className="bg-[#1F1F1F] border-[#333] border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="xs" className="md:gap-3" align="center">
                <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-8 h-8 text-black" />
                </div>
                <Heading level={2} className="text-center mb-0 md:mb-8">Our Guarantees</Heading>
                
                <Grid responsiveCols={{mobile: 1, desktop: 2}} gap="lg" className="w-full md:items-stretch">
                {/* 72-Hour Activation Guarantee */}
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
                      72‑Hour Activation Guarantee
                    </Heading>
                    <div className="text-center">
                        <p className="text-sm md:text-base text-[#39FF14] font-semibold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Clock starts today
                      </p>
                    </div>
                      <Text size="sm" className="md:text-base text-white text-center">
                      Complete your Activation Checklist in 72 hours. Not satisfied? Full refund of your $499 Intensive fee. No questions asked.
                    </Text>
                      <Text size="xs" className="md:text-sm text-neutral-300 text-center">
                      Completion = all of this done within 72 hours:<br />Profile 70%+ complete, 84‑Q Vibration Assessment submitted, VIVA Vision drafted (12 categories), First refinement done, AM/PM Vision Audios generated, Vision Board built (12 images), 3 journal entries logged (written, voice, video), Calibration Call booked, Activation Protocol scheduled
                    </Text>
                  </Stack>
                  </Card>
                </div>

                {/* Membership Guarantee */}
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
                        <p><span className="font-semibold">28‑Day Plan:</span> 12‑week satisfaction guarantee from today.</p>
                        <p><span className="font-semibold">Annual Plan:</span> 16‑week satisfaction guarantee from today.</p>
                      </div>
                      <div className="text-xs md:text-sm text-neutral-300 text-center space-y-2">
                        <p className="font-semibold">Not satisfied within your window?</p>
                        <p>If your plan <strong className="font-semibold">hasn't billed yet</strong> (first charge is Day 56), we cancel the upcoming charge.</p>
                        <p>If it <strong className="font-semibold">has billed</strong> inside your window, we refund that plan charge and cancel future renewals.</p>
                      </div>
                </Stack>
                  </Card>
                </div>
                </Grid>
              </Stack>
          </div>
          </Container>
        </section>

        {/* Pricing Section */}
        <section id="pricing">
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="xl" className="md:gap-12">
                
                {/* PLAN TYPE TOGGLE */}
                <div className="flex justify-center">
                  <div className="flex md:inline-flex w-full md:w-auto items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700">
                    <button
                      onClick={() => setPlanType('solo')}
                      className={`flex-1 md:flex-none px-6 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                        planType === 'solo'
                          ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30 scale-105'
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
                      onClick={() => setPlanType('household')}
                      className={`flex-1 md:flex-none px-6 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                        planType === 'household'
                          ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30 scale-105'
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
                
                {/* ACTIVATION INTENSIVE TITLE - ENHANCED */}
                <div className="text-center">
                  <Heading level={2} className="text-white text-3xl md:text-5xl font-bold mb-6 md:mb-8">
                    Pricing
                  </Heading>
                  <div className="w-full h-px bg-gradient-to-r from-[#39FF14]/0 via-[#39FF14]/60 to-[#39FF14]/0 mx-auto mb-6 md:mb-8"></div>
                  <Heading level={3} className="mb-3 bg-gradient-to-r from-[#39FF14] via-[#14B8A6] to-[#8B5CF6] bg-clip-text text-transparent">
                      Vision Activation Intensive
                  </Heading>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-gradient-to-r from-[#BF00FF]/20 to-[#8B5CF6]/20 text-[#BF00FF] border-[#BF00FF]/30 mb-4">
                      <Clock className="w-4 h-4 inline mr-2" />
                      72-Hour Activation
                  </span>
                  <Text size="xl" className="text-neutral-300 max-w-3xl mx-auto">
                    Go from blank slate to fully activated in 72 hours. Vision drafted, board built, audios recorded, conscious creation system live.
                  </Text>
                  </div>

                {/* MAIN PRICING CONTENT */}
                <Stack align="center" gap="lg">
                    
                    {/* DYNAMIC PRICE */}
                    <div className="text-center">
                      {promoCode ? (
                        <div className="flex flex-col items-center gap-2 mb-4">
                          <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-neutral-500 line-through opacity-50">
                            $499
                          </div>
                          <div className="text-5xl md:text-7xl lg:text-9xl font-bold text-[#39FF14]">
                            $1
                          </div>
                        </div>
                      ) : (
                        <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-[#39FF14] mb-4">
                          ${getPaymentAmount()}
                        </div>
                      )}
                      <div className="text-xl text-white mb-2 text-center">
                        {promoCode 
                          ? '$498 Off - Pay $1 to Verify Payment Method' 
                          : paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? `× 2 Payments = $${getIntensiveTotal()}` : `× 3 Payments = $${getIntensiveTotal()}`
                        }
                      </div>
                      <div className="text-lg text-neutral-300 text-center">
                        Includes 8 weeks of Vision Pro access
                            </div>
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

                    <Text size="lg" className="text-neutral-300 text-center max-w-2xl">
                      Then continue at your choice below starting Day 56. Cancel anytime before Day 56 to avoid renewal.
                    </Text>

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
                          className={`transition-all relative cursor-pointer md:order-1 order-1 ${
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
                        <Text size="base" className="text-neutral-400 mb-6">Full year, full power • {getPlanSeatsText()}</Text>
                        
                        <div className="inline-flex items-baseline gap-2 mb-2">
                              <span className="text-5xl font-bold text-white">${getVisionProAnnualPrice()}</span>
                              <span className="text-xl text-neutral-400">/year</span>
                        </div>
                        <div className="text-neutral-500 text-sm mb-1">
                              ${getVisionProAnnualPerCycle()}/28 days, billed annually
                        </div>
                        <div className="text-primary-500 text-sm font-semibold">
                              Save {getVisionProAnnualSavings()} vs ${getVisionProMonthlyPrice()} every 28 days
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {[
                              'Platform access: Life Vision Builder (12 categories) with VIVA AI, Vision Boards + AM/PM Vision Audio, Journal, Community, Library, Progress tracking',
                              `Capacity: ${formatTokensShort(TOKEN_GRANTS.ANNUAL)} VIVA tokens/year + ${STORAGE_QUOTAS.ANNUAL}GB storage; tokens reset at renewal`,
                              'Priority response queue',
                              '4 bonus calibration check‑ins per year',
                              '16‑week satisfaction guarantee from today',
                              '12‑month rate lock',
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
                          className={`transition-all cursor-pointer md:order-2 order-1 ${
                        billingPeriod === '28day'
                              ? 'border-2 border-[#00FFFF] bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 scale-105 ring-2 ring-[#00FFFF]'
                              : 'border border-neutral-700 opacity-60 hover:opacity-80'
                      }`}
                          onClick={() => setBillingPeriod('28day')}
                    >
                      <div className="text-center mb-8">
                        <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-2">Vision Pro 28-Day</h3>
                        <Text size="base" className="text-neutral-400 mb-6">Flexible billing cycle • {getPlanSeatsText()}</Text>
                        
                        <div className="inline-flex items-baseline gap-2 mb-2">
                          <span className="text-5xl font-bold text-white">${getVisionProMonthlyPrice()}</span>
                          <span className="text-xl text-neutral-400">/28 days</span>
                        </div>
                        <div className="text-neutral-500 text-sm mb-1">
                              Billed every 4 weeks
                        </div>
                        <div className="text-neutral-400 text-sm">
                          ${planType === 'solo' ? '1,287' : '1,937'} per year (13 cycles)
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {[
                              'Platform access: same as Annual',
                              `Capacity: ${formatTokensShort(TOKEN_GRANTS.MONTHLY_28DAY)} VIVA tokens per 28 days + ${STORAGE_QUOTAS.MONTHLY_28DAY}GB storage; unused tokens roll over (max ${ROLLOVER_LIMITS.MONTHLY_28DAY_MAX_CYCLES} cycles)`,
                              'Standard support queue',
                              '12‑week satisfaction guarantee from today',
                              'Flexible — cancel any cycle',
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
                          className={`transition-all relative cursor-pointer md:order-1 order-2 ${
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
                            <Text size="base" className="text-neutral-400 mb-6">Full year, full power • {getPlanSeatsText()}</Text>
                            
                            <div className="inline-flex items-baseline gap-2 mb-2">
                              <span className="text-5xl font-bold text-white">${getVisionProAnnualPrice()}</span>
                              <span className="text-xl text-neutral-400">/year</span>
                            </div>
                            <div className="text-neutral-500 text-sm mb-1">
                              ${getVisionProAnnualPerCycle()}/28 days, billed annually
                            </div>
                            <div className="text-primary-500 text-sm font-semibold">
                              Save {getVisionProAnnualSavings()} vs ${getVisionProMonthlyPrice()} every 28 days
            </div>
          </div>

                          <div className="space-y-3 mb-8">
                            {[
                              'Platform access: Life Vision Builder (12 categories) with VIVA AI, Vision Boards + AM/PM Vision Audio, Journal, Community, Library, Progress tracking',
                              'Capacity: 5M VIVA tokens/year + 100GB storage; tokens reset at renewal',
                              'Priority response queue',
                              '4 bonus calibration check‑ins per year',
                              '16‑week satisfaction guarantee from today',
                              '12‑month rate lock',
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
                          className={`transition-all cursor-pointer md:order-2 order-2 ${
                            'border border-neutral-700 opacity-60 hover:opacity-80'
                          }`}
                          onClick={() => setBillingPeriod('28day')}
                        >
                          <div className="text-center mb-8">
                            <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-white mb-2">Vision Pro 28-Day</h3>
                            <Text size="base" className="text-neutral-400 mb-6">Flexible billing cycle • {getPlanSeatsText()}</Text>
                            
                            <div className="inline-flex items-baseline gap-2 mb-2">
                              <span className="text-5xl font-bold text-white">${getVisionProMonthlyPrice()}</span>
                              <span className="text-xl text-neutral-400">/28 days</span>
                            </div>
                            <div className="text-neutral-500 text-sm mb-1">
                              Billed every 4 weeks
                            </div>
                            <div className="text-neutral-400 text-sm">
                              ${planType === 'solo' ? '1,287' : '1,937'} per year (13 cycles)
                            </div>
                          </div>

                          <div className="space-y-3 mb-8">
                            {[
                              'Platform access: same as Annual',
                              'Capacity: 375k VIVA tokens per 28 days + 25GB storage; unused tokens roll over (max 3 cycles)',
                              'Standard support queue',
                              '12‑week satisfaction guarantee from today',
                              'Flexible — cancel any cycle',
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
                    <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                      <Stack gap="md" className="md:gap-8">
                        <Heading level={4} className="text-[#39FF14] text-center">Order Summary & Renewal Terms</Heading>
                        
                        {/* Order Summary */}
                        <Stack gap="sm" align="center">
                          {promoCode && (
                            <Badge variant="premium" className="mb-2">
                              🎉 {promoCode.toUpperCase()} Applied - $498 Off!
                            </Badge>
                          )}
                          <div className="text-white text-center text-sm md:text-base">
                            {promoCode ? (
                              // $1 payment verification with promo code
                              <><strong>Today:</strong> <span className="text-[#39FF14] font-bold">$1</span> payment verification + FREE 72‑Hour Intensive + 8 weeks included.</>
                            ) : paymentPlan === 'full' ? (
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
                          <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs">
                            <Shield className="w-3 h-3 text-[#FFFF00]" />
                            <span>72‑Hour Activation Guarantee</span>
                          </div>
                          <div className="text-white text-center text-sm md:text-base">
                            <strong>Day 56:</strong> {billingPeriod === 'annual' 
                              ? '$999 Payment (=$76.85/28 days). Renews annually.'
                              : '$99 Payment. Renews every 28 days.'
                            }
                          </div>
                          <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs">
                            <Shield className="w-3 h-3 text-[#FFFF00]" />
                            <span>{billingPeriod === 'annual' 
                              ? '16‑week Membership Satisfaction Guarantee from today.'
                              : '12‑week Membership Satisfaction Guarantee from today.'
                            }</span>
                          </div>
                          <div className="text-white text-center text-sm md:text-base">
                            <strong>You can switch or cancel any time before Day 56.</strong>
                          </div>
                        </Stack>

                        {/* Required Checkbox */}
                        <div className="flex items-center justify-center">
                          <Checkbox
                            label="I agree to the renewal and guarantee terms above."
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                          />
                        </div>

                        {/* CTA BUTTON */}
                    <div className="flex justify-center">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleIntensivePurchase}
                        disabled={isLoading || !agreedToTerms}
                      >
                        {isLoading ? 'Processing...' : promoCode ? 'Pay $1 & Start Activation Intensive' : 'Start the Activation Intensive'}
                      </Button>
                    </div>
                      </Stack>
                    </Card>

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
                        <a
                          href="#full-faq"
                          className="text-[#39FF14] hover:text-[#5EC49A] underline underline-offset-4 transition-colors text-sm md:text-base"
                        >
                          See Full FAQ
                        </a>
                      </Stack>
                    </Card>

                    {/* FAQ Section */}
                    <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                      <Stack gap="md">
                        <div className="text-center">
                          <Heading level={4} className="text-white font-bold border-b-2 border-[#39FF14] pb-2 inline-block">FAQ's</Heading>
                        </div>
                        <Stack gap="sm" className="text-left">
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">When does billing start?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">$499 today for the Intensive + 8 weeks included. Day 56 your selected plan begins automatically.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">Can I switch or cancel my membership before Day 56?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">Yes—1‑click switch/cancel anytime before Day 56.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">When do guarantees start?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">From checkout (today), not at first renewal.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">What qualifies for the 72‑Hour Activation Guarantee?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">Complete your Activation Checklist in 72 hours. Completion = Profile 70%+ complete, 84‑Q Vibration Assessment submitted, VIVA Vision drafted (12 categories), First refinement done, AM/PM Vision Audios generated, Vision Board built (12 images), 3 journal entries logged (written, voice, video), Calibration Call booked, Activation Protocol scheduled.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">What if I'm not satisfied with the membership?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">Annual: 16‑week satisfaction guarantee from today. 28‑Day: 12‑week satisfaction guarantee. We'll refund the plan and cancel future renewals.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">What if I don't know what I want?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">VIVA AI turns contrast into clarity and drafts your 12‑category Life Vision for you.</p>
                            </div>
                          </div>
                        </Stack>
                        <div className="text-center mt-4 space-y-4">
                          <a
                            href="#full-faq"
                            className="text-[#39FF14] hover:text-[#5EC49A] underline transition-colors cursor-pointer text-sm md:text-base block mb-6"
                          >
                            See full FAQ
                          </a>
                          <div>
                            <Button variant="primary" size="xl" asChild>
                              <a href="#pricing">
                                Start the Activation Intensive
                              </a>
                          </Button>
                          </div>
                        </div>
                      </Stack>
                    </Card>
                  </Stack>
              </Stack>
          </div>
          </Container>
        </section>

        {/* FAQ Section - Full FAQ Placeholder */}
        <section id="full-faq-placeholder" className="hidden" aria-hidden="true">
          {/* Reserved for future FAQ content */}
        </section>

        {/* The Problem: Vibrational Chaos */}
        <section id="problem">
          <Container size="xl">
            <div className="border-[#FF0040]/30 bg-[#FF0040]/5 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8">
                <div className="text-center">
                  <div className="flex flex-wrap justify-center">
                    <Heading level={2} className="text-white mb-4 text-2xl sm:text-3xl md:text-5xl">
                  The Problem: <span className="text-[#FF0040]">Vibrational Chaos</span>
                    </Heading>
                  </div>
                  <Text size="lg" className="text-neutral-300 mb-8">
                    Vibrational chaos = being consistently inconsistent about the same desire.
                </Text>
                </div>
                <Stack gap="md" className="md:gap-8">
                  {/* Symptoms Section */}
                  <div className="-mt-4 md:-mt-6">
                    <Heading level={3} className="text-[#FF0040] text-center mb-4">Symptoms</Heading>
                    <div className="space-y-3 text-center px-0 md:px-4">
                      <BulletedList className="inline-flex flex-col items-center gap-2">
                        <ListItem variant="error" className="text-center max-w-xl">Flip‑flop thoughts: "I want it" ⇄ "I can't have it"</ListItem>
                        <ListItem variant="error" className="text-center max-w-xl">Toddlers‑with‑scissors beliefs running your mind</ListItem>
                        <ListItem variant="error" className="text-center max-w-xl">Open loops: start, stop, restart—no dominant signal</ListItem>
                        <ListItem variant="error" className="text-center max-w-xl">Seeking signs instead of setting structure</ListItem>
                        <ListItem variant="error" className="text-center max-w-xl">Evidence‑hunting for why it won't work</ListItem>
                      </BulletedList>
                    </div>
              </div>

                  {/* 60-Second Self-Check */}
                  <div className="bg-[#1F1F1F]/50 rounded-xl p-6 border border-[#FF0040]/30 w-full max-w-5xl mx-auto">
                    <Heading level={3} className="text-white mb-4 text-center">60‑Second Self‑Check</Heading>
                    <Text size="sm" className="text-neutral-400 text-center mb-4">Tap Yes/No for each. Your score appears instantly.</Text>
                    <Text size="sm" className="text-neutral-300 text-center mb-4 font-semibold">In the past 7 days did you...</Text>
                    <Stack gap="sm" className="items-center">
                      {[
                        'Contradict a key desire with doubt?',
                        'Avoid writing what you want ("I\'m not sure yet")?',
                        'Start, stop, and "restart Monday"?',
                        'Consume more than you create (no assets built)?',
                        'Dismiss a small win as "luck"?'
                      ].map((question, index) => (
                        <div key={index} className="flex flex-col items-center gap-3 py-3 border-b border-neutral-700/50 last:border-b-0 w-full">
                          <Text size="sm" className="text-neutral-300 text-center">{question}</Text>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                const newAnswers = [...selfCheckAnswers]
                                newAnswers[index] = true
                                setSelfCheckAnswers(newAnswers)
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[44px] ${
                                selfCheckAnswers[index]
                                  ? 'bg-[#39FF14] text-black scale-105 shadow-lg shadow-[#39FF14]/20'
                                  : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => {
                                const newAnswers = [...selfCheckAnswers]
                                newAnswers[index] = false
                                setSelfCheckAnswers(newAnswers)
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[44px] ${
                                selfCheckAnswers[index] === false
                                  ? 'bg-neutral-800 text-white border-2 border-[#333]'
                                  : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ))}
                      {(() => {
                        const chaosScore = calculateChaosScore()
                        const prescriptions = getPrescription()
                        return (
                          <div className="space-y-4">
                            <div 
                              className={`border-2 rounded-lg p-4 mt-4`}
                              style={{ borderColor: chaosScore.color }}
                            >
                              <Text size="sm" className="text-center">
                                <strong style={{ color: chaosScore.color }}>Score: {chaosScore.score}/5</strong>
                                <span className="text-neutral-400 ml-2">= {chaosScore.label}</span>
                              </Text>
                            </div>
                            {prescriptions.length > 0 && (
                              <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg p-4">
                                <Text size="sm" className="text-[#39FF14] font-semibold mb-2">Micro‑prescriptions:</Text>
                                <Stack gap="xs">
                                  {prescriptions.map((prescription, idx) => (
                                    <Text key={idx} size="sm" className="text-neutral-300">
                                      • {prescription}
                                    </Text>
                                  ))}
                                </Stack>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      <div className="text-center mt-6">
                        <Text size="sm" className="text-neutral-400 text-center mb-3">
                          Ditch chaos in 72 hours
                        </Text>
                        <Button variant="primary" size="md" asChild>
                          <a href="#pricing">
                            Start the Activation Intensive
                          </a>
                        </Button>
                      </div>
                    </Stack>
                  </div>


                  {/* Bridge Section */}
                  <div className="bg-[#1F1F1F]/50 rounded-xl p-6 border border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                    <Heading level={3} className="text-[#39FF14] mb-3 text-center">The Fix</Heading>
                    <Text size="base" className="text-neutral-300 mb-4">
                      Chaos is an input problem. Structure fixes inputs. Conscious Creation System: Train → Tune → Track turns scattered signals into a dominant point of attraction.
                    </Text>
                    <Text size="sm" className="text-neutral-300">
                      <strong className="text-[#39FF14]">Cost of chaos:</strong> weeks pass, assets = 0. <strong className="text-[#39FF14]">Structure</strong> = a complete vision, audio, board, journals in 72 hours—visible progress now.
                    </Text>
                  </div>

                  {/* CTA */}
                  <div className="text-center">
                    <Text size="sm" className="text-neutral-400 text-center mb-3">
                      Ditch chaos in 72 hours
                    </Text>
                    <Button variant="primary" size="lg" asChild>
                      <a href="#pricing">
                        Start the Activation Intensive
                      </a>
                    </Button>
                  </div>
                </Stack>
              </Stack>
            </div>
          </Container>
        </section>

        {/* The Solution: Conscious Creation System */}
        <section id="solution">
          <Container size="xl">
            <Card variant="outlined" className="border-[#39FF14] bg-[#0F1612]/70 p-4 md:p-6 shadow-[0_18px_60px_rgba(57,255,20,0.12)]">
              <Stack gap="lg">
                <div className="text-center w-full space-y-3">
                  <Heading level={2} className="text-white mb-4 leading-tight">
                    <span className="block md:inline">The Solution:</span>{' '}
                    <span className="block md:inline text-[#39FF14]">Conscious Creation System</span>
                  </Heading>
                  <Text size="lg" className="text-neutral-200 max-w-3xl mx-auto">
                    Structure beats "trying." Follow a simple path—Train → Tune → Track—to go from no idea to an activated Life Vision in 72 hours.
                  </Text>
                  <Text size="sm" className="text-neutral-300 tracking-wide max-w-3xl mx-auto">
                    <strong>Vibrational fitness is your system for conscious creation.</strong> It's doing the reps that keep you aligned with your Life Vision—so your outer world naturally begins to reflect it, again and again and again.
                  </Text>
                </div>

                <Grid responsiveCols={{ mobile: 1, desktop: 3 }} gap="lg">
                  <Card variant="elevated" className="h-full border-[#39FF14]/30 bg-[#39FF14]/6">
                    <Stack gap="md" className="h-full">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14]/25 to-transparent rounded-2xl flex items-center justify-center mx-auto">
                        <Icon icon={Dumbbell} size="lg" color="#39FF14" />
                      </div>
                      <Stack gap="sm" className="text-left items-center">
                        <Heading level={3} className="text-white text-center uppercase tracking-wide !mb-0">
                          Train
                        </Heading>
                        <Text size="base" className="text-neutral-400 uppercase tracking-wide text-center -mt-1">(0–72h)</Text>
                        <Text size="sm" className="text-neutral-300 font-semibold text-center w-full">Your activation checklist</Text>
                        <BulletedList className="space-y-1 text-neutral-100">
                          <ListItem variant="success" icon={Check}>Profile 70%+ complete</ListItem>
                          <ListItem variant="success" icon={Check}>84‑Q Vibration Assessment submitted</ListItem>
                          <ListItem variant="success" icon={Check}>VIVA Vision drafted (12 categories)</ListItem>
                          <ListItem variant="success" icon={Check}>First refinement done</ListItem>
                          <ListItem variant="success" icon={Check}>AM/PM Vision Audios generated</ListItem>
                          <ListItem variant="success" icon={Check}>Vision Board built (12 images)</ListItem>
                          <ListItem variant="success" icon={Check}>3 journal entries logged (written, voice, and video so you find your preferred mode)</ListItem>
                          <ListItem variant="success" icon={Check}>Calibration Call booked</ListItem>
                          <ListItem variant="success" icon={Check}>Activation Protocol scheduled</ListItem>
                        </BulletedList>
                        <Text size="sm" className="text-neutral-200 text-center">
                          <strong className="text-[#39FF14]">Done when:</strong> all boxes checked within 72 hours.
                        </Text>
                      </Stack>
                    </Stack>
                  </Card>

                  <Card variant="elevated" className="h-full border-[#00FFFF]/30 bg-[#00FFFF]/8">
                    <Stack gap="md" className="h-full">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#00FFFF]/25 to-transparent rounded-2xl flex items-center justify-center mx-auto">
                        <Icon icon={Brain} size="lg" color="#00FFFF" />
                      </div>
                      <Stack gap="sm" className="text-left items-center">
                        <Heading level={3} className="text-white text-center uppercase tracking-wide !mb-0">
                          Tune
                        </Heading>
                        <Text size="base" className="text-neutral-400 uppercase tracking-wide text-center -mt-1">(ongoing)</Text>
                        <Text size="sm" className="text-neutral-300 font-semibold text-center w-full">Keep your signal aligned as life evolves</Text>
                        <BulletedList className="space-y-1">
                          <ListItem variant="accent" icon={Check} className="!text-[#00FFFF]">Refine your Life Vision when clarity increases (weekly pass)</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#00FFFF]">Regenerate AM/PM Vision Audios to match updates</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#00FFFF]">Follow your Activation Protocol daily (no skipped reps)</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#00FFFF]">Update profile & assessment when major life changes occur (check-in quarterly)</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#00FFFF]">Use VIVA prompts whenever contrast appears</ListItem>
                        </BulletedList>
                        <Text size="sm" className="text-neutral-200 text-center">
                          <strong className="text-[#00FFFF]">Done when:</strong> weekly refinement logged + protocol streak active (7+ days).
                        </Text>
                      </Stack>
                    </Stack>
                  </Card>

                  <Card variant="elevated" className="h-full border-[#BF00FF]/30 bg-[#BF00FF]/8">
                    <Stack gap="md" className="h-full">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#BF00FF]/25 to-transparent rounded-2xl flex items-center justify-center mx-auto">
                        <Icon icon={TrendingUp} size="lg" color="#BF00FF" />
                      </div>
                      <Stack gap="sm" className="text-left items-center">
                        <Heading level={3} className="text-white text-center uppercase tracking-wide !mb-0">
                          Track
                        </Heading>
                        <Text size="base" className="text-neutral-400 uppercase tracking-wide text-center -mt-1">(ongoing)</Text>
                        <Text size="sm" className="text-neutral-300 font-semibold text-center w-full">Build visible momentum and proof</Text>
                        <BulletedList className="space-y-1">
                          <ListItem variant="accent" icon={Check} className="!text-[#BF00FF]">Log iterations and wins; watch streaks grow</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#BF00FF]">Journal regularly in whatever format you prefer (written, voice, or video) to see your progress and spot patterns</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#BF00FF]">Keep your Vision Board current with on‑signal images and actualization stories</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#BF00FF]">Review your progress weekly (dashboard metrics)</ListItem>
                          <ListItem variant="accent" icon={Check} className="!text-[#BF00FF]">Share a win in the Vibe Tribe for accountability</ListItem>
                        </BulletedList>
                        <Text size="sm" className="text-neutral-200 text-center">
                          <strong className="text-[#BF00FF]">Done when:</strong> 1 weekly review complete + 1 shared win.
                        </Text>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>

                <div className="text-center">
                  <Button variant="primary" size="lg" asChild>
                    <a href="#pricing">
                      Start the Activation Intensive
                    </a>
                  </Button>
                </div>
              </Stack>
            </Card>
          </Container>
        </section>

        {/* Final CTA */}
        <section>
          <Container size="xl">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/15 via-[#00FFFF]/10 to-[#BF00FF]/15 border-[#39FF14]/30 p-4 md:p-6 shadow-[0_20px_60px_rgba(57,255,20,0.18)]">
              <Stack align="center" gap="lg" className="text-center">
                <Heading level={2} className="text-white">
                  <span className="bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#BF00FF] bg-clip-text text-transparent">Welcome Home</span>
                </Heading>
                <div className="w-20 h-[2px] md:h-[3px] bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#BF00FF] rounded-full"></div>

                <div className="w-full max-w-5xl mx-auto space-y-6">
                  <Text size="lg" className="md:text-xl text-neutral-200">
                    Ditch vibrational chaos. Activate your Life Vision in 72 hours—then keep compounding with Vision Pro.
                  </Text>

                  <Grid responsiveCols={{ mobile: 1, desktop: 3 }} gap="lg" className="w-full">
                    <Card variant="glass" className="text-center">
                      <Stack gap="sm">
                        <Icon icon={Sparkles} size="lg" color="#39FF14" className="mx-auto" />
                        <Text size="sm" className="font-semibold text-white">Gain Clarity</Text>
                        <Text size="sm" className="text-neutral-400">12‑category Life Vision completed with VIVA</Text>
                      </Stack>
                    </Card>
                    <Card variant="glass" className="text-center">
                      <Stack gap="sm">
                        <Icon icon={Brain} size="lg" color="#00FFFF" className="mx-auto" />
                        <Text size="sm" className="font-semibold text-white">Establish Harmony</Text>
                        <Text size="sm" className="text-neutral-400">AM/PM Vision Audios + daily Activation Protocol</Text>
                      </Stack>
                    </Card>
                    <Card variant="glass" className="text-center">
                      <Stack gap="sm">
                        <Icon icon={Target} size="lg" color="#BF00FF" className="mx-auto" />
                        <Text size="sm" className="font-semibold text-white">Lock It In</Text>
                        <Text size="sm" className="text-neutral-400">Vision Board built, 3 journals logged, dashboard tracking</Text>
                      </Stack>
                    </Card>
                  </Grid>

                  <Stack gap="sm" align="center">
                    <Text size="lg" className="text-neutral-300 text-center italic max-w-xl">
                      <span className="block md:inline">"What would happen if my vision became the dominant signal</span>{' '}
                      <span className="block md:inline">in my life?"</span>
                    </Text>
                    <Text size="lg" className="text-[#39FF14] font-semibold text-center">
                      Answer: You'd wake up excited, living the life you choose.
                    </Text>
                  </Stack>
                </div>

                <div className="w-full max-w-xl">
                  <Button variant="primary" size="xl" className="w-full" asChild>
                    <a href="#pricing">
                      Start the Activation Intensive
                    </a>
                  </Button>
                  <Text size="xs" className="text-neutral-400 text-center mt-2">
                    $499 today. Includes 8 weeks of Vision Pro. Day 56: auto‑continue at your selected plan.
                  </Text>
                  <div className="flex flex-col items-center justify-center gap-3 text-xs uppercase tracking-wide text-neutral-400 mt-4">
                    <div className="flex items-center gap-2">
                      <Icon icon={Shield} size="sm" className="text-[#39FF14] flex-shrink-0" />
                      <span className="leading-tight">Covered by the 72‑Hour Activation Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon={Award} size="sm" className="text-[#00FFFF] flex-shrink-0" />
                      <span className="leading-tight">Membership Guarantee: 16 weeks (Annual) • 12 weeks (Every 28 Days)</span>
                    </div>
                  </div>
                </div>
              </Stack>
            </Card>
          </Container>
        </section>

        {/* FAQ Section */}
        <section id="full-faq">
          <Container size="xl">
            <Card variant="elevated" className="bg-[#0F1612]/80 border-[#39FF14]/20 p-4 md:p-6 lg:p-8 shadow-[0_24px_60px_rgba(57,255,20,0.12)]">
              <Stack gap="lg" className="md:gap-10">
                <div className="text-center space-y-2">
                  <Heading level={2} className="text-white">
                    Frequently Asked Questions
                  </Heading>
                  <Text size="lg" className="text-neutral-300">
                    Everything you need to know
                  </Text>
                </div>
                <OfferStack
                  items={[
                {
                  id: 'skeptical',
                  title: 'What if I\'m skeptical?',
                  description: 'Good. That\'s why we stack raw proof, a structured mechanism, and guarantees. See the vision transformations (including $0.74 → $1M screenshots), the Conscious Creation System: Train → Tune → Track, and our 72‑Hour Activation + Membership Guarantees.'
                },
                {
                  id: 'religious',
                  title: 'Is this religious?',
                  description: 'No doctrine. It\'s a practical system with tools and habits. We measure observable outputs (vision built, audio generated, board created, journals logged, call completed) and track progress.'
                },
                {
                  id: 'how-fast',
                  title: 'How fast is "fast"?',
                  description: '"Active" in 72 hours: Profile 70%+ complete, 84‑Q Vibration Assessment submitted, VIVA Vision drafted (12 categories), First refinement done, AM/PM Vision Audios generated, Vision Board built (12 images), 3 journal entries logged (written, voice, video), Calibration Call booked, Activation Protocol scheduled'
                },
                {
                  id: 'tried-loa',
                  title: 'What if I\'ve tried LoA and failed?',
                  description: 'Most people had belief without structure. We give you the mechanism (Train → Tune → Track), proof it works, and guarantees if you\'re not satisfied.'
                },
                {
                  id: 'dont-know',
                  title: 'What if I don\'t know what I want?',
                  description: 'VIVA AI turns contrast into clarity and drafts your 12‑category life vision with you using our 4‑Layer Conscious Creation Writing Architecture (encoded in VIVA). You\'ll have a concrete first draft to refine within 72 hours of starting—something that used to take Jordan and Vanessa months to do on their own without VIVA\'s help.'
                },
                {
                  id: 'doesnt-work',
                  title: 'What if it doesn\'t work for me?',
                  description: 'Two layers of protection: 72‑Hour Activation Guarantee (complete your Activation Checklist in 72 hours; not satisfied—full refund) and Membership Satisfaction Guarantee (16 weeks Annual, 12 weeks 28‑Day) from checkout.'
                },
                {
                  id: 'guarantee-start',
                  title: 'When do guarantees start?',
                  description: (
                    <span>
                      From checkout (today), not at first renewal. See{' '}
                      <a
                        href="#our-guarantees"
                        className="text-[#39FF14] underline underline-offset-4 hover:text-[#5EC49A] transition-colors"
                      >
                        Our Guarantees
                      </a>{' '}
                      for more information.
                    </span>
                  )
                },
                {
                  id: 'guarantee-qualify',
                  title: 'What qualifies for the 72‑Hour Activation Guarantee?',
                  description: 'Complete your Activation Checklist in 72 hours. Completion = Profile 70%+ complete, 84‑Q Vibration Assessment submitted, VIVA Vision drafted (12 categories), First refinement done, AM/PM Vision Audios generated, Vision Board built (12 images), 3 journal entries logged (written, voice, video), Calibration Call booked, Activation Protocol scheduled. If you complete your Activation Checklist in 72 hours and are not satisfied, you\'ll get a full refund of your $499 Intensive fee. No questions asked.'
                },
                {
                  id: 'refunds',
                  title: 'How do refunds work?',
                  description: (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">What's covered</p>
                        <ul className="list-disc marker:text-[#39FF14] pl-5 space-y-1 text-sm text-neutral-300">
                          <li>
                            72‑Hour Activation Guarantee: if you complete your Activation Checklist in 72 hours and aren't satisfied, we refund the $499 Intensive fee. (Completion = Profile 70%+ complete, 84‑Q Vibration Assessment submitted, VIVA Vision drafted (12 categories), First refinement done, AM/PM Vision Audios generated, Vision Board built (12 images), 3 journal entries logged (written, voice, video), Calibration Call booked, Activation Protocol scheduled.)
                          </li>
                          <li>
                            Membership Satisfaction Guarantee: from checkout date—16 weeks (Annual) or 12 weeks (28‑Day). If your plan hasn't billed yet (first charge is Day 56), we cancel the upcoming charge. If a plan charge occurred within your window, we refund that charge in full.
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">How to request</p>
                        <p className="text-sm text-neutral-300">
                          When logged in, go to the Support tab (left sidebar on desktop/ under "More" on mobile). If you are logged in, you can click here: <a href="/support" className="text-[#39FF14] underline underline-offset-4 hover:text-[#5EC49A] transition-colors">Support</a>. We reply within 1 business day.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">How it's paid</p>
                        <p className="text-sm text-neutral-300">
                          Refunds go back to the original payment method. Banks typically show the credit in 5–10 business days. (If the original charge is very recent, it can post as a reversal and the original charge disappears.)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">What happens to access</p>
                        <p className="text-sm text-neutral-300">
                          When we refund the Intensive, your account downgrades immediately. Membership refunds cancel future renewals and remove paid features tied to that plan.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Limits</p>
                        <p className="text-sm text-neutral-300">
                          One refund per customer per product. We don't cover currency conversion, bank fees, or taxes outside our control. Abuse or duplicate accounts void guarantees.
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  id: 'billing-start',
                  title: 'When does billing start?',
                  description: '$499 today for the Intensive + 8 weeks included. Day 56 your selected plan begins automatically.'
                },
                {
                  id: 'what-is-vibrational-fitness',
                  title: 'What is Vibrational Fitness?',
                  description: 'The skill of training your vibration to attract the life you choose using a repeatable system—Train → Tune → Track—so progress is visible (checklists, artifacts, streaks), not hypothetical.'
                },
                {
                  id: 'switch-cancel',
                  title: 'Can I switch or cancel before billing starts?',
                  description: 'Yes—1‑click switch/cancel anytime before Day 56.'
                },
                {
                  id: 'change-plans',
                  title: 'Can I change plans later?',
                  description: (
                    <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
                      <p>
                        <span className="font-semibold text-[#39FF14]">Short answer:</span> Yes. You can switch plans. Here's exactly how it works and why we do it this way.
                      </p>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Before your first plan charge (Day 56)</p>
                        <p>
                          You can switch from Annual to Every 28 Days or vice-versa in one click. Your selection updates instantly; the first charge still occurs on Day 56 at the new plan.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">After billing starts (Day 56 and beyond)</p>
                        <ul className="list-disc marker:text-[#39FF14] pl-5 space-y-1">
                          <li>
                            <span className="font-semibold text-white">Every 28 Days → Annual:</span> Switch anytime; your annual prepay starts on your next renewal date. If you want to prepay now (to lock the rate and savings immediately), you can start Annual today and we'll end your current 28-day cycle early with no penalty.
                          </li>
                          <li>
                            <span className="font-semibold text-white">Annual → Every 28 Days:</span> Switch effective at your annual renewal. Annual prepay is not split into partial refunds; you keep access through your paid year, then move to 28-day.
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Rate-lock (Annual)</p>
                        <p>
                          Annual prepay includes a 12-month rate lock—your price won't change during your paid year.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Pricing cadence</p>
                        <p>
                          Every 28 Days bills every four weeks (13 cycles/year). We display savings using a 28-day equivalent for apples-to-apples comparison with Annual.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Guarantees stay intact when you switch</p>
                        <p>
                          Your Membership Satisfaction Guarantee window starts at checkout (today): 16 weeks (Annual) or 12 weeks (Every 28 Days). Switching plans doesn't reset the clock; it just changes what you'll be billed at the next renewal.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Why we do it this way</p>
                        <p className="text-sm text-neutral-300">
                          Letting you switch at renewal gives flexibility without creating billing confusion.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">How to switch</p>
                        <p className="text-sm text-neutral-300">
                          When logged in, under "Settings" &gt; <a href="/billing" className="text-[#39FF14] underline underline-offset-4 hover:text-[#5EC49A] transition-colors">"Billing & Subscription"</a>, choose "Manage Billing." If you're pre-Day 56, your first charge will run on Day 56 at the selected plan. If you're mid-cycle, the change applies at the next renewal (or immediately for an upgrade to Annual if you choose to prepay now).
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          We'll always show your next charge date and amount before you confirm any change.
                        </p>
                        <p>
                          If we ever change prices for new customers, your annual rate-lock protects you through your paid year.
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  id: '5-phase-flow',
                  title: 'What is the 4‑Layer Conscious Creation Writing Architecture?',
                  description: (
                    <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
                      <p>
                        The 4-Layer Conscious Creation Writing Architecture is the energetic blueprint behind The Life I Choose™ vision document. It's how Vibration Fit transforms words on a page into a living, breathing frequency field that your subconscious can align with.
                      </p>
                      <p>
                        Every Life I Choose document follows four interacting layers:
                      </p>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">The 5-Phase Conscious Creation Flow</p>
                        <p>
                          The energetic rhythm of every paragraph. Each section naturally moves from Gratitude → Sensory Detail → Embodiment → Essence → Allowing.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">The Who / What / Where / Why Framework</p>
                        <p>
                          The narrative orientation that gives your vision shape and clarity. It defines who you are being, what you're doing, where you are, and why it matters emotionally.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">The Being / Doing / Receiving Loops</p>
                        <p>
                          The vibrational cycling that keeps your energy balanced. You activate the feeling (Being), express it through aligned action (Doing), and open space to let results flow in (Receiving).
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Micro–Macro Paragraph Breathing</p>
                        <p>
                          The emotional pacing that gives your writing life. Your paragraphs expand into vivid sensory scenes (macro) and then contract back into essence (micro), creating a rhythm that feels alive when you read or listen to it.
                        </p>
                      </div>
                      <p>
                        Together, these four layers turn your writing into a vibrational practice—helping you not just describe your dream life, but tune to it until it becomes your reality.
                      </p>
                    </div>
                  )
                },
                {
                  id: 'tokens-storage',
                  title: 'How do tokens and storage work?',
                  description: (
                    <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Annual token & storage capacity</p>
                        <p>{formatTokensShort(TOKEN_GRANTS.ANNUAL)} VIVA tokens/year + {STORAGE_QUOTAS.ANNUAL}GB storage; tokens reset at renewal.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">28-Day token & storage capacity</p>
                        <p>{formatTokensShort(TOKEN_GRANTS.MONTHLY_28DAY)} VIVA tokens per 28 days + {STORAGE_QUOTAS.MONTHLY_28DAY}GB storage; unused tokens roll over (max {ROLLOVER_LIMITS.MONTHLY_28DAY_MAX_CYCLES} cycles).</p>
                      </div>
                      <p>Both plans can add-on extra tokens or storage for a fee.</p>
                    </div>
                  )
                },
                {
                  id: 'billing-cadence',
                  title: 'Do you charge sales tax/VAT/GST?',
                  description: (
                    <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Today</p>
                        <p>We don't collect sales tax/VAT/GST at checkout right now. The price you see is the price you pay (plus any bank/FX fees your bank may add).</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">If this changes</p>
                        <p>If a law or your location requires tax in the future, we'll calculate it from your billing address, show it clearly at checkout before you pay, and itemize it on your receipt. We'll notify you ahead of any change.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">Receipts</p>
                        <p>Your receipt will show a $0.00 tax line while tax collection is not enabled.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">International buyers</p>
                        <p>Your bank may add currency conversion or cross-border fees—we don't control those.</p>
                      </div>
                      <p>Note: This is not tax advice. If you're required to self-assess/use tax in your jurisdiction, consult your local guidance.</p>
                    </div>
                  )
                }
              ]}
                  className="w-full max-w-5xl mx-auto"
                />
              </Stack>
            </Card>
          </Container>
        </section>

      </Stack>
  )
}