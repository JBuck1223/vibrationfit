'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  PageHero,
  IntensiveCompletionBanner,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { createClient } from '@/lib/supabase/client'
import { Image, Eye, Sparkles, Plus, Layout, TrendingUp, Upload, Download, CheckCircle } from 'lucide-react'

const VISION_BOARD_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function VisionBoardResourcesPage() {
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    checkIntensiveMode()
  }, [])

  const checkIntensiveMode = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, vision_board_completed, vision_board_completed_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        if (checklist.vision_board_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklist.vision_board_completed_at)
        }
      }
    } catch (err) {
      console.error('Error checking intensive mode:', err)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner - Shows when step is already complete in intensive mode */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Create Vision Board"
            completedAt={completedAt}
          />
        )}

        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 10 OF 14" : undefined}
          title="Vision Board Resources"
          subtitle="Learn how to create and use your digital Vision Board to activate your Life Vision."
        >
          <div className="mx-auto w-full max-w-3xl mb-6">
            <OptimizedVideo
              url={VISION_BOARD_VIDEO}
              context="single"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button variant="primary" size="sm" asChild className="w-full md:w-auto md:flex-none flex items-center gap-2">
              <Link href="/vision-board/ideas">
                <Sparkles className="w-4 h-4" />
                Get Ideas
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="w-full md:w-auto md:flex-none">
              <Link href="/vision-board">
                View My Board
              </Link>
            </Button>
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What Is a Vision Board?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Vision Board is the visual expression of your Life Vision. It's a collection of images that represent the realities you're choosing to create across all 12 life areas.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Instead of a cork board with random cut‑outs, your digital Vision Board is:
            </p>
            <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed">
              <p>• Always accessible</p>
              <p>• Organized by life category</p>
              <p>• Easy to update as you grow</p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              During the Intensive, your goal is simple: at least one image for each of the 12 life areas so your whole life is visually activated, not just one or two categories.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Your Vision Board Works
            </Text>
            <Stack gap="xl">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">1</div>
                  <Text size="sm" className="text-white font-semibold">
                    Visual Imagery
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Images are the language of your subconscious. When you see scenes that match your desires, your nervous system starts to treat them as familiar instead of impossible.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">2</div>
                  <Text size="sm" className="text-white font-semibold">
                    Organized by Category
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Your board is organized by the same 12 categories as your Life Vision (Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, Giving), so you can see each area clearly or zoom out and view your entire life at once.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">3</div>
                  <Text size="sm" className="text-white font-semibold">
                    Living & Evolving
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  This isn't a one‑and‑done collage. As things manifest, you can mark them as Actualized and even add "evidence" images. You can also add new visions as your desires expand.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How to Build Your Vision Board (Fast)
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              You have three ways to create items:
            </p>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <Sparkles className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">VIVA Ideas (Fast Lane)</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Click Get Ideas and VIVA will read your Life Vision, generate 3 tailored ideas per category, and create AI images for the ones you select. This is the fastest way to cover all 12 categories in minutes.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Plus className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Generate with VIVA (Custom Lane)</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    When you add an item manually, you write the name and description, then click Generate with VIVA. VIVA turns your words into a matching AI image automatically.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Upload className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Upload Your Own Photos</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    If you already have images you love, you can upload them directly.
                  </p>
                </div>
              </Inline>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              For the Intensive, the smartest move is usually:
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed font-medium">
              Use VIVA Ideas to quickly get at least one item per category, then add or customize anything you want with Generate with VIVA or your own photos.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How to Use Your Vision Board
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The power comes from repeated contact with your images:
            </p>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <Eye className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Daily Visualization</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Spend 3–5 minutes looking at your board. Let yourself feel what it would be like if these scenes were normal in your life.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Plus className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Add with Intention</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Only add images that genuinely resonate with you, not what you think you should want.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <CheckCircle className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Celebrate Manifestations</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    When something becomes real, mark it as Actualized and, if you want, add an evidence photo. This builds undeniable proof that your vision is working.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <TrendingUp className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Keep It Current</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    As desires change, update your board so it always reflects the life you're actually creating now.
                  </p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Take It Offline (Optional)
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Vision Board doesn't have to live only on a screen.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              You can download a PDF collage of your board and:
            </p>
            <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed">
              <p>• Print it and hang it where you'll see it every day</p>
              <p>• Keep a copy in your journal or planner</p>
              <p>• Cut out individual images and create a physical board if you love working with your hands</p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Use the digital version for daily on-the-go visualization, and the printed version to keep your vision in your physical space.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Create?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              You don't need the "perfect" board today. Start by getting one image per life area, then let it grow with you.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Use Get Ideas to let VIVA do the heavy lifting, or jump straight into View My Board to build and customize your visions.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Once your board has images you love, you can also download it as a PDF collage to print or use however you like.
            </p>
            <Inline gap="sm" justify="center" className="flex-wrap">
              <Button variant="primary" size="sm" className="justify-center" asChild>
                <Link href="/vision-board/ideas">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Ideas
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




