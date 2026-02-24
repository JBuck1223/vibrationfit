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
import { ArrowRight, Mic, Heart, Brain, Sparkles, SkipForward, Rocket, Headphones } from 'lucide-react'

const AUDIO_RECORD_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/08-audio-record-1080p.mp4'
const AUDIO_RECORD_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/08-audio-record-thumb.0000000.jpg'

export default function AudioRecordNewPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [wasSkipped, setWasSkipped] = useState(false) // Track if completed via skip vs actual recording
  const [hasActualRecordings, setHasActualRecordings] = useState(false)
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

      // Check if in intensive mode
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, intensive_id, audio_generated, audio_generated_at, voice_recording_skipped, voice_recording_skipped_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        setIntensiveId(checklist.intensive_id)
        
        // Check if user already skipped this step
        if (checklist.voice_recording_skipped) {
          setIsAlreadyCompleted(true)
          setWasSkipped(true)
          setCompletedAt(checklist.voice_recording_skipped_at)
        }
      }

      // Check for actual user voice recordings (Step 8 is complete if user recorded OR skipped)
      const { count: voiceRecordingCount } = await supabase
        .from('audio_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('voice_id', 'user_voice')
        .eq('status', 'completed')
      
      if ((voiceRecordingCount || 0) > 0) {
        setIsAlreadyCompleted(true)
        setHasActualRecordings(true)
        setWasSkipped(false) // Override skipped if they have actual recordings
        // Use the most recent recording date as completion date
        const { data: latestRecording } = await supabase
          .from('audio_tracks')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('voice_id', 'user_voice')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (latestRecording) {
          setCompletedAt(latestRecording.created_at)
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
    // Mark Step 8 as skipped in intensive checklist
    if (isIntensiveMode && intensiveId) {
      try {
        const supabase = createClient()
        await supabase
          .from('intensive_checklist')
          .update({
            voice_recording_skipped: true,
            voice_recording_skipped_at: new Date().toISOString()
          })
          .eq('intensive_id', intensiveId)
      } catch (err) {
        console.error('Error marking step as skipped:', err)
      }
      router.push('/life-vision/audio/mix/new')
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
      <Stack gap="lg">
        {/* Completion Banner - Shows only when user has actual recordings (not just skipped) */}
        {isIntensiveMode && hasActualRecordings && completedAt && (
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

          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={AUDIO_RECORD_VIDEO}
              thumbnailUrl={AUDIO_RECORD_POSTER}
              context="single"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {hasActualRecordings ? (
              // User has actual recordings - show Listen button
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push(activeVisionId ? `/life-vision/${activeVisionId}/audio/sets` : '/life-vision')}
              >
                <Headphones className="mr-2 h-4 w-4" />
                Listen to Audio Sets
              </Button>
            ) : (
              // User hasn't recorded (or only skipped) - show Record and Skip options
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
                {!wasSkipped && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSkip}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip for Now
                  </Button>
                )}
              </div>
            )}
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
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How It Works
            </Text>
            <Stack gap="xl">
              {/* Step 1 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">1</div>
                  <Text size="sm" className="text-white font-semibold">
                    Choose Sections
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Record one section at a time – Forward, each life category, and your Conclusion – at your own pace.
                </p>
              </Stack>

              {/* Step 2 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">2</div>
                  <Text size="sm" className="text-white font-semibold">
                    Read & Record
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Your written vision appears on screen as your script. Hit "Start Recording," speak naturally, and let yourself feel it.
                </p>
              </Stack>

              {/* Step 3 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">3</div>
                  <Text size="sm" className="text-white font-semibold">
                    Fix Mistakes Without Starting Over
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  After recording, you can trim out parts you don't like – false starts, restarts, awkward pauses – without re-doing the whole thing. Save it when it feels good enough.
                </p>
              </Stack>

              {/* Step 4 */}
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">4</div>
                  <Text size="sm" className="text-white font-semibold">
                    Use It in Your Mixes
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  In the next step, you'll be able to create Audio Mixes using your voice recordings with background music. After you complete the Intensive and unlock the full platform, you can also add frequencies for deeper activation.
                </p>
              </Stack>
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
              {hasActualRecordings ? (
                // User has actual recordings - show Listen button
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push(activeVisionId ? `/life-vision/${activeVisionId}/audio/sets` : '/life-vision')}
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Listen to Audio Sets
                </Button>
              ) : (
                // User hasn't recorded (or only skipped) - show Record and Skip options
                <>
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
                  {!wasSkipped && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSkip}
                    >
                      <SkipForward className="mr-2 h-4 w-4" />
                      Skip for Now
                    </Button>
                  )}
                </>
              )}
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
