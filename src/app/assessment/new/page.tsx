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
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Target, BarChart, TrendingUp } from 'lucide-react'
import { fetchAssessments } from '@/lib/services/assessmentService'

const ASSESSMENT_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/04-assessment-1080p.mp4'
const ASSESSMENT_INTRO_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/04-assessment-thumb.0000000.jpg'

export default function AssessmentNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [assessmentInProgressId, setAssessmentInProgressId] = useState<string | null>(null)

  useEffect(() => {
    loadAssessments()
  }, [])

  const loadAssessments = async () => {
    try {
      const { assessments } = await fetchAssessments()
      if (assessments?.length) {
        const inProgress = assessments.find((a) => a.status === 'in_progress')
        setAssessmentInProgressId(inProgress?.id ?? null)
      }
    } catch (error) {
      console.error('Error loading assessments:', error)
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
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => router.push('/assessment')}
            className="w-full md:w-auto"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Assessment Hub
          </Button>
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
              This isn&apos;t a fluffy quiz. It&apos;s structured data that powers the rest of your journey.
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

      </Stack>
    </Container>
  )
}
