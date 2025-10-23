'use client'

import React, { useState } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, ArrowRight, Star, Target,
  Brain, TrendingUp, Shield, Play, Award, Globe, Crown, Check
} from 'lucide-react'
import {
  Stack,
  Inline,
  Grid,
  Switcher,
  Cover,
  Container,
  Card,
  Button,
  VIVAButton,
  Icon,
  Badge,
  Video,
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

  return (
    <Stack gap="xl">
        
        {/* Hero Section */}
        <section>
          <Cover minHeight="500px" className="!p-0">
            <div className="w-full">
              {/* Headline at top */}
              <div className="text-center mb-4 md:mb-6 px-2 md:px-0">
                <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Thoughts become things…
                  <br />
                  <span className="text-xl md:text-4xl lg:text-5xl text-white">so why isn't it working?</span>
                </h1>
              </div>
              
              {/* Two column layout for desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left column - Content */}
                <div className="space-y-4 text-center lg:text-left flex flex-col justify-center">
                  <p className="text-lg md:text-2xl text-neutral-200 leading-relaxed font-bold md:font-medium mt-2 md:mt-2 px-2 md:px-0 text-center md:text-center">
                    Bridge the woo-woo with the how-to.
                  </p>
                  
                  <p className="text-base md:text-lg text-[#39FF14] leading-relaxed text-center md:text-center">
                    Activate your Life Vision in <span className="font-bold text-[#39FF14]">72 hours</span>
                    <br />
                    with the Activation Intensive.
                  </p>
                  
                  <div className="text-base text-neutral-500 leading-relaxed text-left">
                    <ul className="space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-[#39FF14] mt-0">→</span>
                        <span className="text-left">Conscious Creation System: Train → Tune → Track</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#39FF14] mt-0">→</span>
                        <span className="text-left">VIVA AI turns contrast into clarity—even if you don't know what you want</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#39FF14] mt-0">→</span>
                        <span className="text-left">Includes 8 weeks of Vision Pro; auto‑starts Day 56 at your plan</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-center md:justify-center">
                    <Button variant="primary" size="xl" className="mt-2 md:mt-2">
                      Start the 72‑Hour Activation Intensive
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

        {/* What 'active in 72 hours' means - Credibility Box */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-[#39FF14]/10 border-[#39FF14]/30 !mx-0 !w-full">
              <Stack gap="md" className="px-4">
                <h3 className="text-xl font-bold text-[#39FF14] text-center">
                  What "active in 72 hours" means
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <Icon icon={CheckCircle} size="sm" color="#39FF14" />
                    <span className="text-sm text-neutral-300">12-category vision completed</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Icon icon={CheckCircle} size="sm" color="#39FF14" />
                    <span className="text-sm text-neutral-300">AM/PM audio recordings</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Icon icon={CheckCircle} size="sm" color="#39FF14" />
                    <span className="text-sm text-neutral-300">Vision board created</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Icon icon={CheckCircle} size="sm" color="#39FF14" />
                    <span className="text-sm text-neutral-300">3 journal entries logged</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Icon icon={CheckCircle} size="sm" color="#39FF14" />
                    <span className="text-sm text-neutral-300">Calibration call booked</span>
                  </div>
                </div>
              </Stack>
            </Card>
          </div>
        </section>

        {/* Video Section */}
        <section id="video">
            <Card variant="elevated" className="overflow-hidden">
              <Stack gap="md" className="p-8">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Meet Your AI Alignment Coach
                  </h2>
                  <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                    Watch this introduction to understand how VibrationFit transforms conscious creators 
                    into manifestation masters.
                  </p>
                </div>
                
              
              </Stack>
            </Card>
        </section>

        {/* The Problem: Vibrational Chaos */}
        <section id="problem">
            <Stack gap="lg" align="center">
              <div className="text-center max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  The Problem: <span className="text-[#FF0040]">Vibrational Chaos</span>
                </h2>
                <p className="text-xl text-neutral-300">
                  Understanding conscious creation isn't enough. You need a SYSTEM.
                </p>
              </div>

              <Card variant="elevated" className="border-[#FF0040]/30 bg-[#FF0040]/5 max-w-4xl">
                <Stack gap="md" className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#FF0040] mb-4">What is Vibrational Chaos?</h3>
                    <p className="text-lg text-neutral-300 mb-6">
                      "Vibrational chaos is a state of being where a person is consistently inconsistent in their thought patterns, also known as their vibe."
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <Icon icon={Target} size="xl" color="#39FF14" className="mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-[#39FF14] mb-2">Thoughts in Harmony</h4>
                      <p className="text-sm text-neutral-400">Desires aligned with your goals</p>
                    </div>
                    <div className="text-center">
                      <Icon icon={Shield} size="xl" color="#FF0040" className="mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-[#FF0040] mb-2">Thoughts of Self-Doubt</h4>
                      <p className="text-sm text-neutral-400">Limiting beliefs holding you back</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-neutral-400 mb-4">
                      "These opposing thoughts continuously are in battle, if unchecked."
                    </p>
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
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  The Solution: <span className="text-[#39FF14]">Conscious Creation System</span>
                </h2>
                <p className="text-xl text-neutral-300">
                  "A structured way to train, tune and track our vibration so that actualization or manifestation becomes second nature."
                </p>
              </div>

              <Grid minWidth="300px" gap="lg">
                <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300 border-[#39FF14]/30 bg-[#39FF14]/5">
                  <Stack gap="md" className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14]/20 to-[#39FF14]/5 rounded-2xl flex items-center justify-center">
                      <Icon icon={Target} size="lg" color="#39FF14" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">TRAIN</h3>
                    <p className="text-neutral-400">
                      Create your comprehensive <span className="text-[#39FF14] font-semibold">Life I Choose™</span> document 
                      across 14 life categories. Get crystal clear on your goals and direction with AI-guided prompts.
                    </p>
                    <Badge variant="success">Above the Green Line</Badge>
                  </Stack>
                </Card>

                <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300 border-[#00FFFF]/30 bg-[#00FFFF]/5">
                  <Stack gap="md" className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00FFFF]/20 to-[#00FFFF]/5 rounded-2xl flex items-center justify-center">
                      <Icon icon={Brain} size="lg" color="#00FFFF" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">TUNE</h3>
                    <p className="text-neutral-400">
                      Daily check-ins and personalized AI guidance to keep you aligned and in flow. 
                      Your intelligent companion for staying above the Green Line every single day.
                    </p>
                    <Badge variant="info">VIVA Assistant</Badge>
                  </Stack>
                </Card>

                <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300 border-[#BF00FF]/30 bg-[#BF00FF]/5">
                  <Stack gap="md" className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#BF00FF]/20 to-[#BF00FF]/5 rounded-2xl flex items-center justify-center">
                      <Icon icon={TrendingUp} size="lg" color="#BF00FF" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">TRACK</h3>
                    <p className="text-neutral-400">
                      Log your wins and track evidence of actualization. See your progress, 
                      celebrate victories, and prove to yourself that manifestation works.
                    </p>
                    <Badge variant="premium">Premium Feature</Badge>
                  </Stack>
                </Card>
              </Grid>

              {/* The Formula */}
              <Card variant="glass" className="text-center max-w-2xl">
                <Stack gap="md" className="p-8">
                  <h3 className="text-2xl font-bold text-white">The Formula</h3>
                  <div className="text-xl md:text-4xl font-bold">
                    <span className="text-[#39FF14]">Desire</span>
                    <span className="text-white mx-2 md:mx-4">+</span>
                    <span className="text-[#00FFFF]">Vibrational Harmony</span>
                    <span className="text-white mx-2 md:mx-4">=</span>
                    <span className="text-[#BF00FF]">Actualization</span>
                  </div>
                  <p className="text-neutral-400">
                    "Conscious creation simply comes down to two things: desire and vibrational harmony with the desire."
                  </p>
                </Stack>
              </Card>
            </Stack>
        </section>

        {/* What is Vibrational Fitness */}
        <section>
            <Cover minHeight="300px" className="bg-gradient-to-r from-[#39FF14]/10 via-[#00FFFF]/5 to-[#BF00FF]/10 rounded-3xl border border-[#333]">
              <Stack align="center" gap="lg" className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  What is Vibrational Fitness?
                </h2>
                <p className="text-xl md:text-2xl text-neutral-300 max-w-4xl">
                  <span className="text-[#39FF14] font-semibold">Vibrational fitness is intentionally training your vibration to attract the life you choose.</span>
                </p>
                <p className="text-lg text-neutral-400 max-w-3xl">
                  "By becoming a member, you'll be able to instantly apply our conscious creation system in your reality 
                  and eliminate confusion around conscious creation, AKA turning thoughts into things."
                </p>
                <Badge variant="premium" className="text-lg px-6 py-3">
                  <Icon icon={Sparkles} size="md" className="mr-2" />
                  Decades of Trial & Error → Instant Access
                </Badge>
              </Stack>
            </Cover>
        </section>

        {/* Life Categories Grid */}
        <section>
            <Stack gap="lg">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  Your Complete
                  <span className="text-[#39FF14]"> Life Vision</span>
                </h2>
                <p className="text-xl text-neutral-300">
                  Craft your vision across 14 comprehensive life categories. Nothing gets left behind 
                  in your journey to actualization.
                </p>
              </div>

              <Grid minWidth="250px" gap="md">
                {VISION_CATEGORIES.map((category) => (
                  <Card 
                    key={category.key} 
                    variant="default" 
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedCategory === category.key ? 'ring-2 ring-[#39FF14] bg-[#39FF14]/5' : ''
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory === category.key ? null : category.key)}
                  >
                    <Stack align="center" gap="sm" className="text-center p-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        selectedCategory === category.key 
                          ? 'bg-[#39FF14]/20 border-2 border-[#39FF14]' 
                          : 'bg-[#00FFFF]/20 border-2 border-[#00FFFF]'
                      }`}>
                        <Icon icon={category.icon} size="md" color={selectedCategory === category.key ? '#39FF14' : '#00FFFF'} />
                      </div>
                      <h4 className="font-semibold text-white">{category.label}</h4>
                      <p className="text-xs text-neutral-500">{category.description}</p>
                      {selectedCategory === category.key && <Badge variant="success">Selected</Badge>}
                    </Stack>
                  </Card>
                ))}
              </Grid>
            </Stack>
        </section>

        {/* Transformation Story */}
        <section id="story">
            <Stack gap="lg">
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  From <span className="text-[#FF0040]">$0.43</span> to 
                  <span className="text-[#39FF14]"> $1M+</span>
                </h2>
                <p className="text-xl text-neutral-300">
                  Our real transformation story - from rock bottom to living our dream life
                </p>
              </div>

              {/* Before & After Comparison */}
              <Grid minWidth="300px" gap="lg">
                {/* Before */}
                <Card variant="elevated" className="border-[#FF0040]/30 bg-[#FF0040]/5">
                  <Stack gap="md" className="p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-[#FF0040] mb-4">Before: Rock Bottom</h3>
                      <p className="text-neutral-400 mb-6">
                        "At one point, it got so bad that I transferred 43 cents from one bank account to another to avoid an overdraft fee."
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Bank Account</span>
                        <span className="text-[#FF0040] font-bold">$0.43</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Total Debt</span>
                        <span className="text-[#FF0040] font-bold">$100K+</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Living Situation</span>
                        <span className="text-[#FF0040] font-bold">With In-Laws</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Income</span>
                        <span className="text-[#FF0040] font-bold">Basically None</span>
                      </div>
                    </div>

                    <Badge variant="danger" className="mx-auto">Vibrational Chaos</Badge>
                  </Stack>
                </Card>

                {/* After */}
                <Card variant="elevated" className="border-[#39FF14]/30 bg-[#39FF14]/5">
                  <Stack gap="md" className="p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-[#39FF14] mb-4">After: Living the Dream</h3>
                      <p className="text-neutral-400 mb-6">
                        "We went from being six figures in the hole to being completely debt free with multiple six figures in the bank, and ultimately went on to make our first million dollars in business."
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Business Revenue</span>
                        <span className="text-[#39FF14] font-bold">$1M+</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Savings</span>
                        <span className="text-[#39FF14] font-bold">Multiple 6-Figures</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Dream Home</span>
                        <span className="text-[#39FF14] font-bold">Paid Cash</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-neutral-300">Lifestyle</span>
                        <span className="text-[#39FF14] font-bold">Complete Freedom</span>
                      </div>
                    </div>

                    <Badge variant="success" className="mx-auto">Above the Green Line</Badge>
                  </Stack>
                </Card>
              </Grid>

              {/* The Turning Point */}
              <Card variant="glass" className="text-center">
                <Stack gap="md" className="p-8">
                  <Icon icon={Zap} size="xl" color="#39FF14" className="mx-auto" />
                  <h3 className="text-2xl font-bold text-white">The Turning Point</h3>
                  <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
                    "At an especially low moment—like can't afford milk and bread kind of moment—we finally decided to 
                    <span className="text-[#39FF14] font-semibold"> fully commit to the principles</span> that we knew to be true, 
                    but had never before fully committed to."
                  </p>
                  <p className="text-xl font-bold text-[#39FF14]">
                    And man, oh man, did things change. And fast.
                  </p>
                </Stack>
              </Card>
            </Stack>
        </section>

        {/* Stats Section */}
        <section>
            <Cover minHeight="300px" className="bg-gradient-to-r from-[#39FF14]/10 via-[#00FFFF]/5 to-[#BF00FF]/10 rounded-3xl border border-[#333]">
              <Stack align="center" gap="lg">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Join the Movement
                  </h2>
                  <p className="text-lg text-neutral-300">
                    Thousands of conscious creators are already actualizing their dreams
                  </p>
                </div>

                <Grid minWidth="200px" gap="lg">
                  <Card variant="glass" className="text-center p-6">
                    <Icon icon={Users} size="lg" color="#39FF14" className="mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-2">10,247</div>
                    <div className="text-sm text-neutral-400">Active Creators</div>
                  </Card>
                  <Card variant="glass" className="text-center p-6">
                    <Icon icon={Target} size="lg" color="#00FFFF" className="mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-2">5,891</div>
                    <div className="text-sm text-neutral-400">Visions Completed</div>
                  </Card>
                  <Card variant="glass" className="text-center p-6">
                    <Icon icon={TrendingUp} size="lg" color="#BF00FF" className="mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-2">94%</div>
                    <div className="text-sm text-neutral-400">Success Rate</div>
                  </Card>
                  <Card variant="glass" className="text-center p-6">
                    <Icon icon={Award} size="lg" color="#39FF14" className="mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-2">87%</div>
                    <div className="text-sm text-neutral-400">Avg. Alignment</div>
                  </Card>
                </Grid>
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
                <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
                  Simple, powerful, and designed for real results. Get started in minutes, 
                  see results in days.
                </p>
              </div>

              <Switcher className="gap-8">
                <Card variant="glass" className="flex-1">
                  <Stack gap="md" className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#39FF14] rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-white">Craft Your Vision</h3>
                    <p className="text-neutral-400">
                      Use our guided AI prompts to create your comprehensive Life I Choose™ document 
                      across all 14 life categories.
                    </p>
                  </Stack>
                </Card>

                <Card variant="glass" className="flex-1">
                  <Stack gap="md" className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#00FFFF] rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-white">Daily Alignment</h3>
                    <p className="text-neutral-400">
                      Check in daily with your AI Alignment Coach. Stay above the Green Line 
                      with personalized guidance and support.
                    </p>
                  </Stack>
                </Card>

                <Card variant="glass" className="flex-1">
                  <Stack gap="md" className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#BF00FF] rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-white">Track & Actualize</h3>
                    <p className="text-neutral-400">
                      Log evidence of your manifestations. Watch your vision come to life 
                      with our powerful tracking tools.
                    </p>
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
                  <p className="text-xl md:text-2xl text-neutral-300 mb-6">
                    "What would happen if I gained clarity on the life that I wanted to live, 
                    intentionally established vibrational harmony with it, and allowed my vision for a fun and 
                    emotionally satisfying life experience to become dominant in my point of attraction?"
                  </p>
                  
                  <p className="text-2xl md:text-3xl font-bold text-[#39FF14] mb-8">
                    We know the answer. You would live a life you love waking up to every day, 
                    feeling your creative power as you live the life you choose.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card variant="glass" className="text-center">
                    <Stack gap="sm" className="p-6">
                      <Icon icon={Target} size="lg" color="#39FF14" className="mx-auto" />
                      <h4 className="font-bold text-white">Gain Clarity</h4>
                      <p className="text-sm text-neutral-400">On the life you want to live</p>
                    </Stack>
                  </Card>
                  <Card variant="glass" className="text-center">
                    <Stack gap="sm" className="p-6">
                      <Icon icon={Brain} size="lg" color="#00FFFF" className="mx-auto" />
                      <h4 className="font-bold text-white">Establish Harmony</h4>
                      <p className="text-sm text-neutral-400">With your vibrational point of attraction</p>
                    </Stack>
                  </Card>
                  <Card variant="glass" className="text-center">
                    <Stack gap="sm" className="p-6">
                      <Icon icon={Crown} size="lg" color="#BF00FF" className="mx-auto" />
                      <h4 className="font-bold text-white">Become Dominant</h4>
                      <p className="text-sm text-neutral-400">In your vision for your life</p>
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
                    <a href="/pricing">
                      View Pricing
                    </a>
                  </Button>
                </Inline>

                <p className="text-lg text-neutral-300 max-w-2xl">
                  "If you're ready to ditch vibrational chaos, align with your clarity, and train your vibration 
                  to attract the life you choose, then <span className="text-[#39FF14] font-semibold">welcome home</span>."
                </p>

                <p className="text-sm text-neutral-500">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </Stack>
            </Cover>
        </section>

      </Stack>
  )
}