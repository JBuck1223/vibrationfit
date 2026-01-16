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
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { 
  ArrowRight, 
  Rocket, 
  Target, 
  Sparkles, 
  Clock,
  CheckCircle,
  Zap
} from 'lucide-react'

// Placeholder video URL - user will replace this later
const INTENSIVE_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function IntensiveWelcomePage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasActiveIntensive, setHasActiveIntensive] = useState<boolean | null>(null)

  useEffect(() => {
    checkIntensiveStatus()
  }, [])

  const checkIntensiveStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user has an active intensive
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        // User already has an active intensive, redirect to dashboard
        router.push('/intensive/dashboard')
        return
      }

      setHasActiveIntensive(false)
    } catch (err) {
      console.error('Error checking intensive status:', err)
      setHasActiveIntensive(false)
    }
  }

  const handleStartIntensive = async () => {
    setIsStarting(true)
    setError(null)

    try {
      // Redirect to the intensive dashboard to begin the journey
      router.push('/intensive/dashboard')
    } catch (err) {
      console.error('Error starting intensive:', err)
      setError(err instanceof Error ? err.message : 'Failed to start intensive')
      setIsStarting(false)
    }
  }

  if (hasActiveIntensive === null) {
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
        {/* Centered Hero Title */}
        <PageHero
          eyebrow="ACTIVATION INTENSIVE"
          title="Welcome to Your Transformation"
          subtitle="Your 14-step journey to creating and activating the life you truly desire."
        >
          {/* Video */}
          <div>
            <OptimizedVideo
              url={INTENSIVE_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleStartIntensive}
              disabled={isStarting}
              className="w-full md:w-auto"
            >
              {isStarting ? (
                <>
                  <Spinner variant="primary" size="sm" className="mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Start My Activation Intensive
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        </PageHero>

        {/* What is the Activation Intensive? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is the Activation Intensive?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The Activation Intensive is a guided, step-by-step process designed to help you clarify your vision, create powerful activation tools, and establish the daily practices that will transform your life.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Over 14 carefully sequenced steps, you'll build everything you need to become a vibrational match to the life you truly desire. Each step unlocks the next, ensuring you have a solid foundation before moving forward.
            </p>
          </Stack>
        </Card>

        {/* Your Journey */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Your Journey
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Foundation Phase
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Set up your account, complete your baseline intake, build your profile, and take your vibration assessment. This establishes where you are right now.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Vision Creation Phase
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Work with VIVA to create your comprehensive Life Vision across all 12 categories of life, then refine it until it feels absolutely perfect.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Zap className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Audio Phase
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Generate personalized audio versions of your vision, optionally record sections in your own voice, and create custom audio mixes for daily listening.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <CheckCircle className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Activation Phase
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Build your vision board, start your journal practice, schedule your calibration call, and complete your custom activation protocol to unlock the full platform.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* What You'll Create */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Create
            </Text>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">Complete Profile</span> - A comprehensive snapshot of where you are across all 12 life categories.
              </p>
              <p>
                <span className="text-white font-semibold">Vibration Assessment</span> - Deep insights into your current vibrational state and patterns.
              </p>
              <p>
                <span className="text-white font-semibold">Life Vision</span> - A detailed, emotionally-charged vision of your ideal life across all categories.
              </p>
              <p>
                <span className="text-white font-semibold">Vision Audio</span> - Personalized audio recordings to listen to daily and program your subconscious.
              </p>
              <p>
                <span className="text-white font-semibold">Vision Board</span> - A visual representation of your vision with images for each life category.
              </p>
              <p>
                <span className="text-white font-semibold">Journal Practice</span> - An established habit of conscious creation through daily reflection.
              </p>
              <p>
                <span className="text-white font-semibold">Activation Protocol</span> - Your personalized daily practice for living above the Green Line.
              </p>
            </Stack>
          </Stack>
        </Card>

        {/* Ready to Begin */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Begin?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Your transformation starts now. Take it one step at a time - each step builds on the last. There's no rush, but there's also no time like the present to start creating the life you truly desire.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleStartIntensive}
                disabled={isStarting}
                className="w-full md:w-auto"
              >
                {isStarting ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Start My Activation Intensive
                  </>
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
