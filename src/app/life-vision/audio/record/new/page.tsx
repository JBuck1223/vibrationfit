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
import { ArrowRight, Mic, Heart, Brain, Sparkles, SkipForward, Rocket } from 'lucide-react'

// Placeholder video URL - replace with actual intro video
const AUDIO_RECORD_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function AudioRecordNewPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
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
      // Note: Step 8 (Record Voice) shares completion with Step 7 (audio_generated)
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, intensive_id, audio_generated, audio_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        setIntensiveId(checklist.intensive_id)
        // Step 8 is optional and shares completion status with Step 7
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
      router.push(`/life-vision/${activeVisionId}/audio/record`)
    } else {
      setError('Please create a Life Vision first.')
      setIsNavigating(false)
    }
  }

  const handleSkip = async () => {
    // Mark step as complete (skipped) and go to next step
    if (isIntensiveMode) {
      router.push('/intensive/dashboard')
    } else {
      router.push('/life-vision')
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
            stepTitle="Record Your Voice"
            completedAt={completedAt}
          />
        )}

        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 8 OF 14 (OPTIONAL)" : "THE LIFE I CHOOSE"}
          title="Record Your Voice"
          subtitle="Add the power of your own voice to your vision audio - the most personal and impactful way to program your subconscious."
        >

          <div>
            <OptimizedVideo
              url={AUDIO_RECORD_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleGetStarted}
                disabled={isNavigating || !activeVisionId}
              >
                {isNavigating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record My Voice
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip for Now
              </Button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Record Your Own Voice?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your subconscious mind responds most powerfully to your own voice. When you hear yourself 
              speaking your vision, your brain recognizes it as YOUR truth, not just words from an 
              external source. This creates deeper neural pathways and faster transformation.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              The Science of Self-Voice
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Brain className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Deeper Neural Encoding
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your brain has special neural circuits for processing your own voice. When you hear 
                  yourself speak, it activates multiple brain regions simultaneously - creating stronger, 
                  more lasting neural pathways.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Emotional Resonance
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your voice carries your emotional energy. When you record with feeling, that emotion 
                  is encoded into the audio - and you feel it every time you listen.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Identity Reinforcement
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Hearing yourself declare your vision reinforces your identity as someone who already 
                  lives this reality. It's the ultimate affirmation practice.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How It Works
            </Text>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">1. Choose Sections</span> - Record one category 
                at a time, or do your entire vision in one session.
              </p>
              <p>
                <span className="text-white font-semibold">2. Read & Record</span> - See your vision text 
                on screen while you record. Take your time, speak with feeling.
              </p>
              <p>
                <span className="text-white font-semibold">3. Review & Redo</span> - Listen back and 
                re-record any sections until they feel right.
              </p>
              <p>
                <span className="text-white font-semibold">4. Mix It Up</span> - In the next step, blend 
                your voice with AI voices, music, and frequencies.
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Record?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              This step is optional but highly recommended. Your own voice is the most powerful tool 
              for subconscious programming. Even recording just one or two key sections can make a 
              significant difference in your transformation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleGetStarted}
                disabled={isNavigating || !activeVisionId}
              >
                {isNavigating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip for Now
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
