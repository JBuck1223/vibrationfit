'use client'

import React, { useState } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, ArrowRight, Star, Target,
  Brain, TrendingUp, Shield, Play, Award, Globe, Crown, Check, Clock, User,
  Headphones, Image, BookOpen, CalendarDays, Lock
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Stack,
  Inline,
  Grid,
  TwoColumn,
  Switcher,
  Cover,
  Container,
  Card,
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
                      Includes 8 weeks of Vision Pro; auto‑starts Day 56 at your plan
                    </ListItem>
                  </BulletedList>
                  
                  <div className="flex justify-center md:justify-center">
                    <Button variant="primary" size="xl" className="mt-1 mb-4 md:mt-2" asChild>
                      <a href="#pricing">
                        Start the Activation Intensive
                      </a>
                  </Button>
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

        {/* What 'active in 72 hours' means + Train → Tune → Track - Side by Side */}
        <section>
          <Grid minWidth="280px" gap="lg">
            {/* What 'active in 72 hours' means */}
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-black border-[#39FF14]/30 hover:border-[#39FF14]/50 transition-all duration-300 flex flex-col items-center justify-center">
              <Stack gap="md" className="md:gap-8 items-center">
                <Heading level={3} className="text-[#39FF14] text-center">
                  What "active in 72 hours" means
                </Heading>
                <div className="flex flex-col items-center">
                  <BulletedList className="items-center">
                    <ListItem icon={CheckCircle} variant="success" className="text-white">
                      12-category vision completed
                    </ListItem>
                    <ListItem icon={CheckCircle} variant="success" className="text-white">
                      AM/PM audio recordings
                    </ListItem>
                    <ListItem icon={CheckCircle} variant="success" className="text-white">
                      Vision board created
                    </ListItem>
                    <ListItem icon={CheckCircle} variant="success" className="text-white">
                      3 journal entries logged
                    </ListItem>
                    <ListItem icon={CheckCircle} variant="success" className="text-white">
                      Calibration call booked
                    </ListItem>
                  </BulletedList>
                </div>
              </Stack>
            </Card>

            {/* Train → Tune → Track Mechanism */}
            <Card variant="elevated" className="bg-gradient-to-br from-black via-neutral-900 to-black border-neutral-700 hover:border-[#14B8A6]/50 transition-all duration-300">
              <Stack gap="md" className="md:gap-8">
                <div className="flex flex-col gap-3">
                  {/* Train */}
                  <div className="flex items-start gap-3 py-4 md:items-center">
                    <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">Train</Heading>
                    <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
                      Complete profile + 84‑Q assessment + first Life Vision draft (with VIVA)
                    </Text>
                  </div>
                  
                  {/* Arrow Down */}
                  <div className="flex items-center gap-3 pl-0">
                    <div className="w-24 flex justify-center">
                      <svg className="w-6 h-6 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Tune */}
                  <div className="flex items-start gap-3 py-4 md:items-center">
                    <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">Tune</Heading>
                    <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
                      Refine your vision, build your Vision Board, start the Activation Protocol
                    </Text>
                  </div>
                  
                  {/* Arrow Down */}
                  <div className="flex items-center gap-3 pl-0">
                    <div className="w-24 flex justify-center">
                      <svg className="w-6 h-6 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Track */}
                  <div className="flex items-start gap-3 py-4 md:items-center">
                    <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">Track</Heading>
                    <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
                      Journal daily, log iterations, watch streaks and wins grow
                    </Text>
                  </div>
                </div>
              </Stack>
            </Card>
          </Grid>
        </section>

        {/* 72-Hour Activation Path */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 !mx-0 !w-full">
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
              
            </Card>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 !mx-0 !w-full">
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
            </Card>
          </div>
        </section>

        {/* Offer Stack Section */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 !mx-0 !w-full">
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
            </Card>
          </div>
        </section>

        {/* Guarantees Section */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-[#1F1F1F] border-[#333] !mx-0 !w-full p-6 md:p-8">
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
          </div>
        </section>

        {/* Pricing Section */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 !mx-0 !w-full">
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
                              '60‑day satisfaction guarantee',
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
                              '30‑day satisfaction guarantee',
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
                              '60‑day satisfaction guarantee',
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
                              '30‑day satisfaction guarantee',
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
                          <div className="text-white text-center text-sm md:text-base">
                            <strong>Day 56:</strong> {billingPeriod === 'annual' 
                              ? '$999 Payment (=$76.85/28 days). Renews annually.'
                              : '$99 Payment. Renews every 28 days.'
                            }
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
                            <span className="text-[#39FF14] font-semibold">I agree to the renewal terms above.</span>
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
                  </Stack>
              </Stack>
            </Card>
          </div>
        </section>

        {/* The Problem: Vibrational Chaos */}
        <section id="problem">
            <Stack gap="lg" align="center">
              <div className="text-center max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  The Problem: <span className="text-[#FF0040]">Vibrational Chaos</span>
                </h2>
                <Text size="xl" className="text-neutral-300">
                  Understanding conscious creation isn't enough. You need a SYSTEM.
                </Text>
              </div>

              <Card variant="elevated" className="border-[#FF0040]/30 bg-[#FF0040]/5 max-w-4xl">
                <Stack gap="md" className="md:gap-8">
                  <div className="text-center">
                    <Heading level={3} className="text-[#FF0040] mb-4">What is Vibrational Chaos?</Heading>
                    <Text size="lg" className="text-neutral-300 mb-6">
                      "Vibrational chaos is a state of being where a person is consistently inconsistent in their thought patterns, also known as their vibe."
                    </Text>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <Icon icon={Target} size="xl" color="#39FF14" className="mx-auto mb-4" />
                      <Heading level={4} className="text-[#39FF14] mb-2">Thoughts in Harmony</Heading>
                      <Text size="sm" className="text-neutral-400">Desires aligned with your goals</Text>
                    </div>
                    <div className="text-center">
                      <Icon icon={Shield} size="xl" color="#FF0040" className="mx-auto mb-4" />
                      <Heading level={4} className="text-[#FF0040] mb-2">Thoughts of Self-Doubt</Heading>
                      <Text size="sm" className="text-neutral-400">Limiting beliefs holding you back</Text>
                    </div>
                  </div>

                  <div className="text-center">
                    <Text size="base" className="text-neutral-400 mb-4">
                      "These opposing thoughts continuously are in battle, if unchecked."
                    </Text>
                    <Badge variant="danger">Vibrational Tug-of-War</Badge>
                  </div>
                </Stack>
              </Card>
            </Stack>
        </section>

        {/* The Solution: Conscious Creation System */}
        <section id="solution">
            <Stack gap="lg" align="center">
              <div className="text-center max-w-3xl">
                <Heading level={2} className="text-white mb-6">
                  The Solution: <span className="text-[#39FF14]">Conscious Creation System</span>
                </Heading>
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

              <Switcher className="gap-8">
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
              </Switcher>
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