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
import { BookOpen, Heart, Sparkles, Plus, Eye } from 'lucide-react'

const JOURNAL_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

export default function JournalResourcesPage() {
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
        .select('id, first_journal_entry, first_journal_entry_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        if (checklist.first_journal_entry) {
          setIsAlreadyCompleted(true)
          setCompletedAt(checklist.first_journal_entry_at)
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
            stepTitle="First Journal Entry"
            completedAt={completedAt}
          />
        )}

        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 11 OF 14" : undefined}
          title="Journal Resources"
          subtitle="Learn how journaling amplifies your vibrational alignment and manifestation practice"
        >
          <div className="mx-auto w-full max-w-3xl mb-6">
            <OptimizedVideo
              url={JOURNAL_VIDEO}
              context="single"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
            {isAlreadyCompleted ? (
              <Button variant="primary" size="sm" asChild className="w-full md:w-auto md:flex-none flex items-center gap-2">
                <Link href="/journal">
                  <Eye className="w-4 h-4" />
                  View Journal
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="w-full md:w-auto md:flex-none">
                  <Link href="/journal">
                    See All Entries
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full md:w-auto md:flex-none flex items-center gap-2">
                  <Link href="/journal/new">
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </Link>
                </Button>
              </>
            )}
          </div>
        </PageHero>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Vibrational Journaling?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Journal is a sacred space for processing, celebrating, and deliberately creating your life experiences. It's where you document your vibrational journey, capture insights, process contrast, and celebrate wins - all while maintaining conscious awareness of your alignment.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Unlike traditional journaling, vibrational journaling focuses on your emotional guidance system. Each entry is an opportunity to understand your vibration, shift into alignment, and create momentum toward your desires. Read below to learn how to use your Journal effectively.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Your Journal Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <BookOpen className="h-5 w-5 text-[#5EC49A]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 1: Written Expression
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Writing is a powerful tool for processing emotions and gaining clarity. By putting your thoughts and experiences into words, you create distance from reactive patterns and can consciously choose your perspective. Your journal entries help you understand what you're feeling, why you're feeling it, and how to shift into better-feeling thoughts.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Heart className="h-5 w-5 text-[#2DD4BF]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 2: Mood Tracking
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Each entry includes your emotional state, allowing you to see patterns in your vibration over time. This awareness is powerful - you'll notice what thoughts, activities, and experiences consistently feel good, helping you make more aligned choices. Track your mood before and after journaling to witness the immediate benefit of processing and reframing.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                  <Text size="sm" className="text-white font-semibold">
                    Component 3: Multimedia Memories
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Enhance your entries with photos, videos, and voice recordings. These multimedia elements bring your memories to life and make revisiting past experiences more vivid and emotional. Looking back at moments of joy, growth, and manifestation reinforces your belief in your manifesting power and creates positive momentum.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What to Journal About
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your journal is versatile - use it for whatever serves your alignment. Here are powerful ways to use it:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Celebrate Wins</span> - Big or small, write about what went right. This trains your brain to look for evidence of things working out.
              </p>
              <p>
                • <span className="text-white font-semibold">Process Contrast</span> - When something feels off, write about it without judgment. Often the act of writing reveals the lesson or reframe.
              </p>
              <p>
                • <span className="text-white font-semibold">Document Manifestations</span> - Keep a record of desires that have manifested. This builds unshakeable belief in your manifesting power.
              </p>
              <p>
                • <span className="text-white font-semibold">Capture Insights</span> - Record aha moments, synchronicities, and inspired ideas before they fade.
              </p>
              <p>
                • <span className="text-white font-semibold">Appreciate & Rampage</span> - List things you appreciate, feel grateful for, or love about your life. Let the good feelings flow!
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Best Practices for Vibrational Journaling
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Get the most from your journal with these alignment-focused practices:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Write How You Feel</span> - Don't edit yourself. Your journal is private and judgement-free. Raw honesty is powerful.
              </p>
              <p>
                • <span className="text-white font-semibold">Reach for Relief</span> - If you're processing contrast, aim for a thought that feels even slightly better, not for instant positivity.
              </p>
              <p>
                • <span className="text-white font-semibold">End on a High Note</span> - Before finishing, write at least one thing you appreciate or feel good about to shift your vibration upward.
              </p>
              <p>
                • <span className="text-white font-semibold">Review Regularly</span> - Revisit past entries monthly to see your growth, remember manifestations, and appreciate how far you've come.
              </p>
              <p>
                • <span className="text-white font-semibold">Use Prompts When Stuck</span> - If you don't know what to write, use the built-in prompts to get started and let it flow from there.
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Journal?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Start documenting your vibrational journey today. There's no wrong way to journal - let your intuition guide you. Whether you're celebrating a win, processing an experience, or just checking in with yourself, each entry brings clarity and alignment.
            </p>
            <Inline gap="sm" justify="center" className="flex-wrap">
              <Button variant="primary" size="sm" className="justify-center" asChild>
                <Link href="/journal/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Entry
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-center" asChild>
                <Link href="/journal">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Entries
                </Link>
              </Button>
            </Inline>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}




