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
import { ArrowRight, Sliders, Music, Brain, Waves, Headphones, Rocket, Volume2, Sunrise, Focus, Moon, Zap } from 'lucide-react'

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
      <Stack gap="lg">
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
          subtitle="Blend your vision audio with immersive soundscapes to design the soundtrack for the life you're creating. Advanced frequency enhancements unlock after you complete the Intensive."
        >

          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={AUDIO_MIX_VIDEO}
              context="single"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isAlreadyCompleted ? (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push(activeVisionId ? `/life-vision/${activeVisionId}/audio/sets` : '/life-vision')}
                className="w-full md:w-auto"
              >
                <Headphones className="mr-2 h-4 w-4" />
                Listen to Audio Sets
              </Button>
            ) : (
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
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {!activeVisionId && !error && !isAlreadyCompleted && (
              <p className="text-sm text-neutral-400">
                You need an active Life Vision with generated audio to create a mix.
              </p>
            )}
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What Is Audio Mixing?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Audio mixing takes your vision voice tracks and layers them with background soundscapes (and, when available, frequency enhancements). The result is a rich, immersive audio experience you can use for morning activation, focused work, category-specific activation, meditation, and sleep.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              You're designing the soundtrack for the life you're creating.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Mix Options
            </Text>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <Music className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Background Soundscapes</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Choose from curated tracks like ocean waves, rain, forest sounds, ambient pads, and music. Different backgrounds create different moods – energizing for morning, calming for meditation, soothing for sleep.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Sliders className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Custom Mix Ratios</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Control the balance between your voice and the background:
                  </p>
                  <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed mt-2">
                    <p><span className="text-white font-medium">Voice‑Focused</span> – Your voice is front and center with subtle music underneath</p>
                    <p><span className="text-white font-medium">Balanced</span> – Equal blend of voice and background for meditation or reflection</p>
                    <p><span className="text-white font-medium">Background‑Heavy</span> – Softer, more subliminal voice for winding down and sleep</p>
                  </Stack>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Zap className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Section Flexibility</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Mix all available sections into one full track, or create focused sets (like "Health + Money" or "Work Focus") for specific moments of your day.
                  </p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Advanced Frequency Enhancements
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              <span className="text-white font-medium">(Available as part of the Advanced Audio Suite after you complete the Intensive)</span>
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              When you've graduated from the 72‑Hour Activation Intensive and unlocked the Advanced Audio Suite, you'll also be able to:
            </p>
            <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed">
              <p>• Add healing binaural frequencies (like solfeggio tones) on top of your mixes</p>
              <p>• Layer in brainwave‑supporting sounds for sleep, meditation, or deep focus</p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              These enhancements sit underneath your music and voice to deepen the activation effect.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              If you already see frequency options in your mixer, that means your Advanced Audio Suite is unlocked and ready to use.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Recommended Use Cases
            </Text>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <Sunrise className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Morning Activation</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Voice‑focused mix with uplifting or cinematic music – clear, energizing, forward‑moving.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Focus className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Deep Focus</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Balanced mix with steady ambient or soft beats – ideal for work, study, or the gym.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Moon className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Evening Wind‑Down / Sleep</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Background‑heavy mix with gentle nature sounds – perfect for relaxing, journaling, or drifting off.
                  </p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Mix?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Start by creating a few mixes for different times of day. Experiment with backgrounds and ratios, and notice which ones your body loves most. As you progress and unlock more advanced features, you can keep evolving your audio to match the level you're playing at.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
              {isAlreadyCompleted ? (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push(activeVisionId ? `/life-vision/${activeVisionId}/audio/sets` : '/life-vision')}
                  className="w-full md:w-auto"
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Listen to Audio Sets
                </Button>
              ) : (
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
              )}
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
