'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  PageHero,
  Spinner,
  Badge,
  IntensiveCompletionBanner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Sliders, Music, Brain, Waves, Headphones, Rocket } from 'lucide-react'

// Placeholder video URL - replace with actual intro video
const AUDIO_MIX_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function AudioMixNewPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    checkActiveVision()
  }, [])

  const checkActiveVision = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if in intensive mode and step completion
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, audios_generated, audios_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        if (checklist.audios_generated) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklist.audios_generated_at)
        }
      }

      // Find active vision
      const { data: activeVision } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .is('household_id', null)
        .maybeSingle()

      if (activeVision) {
        setActiveVisionId(activeVision.id)
      }
    } catch (err) {
      console.error('Error checking vision:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = async () => {
    setIsNavigating(true)
    setError(null)

    if (activeVisionId) {
      router.push(`/life-vision/${activeVisionId}/audio/mix`)
    } else {
      setError('Please create a Life Vision first.')
      setIsNavigating(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Completion Banner - Shows when step is already complete in intensive mode */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Create Your Audio Mix"
            completedAt={completedAt}
          />
        )}

        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 9 OF 14" : "THE LIFE I CHOOSE"}
          title="Create Your Audio Mix"
          subtitle="Blend your vision audio with ambient soundscapes and healing frequencies for the ultimate manifestation experience."
        >

          <div>
            <OptimizedVideo
              url={AUDIO_MIX_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleGetStarted}
              disabled={isNavigating || !activeVisionId}
              className="w-full md:w-auto"
            >
              {isNavigating ? (
                <>
                  <Spinner variant="primary" size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Sliders className="mr-2 h-4 w-4" />
                  Create My Audio Mix
                </>
              )}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {!activeVisionId && !error && (
              <p className="text-sm text-neutral-400">
                You need an active Life Vision with generated audio to create a mix.
              </p>
            )}
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Audio Mixing?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Audio mixing takes your generated voice audio and layers it with background soundscapes 
              and healing frequencies. The result is a rich, immersive audio experience designed for 
              deep relaxation and subconscious programming - perfect for morning rituals or sleep sessions.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Mix Options
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Music className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Background Soundscapes
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Choose from ambient tracks: ocean waves, rain, forest sounds, white/pink/brown noise, 
                  or curated music. Different backgrounds create different moods - energizing for morning, 
                  calming for sleep.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Brain className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Solfeggio Frequencies
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Add ancient healing frequencies like 528Hz (transformation), 396Hz (liberation from fear), 
                  or 741Hz (awakening intuition). These subtle frequencies work on your energy body.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Waves className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Binaural Beats
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Entrain your brainwaves with binaural beats. Alpha waves (8-14Hz) for relaxed focus, 
                  Theta waves (4-8Hz) for deep meditation, or Delta (0.5-4Hz) for sleep programming.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Headphones className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Custom Mix Ratios
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Control the balance between voice and background. 90/10 for clear voice, 50/50 for 
                  balanced meditation, or 30/70 for sleep sessions where the message becomes subliminal.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Recommended Mixes
            </Text>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">Morning Activation</span> - Voice at 90%, 
                uplifting music, Alpha waves. Clear, focused, energizing.
              </p>
              <p>
                <span className="text-white font-semibold">Deep Meditation</span> - Voice at 50%, 
                ambient soundscape, Theta waves. Relaxed absorption.
              </p>
              <p>
                <span className="text-white font-semibold">Sleep Programming</span> - Voice at 30%, 
                ocean waves or rain, Delta waves. Subliminal overnight reprogramming.
              </p>
              <p>
                <span className="text-white font-semibold">Focus Session</span> - Voice at 70%, 
                white noise, Alpha waves. Great for working or exercising.
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Mix?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Create multiple mixes for different times of day and purposes. Your transformation toolkit 
              is unlimited - experiment to find what resonates most deeply with you.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleGetStarted}
                disabled={isNavigating || !activeVisionId}
                className="w-full md:w-auto"
              >
                {isNavigating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sliders className="mr-2 h-4 w-4" />
                    Start Mixing
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
