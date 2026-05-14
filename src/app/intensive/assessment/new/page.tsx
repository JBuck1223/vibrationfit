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
  Spinner,
} from '@/lib/design-system/components'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Target, BarChart, TrendingUp } from 'lucide-react'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import { fetchAssessments } from '@/lib/services/assessmentService'

const ASSESSMENT_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/04-assessment-1080p.mp4'
const ASSESSMENT_INTRO_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/04-assessment-thumb.0000000.jpg'

export default function IntensiveAssessmentNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isIntensiveCompleted, setIsIntensiveCompleted] = useState(false)
  const [intensiveCompletedAt, setIntensiveCompletedAt] = useState<string | null>(null)
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()
  const [checkingIntensive, setCheckingIntensive] = useState(true)
  const [assessmentInProgressId, setAssessmentInProgressId] = useState<string | null>(null)
  const [assessmentLatestCompletedId, setAssessmentLatestCompletedId] = useState<string | null>(null)

  useEffect(() => {
    if (isIntensiveCompleted && intensiveCompletedAt) setStepCompleted(intensiveCompletedAt)
    return () => setStepCompleted(null)
  }, [isIntensiveCompleted, intensiveCompletedAt, setStepCompleted])

  useEffect(() => {
    checkIntensiveAndAssessments()
  }, [])

  const checkIntensiveAndAssessments = async () => {
    try {
      const intensiveData = await getActiveIntensiveClient()
      const { assessments } = await fetchAssessments()

      if (intensiveData) {
        if (intensiveData.assessment_completed) {
          setIsIntensiveCompleted(true)
          setIntensiveCompletedAt(intensiveData.assessment_completed_at || intensiveData.created_at)
        }
      }

      if (assessments?.length) {
        const inProgress = assessments.find((a) => a.status === 'in_progress')
        const completedList = assessments.filter((a) => a.status === 'completed') || []
        const sortedCompleted = [...completedList].sort((a, b) => {
          const tA = a.completed_at ? new Date(a.completed_at).getTime() : 0
          const tB = b.completed_at ? new Date(b.completed_at).getTime() : 0
          return tB - tA
        })
        setAssessmentInProgressId(inProgress?.id ?? null)
        setAssessmentLatestCompletedId(sortedCompleted[0]?.id ?? null)
      }
    } catch (error) {
      console.error('Error checking intensive/assessments:', error)
    } finally {
      setCheckingIntensive(false)
    }
  }

  const handleCreateAssessment = async () => {
    setIsCreating(true)
    setErrorMessage(null)

    try {
      const profileResponse = await fetch('/api/profile')
      if (!profileResponse.ok) {
        throw new Error('Failed to get profile. Please create a profile first.')
      }
      
      const profileData = await profileResponse.json()
      
      if (!profileData.profile?.id) {
        throw new Error('No active profile found. Please create a profile first.')
      }
      
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
        router.push(`/intensive/assessment/${data.assessment.id}/in-progress`)
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
        {/* Video */}
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={ASSESSMENT_INTRO_VIDEO}
            thumbnailUrl={ASSESSMENT_INTRO_POSTER}
            context="single"
            className="w-full"
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
          {assessmentLatestCompletedId ? (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => router.push(`/intensive/assessment/${assessmentLatestCompletedId}/results`)}
              className="w-full md:w-auto"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              View Results
            </Button>
          ) : assessmentInProgressId ? (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => router.push(`/intensive/assessment/${assessmentInProgressId}/in-progress`)}
              className="w-full md:w-auto"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue Assessment
            </Button>
          ) : (
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
          )}
          {errorMessage && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}
        </div>

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
              In about 15-20 minutes and 84 questions, you&apos;ll get a clear read on where you&apos;re already above the Green Line (aligned and thriving) and where you have growth opportunities.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              This isn&apos;t a fluffy quiz. It&apos;s structured data that powers the rest of your 72-Hour Activation.
            </p>
          </Stack>
        </Card>

        {/* What You'll See */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You&apos;ll See
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
                  Every question is scored 1-5 and rolled up into a score for each of the 12 categories. You&apos;ll see:
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
                  You&apos;ll get a ranked breakdown of all 12 categories, plus a visual chart so you can see your alignment pattern at a glance.
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
                  All 12 categories combine into one overall percentage that reflects your current &quot;big picture&quot; vibration.
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
                • <span className="text-white font-semibold">Gut reactions</span> - &quot;What&apos;s your first thought?&quot;
              </p>
              <p>
                • <span className="text-white font-semibold">Body sensations</span> - &quot;What happens in your body?&quot;
              </p>
              <p>
                • <span className="text-white font-semibold">Honest feelings</span> - &quot;Where are you NOW, not where you want to be?&quot;
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
                • <span className="text-white font-semibold">Baseline Awareness</span> - A clear &quot;before&quot; picture of where you&apos;re currently aligned and where you&apos;re not.
              </p>
              <p>
                • <span className="text-white font-semibold">Clarity Without Judgment</span> - &quot;Below Green Line&quot; simply means growth opportunity, not failure.
              </p>
              <p>
                • <span className="text-white font-semibold">Focus</span> - You&apos;ll know exactly which areas are strongest, which are in transition, and which are asking for more attention.
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
