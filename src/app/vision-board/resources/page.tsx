'use client'

import Link from 'next/link'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { Eye, Sparkles, Plus, TrendingUp, Upload, CheckCircle } from 'lucide-react'

const VISION_BOARD_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/10-vision-board-1080p.mp4'
const VISION_BOARD_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/10-vision-board-thumb.0000000.jpg'

export default function VisionBoardResourcesPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Video */}
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={VISION_BOARD_VIDEO}
            thumbnailUrl={VISION_BOARD_POSTER}
            context="single"
            className="w-full"
          />
        </div>
        
        {/* Action buttons */}
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

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What Is a Vision Board?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Vision Board is the visual expression of your Life Vision. It&apos;s a collection of images that represent the realities you&apos;re choosing to create across all 12 life areas.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your digital Vision Board is:
            </p>
            <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed">
              <p>• Always accessible</p>
              <p>• Organized by life category</p>
              <p>• Easy to update as you grow</p>
            </Stack>
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
                  <Text size="sm" className="text-white font-semibold">Visual Imagery</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Images are the language of your subconscious. When you see scenes that match your desires, your nervous system starts to treat them as familiar instead of impossible.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">2</div>
                  <Text size="sm" className="text-white font-semibold">Organized by Category</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  Your board is organized by the same 12 categories as your Life Vision, so you can see each area clearly or zoom out and view your entire life at once.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold text-sm">3</div>
                  <Text size="sm" className="text-white font-semibold">Living &amp; Evolving</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                  This isn&apos;t a one-and-done collage. As things manifest, you can mark them as Actualized and even add &quot;evidence&quot; images.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How to Build Your Vision Board
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
                    Click Get Ideas and VIVA will read your Life Vision, generate 3 tailored ideas per category, and create AI images for the ones you select.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Plus className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Generate with VIVA (Custom Lane)</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Write the name and description, then click Generate with VIVA. VIVA turns your words into a matching AI image automatically.
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
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How to Use Your Vision Board
            </Text>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <Eye className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Daily Visualization</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">Spend 3-5 minutes looking at your board and feeling what it would be like.</p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Plus className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Add with Intention</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">Only add images that genuinely resonate with you.</p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <CheckCircle className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Celebrate Manifestations</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">When something becomes real, mark it as Actualized and add an evidence photo.</p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <TrendingUp className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Keep It Current</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">As desires change, update your board so it always reflects the life you&apos;re creating.</p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Create?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Start by getting one image per life area, then let it grow with you.
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
