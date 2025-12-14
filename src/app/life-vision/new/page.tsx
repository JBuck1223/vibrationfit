'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Container, Stack, PageHero } from '@/lib/design-system/components'
import { Sparkles } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export default function VIVALifeVisionLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGetStarted = async () => {
    setLoading(true)
    // Navigate to the first category page (fun, skipping forward)
    router.push('/life-vision/new/category/fun')
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Section */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Create Your Life Vision with VIVA"
          subtitle="Your Vibrational Intelligence Virtual Assistant is here to help you articulate and activate the life you choose. We'll guide you through 12 key life areas, capturing your voice and energy to create a unified vision."
        />


        {/* How It Works */}
        <Card>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <Card variant="elevated" hover className="border-2 border-neutral-700 hover:border-primary-500 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-primary-500">1</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">Record Your Reflections</h3>
                  <p className="text-xs md:text-sm text-neutral-400">
                    Speak naturally about each life area. Your authentic voice is transcribed and preserved.
                  </p>
                </div>
              </Card>

              {/* Step 2 */}
              <Card variant="elevated" hover className="border-2 border-neutral-700 hover:border-secondary-500 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary-500/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-secondary-500">2</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">AI Synthesis</h3>
                  <p className="text-xs md:text-sm text-neutral-400">
                    VIVA analyzes your profile, assessment, and recordings to craft emotionally intelligent summaries.
                  </p>
                </div>
              </Card>

              {/* Step 3 */}
              <Card variant="elevated" hover className="border-2 border-neutral-700 hover:border-accent-500 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl md:text-3xl font-bold text-accent-500">3</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2">Your Vision Unfolds</h3>
                  <p className="text-xs md:text-sm text-neutral-400">
                    Receive a beautifully written, vibrationally congruent Life Vision in your own words.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* What You'll Cover */}
        <Card>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">What You'll Explore</h2>
            
            {/* Pattern 2.5: Four Column Layout - 2x2 on mobile, 4x1 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {VISION_CATEGORIES.filter(cat => cat.order > 0 && cat.order < 13).map((category) => {
                const IconComponent = category.icon
                return (
                  <Card 
                    key={category.key}
                    variant="elevated" 
                    hover 
                    className="!px-2 !py-4 border-2 border-neutral-700 hover:border-[#00FFFF] transition-all duration-300"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-neutral-800/50">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1">{category.label}</h4>
                      <p className="text-xs text-neutral-400">{category.description}</p>
                    </div>
                  </Card>
                )
              })}
              
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGetStarted}
            loading={loading}
            className="w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Get Started
          </Button>
          <p className="text-xs md:text-sm text-neutral-400 mt-4">
          You can pause and resume anytime.
          </p>
        </div>
      </Stack>
    </Container>
  )
}
