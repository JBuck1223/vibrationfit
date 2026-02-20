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
import { BookOpen, Heart, Sparkles, Plus, Eye, Mic, Video, Tag, TrendingUp, Lightbulb } from 'lucide-react'

const JOURNAL_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/11-journal-1080p.mp4'

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
              What Is Vibrational Journaling?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Journal is your conscious creation log. It's where you:
            </p>
            <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed pl-4">
              <p>• Process experiences and emotions</p>
              <p>• Capture insights and synchronicities</p>
              <p>• Document wins and manifestations</p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Over time, your Journal becomes a record of evidence that your inner work is changing your outer world.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              This isn't "Dear Diary." It's a private place to track your vibration over time so you can see how your inner world is shaping your outer world.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Each entry is an opportunity to understand where you are, shift toward alignment, and build momentum toward your desires.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How Your Journal Works
            </Text>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <BookOpen className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Written Expression</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Typing your thoughts out gets them out of your head and into a form you can actually work with. Writing helps you see what you're feeling, why you're feeling it, and what perspective would feel even slightly better.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Mic className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Voice, Video, and Images</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    If you don't feel like typing, you can record audio or video, and we'll transcribe it for you. You can also add photos or AI‑generated images. Multimedia entries make it powerful to look back later and feel how far you've come.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Tag className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Category Tags</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    You can tag entries with the same life categories as your Life Vision (Love, Money, Health, etc.). Over time, you'll start to see where you're growing the most, and which areas you tend to process or celebrate the most.
                  </p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What to Journal About
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Use your Journal for whatever serves your alignment. Some powerful use cases:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                • <span className="text-white font-semibold">Celebrate Wins</span> – Big or small, write what went right. This trains your brain to look for evidence that things are working out.
              </p>
              <p>
                • <span className="text-white font-semibold">Process Contrast</span> – When something feels off, write it out without judgment. Often the act of writing reveals the lesson and a softer perspective.
              </p>
              <p>
                • <span className="text-white font-semibold">Document Manifestations</span> – Record the "I wanted X, and now I have X" moments. This builds unshakeable belief in your manifesting power.
              </p>
              <p>
                • <span className="text-white font-semibold">Capture Insights</span> – Aha moments, guidance, patterns, synchronicities – get them down before they fade.
              </p>
              <p>
                • <span className="text-white font-semibold">Appreciation & Gratitude</span> – List what you love about your life right now. Let good feelings stack.
              </p>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Best Practices for Vibrational Journaling
            </Text>
            <Stack gap="lg">
              <Inline gap="sm" className="items-start flex-nowrap">
                <Heart className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Write How You Feel</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Don't edit yourself. This is private and judgment‑free. Raw honesty is fuel.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <TrendingUp className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Reach for Relief</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    When you're processing something hard, aim for a thought that feels a bit better, not instant perfection.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Sparkles className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">End on a High Note</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Before you close an entry, add at least one thing you appreciate. Even a tiny shift upward matters.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Eye className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Review Regularly</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    Revisit past entries monthly. See your growth, remember manifestations, and appreciate how far you've come.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Lightbulb className="h-5 w-5 text-[#FF0040] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Use Prompts if You're Stuck</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    If you don't know where to start, use prompts or simple questions like "What feels alive for me right now?" or "What's one thing that went right today?"
                  </p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why This Step Matters in the Intensive
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              For the Intensive, you only need one entry to complete this step. That's your first rep and the start of your evidence log.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              After you graduate into your 28‑day My Activation Plan, journaling becomes part of your regular practice – capturing intentions, evidence, and upgrades as they happen. The earlier you start, the more proof you'll have to look back on.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md" className="text-center">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Ready to Journal?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              You can't do this wrong. Start with one honest entry:
            </p>
            <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              <p>• Celebrate a win</p>
              <p>• Process something that feels heavy</p>
              <p>• Capture an insight from this 72‑hour journey</p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Click "Add Entry" to create your first Journal entry, or "See All Entries" to review what you've already captured.
            </p>
            <Inline gap="sm" justify="center" className="flex-wrap">
              <Button variant="primary" size="sm" className="justify-center" asChild>
                <Link href="/journal/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-center" asChild>
                <Link href="/journal">
                  <BookOpen className="mr-2 h-4 w-4" />
                  See All Entries
                </Link>
              </Button>
            </Inline>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}




