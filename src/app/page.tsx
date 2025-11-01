'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, ArrowRight, Star, Target,
  Brain, TrendingUp, Shield, Play, Award, Globe, Crown, Check, Clock, User,
  Headphones, Image, BookOpen, CalendarDays, Lock, HelpCircle, Eye
} from 'lucide-react'
import { toast } from 'sonner'
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
  Heading,
  Text,
  Title,
  BulletedList,
  ListItem,
} from '@/lib/design-system'

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
  { key: 'possessions', label: 'Possessions / Stuff', icon: Package, description: 'Material abundance' },
  { key: 'giving', label: 'Giving / Legacy', icon: Gift, description: 'Impact & contribution' },
  { key: 'spirituality', label: 'Spirituality', icon: Zap, description: 'Inner connection & purpose' },
  { key: 'conclusion', label: 'Conclusion', icon: CheckCircle, description: 'Integration & completion' },
]

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
      // Directly create Stripe checkout session
      const response = await fetch('/api/stripe/checkout-combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensivePaymentPlan: paymentPlan,
          continuityPlan: billingPeriod,
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
            <div className="w-full">
              {/* Headline at top */}
              <div className="text-center mb-4 md:mb-6">
                <Heading level={1} className="text-white leading-tight">
                  Thoughts become things…<br />so why isn't it working?
                </Heading>
              </div>
              
              {/* Two column layout for desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left column - Content */}
                <div className="space-y-6 text-center lg:text-left flex flex-col justify-center">
                  <Heading level={3} className="text-neutral-200 text-center md:text-center mt-2 md:mt-2 mb-2">
                    Bridge the woo-woo with the how-to.
                  </Heading>
                  
                  <Heading level={4} className="text-[#39FF14] text-center md:text-center mt-4 mb-4">
                    Activate your Life Vision in <span className="font-bold text-[#39FF14]">72 hours</span>
                    <br />
                    with the Activation Intensive.
                  </Heading>
                  
                  <BulletedList className="leading-relaxed lg:text-left lg:ml-6">
                    <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                      Conscious Creation System: Train → Tune → Track
                    </ListItem>
                    <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                      VIVA AI turns contrast into clarity—even if you don't know what you want
                    </ListItem>
                    <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                      Powered by the 5‑Phase Flow inside VIVA Vision
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
                <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto order-last lg:order-last lg:mt-4">
                  <Video
                    src="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-1080p.mp4"
                    poster="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-poster.jpg"
                    variant="hero"
                    quality="auto"
                    trackingId="homepage-hero-video"
                    saveProgress={true}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </Cover>
        </section>

        {/* Two Column Section with Item List Card */}
        <section>
          <Container size="xl">
            <TwoColumn gap="lg">
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
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200">12‑category Life Vision completed (with VIVA)</Text>
                </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200">AM/PM Vision Audios generated</Text>
                  </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200">Vision Board built (12 images, 1 per category)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200">3 journal entries logged (Gratitude, Connect‑the‑Dots, Progress)</Text>
                  </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200">Calibration call booked</Text>
                  </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200">Activation Protocol scheduled</Text>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6">
                <FlowCards
                  items={[
                    {
                      label: 'Train',
                      description: 'Complete profile (70%+) + 84‑Q assessment; finish first Life Vision (with VIVA)',
                      icon: Brain,
                      iconColor: '#39FF14'
                    },
                    {
                      label: 'Tune',
                      description: 'Refine your vision; generate AM/PM Vision Audios; build your 12‑image Vision Board; start the Activation Protocol',
                      icon: Target,
                      iconColor: '#14B8A6'
                    },
                    {
                      label: 'Track',
                      description: 'Journal daily (Gratitude, Dots, Progress), log iterations, and watch streaks and wins grow',
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

        {/* Meet the Mechanism */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8" align="center">
                <Heading level={2} className="text-white text-center">
                  Meet the Mechanism
                </Heading>
                <Card variant="outlined" className="w-full border-2 !border-[#39FF14]/30 !bg-[#39FF14]/20 flex items-center justify-center pb-4 md:pb-3">
                  <Heading level={3} className="text-white text-center">
                    The 5‑Phase Conscious Creation Flow<br className="md:hidden" />(encoded in VIVA)
                  </Heading>
                </Card>
                <Grid responsiveCols={{ mobile: 1, desktop: 5 }} minWidth="200px" gap="sm">
                  <FeatureCard 
                    icon={Heart} 
                    title="Gratitude Opening" 
                    iconColor="#39FF14"
                    variant="outlined"
                    number={1}
                  >
                    Access the frequency with thanks
                  </FeatureCard>
                  <FeatureCard 
                    icon={Eye} 
                    title="Sensory Expansion" 
                    iconColor="#39FF14"
                    variant="outlined"
                    number={2}
                  >
                    Make it tangible with sight/sound/feel
                  </FeatureCard>
                  <FeatureCard 
                    icon={Brain} 
                    title="Mental Lifestyle Embodiment" 
                    iconColor="#39FF14"
                    variant="outlined"
                    number={3}
                  >
                    Live it now in present tense
                  </FeatureCard>
                  <FeatureCard 
                    icon={Target} 
                    title="Essence Summarization" 
                    iconColor="#39FF14"
                    variant="outlined"
                    number={4}
                  >
                    Lock in the core emotion
                  </FeatureCard>
                  <FeatureCard 
                    icon={Sparkles} 
                    title="Universal Surrender" 
                    iconColor="#39FF14"
                    variant="outlined"
                    number={5}
                  >
                    Release it to unfold
                  </FeatureCard>
                </Grid>
                <Text size="xs" className="text-neutral-400 text-center">
                  VIVA guides you through all 5 phases across 12 life categories in 72 hours.
                    </Text>
              </Stack>
            </div>
          </Container>
        </section>

        {/* 72-Hour Activation Path */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8">
                <Heading level={2} className="text-white text-center">
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
                              <Text size="sm" className="text-neutral-400">Journal x3 — Gratitude, Dots, Progress</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#FFFF00] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <Text size="base" className="font-semibold text-white">Phase 4 — Calibration & Launch</Text>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Attend Calibration — 30‑min live call</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Activation Protocol — Execute custom Activation Plan</Text>
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
                            <Text size="base" className="font-semibold text-white">Phase 1 — Foundation (Hours 0–24)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Complete Profile — 70%+ completion</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Vibration Assessment — 84 questions submitted</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Book Calibration — 1:1 call scheduled</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#00FFFF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 2 — Vision Creation (Hours 24–48)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Build Life Vision — All 12 categories drafted with VIVA</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Refine Vision — Polished with VIVA + refinement tool</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#BF00FF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 3 — Activation Tools (Hours 48–72)</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Generate Vision Audio — AM + PM tracks created</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Create Vision Board — 12 images (1 per category) added</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Journal x3 — Gratitude, Connect‑the‑Dots, Progress entries logged</Text>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#FFFF00] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <Text size="base" className="font-semibold text-white">Phase 4 — Calibration & Launch</Text>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Attend Calibration — Live 30‑minute session</Text>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <Text size="sm" className="text-neutral-400">Execute Activation Protocol — Your custom Activation Plan in place</Text>
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

        {/* Offer Stack Section */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="md" className="md:gap-8">
                <div className="text-center">
                  <Heading level={2} className="text-white mb-4">
                    Exactly What You Get Today
                  </Heading>
                  <Text size="lg" className="text-neutral-400 max-w-2xl mx-auto">
                    72‑Hour Activation Intensive + 8 weeks of Vision Pro included (auto‑starts Day 56 at your plan)
                  </Text>
                </div>
                
                <OfferStack
                  items={[
                    {
                      id: 'profile-baseline',
                      title: 'Profile & Baseline',
                      description: '• Give VIVA the signal it needs to guide you\n• Outcome: personalized prompts and next steps (no guesswork)\n• Done when: 70%+ profile complete + assessment saved',
                      icon: User,
                      included: true
                    },
                    {
                      id: 'vibration-assessment',
                      title: 'Vibration Assessment (84‑Q)',
                      description: '• Baseline your vibe to personalize your path\n• Outcome: map your current point of attraction for tailored guidance\n• Done when: 84 questions submitted and score recorded',
                      icon: Brain,
                      included: true
                    },
                    {
                      id: 'viva-vision',
                      title: 'VIVA Vision (Life I Choose)',
                      description: '• Draft your 12‑category Life Vision—even if you don\'t know what you want\n• Outcome: VIVA turns contrast into clarity across all life categories\n• Done when: first Life Vision draft completed (12/12) with VIVA',
                      icon: Sparkles,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-refinement',
                      title: 'Vision Refinement',
                      description: '• Make your vision specific, believable, and exciting\n• Outcome: tighter language, clear targets, aligned next steps\n• Done when: refinement pass saved and version 2 published',
                      icon: Target,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-audio',
                      title: 'Vision Audio (AM/PM)',
                      description: '• Generate personalized tracks to imprint your vision daily\n• Outcome: morning/evening audios synced to your Life Vision\n• Done when: AM + PM audio files generated and saved',
                      icon: Headphones,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-board',
                      title: 'Vision Board',
                      description: '• Build visual proof (one image per category)\n• Outcome: Desire → In Progress → Actualized pipeline for your goals\n• Done when: 12 images added (1 per category), board saved',
                      icon: Image,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'journal',
                      title: 'Conscious Creation Journal',
                      description: '• Log wins and calibrate your vibe\n• Outcome: track shifts; connect thoughts to manifestations\n• Done when: 3 entries logged (Gratitude, Connect‑the‑Dots, Progress)',
                      icon: BookOpen,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'calibration-call',
                      title: '30‑Minute Calibration Call',
                      description: '• Align your plan and remove blockers\n• Outcome: coach reviews assets and sets your Activation Protocol\n• Done when: 30‑min session completed and next steps documented',
                      icon: CalendarDays,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'activation-protocol',
                      title: 'Activation Protocol',
                      description: '• Daily rituals that keep you in harmony\n• Outcome: simple cadence to sustain momentum with less guesswork\n• Done when: AM/PM audio scheduled + 7‑day checklist started',
                      icon: Zap,
                      included: true,
                      locked: true
                    },
                    {
                      id: '8-weeks-included',
                      title: '8 Weeks of Vision Pro Included',
                      description: '• Full access to VIVA, storage, and community\n• Outcome: continue compounding after activation\n• Starts Day 56: auto‑continue at your selected plan (annual default or every 28 days)',
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

        {/* Why this works Section */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="lg" className="md:gap-12">
                <div className="text-center">
                  <Heading level={2} className="text-white mb-4">
                    Why this works (even if…)
                  </Heading>
                </div>

                {/* Value Equation Grid */}
                <Grid minWidth="250px" gap="lg">
                  {/* Dream Outcome */}
                  <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30">
                    <Stack gap="md">
                      <div className="flex flex-col items-center gap-3 mb-0">
                        <Icon icon={Sparkles} size="lg" color="#39FF14" />
                        <Heading level={4} className="text-white text-center font-bold">Total Clarity</Heading>
                      </div>
                      <Text size="sm" className="text-neutral-300 text-center">
                        Your 12‑category Life Vision, activated in 72 hours.
                      </Text>
              </Stack>
            </Card>

                  {/* Likelihood of Success */}
                  <Card variant="elevated" className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-[#14B8A6]/30">
                    <Stack gap="md">
                      <div className="flex flex-col items-center gap-3 mb-0">
                        <Icon icon={TrendingUp} size="lg" color="#14B8A6" />
                        <Heading level={4} className="text-white text-center font-bold">Proven System</Heading>
          </div>
                      <Text size="sm" className="text-neutral-300 text-center">
                        Conscious Creation System: Train → Tune → Track + proof.
                      </Text>
                    </Stack>
                  </Card>

                  {/* Time Delay */}
                  <Card variant="elevated" className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#BF00FF]/10 border-[#8B5CF6]/30">
                    <Stack gap="md">
                      <div className="flex flex-col items-center gap-3 mb-0">
                        <Icon icon={Clock} size="lg" color="#8B5CF6" />
                        <Heading level={4} className="text-white text-center font-bold">72‑Hour Activation</Heading>
                      </div>
                      <Text size="sm" className="text-neutral-300 text-center">
                        Vision, audio, board, journals, and call—done in 3 days.
                      </Text>
                    </Stack>
                  </Card>

                  {/* Effort & Sacrifice */}
                  <Card variant="elevated" className="bg-gradient-to-br from-[#FFB701]/10 to-[#39FF14]/10 border-[#FFB701]/30">
                    <Stack gap="md">
                      <div className="flex flex-col items-center gap-3 mb-0">
                        <Icon icon={Zap} size="lg" color="#FFB701" />
                        <Heading level={4} className="text-white text-center font-bold">No Guesswork</Heading>
                      </div>
                      <Text size="sm" className="text-neutral-300 text-center">
                        VIVA AI turns contrast into clarity; simple guided steps.
                      </Text>
                    </Stack>
                  </Card>
                </Grid>

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

        {/* Guarantees Section */}
        <section>
          <Container size="xl">
            <div className="bg-[#1F1F1F] border-[#333] border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="xs" className="md:gap-3" align="center">
                <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-8 h-8 text-black" />
                </div>
                <Heading level={2} className="text-center mb-0">Our Guarantees</Heading>
                
                <Grid responsiveCols={{mobile: 1, desktop: 2}} gap="lg" className="w-full items-stretch">
                {/* 72-Hour Activation Guarantee */}
                <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 relative pt-28 md:pt-32 mt-24 md:mt-28">
                  <div className="absolute -top-[88px] md:-top-[104px] left-1/2 -translate-x-1/2 w-44 h-44 md:w-52 md:h-52 z-10">
                    <img 
                      src="https://media.vibrationfit.com/site-assets/brand/guarantees/72-hour-activation-guarantee.png" 
                      alt="72 Hour Activation Guarantee"
                      className="w-full h-full object-contain"
                    />
                  </div>
                    <Stack gap="md" align="center" className="pb-4 md:pb-6">
                      <Heading level={3} className="text-base md:text-lg lg:text-xl text-white text-center">
                      72‑Hour Activation Guarantee
                    </Heading>
                    <div className="text-center mb-2">
                        <p className="text-sm md:text-base text-[#39FF14] font-semibold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Clock starts today
                      </p>
                    </div>
                      <Text size="sm" className="md:text-base text-white text-center">
                      Complete all 10 steps in 72 hours. Not satisfied? Full refund—no questions.
                    </Text>
                      <Text size="xs" className="md:text-sm text-neutral-300 text-center">
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
                    <Stack gap="md" align="center" className="pb-4 md:pb-6">
                      <Heading level={3} className="text-base md:text-lg lg:text-xl text-white text-center">
                      Membership Guarantee
                    </Heading>
                    <div className="text-center mb-2">
                        <p className="text-sm md:text-base text-[#8B5CF6] font-semibold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Clock starts today
                      </p>
                    </div>
                      <Text size="sm" className="md:text-base text-white text-center">
                      28‑Day Plan: 12‑week satisfaction guarantee from today.
                    </Text>
                      <Text size="sm" className="md:text-base text-white text-center">
                      Annual Plan: 16‑week satisfaction guarantee from today.
                    </Text>
                      <Text size="sm" className="md:text-base text-white text-center">
                      Not satisfied within your window? We'll refund the plan and cancel future renewals.
                    </Text>
                </Stack>
              </Card>
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
                
                {/* ACTIVATION INTENSIVE TITLE - ENHANCED */}
                <div className="text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-gradient-to-r from-[#BF00FF]/20 to-[#8B5CF6]/20 text-[#BF00FF] border-[#BF00FF]/30 mb-4">
                      <Clock className="w-4 h-4 inline mr-2" />
                      72-Hour Activation
                  </span>
                  <Heading level={2} className="mb-4 bg-gradient-to-r from-[#39FF14] via-[#14B8A6] to-[#8B5CF6] bg-clip-text text-transparent">
                      Vision Activation Intensive
                  </Heading>
                  <Text size="xl" className="text-neutral-300 max-w-3xl mx-auto">
                    Go from blank slate to fully activated in 72 hours. Vision drafted, board built, audios recorded, conscious creation system live.
                  </Text>
                  </div>

                {/* MAIN PRICING CONTENT */}
                <Stack align="center" gap="lg">
                    
                    {/* DYNAMIC PRICE */}
                    <div className="text-center">
                      <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-[#39FF14] mb-4">
                        ${getPaymentAmount()}
                              </div>
                      <div className="text-xl text-white mb-2 text-center">
                        {paymentPlan === 'full' ? 'Today' : paymentPlan === '2pay' ? '× 2 Payments = $499' : '× 3 Payments = $499'}
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
                          <div className="text-white text-center text-sm md:text-base">
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
                              ? '16-week money-back Membership Guarantee'
                              : '12-week money-back Membership Guarantee'
                            }</span>
                          </div>
                          <div className="text-white text-center text-sm md:text-base">
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
                            <span className="text-[#39FF14] font-semibold">I agree to the renewal and guarantee terms above.</span>
                          </span>
                        </label>

                        {/* CTA BUTTON */}
                    <div className="flex justify-center">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleIntensivePurchase}
                        disabled={isLoading || !agreedToTerms}
                      >
                        {isLoading ? 'Processing...' : 'Start the Activation Intensive'}
                      </Button>
                    </div>
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
                              <p className="text-neutral-300 text-sm">Complete all 10 steps in 72 hours (profile 70%+, 84‑Q assessment, 12‑category vision with VIVA, AM/PM audio, 12‑image board, 3 journals, calibration call booked).</p>
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
                            href="#faq"
                            onClick={(e) => {
                              e.preventDefault()
                              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
                            }}
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

        {/* FAQ Section - Full FAQ */}
        <section id="faq">
          {/* Full FAQ content can be added here later */}
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
                  <div>
                    <Heading level={3} className="text-[#FF0040] mb-4 text-center">Symptoms</Heading>
                    <div className="space-y-3">
                      <BulletedList>
                        <ListItem variant="error">Flip‑flop thoughts: "I want it" ⇄ "I can't have it"</ListItem>
                        <ListItem variant="error">Toddlers‑with‑scissors beliefs running your mind</ListItem>
                        <ListItem variant="error">Open loops: start, stop, restart—no dominant signal</ListItem>
                        <ListItem variant="error">Seeking signs instead of setting structure</ListItem>
                        <ListItem variant="error">Evidence‑hunting for why it won't work</ListItem>
                      </BulletedList>
                    </div>
              </div>

                  {/* 60-Second Self-Check */}
                  <div className="bg-[#1F1F1F]/50 rounded-xl p-6 border border-[#FF0040]/30">
                    <Heading level={3} className="text-white mb-4 text-center">60‑Second Self‑Check</Heading>
                    <Text size="sm" className="text-neutral-400 text-center mb-4">Tap Yes/No for each. Your score appears instantly.</Text>
                    <Text size="sm" className="text-neutral-300 text-center mb-4 font-semibold">In the past 7 days did you...</Text>
                    <Stack gap="sm">
                      {[
                        'Contradict a key desire with doubt?',
                        'Avoid writing what you want ("I\'m not sure yet")?',
                        'Start, stop, and "restart Monday"?',
                        'Consume more than you create (no assets built)?',
                        'Dismiss a small win as "luck"?'
                      ].map((question, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-3 border-b border-neutral-700/50 last:border-b-0">
                          <Text size="sm" className="text-neutral-300 flex-1">{question}</Text>
                          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                            <button
                              onClick={() => {
                                const newAnswers = [...selfCheckAnswers]
                                newAnswers[index] = true
                                setSelfCheckAnswers(newAnswers)
                              }}
                              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[44px] ${
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
                              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[44px] ${
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

                  {/* Cheeseburger Test */}
                  <div className="bg-[#1F1F1F]/50 rounded-xl p-6 border border-[#FF0040]/30">
                    <Heading level={3} className="text-white mb-2 text-center">Cheeseburger Test</Heading>
                    <Text size="xs" className="text-neutral-400 text-center mb-4">
                      Tap and hold "Yes" for 3 seconds to place your order. Changing your mind cancels it.
                    </Text>
                    <Text size="sm" className="text-neutral-400 text-center mb-6">
                      Server: "Would you like the cheeseburger?"
                    </Text>

                    {!burgerOrderPlaced && !burgerOrderCanceled && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onMouseDown={handleYesMouseDown}
                            onMouseUp={handleYesMouseUp}
                            onMouseLeave={handleYesMouseUp}
                            onTouchStart={handleYesMouseDown}
                            onTouchEnd={handleYesMouseUp}
                            className={`px-6 py-4 rounded-full text-base sm:text-lg font-semibold text-black transition-all min-h-[44px] sm:min-h-[48px] ${
                              isYesHeld ? 'bg-[#5EC49A] scale-105' : 'bg-[#39FF14] hover:scale-105'
                            }`}
                          >
                            Yes — Place the order
                          </button>
                          <button
                            onClick={handleNoClick}
                            className="px-6 py-4 rounded-full text-base sm:text-lg font-semibold bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-all min-h-[44px] sm:min-h-[48px]"
                          >
                            No — Cancel the order
                          </button>
                        </div>

                        {/* Progress ring/circle */}
                        {isYesHeld && (
                          <div className="flex flex-col items-center space-y-3">
                            <div className="relative w-32 h-32">
                              <svg className="transform -rotate-90" width="128" height="128">
                                {/* Background circle */}
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  fill="none"
                                  stroke="#333"
                                  strokeWidth="8"
                                />
                                {/* Progress circle */}
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  fill="none"
                                  stroke="#39FF14"
                                  strokeWidth="8"
                                  strokeDasharray={`${2 * Math.PI * 56}`}
                                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - holdProgress / 100)}`}
                                  className="transition-all duration-50"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Text className="text-2xl font-bold text-[#39FF14]">
                                  {Math.round(holdProgress)}%
                                </Text>
                              </div>
                            </div>
                            <Text size="xs" className="text-neutral-400 text-center">
                              {holdProgress < 100 ? 'Hold Yes to complete order...' : 'Order placed!'}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}

                    {burgerOrderPlaced && (
                      <div className="space-y-4" role="status" aria-live="polite">
                        <div className="flex flex-col items-center bg-[#39FF14]/10 border-2 border-[#39FF14] rounded-lg p-6">
                          <div className="w-24 h-24 rounded-full bg-[#39FF14]/20 flex items-center justify-center mb-4" role="img" aria-label="Burger delivered">
                            <span className="text-6xl">🍔</span>
                          </div>
                          <Text size="lg" className="text-[#39FF14] font-bold text-center">
                            Order placed. Consistent signal = burger delivered.
                          </Text>
                        </div>
                      </div>
                    )}

                    {burgerOrderCanceled && (
                      <div className="space-y-4" role="status" aria-live="polite">
                        <div className="flex flex-col items-center bg-[#FF0040]/10 border-2 border-[#FF0040] rounded-lg p-6">
                          <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center mb-4 opacity-50" role="img" aria-label="Order canceled">
                            <span className="text-6xl">⛔</span>
                          </div>
                          <Text size="lg" className="text-[#FF0040] font-bold text-center">
                            Order canceled. Flip‑flopping signal = no burger.
                          </Text>
                        </div>
                      </div>
                    )}

                    {(burgerOrderPlaced || burgerOrderCanceled) && (
                      <div className="space-y-4 mt-6">
                        <button
                          onClick={resetBurgerTest}
                          className="text-center w-full text-[#39FF14] hover:text-[#5EC49A] hover:underline transition-colors text-sm"
                        >
                          Try again
                        </button>
                        <Text size="sm" className="text-neutral-300 text-center">
                          Vibrational chaos works the same way—mixed signals cancel outcomes. Structure your signal to get delivery.
                        </Text>
                        <div className="text-center">
                          <Text size="xs" className="text-neutral-400 text-center mb-3">
                            Ditch chaos in 72 hours
                          </Text>
                          <Button variant="primary" size="sm" asChild>
                            <a href="#pricing">
                              Start the Activation Intensive
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bridge Section */}
                  <div className="bg-[#1F1F1F]/50 rounded-xl p-6 border border-[#39FF14]/30">
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
            <Stack gap="lg" align="center">
              <div className="text-center max-w-3xl">
                <div className="flex justify-center">
                  <Heading level={2} className="text-white mb-6 whitespace-nowrap">
                  The Solution: <span className="text-[#39FF14]">Conscious Creation System</span>
                </Heading>
                </div>
                <Text size="xl" className="text-neutral-300">
                  "A structured way to train, tune and track our vibration so that actualization or manifestation becomes second nature."
                </Text>
              </div>

              <Grid minWidth="300px" gap="lg">
                <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300 border-[#39FF14]/30 bg-[#39FF14]/5">
                  <Stack gap="md" className="md:gap-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14]/20 to-[#39FF14]/5 rounded-2xl flex items-center justify-center">
                      <Icon icon={Target} size="lg" color="#39FF14" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">TRAIN</h3>
                    <Text size="base" className="text-neutral-400">
                      Create your comprehensive <span className="text-[#39FF14] font-semibold">Life I Choose™</span> document 
                      across 14 life categories. Get crystal clear on your goals and direction with AI-guided prompts.
                    </Text>
                    <Badge variant="success">Above the Green Line</Badge>
                  </Stack>
                </Card>

                <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300 border-[#00FFFF]/30 bg-[#00FFFF]/5">
                  <Stack gap="md">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00FFFF]/20 to-[#00FFFF]/5 rounded-2xl flex items-center justify-center">
                      <Icon icon={Brain} size="lg" color="#00FFFF" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">TUNE</h3>
                    <Text size="base" className="text-neutral-400">
                      Daily check-ins and personalized AI guidance to keep you aligned and in flow. 
                      Your intelligent companion for staying above the Green Line every single day.
                    </Text>
                    <Badge variant="info">VIVA Assistant</Badge>
                  </Stack>
                </Card>

                <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300 border-[#BF00FF]/30 bg-[#BF00FF]/5">
                  <Stack gap="md">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#BF00FF]/20 to-[#BF00FF]/5 rounded-2xl flex items-center justify-center">
                      <Icon icon={TrendingUp} size="lg" color="#BF00FF" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">TRACK</h3>
                    <Text size="base" className="text-neutral-400">
                      Log your wins and track evidence of actualization. See your progress, 
                      celebrate victories, and prove to yourself that manifestation works.
                    </Text>
                    <Badge variant="premium">Premium Feature</Badge>
                  </Stack>
                </Card>
              </Grid>

            </Stack>
        </section>

        {/* What is Vibrational Fitness */}
        <section>
            <Cover minHeight="300px" className="bg-gradient-to-r from-[#39FF14]/10 via-[#00FFFF]/5 to-[#BF00FF]/10 rounded-3xl border border-[#333]">
              <Stack align="center" gap="lg" className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  What is Vibrational Fitness?
                </h2>
                <Text size="xl" className="md:text-2xl text-neutral-300 max-w-4xl">
                  <span className="text-[#39FF14] font-semibold">Vibrational fitness is intentionally training your vibration to attract the life you choose.</span>
                </Text>
                <Text size="lg" className="text-neutral-400 max-w-3xl">
                  "By becoming a member, you'll be able to instantly apply our conscious creation system in your reality 
                  and eliminate confusion around conscious creation, AKA turning thoughts into things."
                </Text>
                <Badge variant="premium" className="text-lg px-6 py-3">
                  <Icon icon={Sparkles} size="md" className="mr-2" />
                  Decades of Trial & Error → Instant Access
                </Badge>
              </Stack>
            </Cover>
        </section>

        {/* How It Works */}
        <section>
            <Stack gap="lg">
              <div className="text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  How It Works
                </h2>
                <Text size="xl" className="text-neutral-300 max-w-2xl mx-auto">
                  Simple, powerful, and designed for real results. Get started in minutes, 
                  see results in days.
                </Text>
              </div>

              <Grid responsiveCols={{mobile: 1, desktop: 3}} gap="lg" className="flex-col md:flex-row">
                <Card variant="glass" className="flex-1">
                  <Stack gap="md" className="text-center">
                    <div className="w-16 h-16 bg-[#39FF14] rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-white">Craft Your Vision</h3>
                    <Text size="base" className="text-neutral-400">
                      Use our guided AI prompts to create your comprehensive Life I Choose™ document 
                      across all 14 life categories.
                    </Text>
                  </Stack>
                </Card>

                <Card variant="glass" className="flex-1">
                  <Stack gap="md" className="text-center">
                    <div className="w-16 h-16 bg-[#00FFFF] rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-white">Daily Alignment</h3>
                    <Text size="base" className="text-neutral-400">
                      Check in daily with your AI Alignment Coach. Stay above the Green Line 
                      with personalized guidance and support.
                    </Text>
                  </Stack>
                </Card>

                <Card variant="glass" className="flex-1">
                  <Stack gap="md" className="text-center">
                    <div className="w-16 h-16 bg-[#BF00FF] rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-white">Track & Actualize</h3>
                    <Text size="base" className="text-neutral-400">
                      Log evidence of your manifestations. Watch your vision come to life 
                      with our powerful tracking tools.
                    </Text>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
        </section>

        {/* Final CTA */}
        <section>
            <Cover minHeight="500px" className="bg-gradient-to-br from-[#39FF14]/20 via-[#00FFFF]/10 to-[#BF00FF]/20 rounded-3xl border-2 border-[#333]">
              <Stack align="center" gap="lg" className="text-center">
                <h2 className="text-4xl md:text-6xl font-bold text-white">
                  <span className="bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#BF00FF] bg-clip-text text-transparent">Welcome Home</span>
                </h2>
                
                <div className="max-w-4xl">
                  <Text size="xl" className="md:text-2xl text-neutral-300 mb-6">
                    "What would happen if I gained clarity on the life that I wanted to live, 
                    intentionally established vibrational harmony with it, and allowed my vision for a fun and 
                    emotionally satisfying life experience to become dominant in my point of attraction?"
                  </Text>
                  
                  <Text size="2xl" className="md:text-3xl font-bold text-[#39FF14] mb-8">
                    We know the answer. You would live a life you love waking up to every day, 
                    feeling your creative power as you live the life you choose.
                  </Text>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card variant="glass" className="text-center">
                    <Stack gap="sm">
                      <Icon icon={Target} size="lg" color="#39FF14" className="mx-auto" />
                      <h4 className="font-bold text-white">Gain Clarity</h4>
                      <Text size="sm" className="text-neutral-400">On the life you want to live</Text>
                    </Stack>
                  </Card>
                  <Card variant="glass" className="text-center">
                    <Stack gap="sm">
                      <Icon icon={Brain} size="lg" color="#00FFFF" className="mx-auto" />
                      <h4 className="font-bold text-white">Establish Harmony</h4>
                      <Text size="sm" className="text-neutral-400">With your vibrational point of attraction</Text>
                    </Stack>
                  </Card>
                  <Card variant="glass" className="text-center">
                    <Stack gap="sm">
                      <Icon icon={Crown} size="lg" color="#BF00FF" className="mx-auto" />
                      <h4 className="font-bold text-white">Become Dominant</h4>
                      <Text size="sm" className="text-neutral-400">In your vision for your life</Text>
                    </Stack>
                  </Card>
                </div>

                <Inline gap="md" className="mt-8">
                  <Button variant="primary" size="xl" asChild>
                    <a href="/auth/signup">
                      Join the Vibe Tribe
                      <Icon icon={ArrowRight} size="sm" />
                    </a>
                  </Button>
                  <Button variant="secondary" size="xl" asChild>
                    <a href="#pricing">
                      View Pricing
                    </a>
                  </Button>
                </Inline>

                <Text size="lg" className="text-neutral-300 max-w-2xl">
                  "If you're ready to ditch vibrational chaos, align with your clarity, and train your vibration 
                  to attract the life you choose, then <span className="text-[#39FF14] font-semibold">welcome home</span>."
                </Text>

                <Text size="sm" className="text-neutral-500">
                  No credit card required • 14-day free trial • Cancel anytime
                </Text>
              </Stack>
            </Cover>
        </section>

      </Stack>
  )
}