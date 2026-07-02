'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, ArrowRight, Star, Target,
  Brain, TrendingUp, Shield, Play, Award, Globe, Crown, Check, Clock, User, Dumbbell,
  Headphones, Image, BookOpen, CalendarDays, Lock, HelpCircle, Eye,
  RadioTower,
  Settings, FileText, ClipboardCheck, Wand2, Music, Mic, Sliders, Calendar, Rocket, Unlock,
  ShoppingCart, MessageSquarePlus, Video, Map
} from 'lucide-react'
import { toast } from 'sonner'
import { OptimizedVideo } from '@/components/OptimizedVideo'
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
  SocialProofSection,
} from '@/lib/design-system/components'
import { trackConversion } from '@/lib/tracking/pixels'

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
  const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('28day')
  const [paymentPlan, setPaymentPlan] = useState<'full' | '2pay'>('full')
  const [isLoading, setIsLoading] = useState(false)
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
      
      // Affiliate/referral source (tracking handled by global ReferralBanner)
      const ref = params.get('ref') || params.get('source') || params.get('affiliate')
      if (ref) {
        setReferralSource(ref)
        if (!promo) setPromoCode('LAUNCH2026')
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
      }
    }

    // Handle popstate (browser back/forward buttons)
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentHash(window.location.hash)
      }
    }

    // Handle browser back/forward navigation
    const handlePageShow = () => {
      if (typeof window !== 'undefined') {
        setCurrentHash(window.location.hash)
      }
    }

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
      ? { full: 499, twoPayment: 275 }
      : { full: 699, twoPayment: 375 }

    switch (paymentPlan) {
      case 'full': return prices.full.toFixed(2).replace('.00', '')
      case '2pay': return prices.twoPayment.toFixed(2).replace('.00', '')
      default: return prices.full.toFixed(2).replace('.00', '')
    }
  }
  
  const getIntensiveTotal = () => {
    return planType === 'solo' ? '499' : '699'
  }

  // Total across both installments when paying in 2 payments ($275x2 / $375x2).
  const getTwoPayTotal = () => {
    return planType === 'solo' ? '550' : '750'
  }
  
  const getVisionProAnnualPrice = () => {
    return planType === 'solo' ? '990' : '1,490'
  }
  
  const getVisionProMonthlyPrice = () => {
    return planType === 'solo' ? '99' : '149'
  }
  
  const getVisionProAnnualSavings = () => {
    return planType === 'solo' ? '23%' : '23%'
  }
  
  const getPlanSeatsText = () => {
    return planType === 'solo' ? '1 seat' : '2 seats included'
  }

  const getDay28RenewalText = () => {
    if (billingPeriod === 'annual') {
      return `If you love it and do nothing, you'll renew at $${getVisionProAnnualPrice()}/year.`
    }
    return `If you love it and do nothing, you'll renew at $${getVisionProMonthlyPrice()} every 28 days.`
  }

  const getDay28SwitchText = () => {
    if (billingPeriod === 'annual') {
      return `You can switch to Every 28 Days ($${getVisionProMonthlyPrice()}/28 days) or cancel any time before Day 28 in your account settings.`
    }
    return `You can switch to the Annual plan ($${getVisionProAnnualPrice()}/year) or cancel any time before Day 28 in your account settings.`
  }

  const getYoullGetRenewalMicrocopy = () => {
    if (billingPeriod === 'annual') {
      return `After your first 28 days included, Vision Pro continues at $${getVisionProAnnualPrice()}/year. Cancel anytime before Day 28 to avoid renewal, or switch to Every 28 Days ($${getVisionProMonthlyPrice()} every 28 days).`
    }
    return `After your first 28 days included, Vision Pro continues at $${getVisionProMonthlyPrice()} every 28 days. Cancel anytime before Day 28 to avoid renewal, or switch to annual ($${getVisionProAnnualPrice()}/year) and save.`
  }

  const getPromoDiscount = () => {
    const total = planType === 'solo' ? 499 : 699
    return (total - 1).toString()
  }

  const getInstallmentScheduleNote = (): string | null => {
    const amount = `$${getPaymentAmount()}`
    if (paymentPlan === '2pay') {
      return `Second payment of ${amount} charged automatically in 2 weeks (14 days after today).`
    }
    return null
  }

  const handleIntensivePurchase = async () => {
    setIsLoading(true)

    try {
      const visitorId = typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|; )vf_visitor_id=([^;]*)/)?.[1] || undefined
        : undefined
      const sessionId = typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|; )vf_session_id=([^;]*)/)?.[1] || undefined
        : undefined

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            product_key: 'intensive',
            plan: paymentPlan,
            continuity: billingPeriod,
            plan_type: planType,
          }],
          promoCode: promoCode || undefined,
          referralSource: referralSource || undefined,
          campaignName: campaignName || undefined,
          visitorId,
          sessionId,
        }),
      })

      const data = await res.json()
      if (data.cartId) {
        trackConversion('initiate_checkout', { content_name: 'intensive', currency: 'USD' })
        window.location.href = `/checkout/${data.cartId}`
      } else {
        toast.error('Failed to create checkout session')
        setIsLoading(false)
      }
    } catch {
      toast.error('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
      <>
      {/* Referral banner is now handled globally by ReferralBanner in layout */}
      <Stack gap="lg">
        
        {/* Hero Section */}
        <section>
          <Cover minHeight="500px" className="!p-0">
            <Container size="xl" className="w-full">
              <Stack gap="sm" className="items-center">
                {/* Headline at top */}
                <div className="text-center">
                  <Heading level={2} className="text-white leading-tight !mb-0">
                    Thoughts become things…<br />so why isn't it working?
                  </Heading>
                </div>
                
                {/* Two column layout for desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-8 items-start w-full">
                  {/* Left column - Content */}
                  <div className="space-y-3 text-center lg:text-left flex flex-col justify-center">
                    <Heading level={4} className="text-[#39FF14] text-center md:text-center">
                      Install your Conscious Creation System in <span className="font-bold text-[#39FF14]">72 hours</span>
                    </Heading>

                    <Text size="sm" className="text-neutral-300 text-center md:text-left">
                      So freedom and joy become your baseline and manifestations turn into repeatable side‑effects.
                    </Text>

                    <Text size="xs" className="text-neutral-400 italic text-center md:text-left">
                      For people who believe in universal law but are stuck in inconsistent, on‑off practice.
                    </Text>
                    
                    {/* Mobile bullets */}
                    <BulletedList className="leading-relaxed md:hidden">
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Design your dream life</strong> in 72 hours (vision, audio, board done).
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Turn it into a simple daily plan</strong> that runs on autopilot.
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Enjoy more freedom and joy now</strong> while wins stack as evidence.
                      </ListItem>
                    </BulletedList>

                    {/* Desktop bullets */}
                    <BulletedList className="leading-relaxed lg:text-left lg:ml-6 hidden md:block">
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Design your dream life</strong> in 72 hours (vision, audio, board done).
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Turn it into a simple daily plan</strong> that runs on autopilot.
                      </ListItem>
                      <ListItem icon={Zap} variant="primary" className="text-left text-neutral-300">
                        <strong>Enjoy more freedom and joy now</strong> while wins stack as evidence.
                      </ListItem>
                    </BulletedList>
                    
                    <div className="flex flex-col items-center md:items-center">
                      {/* Decision block: button + proof strip */}
                      <div className="flex flex-col items-center">
                        <Button variant="primary" size="xl" className="mt-1 md:mt-2" asChild>
                          <a href="#pricing">
                            Start the 72-Hour Activation Intensive
                          </a>
                        </Button>

                        {/* Micro-Proof Strip — tight to button */}
                        <div className="text-center mt-1.5">
                          <span className="block text-[11px] text-[#39FF14]/70 mb-0.5 tracking-wide">What members are saying:</span>
                          {/* Mobile: inline with dots */}
                          <p className="md:hidden text-[11px] italic text-neutral-400 leading-snug">
                            &ldquo;Easiest thing I&rsquo;ve ever seen to uncover your desires and make them real.&rdquo;
                            {' '}&bull;{' '}
                            &ldquo;Most comprehensive, easy and exciting program I&rsquo;ve ever done.&rdquo;
                            {' '}&bull;{' '}
                            &ldquo;If there was ever a doubt this is divinely inspired and actually works, I have proof.&rdquo;
                          </p>
                          {/* Desktop: one per line, no dots */}
                          <div className="hidden md:flex flex-col gap-0.5 text-xs italic text-neutral-400 leading-snug">
                            <span>&ldquo;Easiest thing I&rsquo;ve ever seen to uncover your desires and make them real.&rdquo;</span>
                            <span>&ldquo;Most comprehensive, easy and exciting program I&rsquo;ve ever done.&rdquo;</span>
                            <span>&ldquo;If there was ever a doubt this is divinely inspired and actually works, I have proof.&rdquo;</span>
                          </div>
                        </div>
                      </div>

                      {/* Price detail — separated from decision block */}
                      <Text size="xs" className="text-neutral-400 text-center mt-4">
                        ${getIntensiveTotal()} today. First 28 days of Vision Pro included. Day 28: auto‑continue at your selected plan.
                      </Text>
                    </div>
                  </div>
                  
                  {/* Right column - Video (OptimizedVideo: adaptive 720p/1080p/original + same player as profile/new) */}
                  <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-3xl mx-auto w-full lg:order-last">
                    <OptimizedVideo
                      url="https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-1080p.mp4"
                      thumbnailUrl="https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-thumb.0000000.jpg"
                      context="single"
                      caption="Five minute overview video"
                      trackingId="homepage-hero-video"
                      saveProgress={true}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </Stack>
            </Container>
          </Cover>
        </section>

        {/* How Vibration Fit Works — Slim Summary */}
        <section>
          <Container size="xl">
            <div className="text-center max-w-3xl mx-auto py-4">
              <Badge variant="primary" className="mb-4">How Vibration Fit works</Badge>
              <Heading level={3} className="text-white !mb-4">
                <span className="text-[#39FF14]">Design</span> your Life Vision &rarr; <span className="text-[#00FFFF]">Install</span> it in 72 hours &rarr; <span className="text-[#FFFF00]">Run</span> it daily with MAP.
              </Heading>
              <Text size="base" className="text-neutral-300 mb-6">
                Your Conscious Creation System gives you the structure so &ldquo;thoughts become things&rdquo; stops being random and starts being repeatable.
              </Text>
              <Link href="/system" className="inline-flex items-center gap-2 text-[#39FF14] hover:text-[#5EC49A] font-semibold transition-colors text-base">
                See how the system works
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Container>
        </section>

        {/* Social Proof - Videos + Screenshots */}
        <section>
          <Container size="xl">
            <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-black/40 border-[#39FF14]/20 border-2">
              <SocialProofSection
                eyebrow="Vibration Fit Member Results"
                title="Real People. Real Results."
                subtitle="Watch unedited stories and scroll through real screenshots from Vibration Fit members using universal law to create tangible wins in money, relationships, opportunities, and everyday life."
                microcopy="All videos and messages are from real Vibration Fit members, shared with permission. Screenshots are unedited."
                videos={[
                  {
                    id: 'v1',
                    src: 'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/intensive/testimonials/1773515176961-susxm5ps05e-intensive-c8f87e55-24af-4eed-8520-025cc3547a12-testimonial-recording-1773515176541.webm',
                    label: 'Testimonial',
                  },
                  {
                    id: 'v2',
                    src: 'https://media.vibrationfit.com/site-assets/video/proof-wall/michele-testimonial-1080p.mp4',
                    poster: 'https://media.vibrationfit.com/site-assets/video/proof-wall/michele-testimonial-thumb.0000000.jpg',
                    label: 'Michele',
                  },
                  {
                    id: 'v3',
                    src: 'https://media.vibrationfit.com/user-uploads/4ed2a268-9df0-44da-8a0b-641238f92378/intensive/testimonials/1774242947302-jc0ui5mokj9-intensive-cae9652b-0556-4372-960c-431ea8b7eb3e-testimonial-recording-1774242946695.webm',
                    label: 'Intensive',
                  },
                ]}
                screenshots={[
                  { id: 's1', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0002-4.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's2', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0003-5.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's3', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0004-7.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's4', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0005-8.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's5', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0006-9.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's6', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0007-13.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's7', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0008-jeanie.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's8', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0009-11.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's9', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0010-12.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's10', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0011-14.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's11', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0012-15.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's12', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0013-16.jpg', alt: 'Vibration Fit member testimonial' },
                  { id: 's13', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0014-17.jpg', alt: 'Vibration Fit member testimonial' },
                ]}
              />
            </Card>
          </Container>
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
                  <Heading level={3} className="text-white text-center mb-4 md:mb-5">
                    What &quot;installed in 72 hours&quot; means
                </Heading>
                  <Text size="sm" className="text-neutral-300 text-center mb-8 md:mb-10">
                    The 72-Hour Vision Activation Intensive is where we build and connect the parts of your Conscious Creation System so it&rsquo;s ready to run.
                  </Text>
                  <div className="flex flex-col gap-4 items-start mx-auto text-left md:text-left">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Account Settings &amp; Baseline Intake complete</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Profile complete</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">12‑category Life Vision built (with VIVA)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Vision Audio &amp; Mix ready (voice recording optional)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Vision Board built (12 images, 1 per category)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">1 journal entry logged</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Vibe Tribe post + community engagement</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">Alignment Gym tour complete</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14]" />
                      <Text size="sm" className="text-neutral-200 text-left">MAP activated—your customized My Alignment Plan</Text>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-4">
                    <Check className="w-4 h-4 flex-shrink-0 text-[#39FF14] mt-0.5" />
                    <Text size="sm" className="text-[#39FF14]/80 text-left italic">
                      When all 14 guided steps are complete, you graduate into full Vision Pro member mode — your dashboard, advanced tools, and Alignment Gym live sessions turn on.
                    </Text>
                  </div>
                </div>
              </div>
              <Card variant="outlined" className="h-full border-neutral-800 bg-neutral-950">
                <Heading level={3} className="text-white text-center mb-4 md:mb-5">
                  The 4 parts of your system
                </Heading>
                <Text size="sm" className="text-neutral-400 text-center mb-6 md:mb-8">
                  Every aligned action in Vibration Fit is one of these four. Your MAP schedules them, your dashboard tracks them.
                </Text>
                <div className="flex flex-col divide-y divide-neutral-800 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20">
                      <Brain className="w-5 h-5 text-[#39FF14]" />
                    </div>
                    <div>
                      <Text size="sm" className="text-white font-semibold">Creations</Text>
                      <Text size="xs" className="text-neutral-500">Visions, audios, boards, journals — artifacts you build</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20">
                      <RadioTower className="w-5 h-5 text-[#14B8A6]" />
                    </div>
                    <div>
                      <Text size="sm" className="text-white font-semibold">Activations</Text>
                      <Text size="xs" className="text-neutral-500">Daily reps that keep your signal aligned</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#BF00FF]/10 border border-[#BF00FF]/20">
                      <Heart className="w-5 h-5 text-[#BF00FF]" />
                    </div>
                    <div>
                      <Text size="sm" className="text-white font-semibold">Connections</Text>
                      <Text size="xs" className="text-neutral-500">Vibe Tribe posts, comments, and hearts</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFB701]/10 border border-[#FFB701]/20">
                      <CalendarDays className="w-5 h-5 text-[#FFB701]" />
                    </div>
                    <div>
                      <Text size="sm" className="text-white font-semibold">Sessions</Text>
                      <Text size="xs" className="text-neutral-500">Alignment Gym live coaching and replays</Text>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <Link href="/system" className="text-[#39FF14] hover:text-[#5EC49A] underline underline-offset-4 transition-colors text-sm">
                    See how every part fits together →
                  </Link>
                </div>
              </Card>
            </TwoColumn>
          </Container>
        </section>

        {/* 72-Hour Activation Path */}
        <section>
          <Container size="xl">
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
              <Stack gap="md">
                <Heading level={2} className="text-white text-center !mb-0">
                  Your 72‑Hour Activation Path
                </Heading>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Setup */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-5 h-5 text-neutral-400" />
                      <span className="font-semibold text-white">Setup</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">1</span>
                        <Settings className="w-3.5 h-3.5" />
                        <span>Account Settings</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">2</span>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Baseline Intake</span>
                      </div>
                    </div>
                  </div>

                  {/* Foundation */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-[#5EC49A]" />
                      <span className="font-semibold text-white">Foundation</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">3</span>
                        <User className="w-3.5 h-3.5" />
                        <span>Create Profile</span>
                      </div>
                    </div>
                  </div>

                  {/* Vision Creation */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-[#2DD4BF]" />
                      <span className="font-semibold text-white">Vision Creation</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">4</span>
                        <Target className="w-3.5 h-3.5" />
                        <span>Create Life Vision</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Headphones className="w-5 h-5 text-[#8B5CF6]" />
                      <span className="font-semibold text-white">Audio</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">5</span>
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Generate Vision Audio</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">6</span>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Record Your Voice</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">7</span>
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Create Audio Mix</span>
                      </div>
                    </div>
                  </div>

                  {/* Activation */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-5 h-5 text-[#FFB701]" />
                      <span className="font-semibold text-white">Activation</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">8</span>
                        <Image className="w-3.5 h-3.5" />
                        <span>Vision Board</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">9</span>
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>First Journal Entry</span>
                      </div>
                    </div>
                  </div>

                  {/* Community */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-[#00FFFF]" />
                      <span className="font-semibold text-white">Community</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">10</span>
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        <span>First Vibe Tribe Post</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">11</span>
                        <Heart className="w-3.5 h-3.5" />
                        <span>Engage in Vibe Tribe</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">12</span>
                        <Video className="w-3.5 h-3.5" />
                        <span>Alignment Gym Tour</span>
                      </div>
                    </div>
                  </div>

                  {/* Completion */}
                  <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="w-5 h-5 text-[#39FF14]" />
                      <span className="font-semibold text-white">Completion</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">13</span>
                        <Map className="w-3.5 h-3.5" />
                        <span>My Alignment Plan</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <span className="text-xs font-mono text-neutral-600 w-4">14</span>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Graduation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Stack>
            </Card>
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
                  <div className="bg-gradient-to-br from-[#1F1F1F] to-[#0F0F0F] rounded-2xl border-2 border-[#39FF14]/20 p-4 md:p-6 space-y-4 md:space-y-6">
                    
                    {/* Header Section - PageHero style */}
                    <div className="text-center space-y-2">
                      <Text size="xs" className="text-[#39FF14] uppercase tracking-wider font-semibold">72-Hour Vision Activation Intensive</Text>
                      <Heading level={4} className="text-white">Your 14-Step Activation Path</Heading>
                      <Text size="xs" className="text-neutral-400 max-w-md mx-auto">Follow each step in order. Graduate at Step 14 to enter full Vision Pro member mode.</Text>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-2 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-full px-3 py-1 text-xs font-semibold text-[#BF00FF]">
                          Current Phase: Vision Creation · Step 4 of 14
                        </span>
                      </div>
                    </div>
                    
                    {/* Countdown & Progress Card */}
                    <div className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border border-[#39FF14]/30 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h5 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time Remaining
                          </h5>
                          <Text size="xl" className="font-bold text-[#39FF14]">64h 12m 08s</Text>
                          <Text size="xs" className="text-neutral-400 mt-1">Most people activate in 72 hours</Text>
                        </div>
                        <div className="text-right">
                          <Text size="xs" className="text-neutral-400 mb-1">Overall Progress</Text>
                          <Text size="2xl" className="font-bold text-[#14B8A6]">21%</Text>
                          <Text size="xs" className="text-neutral-400 mt-1">3 of 14 steps</Text>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-3">
                        <div className="h-3 rounded-full bg-gradient-to-r from-[#39FF14] to-[#14B8A6]" style={{ width: '21%' }}></div>
                      </div>
                    </div>
                    
                    {/* Next Step Card - matches actual dashboard style */}
                    <div className="rounded-xl overflow-hidden border border-[#BF00FF]/30">
                      <div className="flex">
                        <div className="w-12 flex-shrink-0 flex items-center justify-center bg-[#BF00FF]">
                          <span className="text-lg font-bold text-black">4</span>
                        </div>
                        <div className="flex-1 p-3 bg-gradient-to-br from-[#BF00FF]/5 to-purple-500/5">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-bold text-white">Create Your Life Vision</h5>
                            <span className="text-[10px] bg-[#BF00FF]/20 text-[#BF00FF] px-2 py-0.5 rounded-full font-semibold">Next Step</span>
                          </div>
                          <Text size="xs" className="text-neutral-400 mb-2">12-category vision co-written with VIVA</Text>
                          <button className="text-xs bg-[#39FF14] text-black px-3 py-1.5 rounded-full font-semibold hover:bg-[#39FF14]/80 transition-colors flex items-center gap-1">
                            Continue <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Phase Progress - Setup (Complete) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-bold text-white">Setup</h6>
                        <span className="text-xs bg-[#39FF14]/20 text-[#39FF14] px-2 py-1 rounded-full">2/2 Complete</span>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg overflow-hidden border border-[#39FF14]/30">
                          <div className="flex">
                            <div className="w-10 flex-shrink-0 flex items-center justify-center bg-[#39FF14]">
                              <span className="text-sm font-bold text-black">1</span>
                            </div>
                            <div className="flex-1 p-2 bg-[#39FF14]/5 flex items-center justify-between">
                              <div>
                                <Text size="xs" className="font-semibold text-white">Account Settings</Text>
                                <Text size="xs" className="text-neutral-500">Name, email, phone, photo</Text>
                              </div>
                              <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-[#39FF14]/30">
                          <div className="flex">
                            <div className="w-10 flex-shrink-0 flex items-center justify-center bg-[#39FF14]">
                              <span className="text-sm font-bold text-black">2</span>
                            </div>
                            <div className="flex-1 p-2 bg-[#39FF14]/5 flex items-center justify-between">
                              <div>
                                <Text size="xs" className="font-semibold text-white">Baseline Intake</Text>
                                <Text size="xs" className="text-neutral-500">Activation intake questionnaire</Text>
                              </div>
                              <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phase Progress - Foundation (Complete) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-bold text-white">Foundation</h6>
                        <span className="text-xs bg-[#39FF14]/20 text-[#39FF14] px-2 py-1 rounded-full">1/1 Complete</span>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg overflow-hidden border border-[#39FF14]/30">
                          <div className="flex">
                            <div className="w-10 flex-shrink-0 flex items-center justify-center bg-[#39FF14]">
                              <span className="text-sm font-bold text-black">3</span>
                            </div>
                            <div className="flex-1 p-2 bg-[#39FF14]/5 flex items-center justify-between">
                              <div>
                                <Text size="xs" className="font-semibold text-white">Create Profile</Text>
                                <Text size="xs" className="text-neutral-500">Build your life profile</Text>
                              </div>
                              <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phase Progress - Vision Creation (Active) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-bold text-white">Vision Creation</h6>
                        <span className="text-xs bg-neutral-600/50 text-neutral-300 px-2 py-1 rounded-full">0/1 Complete</span>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg overflow-hidden border border-[#BF00FF]/30">
                          <div className="flex">
                            <div className="w-10 flex-shrink-0 flex items-center justify-center bg-[#BF00FF]">
                              <span className="text-sm font-bold text-black">4</span>
                            </div>
                            <div className="flex-1 p-2 bg-gradient-to-br from-[#BF00FF]/5 to-purple-500/5 flex items-center justify-between">
                              <div>
                                <Text size="xs" className="font-semibold text-white">Create Your Life Vision</Text>
                                <Text size="xs" className="text-neutral-500">12-category vision with VIVA</Text>
                              </div>
                              <button className="text-[10px] bg-[#39FF14] text-black px-2 py-1 rounded-full font-semibold">Start</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remaining Phases Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="bg-neutral-800/30 rounded-lg p-2 opacity-50">
                        <Text size="xs" className="text-neutral-500 font-semibold">Audio</Text>
                        <Text size="xs" className="text-neutral-600">Steps 5–7</Text>
                      </div>
                      <div className="bg-neutral-800/30 rounded-lg p-2 opacity-50">
                        <Text size="xs" className="text-neutral-500 font-semibold">Activation</Text>
                        <Text size="xs" className="text-neutral-600">Steps 8–9</Text>
                      </div>
                      <div className="bg-neutral-800/30 rounded-lg p-2 opacity-50">
                        <Text size="xs" className="text-neutral-500 font-semibold">Community</Text>
                        <Text size="xs" className="text-neutral-600">Steps 10–12</Text>
                      </div>
                      <div className="bg-neutral-800/30 rounded-lg p-2 opacity-50">
                        <Text size="xs" className="text-neutral-500 font-semibold">Completion</Text>
                        <Text size="xs" className="text-neutral-600">Steps 13–14</Text>
                      </div>
                    </div>
                    
                    {/* Completion Message */}
                    <div className="text-center bg-gradient-to-r from-[#39FF14]/5 to-[#14B8A6]/5 border border-[#39FF14]/20 rounded-xl p-3">
                      <Text size="xs" className="text-neutral-300">
                        <strong className="text-[#39FF14]">Complete all 14 steps</strong> to graduate and enter your full Vision Pro member experience
                      </Text>
                    </div>
                  </div>
                </Stack>
            </div>
          </Container>
        </section>

        {/* Vision Transformations - From Vision to Actualized Reality */}
        <section>
          <Container size="xl">
            <ProofWall
              heading="We Used This Process On Ourselves First"
              subtitle="Before we ever invited members into Vibration Fit, we used this exact system to go from overdrafted and in debt to six figures in the bank. Once it worked for us, we started helping others do the same."
              caption="Real screenshots from our accounts, before and after applying the Vibration Fit system."
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
                          <span className="text-white font-semibold">You can&apos;t make this stuff up.</span> So here we are in Amalfi, sitting at dinner on Day 2 talking about how surreal it is that we&apos;re in Italy marking off another place from our vision board. Jordan pulls up the exact photo from our vision board and we wonder where it was taken. We knew it was somewhere along the Amalfi Coast, but little did we know when we got here that the Amalfi coast is actually 34 miles long and spans across many towns. Jordan asks our waiter if he knows where our vision board photo was taken and he says, &ldquo;That&apos;s Atrani. Only one minute north of Amalfi.&rdquo;
                        </Text>
                        <Text size="sm" className="text-justify">
                          It turned out that we had driven right through Atrani on our way to Ravello earlier that day—and that we were only staying about 12 minutes away the whole time!
                        </Text>
                        <Text size="sm" className="text-justify">
                          So on Day 3, a bright, beautiful, sunny day, we started the morning off by driving straight to Atrani to get our very own photo in the exact same location as the one we&apos;ve been staring at and dreaming about from our vision board for years!
                        </Text>
                        <Text size="sm" className="text-justify">
                          The first photo is proof of us there; the second one is the photo from our vision board!
                        </Text>
                        <Text size="sm" className="text-justify">
                          This vision stuff truly works. We are constantly surprised and delighted by the Universe! We are across the world and somehow line up with the exact right places, people, and circumstances to experience the place we&apos;ve had on our vision board for years—with no planning ahead of time. That&apos;s conscious creation at its best.
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

        {/* Why This Works Section */}
        <section>
          <Container size="xl">
            <div className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 border-2 rounded-2xl p-4 md:p-6 lg:p-8">
              <Stack gap="lg" className="md:gap-10">
                <div className="text-center">
                  <Heading level={2} className="text-white">
                    Bridge the Woo-Woo With the How-To
                  </Heading>
                  <Text size="lg" className="text-neutral-300 mt-2">
                    Why This Works (Even If You&apos;ve Tried Before)
                  </Text>
                  <Text size="base" className="text-neutral-400 mt-3 max-w-3xl mx-auto">
                    Vibration Fit installs and runs your Conscious Creation System: a simple structure of Creations, Activations, Connections, and Sessions guided by your My Alignment Plan.
                  </Text>
                </div>
                
                <Grid responsiveCols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="lg">
                  <FeatureCard 
                    icon={Target} 
                    title={<span className="text-[#39FF14]">Total Clarity</span>}
                    iconColor="#39FF14"
                    variant="elevated"
                    className="!bg-[#39FF14]/10 !border-[#39FF14]/30"
                  >
                    Activate your Life Vision in 72 hours. You leave the Intensive with a complete 12‑category Life Vision, Vision Audio, a 12‑image Vision Board, 1 journal entry, and your My Alignment Plan activated.
                  </FeatureCard>

                  <FeatureCard 
                    icon={TrendingUp} 
                    title={<span className="text-[#00FFFF]">Proven System</span>}
                    iconColor="#00FFFF"
                    variant="elevated"
                    className="!bg-[#00FFFF]/10 !border-[#00FFFF]/30"
                  >
                    Instead of trying to manifest at random, you follow a simple structure: <strong>Creations</strong>, <strong>Activations</strong>, <strong>Connections</strong>, and <strong>Sessions</strong>, all scheduled by your My Alignment Plan and guided by VIVA.
                  </FeatureCard>

                  <FeatureCard 
                    icon={Clock} 
                    title={<span className="text-[#BF00FF]">72‑Hour Activation</span>}
                    iconColor="#BF00FF"
                    variant="elevated"
                    className="!bg-[#BF00FF]/10 !border-[#BF00FF]/30"
                  >
                    You don&apos;t wait months to feel it working. In the first 72 hours you see concrete outputs on your dashboard: profile done, Life Vision built, audio and board created, journal logged, community engaged, and your MAP activated.
                  </FeatureCard>

                  <FeatureCard 
                    icon={CheckCircle} 
                    title={<span className="text-[#FFFF00]">No Guesswork, Just Reps</span>}
                    iconColor="#FFFF00"
                    variant="elevated"
                    className="!bg-[#FFFF00]/10 !border-[#FFFF00]/30"
                  >
                    VIVA asks, you answer. Prompts, checklists, and your My Alignment Plan tell you exactly what to do next—so staying aligned becomes a set of simple daily reps, not a mysterious practice you have to invent.
                  </FeatureCard>
                </Grid>
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
                  <div className="max-w-2xl mx-auto text-center">
                    <Text size="lg" className="text-neutral-400">
                      72‑Hour Vision Activation Intensive + first 28 days of Vision Pro included
                    </Text>
                    <Text size="sm" className="text-neutral-500 mt-1">
                      (your plan auto‑starts Day 28)
                    </Text>
                  </div>
                </div>
                
                <OfferStack
                  items={[
                    {
                      id: 'setup',
                      title: 'Setup (Steps 1–2)',
                      description: 'What it is: Your account setup and baseline intake.\nOutcome: VIVA knows who you are and where you\'re starting from.\nDone when: Account settings are complete and your baseline intake is submitted.',
                      icon: Settings,
                      included: true
                    },
                    {
                      id: 'unlock-message',
                      title: 'Each phase below unlocks as you complete the step before it.',
                      description: '',
                      icon: null,
                      included: true,
                      isMessage: true
                    },
                    {
                      id: 'profile',
                      title: 'Create Your Profile (Step 3)',
                      description: 'What it is: Your personal snapshot across all 12 life categories.\nOutcome: Personalized prompts and next steps—no guesswork.\nDone when: Profile is complete.',
                      icon: User,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'life-vision',
                      title: 'Life Vision with VIVA (Step 4)',
                      description: 'What it is: 12‑category Life Vision builder with VIVA.\nOutcome: Turn "I don\'t know what I want" into a vivid Life I Choose™.\nDone when: Your Life Vision is completed across all 12 categories with VIVA.',
                      icon: Target,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-audio',
                      title: 'Vision Audio Suite (Steps 5–7)',
                      description: 'What it is: Generate, record, and mix your Vision Audio.\nOutcome: Daily embodiment tracks you can listen to morning and evening.\nDone when: Vision audio is generated, your voice is recorded (optional step), and your audio mix is saved.',
                      icon: Headphones,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'vision-board',
                      title: 'Vision Board (Step 8)',
                      description: 'What it is: Visual proof, one image per category.\nOutcome: Each item stays Active until you mark it Actualized—and add evidence when it shows up in your life.\nDone when: 12 images are added (1 per category) and your board is saved.',
                      icon: Image,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'journal',
                      title: 'First Journal Entry (Step 9)',
                      description: 'What it is: Multi‑format journal (written, voice, video).\nOutcome: Start your evidence log and see your progress as you reflect.\nDone when: 1 entry is logged.',
                      icon: BookOpen,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'community',
                      title: 'Vibe Tribe & Alignment Gym Tour (Steps 10–12)',
                      description: 'What it is: Your first Vibe Tribe post, community engagement, and a guided Alignment Gym tour.\nOutcome: Start showing up in the community during your Intensive — post, engage, and preview weekly live coaching.\nDone when: You\'ve posted in Vibe Tribe, engaged with another member\'s post, and completed the Alignment Gym tour (live sessions unlock at Graduation).',
                      icon: Users,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'map',
                      title: 'My Alignment Plan (Step 13)',
                      description: 'What it is: Your daily alignment rhythm—MAP (My Alignment Plan).\nOutcome: Stay in vibrational harmony with your vision without guesswork.\nDone when: You customize and activate your MAP.',
                      icon: Map,
                      included: true,
                      locked: true
                    },
                    {
                      id: 'full-unlock',
                      title: 'Graduation (Step 14)',
                      description: 'What it is: You graduate from Intensive mode into full Vision Pro member mode.\nOutcome: Your main dashboard, full navigation, advanced audio tools, and Alignment Gym live sessions + replays turn on — with stats, streaks, and MAP tracking.\nDone when: All 14 steps are complete. You instantly enter member mode with:\n  - Advanced Audio Suite: binaural beats, solfeggio layers, and frequency enhancements for your Vision Audio\n  - Full Vision Pro dashboard and navigation — no more guided rails\n  - Alignment Gym live sessions, replays, streaks, and MAP tracking\n  - Ongoing Vibe Tribe and Alignment Gym as a Vision Pro member',
                      icon: Unlock,
                      included: true,
                      locked: true
                    },
                    {
                      id: '28-days-included',
                      title: 'First 28 Days of Vision Pro Included',
                      description: 'What it is: Full access to VIVA and the platform while you activate and beyond.\nOutcome: Keep compounding after your 72‑Hour Activation before your plan starts.\nDone when: Your access is live now, and your selected plan is scheduled to begin automatically on Day 28 (Annual or Every 28 Days).',
                      icon: Crown,
                      included: true
                    }
                  ]}
                  defaultExpanded={['setup']}
                  allowMultiple={true}
                />
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
                      Complete all 14 guided Activation Intensive steps in 72 hours. Not satisfied? Full refund of your ${getIntensiveTotal()} Intensive fee. No questions asked.
                    </Text>
                      <Text size="xs" className="md:text-sm text-neutral-300 text-center">
                      Completion = all 14 guided Activation Intensive steps done within 72 hours:<br />Account Settings &amp; Baseline Intake, Profile complete, 12‑category Life Vision built (with VIVA), Vision Audio &amp; Mix ready, Vision Board built (12 images), 1 journal entry logged, Vibe Tribe post + community engagement, Alignment Gym tour complete, MAP activated
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
                        <p>You have a 16‑week satisfaction guarantee from your checkout date, no matter which plan you choose (Every 28 Days or Annual).</p>
                      </div>
                      <div className="text-xs md:text-sm text-neutral-300 text-center space-y-2">
                        <p className="font-semibold">Not satisfied within your 16‑week window?</p>
                        <p>If your plan <strong className="font-semibold">hasn't billed yet</strong> (first charge is Day 28), we cancel the upcoming charge and end your membership at the end of the current paid period.</p>
                        <p>If it <strong className="font-semibold">has billed</strong> inside your 16-week window, we refund that charge and cancel all future renewals.</p>
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
                  <div className="inline-flex w-auto items-center gap-1.5 p-1.5 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700">
                    <button
                      onClick={() => setPlanType('solo')}
                      className={`px-5 md:px-6 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 ${
                        planType === 'solo'
                          ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30'
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
                      className={`px-5 md:px-6 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 ${
                        planType === 'household'
                          ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
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
                      72-Hour Vision Activation Intensive
                  </Heading>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-gradient-to-r from-[#BF00FF]/20 to-[#8B5CF6]/20 text-[#BF00FF] border-[#BF00FF]/30 mb-4">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Complete in 72 hours
                  </span>
                  <Text size="xl" className="text-neutral-300 max-w-3xl mx-auto">
                    Go from blank slate to fully activated in 72 hours. Vision drafted, board built, audios recorded, conscious creation system live.
                  </Text>
                  </div>

                {/* MAIN PRICING CONTENT */}
                <Stack align="center" gap="md">
                    
                    {/* DYNAMIC PRICE */}
                    <div className="text-center">
                      {promoCode ? (
                        <div className="flex flex-col items-center gap-2 mb-2">
                          <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-neutral-500 line-through opacity-50">
                            ${getIntensiveTotal()}
                          </div>
                          <div className="text-5xl md:text-7xl lg:text-9xl font-bold text-[#39FF14]">
                            $1
                          </div>
                          <div className="text-xl text-white text-center">
                            ${getPromoDiscount()} Off - Pay $1 to Verify Payment Method
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 mb-2">
                          <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-[#39FF14]">
                            ${getPaymentAmount()}
                          </div>
                          {paymentPlan === '2pay' && (
                            <div className="text-xl text-white text-center">
                              × 2 Payments = ${getTwoPayTotal()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PAYMENT OPTIONS */}
                      <Stack align="center" gap="sm" className="mt-3 md:mt-4 mb-3 md:mb-4">
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
                        </div>
                      </Stack>

                      <Card className="bg-[#1F1F1F]/80 border-2 border-[#39FF14]/30 rounded-xl p-3 md:p-4 w-full max-w-2xl mx-auto">
                        <div>
                          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                            <div className="h-px flex-1 max-w-12 md:max-w-16 bg-gradient-to-r from-transparent to-[#39FF14]/50" />
                            <p className="text-sm md:text-base font-bold uppercase tracking-[0.18em] bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#39FF14] bg-clip-text text-transparent">
                              You&apos;ll Get
                            </p>
                            <div className="h-px flex-1 max-w-12 md:max-w-16 bg-gradient-to-l from-transparent to-[#39FF14]/50" />
                          </div>
                          <div className="flex flex-col gap-2.5 text-left">
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white font-medium text-sm">72-Hour Vision Activation Intensive</p>
                                <p className="text-neutral-400 text-xs mt-0.5">14 guided steps with VIVA to design and lock in your new life vision.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-white font-medium text-sm">First 28 days of Vision Pro included</p>
                                <p className="text-neutral-400 text-xs mt-0.5">Full access to all practices, tools, and community.</p>
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 pt-3 border-t border-[#39FF14]/20 text-xs text-neutral-500 text-center leading-relaxed">
                            {getYoullGetRenewalMicrocopy()}
                          </p>
                        </div>
                      </Card>
                    </div>

                    {/* SEPARATOR */}
                    <div className="w-full h-px bg-neutral-600"></div>

                    <Text size="lg" className="text-neutral-300 text-center max-w-2xl">
                      Choose how your Vision Pro membership continues after your first 28 days included.
                    </Text>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700 mx-auto mb-8">
                      <button
                        onClick={() => setBillingPeriod('28day')}
                        className={`px-4 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                          billingPeriod === '28day'
                            ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30 scale-105'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                        }`}
                      >
                        28-Day
                      </button>
                      <button
                        onClick={() => setBillingPeriod('annual')}
                        className={`px-4 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                          billingPeriod === 'annual'
                            ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/30 scale-105'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          Annual
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFB701] text-black shadow-md">
                            Save {getVisionProAnnualSavings()}
                          </span>
                        </span>
                      </button>
                  </div>

                    {/* VISION PRO MEMBERSHIP CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6 gap-y-12 max-w-5xl mx-auto mb-8">
                      
                      {/* Annual Plan - Show first on mobile if selected */}
                      {billingPeriod === 'annual' && (
                        <Card 
                          className={`transition-all relative cursor-pointer md:order-2 order-1 ${
                            billingPeriod === 'annual'
                              ? 'border-2 border-[#00FFFF] bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 scale-105 ring-2 ring-[#00FFFF]'
                              : 'border border-neutral-700 opacity-60 hover:opacity-80'
                          }`}
                          onClick={() => setBillingPeriod('annual')}
                        >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <div className="bg-[#00FFFF] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                            Best Value
                            </div>
                        </div>

                      <div className="text-center mb-8">
                        <Crown className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                        <Text size="base" className="text-neutral-400 mb-6">Committed creator • {getPlanSeatsText()}</Text>
                        
                        <div className="inline-flex items-baseline gap-2 mb-2">
                              <span className="text-5xl font-bold text-white">${getVisionProAnnualPrice()}</span>
                              <span className="text-xl text-neutral-400">/year</span>
                        </div>
                        <div className="text-[#00FFFF] text-sm font-semibold mb-1">
                              3 billing cycles free
                        </div>
                        <div className="text-neutral-500 text-sm">
                              Save {getVisionProAnnualSavings()} vs ${getVisionProMonthlyPrice()} every 28 days
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {[
                              'Full platform access',
                              'Alignment Gym group coaching (1 hour / week)',
                              'Protected by our 16‑week satisfaction guarantee',
                              '12‑month rate lock (best value)',
                        ].map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-[#00FFFF] flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-200 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                      )}

                      {/* 28-Day Plan - Show first on mobile if selected */}
                      {billingPeriod === '28day' && (
                    <Card
                          className={`transition-all cursor-pointer md:order-1 order-1 ${
                        billingPeriod === '28day'
                              ? 'border-2 border-[#39FF14] bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/5 scale-105 ring-2 ring-[#39FF14]'
                              : 'border border-neutral-700 opacity-60 hover:opacity-80'
                      }`}
                          onClick={() => setBillingPeriod('28day')}
                    >
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="bg-[#39FF14] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                          Most Popular
                        </div>
                      </div>
                      <div className="text-center mb-8">
                        <Zap className="w-12 h-12 text-[#39FF14] mx-auto mb-4" />
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
                              'Full platform access',
                              'Alignment Gym group coaching (1 hour / week)',
                              'Protected by our 16‑week satisfaction guarantee',
                              'Flexible: cancel any 28‑day cycle',
                        ].map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-200 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                      )}

                      {/* Show unselected cards */}
                      {billingPeriod !== 'annual' && (
                        <Card 
                          className={`transition-all relative cursor-pointer md:order-2 order-2 ${
                            'border border-neutral-700 opacity-60 hover:opacity-80'
                          }`}
                          onClick={() => setBillingPeriod('annual')}
                        >
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <div className="bg-[#00FFFF] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                              Best Value
                            </div>
                </div>

                          <div className="text-center mb-8">
                            <Crown className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                            <Text size="base" className="text-neutral-400 mb-6">Committed creator • {getPlanSeatsText()}</Text>
                            
                            <div className="inline-flex items-baseline gap-2 mb-2">
                              <span className="text-5xl font-bold text-white">${getVisionProAnnualPrice()}</span>
                              <span className="text-xl text-neutral-400">/year</span>
                            </div>
                            <div className="text-[#00FFFF] text-sm font-semibold mb-1">
                              3 billing cycles free
                            </div>
                            <div className="text-neutral-500 text-sm">
                              Save {getVisionProAnnualSavings()} vs ${getVisionProMonthlyPrice()} every 28 days
            </div>
          </div>

                          <div className="space-y-3 mb-8">
                            {[
                              'Full platform access',
                              'Alignment Gym group coaching (1 hour / week)',
                              'Protected by our 16‑week satisfaction guarantee',
                              '12‑month rate lock (best value)',
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-[#00FFFF] flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-200 text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {billingPeriod !== '28day' && (
                        <Card 
                          className={`transition-all cursor-pointer md:order-1 order-2 ${
                            'border border-neutral-700 opacity-60 hover:opacity-80'
                          }`}
                          onClick={() => setBillingPeriod('28day')}
                        >
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <div className="bg-[#39FF14] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                              Most Popular
                            </div>
                          </div>
                          <div className="text-center mb-8">
                            <Zap className="w-12 h-12 text-[#39FF14] mx-auto mb-4" />
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
                              'Full platform access',
                              'Alignment Gym group coaching (1 hour / week)',
                              'Protected by our 16‑week satisfaction guarantee',
                              'Flexible: cancel any 28‑day cycle',
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-200 text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>

                    {/* RENEWAL TERMS & ORDER SUMMARY COMBINED */}
                    <Card className="bg-[#1F1F1F]/50 border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                      <Stack gap="md" className="md:gap-8">
                        <Heading level={4} className="text-[#39FF14] text-center">Order Summary &amp; Renewal Terms</Heading>
                        
                        {/* Order Summary */}
                        <Stack gap="sm" align="center">
                          {promoCode && (
                            <Badge variant="premium" className="mb-2">
                              {promoCode.toUpperCase()} Applied - ${getPromoDiscount()} Off!
                            </Badge>
                          )}
                          <div className="text-white text-center text-sm md:text-base space-y-2">
                            <p>
                              <strong>Today:</strong>{' '}
                              {promoCode
                                ? <><span className="text-[#39FF14] font-bold">$1</span> payment verification + FREE 72‑Hour Vision Activation Intensive + your first 28 days of Vision Pro included.</>
                                : paymentPlan === 'full'
                                  ? <>${getIntensiveTotal()} for the 72‑Hour Vision Activation Intensive + your first 28 days of Vision Pro included.</>
                                  : <>${getPaymentAmount()} (first of 2 payments) for the 72‑Hour Vision Activation Intensive + your first 28 days of Vision Pro included.</>
                              }
                            </p>
                            {getInstallmentScheduleNote() && (
                              <p className="text-neutral-400 text-sm">
                                {getInstallmentScheduleNote()}
                              </p>
                            )}
                          </div>
                          <p className="text-neutral-400 text-xs text-center">
                            <Shield className="w-3 h-3 text-[#FFFF00] inline-block align-middle -mt-[2px] mr-1" aria-hidden />
                            72‑Hour Activation Guarantee
                          </p>
                          <div className="text-white text-center text-sm md:text-base space-y-2">
                            <p>
                              <strong>Day 28:</strong>{' '}{getDay28RenewalText()}
                            </p>
                            <p className="text-neutral-400 text-sm">
                              {getDay28SwitchText()}
                            </p>
                          </div>
                          <p className="text-neutral-400 text-xs text-center">
                            <Shield className="w-3 h-3 text-[#FFFF00] inline-block align-middle -mt-[2px] mr-1" aria-hidden />
                            16‑week Membership Satisfaction Guarantee from today.
                          </p>
                        </Stack>

                        {/* CTA BUTTON */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="primary"
                        size="xl"
                        onClick={handleIntensivePurchase}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : promoCode ? 'Pay $1 & Start 72-Hour Activation Intensive' : 'Start the 72-Hour Activation Intensive'}
                      </Button>
                      <p className="flex items-center justify-center gap-2 text-xs text-[#39FF14] text-center mt-2">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Next Step: Secure Checkout
                      </p>
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
                              <p className="text-neutral-300 text-sm">${getIntensiveTotal()} today for the Intensive + first 28 days of Vision Pro included. Day 28 your selected plan begins automatically.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">Can I switch or cancel my membership before Day 28?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">Yes—1‑click switch/cancel anytime before Day 28.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">When do guarantees start?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">All guarantees start from your checkout date. Your 72‑hour window begins the moment you enroll in the Intensive, and your Membership Satisfaction Guarantee runs for 16 weeks from that same checkout date, no matter which plan you choose.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">What qualifies for the 72‑Hour Activation Guarantee?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">Complete all 14 guided Activation Intensive steps within 72 hours. If you do that and aren&apos;t satisfied, you get a full refund.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">What if I'm not satisfied with the membership?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">You have a 16‑week satisfaction guarantee from your checkout date, no matter which plan you choose (Every 28 Days or Annual). If you're not satisfied within those 16 weeks, we'll refund your most recent membership charge (if it was billed inside the window) and cancel all future renewals.</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-[#39FF14] text-sm mt-0.5">•</span>
                              <h5 className="text-white font-semibold">What if I don't know what I want?</h5>
                            </div>
                            <div className="ml-4 mb-0 text-justify">
                              <p className="text-neutral-300 text-sm">VIVA turns contrast into clarity and drafts your 12‑category Life Vision for you.</p>
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
                                Start the 72-Hour Activation Intensive
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

                  {/* Bridge Section */}
                  <div className="bg-[#1F1F1F]/50 rounded-xl p-6 border border-[#39FF14]/30 w-full max-w-5xl mx-auto">
                    <Heading level={3} className="text-[#39FF14] mb-3 text-center">The Fix</Heading>
                    <Text size="base" className="text-neutral-300 mb-4 text-center">
                      Chaos is an input problem. Structure fixes inputs.
                    </Text>
                    <div className="text-center mb-4">
                      <Text size="base" className="text-neutral-300 font-semibold">The Conscious Creation System</Text>
                      <Text size="lg" className="text-[#39FF14] font-bold">Creations → Activations → Connections → Sessions</Text>
                      <Text size="xs" className="text-neutral-500">These are the 4 Parts of your Conscious Creation System.</Text>
                      <Text size="base" className="text-neutral-300">It turns scattered signals into a dominant point of attraction.</Text>
                    </div>
                    <Text size="sm" className="text-neutral-300 text-center">
                      <strong className="text-[#39FF14]">Cost of chaos:</strong> weeks pass, assets = 0.<br />
                      <strong className="text-[#39FF14]">With structure:</strong> a complete vision, audios, board, and journals in 72 hours, plus your MAP so you know exactly what to do next.
                    </Text>
                  </div>

                  <div className="text-center">
                    <Link href="/system" className="text-[#39FF14] hover:text-[#5EC49A] underline underline-offset-4 transition-colors text-sm md:text-base">
                      See how the system fixes this →
                    </Link>
                  </div>
                </Stack>
              </Stack>
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section>
          <Container size="xl">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/15 via-[#00FFFF]/10 to-[#BF00FF]/15 border-[#39FF14]/30 p-4 md:p-6 shadow-[0_20px_60px_rgba(57,255,20,0.18)]">
              <Stack align="center" gap="lg">
                <div className="text-center">
                  <Heading level={2} className="text-white">
                    Welcome Home
                  </Heading>
                  <Text size="lg" className="text-neutral-300 mt-2">
                    Ditch vibrational chaos. Activate your Life Vision in 72 hours—then keep compounding with Vision Pro.
                  </Text>
                </div>
                <div className="w-full max-w-5xl mx-auto space-y-6 text-center">

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
                        <Text size="sm" className="text-neutral-400">Vision Audio + your daily Activations with My Alignment Plan</Text>
                      </Stack>
                    </Card>
                    <Card variant="glass" className="text-center">
                      <Stack gap="sm">
                        <Icon icon={Target} size="lg" color="#BF00FF" className="mx-auto" />
                        <Text size="sm" className="font-semibold text-white">Lock It In</Text>
                        <Text size="sm" className="text-neutral-400">Vision Board built, 1 journal logged (written, voice, or video), dashboard tracking your streaks</Text>
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
                      Start the 72-Hour Activation Intensive
                    </a>
                  </Button>
                  <div className="flex flex-col items-center justify-center gap-3 text-xs uppercase tracking-wide text-neutral-400 mt-4">
                    <div className="flex items-center gap-2">
                      <Icon icon={Shield} size="sm" className="text-[#39FF14] flex-shrink-0" />
                      <span className="leading-tight">Covered by the 72‑Hour Activation Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon={Award} size="sm" className="text-[#00FFFF] flex-shrink-0" />
                      <span className="leading-tight">16‑week Membership Satisfaction Guarantee</span>
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
                  description: 'Good. That\'s why we stack raw proof, a structured mechanism, and guarantees. See the vision transformations (including $0.74 → $1M screenshots), the Conscious Creation System: Creations → Activations → Connections → Sessions, and our 72‑Hour Activation + Membership Guarantees.'
                },
                {
                  id: 'tried-loa',
                  title: 'What if I\'ve tried LoA and failed?',
                  description: 'Most people had belief without structure. We give you the mechanism (Creations → Activations → Connections → Sessions), a 72‑Hour Activation to get your Life Vision fully online, and a 28‑Day MAP (My Alignment Plan) so you know exactly what to do each day, plus proof and guarantees if you\'re not satisfied.'
                },
                {
                  id: 'dont-know',
                  title: 'What if I don\'t know what I want?',
                  description: 'VIVA turns contrast into clarity and drafts your 12‑category Life Vision with you. You\'ll have a concrete first draft to refine within 72 hours of starting—something that used to take Jordan and Vanessa months to do on their own without VIVA\'s help.'
                },
                {
                  id: 'doesnt-work',
                  title: 'What if it doesn\'t work for me?',
                  description: 'You have two layers of protection: a 72‑Hour Activation Guarantee (complete all 14 guided Activation Intensive steps in 72 hours; if you\'re not satisfied, you get a full refund of your Intensive fee) and a Membership Satisfaction Guarantee (16 weeks from your checkout date, no matter which plan you choose).'
                },
                {
                  id: 'billing-start',
                  title: 'When does billing start?',
                  description: `$${getIntensiveTotal()} today for the Intensive + first 28 days of Vision Pro included. Day 28 your selected plan begins automatically.`
                },
                {
                  id: 'switch-cancel',
                  title: 'Can I switch or cancel before billing starts?',
                  description: 'Yes—1‑click switch/cancel anytime before Day 28.'
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
                            72‑Hour Activation Guarantee: if you complete all 14 guided Activation Intensive steps in 72 hours and aren't satisfied, we refund the ${getIntensiveTotal()} Intensive fee.
                          </li>
                          <li>
                            Membership Satisfaction Guarantee: From your checkout date, you have 16 weeks, no matter which plan you choose (Every 28 Days or Annual).
                            <br /><br />
                            If your next plan charge hasn't billed yet (first charge is Day 28), we cancel the upcoming charge and end your membership at the end of the current paid period.
                            <br />
                            If a plan charge occurred within your 16‑week window, we refund that charge in full and cancel all future renewals.
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
                          Refunds go back to the original payment method. Banks typically show the credit in 5–10 business days.
                        </p>
                      </div>
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
                        <p className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide">International buyers</p>
                        <p>Your bank may add currency conversion or cross-border fees—we don't control those.</p>
                      </div>
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
      </>
  )
}