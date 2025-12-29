'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  PageHero,
  Spinner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Music, Headphones, Sparkles, Waves, Brain, Volume2 } from 'lucide-react'

// Placeholder video URL - replace with actual audio intro video
const AUDIO_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function AudioNewPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleGetStarted = () => {
    setIsNavigating(true)
    // Redirect to life vision dashboard where they can select a vision for audio
    router.push('/life-vision')
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Centered Hero Title */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Welcome to Life Vision Audio"
          subtitle="Transform your Life Vision into powerful audio that rewires your subconscious mind."
        >
          {/* Video */}
          <div>
            <OptimizedVideo
              url={AUDIO_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleGetStarted}
              disabled={isNavigating}
              className="w-full md:w-auto"
            >
              {isNavigating ? (
                <>
                  <Spinner variant="primary" size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Get Started with Audio
                </>
              )}
            </Button>
          </div>
        </PageHero>

        {/* What is Life Vision Audio? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Life Vision Audio?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Life Vision Audio transforms your written Life Vision into a personalized audio experience that speaks directly to your subconscious mind. By listening to your vision in your own voice (or a voice of your choice), combined with ambient soundscapes and binaural frequencies, you create new neural pathways that align your thoughts, feelings, and actions with your desired reality.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              This isn't just reading your goals—it's a scientifically-designed audio experience that leverages neuroplasticity, repetition, and emotional resonance to create lasting change at the subconscious level.
            </p>
          </Stack>
        </Card>

        {/* What's Included */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What's Included
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Music className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Voice Options
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Choose from a variety of AI-generated voices (Nova, Alloy, Echo, etc.) or record your vision in your own voice. Each voice option is carefully designed to sound natural, warm, and engaging—like a trusted guide speaking directly to you.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Waves className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Background Soundscapes
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Select from ambient tracks including ocean waves, rain, white/pink/brown noise, and curated music. These backgrounds enhance relaxation and create the optimal mental state for subconscious absorption. Choose different mixes for different times of day—energizing for morning, calming for sleep.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Brain className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Binaural Frequencies (Optional)
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Add Solfeggio frequencies and binaural beats to your audio. These subtle frequency layers (like 528Hz for healing or Theta waves for deep relaxation) help entrain your brainwaves to optimal states for manifestation, healing, and transformation.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Volume2 className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Custom Mix Ratios
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Control the balance between your voice and background audio. Go 90/10 for clear, voice-focused listening during active hours, or 50/50 for a balanced, meditative experience. Experiment to find what resonates with you.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* How to Use Your Audio */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How to Use Your Life Vision Audio
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              For maximum impact, we recommend listening to your Life Vision audio daily—ideally twice per day:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Morning</span> - Listen within the first hour of waking to set your intention and prime your subconscious for the day ahead. Use an energizing mix (80/20 voice-to-background).
              </p>
              <p>
                • <span className="text-white font-semibold">Evening/Before Sleep</span> - Listen as you fall asleep to program your subconscious during the theta brainwave state. Use a calming mix (50/50 or 30/70) with relaxing backgrounds.
              </p>
              <p>
                • <span className="text-white font-semibold">During Activities</span> - Play in the background while working, exercising, or commuting. Your subconscious absorbs the message even when you're not actively focused.
              </p>
              <p>
                • <span className="text-white font-semibold">Consistency is Key</span> - The magic happens with repetition. Aim for 21-30 days of consistent daily listening to create new neural pathways and solidify your new identity.
              </p>
            </Stack>
          </Stack>
        </Card>

        {/* The Science Behind It */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              The Science Behind Life Vision Audio
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Life Vision Audio leverages three powerful neuroscience principles:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">1. Neuroplasticity</span> - Your brain creates new neural pathways through repetition. By consistently exposing your mind to your desired reality, you literally rewire your brain to think, feel, and act in alignment with your vision.
              </p>
              <p>
                <span className="text-white font-semibold">2. Subconscious Programming</span> - 95% of your thoughts and behaviors are driven by your subconscious mind. Audio bypasses your conscious filters and speaks directly to the part of you that controls your automatic patterns and beliefs.
              </p>
              <p>
                <span className="text-white font-semibold">3. Frequency Resonance</span> - Everything vibrates at a frequency, including your thoughts and emotions. Binaural beats and Solfeggio frequencies help entrain your brainwaves to optimal states for healing, manifestation, and transformation.
              </p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed mt-4">
              When combined with your written Life Vision (which engages your conscious mind), audio creates a complete transformation system that works on both conscious and subconscious levels simultaneously.
            </p>
          </Stack>
        </Card>

        {/* Ready to Begin */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Create Your Audio?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              First, you'll need an active Life Vision. If you don't have one yet, we'll help you create it. Then you can generate unlimited audio versions with different voices, backgrounds, and frequencies to support every aspect of your transformation journey.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleGetStarted}
                disabled={isNavigating}
                className="w-full md:w-auto"
              >
                {isNavigating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Start Creating Your Audio
                  </>
                )}
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

