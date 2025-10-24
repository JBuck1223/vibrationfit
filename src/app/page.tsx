'use client'

import React, { useState } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, ArrowRight, Star, Target,
  Brain, TrendingUp, Shield, Play, Award, Globe, Crown, Check, Clock, User,
  Headphones, Image, BookOpen, CalendarDays, Lock
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
  OfferStack,
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
                    <Button variant="primary" size="xl" className="mt-1 mb-4 md:mt-2">
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

        {/* Train → Tune → Track Mechanism */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-neutral-900 border-neutral-700 !mx-0 !w-full">
              <Stack gap="md" className="px-4">
                <h3 className="text-xl font-bold text-white text-center">
                  Train → Tune → Track
                </h3>
                <div className="space-y-4">
                  {/* Train */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#39FF14] mb-1">Train</div>
                    <div className="text-sm text-neutral-300 hidden md:block">
                      Complete profile + 84‑Q assessment + first Life Vision draft (with VIVA)
                    </div>
                    <div className="text-sm text-neutral-300 md:hidden">
                      Profile + 84‑Q + first Life Vision (VIVA)
                    </div>
                  </div>
                  
                  {/* Tune */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#39FF14] mb-1">Tune</div>
                    <div className="text-sm text-neutral-300 hidden md:block">
                      Refine your vision, build your Vision Board, start the Activation Protocol
                    </div>
                    <div className="text-sm text-neutral-300 md:hidden">
                      Refine vision, build board, Activation Protocol
                    </div>
                  </div>
                  
                  {/* Track */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#39FF14] mb-1">Track</div>
                    <div className="text-sm text-neutral-300 hidden md:block">
                      Journal daily, log iterations, watch streaks and wins grow
                    </div>
                    <div className="text-sm text-neutral-300 md:hidden">
                      Journal, iterations, streaks & wins
                    </div>
                  </div>
                </div>
              </Stack>
            </Card>
          </div>
        </section>

        {/* 72-Hour Activation Path */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 !mx-0 !w-full">
              <Stack gap="sm" className="p-2 md:p-8">
                <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
                  Your 72‑Hour Activation Path
                </h3>
                
                {/* Desktop Layout on Mobile for Comparison */}
                <div className="md:hidden mb-4">
                  <div className="relative">
                    {/* Gradient Connecting Line */}
                    <div className="absolute left-[10px] w-0.5 h-[98%] bg-gradient-to-b from-[#39FF14] via-[#00FFFF] via-[#BF00FF] to-[#FFFF00] top-[10px]"></div>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#39FF14] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <p className="text-base font-semibold text-white">Phase 1 — Foundation (0–24h)</p>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Profile — 70%+ complete</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Assessment — 84 Qs submitted</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Calibration — 1:1 call scheduled</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#00FFFF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <p className="text-base font-semibold text-white">Phase 2 — Vision Creation (24–48h)</p>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Life Vision — 12 categories drafted (with VIVA)</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Refine — polished with VIVA + tool</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#BF00FF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <p className="text-base font-semibold text-white">Phase 3 — Activation Tools (48–72h)</p>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Vision Audio — AM + PM tracks created</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Vision Board — 12 images added</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Journal x3 — Gratitude, Dots, Progress</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 border-2 border-[#FFFF00] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                        <div>
                          <p className="text-base font-semibold text-white">Phase 4 — Calibration & Launch</p>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Attend Calibration — 30‑min live call</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Activation Protocol — Execute custom Activation Plan</p>
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
                            <p className="text-base font-semibold text-white">Phase 1 — Foundation (Hours 0–24)</p>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Complete Profile — 70%+ completion</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Vibration Assessment — 84 questions submitted</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Book Calibration — 1:1 call scheduled</p>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#00FFFF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <p className="text-base font-semibold text-white">Phase 2 — Vision Creation (Hours 24–48)</p>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Build Life Vision — All 12 categories drafted with VIVA</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Refine Vision — Polished with VIVA + refinement tool</p>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#BF00FF] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <p className="text-base font-semibold text-white">Phase 3 — Activation Tools (Hours 48–72)</p>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Generate Vision Audio — AM + PM tracks created</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Create Vision Board — 12 images (1 per category) added</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Journal x3 — Gratitude, Connect‑the‑Dots, Progress entries logged</p>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 border-2 border-[#FFFF00] rounded-full mt-0.5 flex-shrink-0 relative z-10 bg-black"></div>
                          <div>
                            <p className="text-base font-semibold text-white">Phase 4 — Calibration & Launch</p>
                            <div className="space-y-1 mt-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Attend Calibration — Live 30‑minute session</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 border border-neutral-500 rounded flex-shrink-0 mt-0.5"></div>
                              <p className="text-sm text-neutral-400">Execute Activation Protocol — Your custom Activation Plan in place</p>
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
                        <h4 className="text-base font-semibold text-[#39FF14] mb-2 text-center">Foundation</h4>
                        <p className="text-sm text-neutral-400 text-center">Hours 0–24</p>
                      </div>
                      
                      {/* Phase 2 - Neon Cyan */}
                      <div className="bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 border-[#00FFFF]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#00FFFF] rounded-full flex items-center justify-center mb-3">
                          <span className="text-black font-bold text-lg">2</span>
                        </div>
                        <h4 className="text-base font-semibold text-[#00FFFF] mb-2 text-center">Vision Creation</h4>
                        <p className="text-sm text-neutral-400 text-center">Hours 24–48</p>
                      </div>
                      
                      {/* Phase 3 - Neon Purple */}
                      <div className="bg-gradient-to-br from-[#BF00FF]/10 to-[#BF00FF]/5 border-[#BF00FF]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#BF00FF] rounded-full flex items-center justify-center mb-3">
                          <span className="text-white font-bold text-lg">3</span>
                        </div>
                        <h4 className="text-base font-semibold text-[#BF00FF] mb-2 text-center">Activation Tools</h4>
                        <p className="text-sm text-neutral-400 text-center">Hours 48–72</p>
                      </div>
                      
                      {/* Phase 4 - Energy Yellow */}
                      <div className="bg-gradient-to-br from-[#FFFF00]/10 to-[#FFFF00]/5 border-[#FFFF00]/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                        <div className="w-10 h-10 bg-[#FFFF00] rounded-full flex items-center justify-center mb-3">
                          <span className="text-black font-bold text-lg">4</span>
                        </div>
                        <h4 className="text-base font-semibold text-[#FFFF00] mb-2 text-center">Calibration & Launch</h4>
                        <p className="text-sm text-neutral-400 text-center">Hours 72+</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="text-center my-4 md:mt-8 md:mb-4">
                  <Button variant="primary" size="xl">
                    Start the 72‑Hour Activation Intensive
                  </Button>
                </div>
                
                {/* Dashboard Preview Box */}
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">What you'll see on your dashboard:</h3>
                    <p className="text-sm text-neutral-400">Your personalized activation journey</p>
                  </div>
                  
                  {/* Dashboard Preview Container */}
                  <div className="bg-gradient-to-br from-[#1F1F1F] to-[#0F0F0F] rounded-2xl border-2 border-[#39FF14]/20 p-6 space-y-6">
                    
                    {/* Header Section */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full px-4 py-2 mb-4">
                        <Clock className="w-4 h-4 text-[#39FF14]" />
                        <span className="text-sm font-semibold text-[#39FF14]">Activation Intensive</span>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">Your Activation Journey</h4>
                      <p className="text-sm text-neutral-400">Current Phase: <span className="text-[#39FF14]">Foundation</span></p>
                    </div>
                    
                    {/* Countdown & Progress Card */}
                    <div className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border border-[#39FF14]/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time Remaining
                          </h5>
                          <p className="text-xl font-bold text-[#39FF14]">68h 23m 45s</p>
                          <p className="text-xs text-neutral-400 mt-1">Deadline: Dec 15, 2024 11:59 PM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-400 mb-1">Overall Progress</p>
                          <p className="text-2xl font-bold text-[#14B8A6]">25%</p>
                          <p className="text-xs text-neutral-400 mt-1">3 of 12 steps</p>
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
                          <p className="text-xs text-neutral-400">Set up your personal info, goals, and values</p>
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
                                <p className="text-xs font-semibold text-white">Complete Your Profile</p>
                                <p className="text-xs text-neutral-400">Set up your personal info, goals, and values</p>
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
                                <p className="text-xs font-semibold text-white">Take Vibration Assessment</p>
                                <p className="text-xs text-neutral-400">Discover your current vibration score</p>
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
                                <p className="text-xs font-semibold text-neutral-400">Book Your Calibration Call</p>
                                <p className="text-xs text-neutral-500">Schedule your 1-on-1 session</p>
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
                                <p className="text-xs font-semibold text-neutral-400">Build Your Life Vision</p>
                                <p className="text-xs text-neutral-500">Create your 12-category vision with VIVA</p>
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
                                <p className="text-xs font-semibold text-neutral-400">Refine Your Vision</p>
                                <p className="text-xs text-neutral-500">Polish with VIVA + refinement tool</p>
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
                      <p className="text-xs text-neutral-300 mb-2">
                        <strong className="text-[#39FF14]">Complete all phases</strong> to unlock your membership and continue your journey
                      </p>
                      <p className="text-xs text-neutral-400">
                        Your membership will automatically activate on Day 56
                      </p>
                    </div>
                  </div>
                  
                  {/* CTA Button Inside Dashboard */}
                  <div className="text-center pt-8 pb-2 md:pt-8 md:pb-0">
                    <Button variant="primary" size="xl">
                      Start the 72‑Hour Activation Intensive
                    </Button>
                  </div>
                </div>
              </Stack>
            </Card>
          </div>
        </section>

        {/* Offer Stack Section */}
        <section>
          <div className="w-full">
            <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/5 to-[#14B8A6]/5 border-[#39FF14]/30 !mx-0 !w-full">
              <Stack gap="md" className="p-2 md:p-8">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Exactly What You Get Today
                  </h2>
                  <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                    72‑Hour Activation Intensive + 8 weeks of Vision Pro included (auto‑starts Day 56 at your plan)
                  </p>
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
                
                <div className="text-center py-2 md:py-8">
                  <Button variant="primary" size="xl">
                    Start the 72‑Hour Activation Intensive
                  </Button>
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