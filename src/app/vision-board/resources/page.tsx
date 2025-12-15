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
import { Image, Eye, Sparkles, Plus } from 'lucide-react'

const VISION_BOARD_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function VisionBoardResourcesPage() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <PageHero
          title="Vision Board Resources"
          subtitle="Learn how to create and use your digital vision board for manifestation"
        >
          <div className="mx-auto w-full max-w-3xl mb-6">
            <OptimizedVideo
              url={VISION_BOARD_VIDEO}
              context="single"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" asChild className="w-full md:w-auto md:flex-none">
              <Link href="/vision-board">
                See All
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full md:w-auto md:flex-none flex items-center gap-2">
              <Link href="/vision-board/new">
                <Plus className="w-4 h-4" />
                Add Item
              </Link>
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is a Vision Board?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Vision Board is a powerful visual representation of your dreams, desires, and the life you're intentionally creating. It's a collection of images, affirmations, and symbols that resonate with your authentic desires and keep you vibrationally aligned with your goals.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Unlike traditional cork boards, your digital Vision Board is always accessible, easily updatable, and organized by life category. Read below to learn how to create and use your Vision Board effectively.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Your Vision Board Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Image className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 1: Visual Imagery
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Images are the language of your subconscious mind. By selecting photos that represent your desires, you're programming your mind to recognize opportunities and attract circumstances that align with your vision. Choose images that make you feel the emotion of already having what you desire.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Eye className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 2: Organized by Category
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your Vision Board is organized by life category (Love, Family, Health, Work, Money, etc.) making it easy to focus on specific areas or view your complete vision. This organization helps you ensure you're creating a balanced, holistic vision for your entire life, not just one area.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 3: Living & Evolving
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your Vision Board isn't static - it grows and evolves with you. As you manifest desires, you can mark them as achieved and add new ones. This creates a powerful record of your manifestation journey and keeps your vision fresh and exciting. Update it whenever you feel inspired or when your desires shift.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How to Use Your Vision Board
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The power of your Vision Board comes from regular engagement with it. Here are the best practices:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Daily Visualization</span> - Spend 3-5 minutes each morning looking at your Vision Board. Feel the emotions of already having these things in your life.
              </p>
              <p>
                • <span className="text-white font-semibold">Add with Intention</span> - Only add images that genuinely resonate with your authentic desires, not what you think you should want or what looks good to others.
              </p>
              <p>
                • <span className="text-white font-semibold">Celebrate Manifestations</span> - When something manifests, mark it as achieved! This reinforces your belief in your manifesting power and creates positive momentum.
              </p>
              <p>
                • <span className="text-white font-semibold">Keep it Current</span> - Review and update your Vision Board monthly. Remove images that no longer resonate and add new desires as they arise.
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Finding the Right Images
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The most powerful Vision Board images are ones that evoke strong positive emotions. Here's how to find them:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Use Your Own Photos</span> - Personal photos that represent the feeling you're after are incredibly powerful.
              </p>
              <p>
                • <span className="text-white font-semibold">Search Intentionally</span> - Look for images that capture the essence and emotion of what you want, not just the thing itself.
              </p>
              <p>
                • <span className="text-white font-semibold">Trust Your Gut</span> - If an image makes you feel excited, expansive, or joyful when you look at it, it's right for your board.
              </p>
              <p>
                • <span className="text-white font-semibold">Include Affirmations</span> - Images with inspiring text or quotes can be powerful additions to reinforce your desires.
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Create?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Start building your Vision Board today. Remember, this is a living tool that grows with you - you don't need to have it all figured out right now. Start with what excites you and let it evolve.
            </p>
            <Inline gap="sm" justify="center" className="flex-wrap">
              <Button variant="primary" size="sm" className="justify-center" asChild>
                <Link href="/vision-board/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-center" asChild>
                <Link href="/vision-board">
                  <Eye className="mr-2 h-4 w-4" />
                  View My Board
                </Link>
              </Button>
            </Inline>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

