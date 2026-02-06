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
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, User, Heart, Activity, Sparkles, Eye } from 'lucide-react'
import { IntensiveCompletionBanner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'

// Placeholder video URL - user will replace this later
const PROFILE_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function ProfileNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [checkingIntensive, setCheckingIntensive] = useState(true)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  // 3-state for Intensive users: none (no profile), in_progress (has profile, not completed), completed
  const [profileStatus, setProfileStatus] = useState<'none' | 'in_progress' | 'completed'>('none')

  useEffect(() => {
    checkIntensiveMode()
  }, [])

  const checkIntensiveMode = async () => {
    try {
      // Use centralized intensive check (source of truth: intensive_checklist.status)
      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIsIntensiveMode(true)
        
        // Check if profile step is already completed (data is already in intensiveData)
        if (intensiveData.profile_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(intensiveData.profile_completed_at || intensiveData.created_at)
          setProfileStatus('completed')
        }

        // Fetch active profile ID for direct navigation
        const supabase = createClient()
        const { data: activeProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', intensiveData.user_id)
          .eq('is_active', true)
          .maybeSingle()

        if (activeProfile?.id) {
          setActiveProfileId(activeProfile.id)
          // If profile exists but not completed in checklist, it's in_progress
          if (!intensiveData.profile_completed) {
            setProfileStatus('in_progress')
          }
        }
        // If no profile exists, profileStatus remains 'none'
      }
    } catch (error) {
      console.error('Error checking intensive mode:', error)
    } finally {
      setCheckingIntensive(false)
    }
  }

  // Handler for Intensive users: Start Profile (creates profile and navigates to edit)
  const handleStartProfile = async () => {
    setIsCreating(true)
    setError(null)

    try {
      // Create new profile
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: {},
          saveAsVersion: false,
          isDraft: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create profile' }))
        throw new Error(errorData.error || 'Failed to create profile')
      }

      const data = await response.json()
      
      if (data.profile?.id) {
        router.push(`/profile/${data.profile.id}/edit`)
      } else {
        throw new Error('No profile ID returned from API')
      }
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      setIsCreating(false)
    }
  }

  // Handler for regular (non-Intensive) users
  const handleCreateProfile = async () => {
    setIsCreating(true)
    setError(null)

    try {
      // Check if user has an existing profile first
      const checkResponse = await fetch('/api/profile')
      if (!checkResponse.ok) {
        throw new Error('Failed to check existing profile')
      }
      
      const checkData = await checkResponse.json()
      const hasExistingProfile = checkData.profile && Object.keys(checkData.profile).length > 0
      
      if (hasExistingProfile) {
        // User already has a profile - redirect to profile dashboard
        router.push('/profile')
        return
      }
      
      // No existing profile - create first profile as active
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: {},
          saveAsVersion: false,
          isDraft: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create profile' }))
        throw new Error(errorData.error || 'Failed to create profile')
      }

      const data = await response.json()
      
      if (data.profile?.id) {
        router.push(`/profile/${data.profile.id}/edit`)
      } else {
        throw new Error('No profile ID returned from API')
      }
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
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
        {/* Completion Banner - Shows above PageHero when step is already complete */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Create Profile"
            completedAt={completedAt}
          />
        )}

        {/* Page Hero - Always shows, with intensive eyebrow when in intensive mode */}
        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 3 OF 14" : undefined}
          title="Welcome to Your Profile"
          subtitle="Your profile is the foundation of your journey with VibrationFit."
        >
          {/* Video */}
          <div>
            <OptimizedVideo
              url={PROFILE_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Button - 3 states for Intensive users */}
          <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isIntensiveMode ? (
              // Intensive mode: 3-state button (Start, Continue, View)
              profileStatus === 'completed' ? (
                // State 3: View Profile (completed)
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push(activeProfileId ? `/profile/${activeProfileId}` : '/profile')}
                  className="w-full md:w-auto"
                >
                  View Profile
                  <Eye className="ml-2 h-4 w-4" />
                </Button>
              ) : profileStatus === 'in_progress' ? (
                // State 2: Continue Profile (in progress)
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => router.push(`/profile/${activeProfileId}/edit`)}
                  className="w-full md:w-auto"
                >
                  Continue Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                // State 1: Start Profile (no profile)
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleStartProfile}
                  disabled={isCreating}
                  className="w-full md:w-auto"
                >
                  {isCreating ? (
                    <>
                      Starting Profile...
                      <Spinner variant="primary" size="sm" className="ml-2" />
                    </>
                  ) : (
                    <>
                      Start Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )
            ) : (
              // Non-intensive mode: Just show Profile Hub button
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => router.push('/profile')}
                className="w-full md:w-auto"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Profile Hub
              </Button>
            )}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        </PageHero>

        {/* What is a Profile? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Your Profile?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your VibrationFit Profile is a comprehensive snapshot of where you are right now across all 12 categories of your life. It helps you understand your current state so you can intentionally create the life you desire.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Think of it as your personal GPS coordinates - you need to know where you are before you can map out where you're going. Your profile isn't about judgment; it's about clarity and self-awareness.
            </p>
          </Stack>
        </Card>

        {/* What You'll Share */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Share
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <User className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Personal Information
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Basic details about you - your name, contact information, and demographic information. This helps us personalize your experience and understand your unique context.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Life Categories
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your current reality across 12 key life areas: Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, and Giving. For each category, you'll share what's going well, what's not working, your dreams, and your worries.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Activity className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Patterns
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Lifestyle details like your daily routines, habits, and preferences. This helps us understand the patterns that shape your current experience and identify opportunities for positive change.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Truth
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  The honest assessment of where you are. Remember, this is a judgment-free zone. The more honest you are, the more powerful your transformation will be. Your profile is private and for your eyes only.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Why It Matters */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Your Profile Matters
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your profile is the foundation for everything that follows - your Life Vision, your daily practices, and your transformation journey. Here's why it's so powerful:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Clarity</span> - Get crystal clear on where you actually are right now, not where you think you should be or where you were yesterday.
              </p>
              <p>
                • <span className="text-white font-semibold">Context for VIVA</span> - Your AI guide uses your profile to provide personalized guidance that's specifically tailored to your unique situation.
              </p>
              <p>
                • <span className="text-white font-semibold">Progress Tracking</span> - Create multiple profile versions over time to see how far you've come and celebrate your growth.
              </p>
              <p>
                • <span className="text-white font-semibold">Authentic Visioning</span> - When you create your Life Vision, it will be grounded in your real, current reality - making it more powerful and achievable.
              </p>
            </Stack>
          </Stack>
        </Card>

      </Stack>
    </Container>
  )
}
