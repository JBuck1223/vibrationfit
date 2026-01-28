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
import { ArrowRight, Music, Mic, Sparkles, Volume2, Rocket, Headphones } from 'lucide-react'

// Placeholder video URL - replace with actual intro video
const AUDIO_GENERATE_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function AudioGenerateNewPage() {
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
        .select('id, audio_generated, audio_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        if (checklist.audio_generated) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklist.audio_generated_at)
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
      router.push(`/life-vision/${activeVisionId}/audio/generate`)
    } else {
      setError('Please create a Life Vision first before generating audio.')
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
            stepTitle="Generate Vision Audio"
            completedAt={completedAt}
          />
        )}

        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 7 OF 14" : "THE LIFE I CHOOSE"}
          title="Generate Vision Audio"
          subtitle="Transform your Life Vision into powerful voice audio that speaks directly to your subconscious."
        >

          <div>
            <OptimizedVideo
              url={AUDIO_GENERATE_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isAlreadyCompleted ? (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push('/life-vision')}
                className="w-full md:w-auto"
              >
                <Headphones className="mr-2 h-4 w-4" />
                Listen to Audio
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
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Generate My Vision Audio
                  </>
                )}
              </Button>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {!activeVisionId && !error && !isAlreadyCompleted && (
              <p className="text-sm text-neutral-400">
                You need an active Life Vision to generate audio.{' '}
                <button 
                  onClick={() => router.push('/life-vision/new')}
                  className="text-primary-400 underline"
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Voice-Only Audio?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Voice-only audio is a clean, professional narration of your Life Vision using high-quality AI voices. 
              This is the foundation for all your vision audio - you can listen to it as-is, or later add 
              background music, frequencies, and even your own voice recordings.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Voice Options
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Volume2 className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Premium AI Voices
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Choose from voices like Nova (warm feminine), Onyx (deep masculine), Echo (neutral), 
                  and more. Each voice is designed to sound natural and engaging.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Per-Category Generation
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your vision is generated in sections (Forward, each life category, Conclusion) so you 
                  can easily regenerate specific parts without re-doing everything.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Music className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Unlimited Regenerations
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Not happy with a section? Regenerate it with a different voice or try different 
                  pacing until it feels perfect for you.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Generate?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Your Life Vision deserves to be heard. Generate your voice-only audio now, then optionally 
              enhance it with your own voice, music, and frequencies in the next steps.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
              {isAlreadyCompleted ? (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push('/life-vision')}
                  className="w-full md:w-auto"
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Listen to Audio
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
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Start Generating
                    </>
                  )}
                </Button>
              )}
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
