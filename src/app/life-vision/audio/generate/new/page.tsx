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
  IntensiveCompletionBanner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Volume2, Headphones, LayoutGrid, MousePointerClick, ListMusic, Music2, Layers } from 'lucide-react'

const AUDIO_GENERATE_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/07-audio-generation-1080p.mp4'
const AUDIO_GENERATE_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/07-audio-generation-thumb.0000000.jpg'

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
      <Stack gap="lg">
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

          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={AUDIO_GENERATE_VIDEO}
              thumbnailUrl={AUDIO_GENERATE_POSTER}
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
              Voice-only audio is a clean, professional narration of your Life Vision using high-quality AI voices. It's the foundation of your entire audio suite.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              You can:
            </p>
            <Stack gap="xs" className="text-sm md:text-base text-neutral-300 leading-relaxed pl-4">
              <p>• Listen as-is for daily activation</p>
              <p>• Use it in the Audio Mix step to add background music</p>
              <p>• After you complete the Intensive and unlock the full platform, layer in frequencies for maximum activation</p>
            </Stack>
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
                  Choose from multiple natural-sounding voices with different energies - calm, powerful, uplifting, and more - so you can pick the tone that feels best for this chapter of your life.
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You can preview each voice before you decide.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Your Audio Is Built
            </Text>
            <Stack gap="xl">
              {/* Step 1 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">1</div>
                  <Text size="sm" className="text-white font-semibold">
                    Select Voice
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Choose the AI voice that feels best for this version of you, then click Preview Voice to hear a sample.
                </p>
              </Stack>

              {/* Step 2 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">2</div>
                  <Text size="sm" className="text-white font-semibold">
                    Select Sections
                  </Text>
                </Inline>
                <Stack gap="md" className="pl-8">
                  <Stack gap="xs">
                    <Inline gap="sm" className="items-center">
                      <LayoutGrid className="h-4 w-4 text-[#5EC49A]" />
                      <p className="text-sm text-white font-medium">All 14 Sections</p>
                    </Inline>
                    <p className="text-sm text-neutral-300 leading-relaxed pl-6">
                      Generate audio for your entire Life Vision at once: Forward, all 12 life categories, and your Conclusion.
                    </p>
                  </Stack>
                  <Stack gap="xs">
                    <Inline gap="sm" className="items-center">
                      <MousePointerClick className="h-4 w-4 text-[#2DD4BF]" />
                      <p className="text-sm text-white font-medium">Select Specific</p>
                    </Inline>
                    <p className="text-sm text-neutral-300 leading-relaxed pl-6">
                      Or, create focused sets by choosing only certain sections (like "Health + Money" or "Work Focus") without re-doing everything.
                    </p>
                  </Stack>
                </Stack>
              </Stack>

              {/* Step 3 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">3</div>
                  <Text size="sm" className="text-white font-semibold">
                    Output Format
                  </Text>
                </Inline>
                <Stack gap="md" className="pl-8">
                  <Stack gap="xs">
                    <Inline gap="sm" className="items-center">
                      <ListMusic className="h-4 w-4 text-[#8B5CF6]" />
                      <p className="text-sm text-white font-medium">Individual Sections</p>
                    </Inline>
                    <p className="text-sm text-neutral-300 leading-relaxed pl-6">
                      Separate track for each section of your vision.
                    </p>
                  </Stack>
                  <Stack gap="xs">
                    <Inline gap="sm" className="items-center">
                      <Music2 className="h-4 w-4 text-[#FFB701]" />
                      <p className="text-sm text-white font-medium">Combined Full Track</p>
                    </Inline>
                    <p className="text-sm text-neutral-300 leading-relaxed pl-6">
                      One continuous track with all sections in order (great for deep dives and sleep).
                    </p>
                  </Stack>
                  <Stack gap="xs">
                    <Inline gap="sm" className="items-center">
                      <Layers className="h-4 w-4 text-[#39FF14]" />
                      <p className="text-sm text-white font-medium">Both (Recommended)</p>
                    </Inline>
                    <p className="text-sm text-neutral-300 leading-relaxed pl-6">
                      Individual tracks plus a full combined track so you can use whichever fits the moment.
                    </p>
                  </Stack>
                </Stack>
              </Stack>

              {/* Final instruction */}
              <p className="text-sm text-neutral-300 leading-relaxed">
                When you've made your selections, click <span className="text-white font-medium">Generate All 14 Sections</span> (or your selected sections) and VIVA will start generating your Vision Audio.
              </p>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
