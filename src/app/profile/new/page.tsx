'use client'

import Link from 'next/link'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  PageHero,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowRight, User, Heart, Activity, Sparkles } from 'lucide-react'

// Placeholder video URL - user will replace this later
const PROFILE_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function ProfileNewPage() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Centered Hero Title */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Welcome to Your Profile"
          subtitle="Your profile is the foundation of your journey with VibrationFit."
        >
          {/* Video */}
          <div className="mb-6">
            <OptimizedVideo
              url={PROFILE_INTRO_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button variant="primary" size="sm" asChild className="w-full md:w-auto flex-1 md:flex-none">
              <Link href="/profile/new/create">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Your Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="w-full md:w-auto flex-1 md:flex-none">
              <Link href="/profile">
                View Dashboard
              </Link>
            </Button>
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

        {/* Ready to Begin */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Begin?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Take your time filling out your profile. You can save your progress and come back anytime. Remember, this is about honest self-reflection, not perfection.
            </p>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center">
              <Button variant="primary" size="sm" asChild className="w-full md:w-auto">
                <Link href="/profile/new/create">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start Creating Your Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full md:w-auto">
                <Link href="/dashboard">
                  I'll Do This Later
                </Link>
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
