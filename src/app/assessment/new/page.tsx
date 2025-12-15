'use client'

import { useState } from 'react'
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
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, Target, BarChart, TrendingUp, Sparkles } from 'lucide-react'

// Placeholder video URL - user will replace this later
const ASSESSMENT_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function AssessmentNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateAssessment = async () => {
    setIsCreating(true)
    setError(null)

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
      
      // Check if user has any existing assessment
      const checkResponse = await fetch('/api/assessment')
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        
        // If user has any assessment, redirect to assessment dashboard
        if (checkData.assessment && Object.keys(checkData.assessment).length > 0) {
          router.push('/assessment')
          return
        }
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
        
        // If we get a 409 (conflict) error, it means there's an existing assessment
        // Redirect to /assessment dashboard where they can manage it
        if (response.status === 409) {
          router.push('/assessment')
          return
        }
        
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
      setError(err instanceof Error ? err.message : 'Failed to create assessment')
      setIsCreating(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Centered Hero Title */}
        <PageHero
          title="The VibrationFit Assessment"
          subtitle="Discover where you stand in each area of your life and unlock personalized insights."
        >
          {/* Video */}
          <div>
            <OptimizedVideo
              url={ASSESSMENT_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
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
                  Take the Assessment
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
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
              The VibrationFit Assessment is a comprehensive evaluation that measures your current state across all 12 life categories. It provides you with detailed insights into your strengths, growth areas, and alignment levels.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Unlike a simple quiz, this assessment dives deep into each area of your life to give you actionable data and personalized recommendations for your transformation journey.
            </p>
          </Stack>
        </Card>

        {/* What You'll Discover */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Discover
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Alignment Score
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Get a comprehensive score for each of the 12 life categories, showing where you're thriving and where there's room for growth. See exactly where you stand on the "Green Line" of alignment.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <BarChart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Detailed Insights
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Receive personalized insights for each category, highlighting patterns, strengths, and opportunities. Understand not just your score, but what it means and how to improve.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <TrendingUp className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Growth Recommendations
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Get specific, actionable recommendations for each area of your life. Know exactly what steps to take to move from where you are to where you want to be.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Unique Blueprint
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your assessment results become the foundation for your personalized Life Vision. VIVA uses these insights to guide you toward the life you truly desire.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Why Take the Assessment? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Take the Assessment?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The assessment is your starting point for transformation. It provides the clarity and data you need to create meaningful change. Here's why it's essential:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Baseline Measurement</span> - Establish where you are right now so you can track your progress over time.
              </p>
              <p>
                • <span className="text-white font-semibold">Personalized Insights</span> - VIVA uses your assessment to provide guidance that's specifically tailored to your unique situation and goals.
              </p>
              <p>
                • <span className="text-white font-semibold">Identify Blind Spots</span> - Discover areas of your life that may need attention but weren't on your radar.
              </p>
              <p>
                • <span className="text-white font-semibold">Prioritize Growth</span> - Know which areas to focus on first for maximum impact on your overall alignment and happiness.
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
              The assessment takes about 15-20 minutes to complete. Be honest with yourself - the more authentic your responses, the more valuable your insights will be.
            </p>
            <div className="flex flex-col gap-2 md:gap-4 justify-center items-center">
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
                    Start Your Assessment
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

