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
  Spinner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, User, Heart, Activity, Sparkles } from 'lucide-react'

const PROFILE_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/03-profile-1080p.mp4'
const PROFILE_INTRO_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/03-profile-thumb.0000000.jpg'

export default function ProfileNewPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProfile = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const checkResponse = await fetch('/api/profile')
      if (!checkResponse.ok) {
        throw new Error('Failed to check existing profile')
      }
      
      const checkData = await checkResponse.json()
      const hasExistingProfile = checkData.profile && Object.keys(checkData.profile).length > 0
      
      if (hasExistingProfile) {
        router.push('/profile')
        return
      }
      
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

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Video */}
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={PROFILE_INTRO_VIDEO}
            thumbnailUrl={PROFILE_INTRO_POSTER}
            context="single"
            className="w-full"
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => router.push('/profile')}
            className="w-full md:w-auto"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Profile Hub
          </Button>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* What is a Profile? */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What Is Your Profile?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Vibration Fit Profile is a clear snapshot of where you are right now across all 12 categories of your life. It&apos;s how we anchor your starting point so you can intentionally create the life you actually desire, not a vague idea you can&apos;t measure.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Think of it as your personal GPS coordinates: you need to know where you are before you can map where you&apos;re going. This isn&apos;t about judgment. It&apos;s about clarity and self-awareness.
            </p>
          </Stack>
        </Card>

        {/* What You'll Share */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You&apos;ll Share
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <User className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">Personal Information</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Basic details about you – your name, contact info, and a few demographics. This helps us personalize your experience and understand your unique context.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">Life Categories</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your current reality across 12 key areas: Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, and Giving. For each category, you&apos;ll name:
                </p>
                <ul className="text-sm text-neutral-300 leading-relaxed list-disc list-inside ml-1">
                  <li>What&apos;s going well (your clarity)</li>
                  <li>What&apos;s not going well (your contrast)</li>
                </ul>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You are not asked to describe the future here. This step is purely about your current state.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Activity className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">Your Patterns</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Lifestyle details like daily routines, habits, and preferences. This shows us the patterns shaping your current experience and where your energy and time are actually going.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">Your Truth</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  An honest assessment of where you are on average, not just on a really bad or really great day. This is a judgment-free zone. The more real you are, the more powerful your transformation will be. Your profile is private and for your eyes (and VIVA&apos;s) only.
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
              Your profile is the foundation for everything that follows – your Life Vision, your audios, your daily practices, and your overall transformation.
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>• <span className="text-white font-semibold">Clarity</span> – Get crystal clear on where you actually are right now, not where you think you &quot;should&quot; be.</p>
              <p>• <span className="text-white font-semibold">Context for VIVA</span> – Your guide uses this data to give you guidance that&apos;s specific to your life, not generic advice.</p>
              <p>• <span className="text-white font-semibold">Progress Tracking</span> – Over time, you&apos;ll be able to see how far you&apos;ve come and celebrate real shifts.</p>
              <p>• <span className="text-white font-semibold">Authentic Visioning</span> – When you later build your Life Vision, it will be grounded in your real current reality, which makes it more believable, more powerful, and easier to activate.</p>
            </Stack>
          </Stack>
        </Card>

      </Stack>
    </Container>
  )
}
