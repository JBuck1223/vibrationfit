'use client'

import Link from 'next/link'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Text,
  Video,
  PageHero,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { ArrowLeft, Download, Heart, Target, Sparkles, Plus } from 'lucide-react'

const HALF_PAGE_PDF =
  'https://media.vibrationfit.com/site-assets/processes/daily-paper/daily-paper-for-print.pdf'
const FULL_PAGE_PDF =
  'https://media.vibrationfit.com/site-assets/processes/daily-paper/full-page-daily-paper.pdf'
const DAILY_PAPER_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/resources/daily-paper-1080p.mp4'

export default function DailyPaperResourcesPage() {
  return (
    <Container size="xl">
      <Stack gap="xl">
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Daily Paper Resources"
          subtitle="Learn the daily practice that keeps you vibrationally aligned"
        >
          <Inline gap="sm" justify="center" className="flex-wrap">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/daily-paper">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to archive
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
              <Link href="/daily-paper/new">
                <Plus className="w-4 h-4" />
                Add entry
              </Link>
            </Button>
          </Inline>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg" className="text-center">
            <OptimizedVideo
              url={DAILY_PAPER_VIDEO}
              context="single"
              className="mx-auto w-full max-w-3xl"
            />
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is the Daily Paper?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              The Daily Paper is a magical daily process that helps you establish a positive vibe while intentionally moving in the direction of your desires. It can take anywhere from 5 to 15 minutes to complete.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Read below for more information on what three components are included in the Daily Paper and what makes this process so simple yet magical.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How the Daily Paper Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 1: Gratitude
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  The power of gratitude is no secret. Starting with what you feel grateful for puts you in the receiving mode for all great things. It starts your day with a positive mindset that helps domino positive energy into all things.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 2: Top 3 Priorities
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  The feeling of positive movement forward, or progress, is such a satisfying feeling! That’s why we have the top 3 priorities for the day listed. This helps us hone in on What’s Important Now so we can WIN at intentionally creating our life by choice!
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 3: Something Fun
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Something fun for the day so we can stay focused on the fun! This can be anything that tickles your fancy, like going fishing, taking a walk, watching the sunset, taking a bath, going shopping, getting your nails done, boating, going to a park, eating lunch at your favorite restaurant, cooking a favorite meal, working on a project that excites you, or anything else you can think of that makes you feel good while doing it.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Tracking Your Story
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              It’s so much fun looking back at Daily Paper entries to reminisce the beautiful or difficult days from 1, 3, 5 years ago, or even just a few months ago and see how far you’ve come. This Daily Paper is more than just a way to set your day for greatness. It’s also your story – evidence of what thoughts and feelings were the precursors of different manifestations in your life.
            </p>
            <Text size="sm" className="text-neutral-300">
              There are two ways to track your Daily Papers:
            </Text>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • You can print either a half page or full page Daily Paper below and write them by hand, then upload a photo of the completed entry to the form by selecting “File Upload Only”. The half page has room for two Daily Paper entries while the full page has room for one Daily Paper entry (for those who like to write more).
              </p>
              <p>
                • Or if you prefer to type your Daily Paper digitally, you can submit it electronically. All form submissions will be saved to your member account (for your viewing only).
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Print-ready PDFs
            </Text>
            <p className="text-sm text-neutral-300">
              Choose the layout that fits your flow and keep your notebook aligned with the digital archive.
            </p>
            <Inline gap="sm" justify="center" className="flex-wrap">
              <Button variant="secondary" size="sm" className="w-full md:w-auto justify-center" asChild>
                <Link href={HALF_PAGE_PDF} target="_blank">
                  <Download className="mr-2 h-4 w-4" />
                  Half-page PDF
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="w-full md:w-auto justify-center" asChild>
                <Link href={FULL_PAGE_PDF} target="_blank">
                  <Download className="mr-2 h-4 w-4" />
                  Full-page PDF
                </Link>
              </Button>
            </Inline>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

