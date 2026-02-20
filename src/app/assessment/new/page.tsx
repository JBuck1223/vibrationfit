'use client'

import { useState, useEffect } from 'react'
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
  IntensiveCompletionBanner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Target, BarChart, TrendingUp } from 'lucide-react'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'

const ASSESSMENT_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/04-assessment-1080p.mp4'

export default function AssessmentNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isIntensiveCompleted, setIsIntensiveCompleted] = useState(false)
  const [intensiveCompletedAt, setIntensiveCompletedAt] = useState<string | null>(null)
  const [checkingIntensive, setCheckingIntensive] = useState(true)

  useEffect(() => {
    checkIntensiveCompletion()
  }, [])

  const checkIntensiveCompletion = async () => {
    try {
      // Use centralized intensive check (source of truth: intensive_checklist.status)
      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIsIntensiveMode(true)
        
        // Check if assessment step is completed (data is already in intensiveData)
        if (intensiveData.assessment_completed) {
          setIsIntensiveCompleted(true)
          setIntensiveCompletedAt(intensiveData.assessment_completed_at || intensiveData.created_at)
        }
      }
    } catch (error) {
      console.error('Error checking intensive completion:', error)
    } finally {
      setCheckingIntensive(false)
    }
  }

  const handleCreateAssessment = async () => {
    setIsCreating(true)
    setErrorMessage(null)

    try {
      // First, get the user's active profile to use as the profile_version_id
      const profileResponse = await fetch('/api/profile')
      if (!profileResponse.ok) {
        throw new Error('Failed to get profile. Please create a profile first.')
      }
      
      const profileData = await profileResponse.json()
      
      if (!profileData.profile?.id) {
        throw new Error('No active profile found. Please create a profile first.')
      }
      
      // Create new assessment with the active profile
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_version_id: profileData.profile.id,
          assessment_version: 1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create assessment' }))
        throw new Error(errorData.error || 'Failed to create assessment')
      }

      const data = await response.json()
      
      if (data.assessment?.id) {
        router.push(`/assessment/${data.assessment.id}/in-progress`)
      } else {
        throw new Error('No assessment ID returned from API')
      }
    } catch (err) {
      console.error('Error creating assessment:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create assessment')
    } finally {
      setIsCreating(false)
    }
  }

  // Show loading spinner while checking intensive status
  if (checkingIntensive) {
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
        {/* Intensive Completion Banner */}
        {(isIntensiveMode || isIntensiveCompleted) && isIntensiveCompleted && intensiveCompletedAt && (
          <IntensiveCompletionBanner
            stepTitle="Vibration Assessment"
            completedAt={intensiveCompletedAt}
          />
        )}

        {/* Hero with Video */}
        <PageHero
          eyebrow={isIntensiveMode || isIntensiveCompleted ? "ACTIVATION INTENSIVE • STEP 4 OF 14" : undefined}
          title="Welcome to Your Vibration Assessment"
          subtitle="Discover where you stand in each area of your life and unlock personalized insights."
        >
          {/* Video */}
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={ASSESSMENT_INTRO_VIDEO}
              context="single"
              className="w-full"
            />
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isIntensiveMode ? (
              // Intensive mode: Start Assessment button
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleCreateAssessment}
                disabled={isCreating}
                className="w-full md:w-auto"
              >
                {isCreating ? (
                  <>
                    <Spinner variant="primary" size="sm" className="mr-2" />
                    Starting Assessment...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Start Assessment
                  </>
                )}
              </Button>
            ) : (
              // Non-intensive mode: Assessment Hub button
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push('/assessment')}
                className="w-full md:w-auto"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Assessment Hub
              </Button>
            )}
            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}
          </div>
        </PageHero>

        {/* What is the Assessment? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is the Assessment?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The Vibration Fit Assessment is a comprehensive evaluation of your current state across all 12 life categories.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              In about 15-20 minutes and 84 questions, you'll get a clear read on where you're already above the Green Line (aligned and thriving) and where you have growth opportunities.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              This isn't a fluffy quiz. It's structured data that powers the rest of your 72-Hour Activation.
            </p>
          </Stack>
        </Card>

        {/* What You'll See */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll See
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Vibration Scores
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Every question is scored 1-5 and rolled up into a score for each of the 12 categories. You'll see:
                </p>
                <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed pl-6">
                  <p>• Which areas are <span className="text-[#39FF14] font-medium">Above the Green Line</span> (aligned / thriving)</p>
                  <p>• Which are <span className="text-[#FFB701] font-medium">In Transition</span> (shifting / neutral)</p>
                  <p>• Which are <span className="text-[#FF0040] font-medium">Below the Green Line</span> (growth opportunities)</p>
                </Stack>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <BarChart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Category Breakdown
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You'll get a ranked breakdown of all 12 categories, plus a visual chart so you can see your alignment pattern at a glance.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <TrendingUp className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Overall Vibration Score
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  All 12 categories combine into one overall percentage that reflects your current "big picture" vibration.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* How the Questions Work */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How the Questions Work
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Questions are designed to reveal your real, lived experience, not your ideal:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed pl-4">
              <p>
                • <span className="text-white font-semibold">Gut reactions</span> - "What's your first thought?"
              </p>
              <p>
                • <span className="text-white font-semibold">Body sensations</span> - "What happens in your body?"
              </p>
              <p>
                • <span className="text-white font-semibold">Honest feelings</span> - "Where are you NOW, not where you want to be?"
              </p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Some questions adapt based on your profile (for example, parents vs non-parents, single vs partnered, business owner vs employee) so what you see actually fits your life.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Answer based on your average experience over the last few weeks, not a random bad day or a highlight weekend.
            </p>
          </Stack>
        </Card>

        {/* Why This Step Matters */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why This Step Matters
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The assessment is a key part of your 72-Hour Activation because it gives you:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed pl-4">
              <p>
                • <span className="text-white font-semibold">Baseline Awareness</span> - A clear "before" picture of where you're currently aligned and where you're not.
              </p>
              <p>
                • <span className="text-white font-semibold">Clarity Without Judgment</span> - "Below Green Line" simply means growth opportunity, not failure.
              </p>
              <p>
                • <span className="text-white font-semibold">Focus</span> - You'll know exactly which areas are strongest, which are in transition, and which are asking for more attention.
              </p>
              <p>
                • <span className="text-white font-semibold">Fuel for Your Vision</span> - These scores and patterns feed directly into how VIVA helps you craft your personalized Life Vision in the next step.
              </p>
            </Stack>
          </Stack>
        </Card>

      </Stack>
    </Container>
  )
}
