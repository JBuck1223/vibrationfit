'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Card,
  Button,
  Container,
  Stack,
  Inline,
  Text,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Heart, Sparkles, Plus, Eye, Mic, Tag, TrendingUp, Lightbulb } from 'lucide-react'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'

const JOURNAL_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/11-journal-1080p.mp4'
const JOURNAL_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/11-journal-thumb.0000000.jpg'

export default function IntensiveJournalAboutPage() {
  const { setCompletedAt: setStepBarCompletedAt } = useIntensiveStep()
  const [hasEntry, setHasEntry] = useState(false)

  useEffect(() => {
    checkCompletionStatus()
    return () => { setStepBarCompletedAt(null) }
  }, [])

  const checkCompletionStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, first_journal_entry, first_journal_entry_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist?.first_journal_entry) {
        setHasEntry(true)
        setStepBarCompletedAt(checklist.first_journal_entry_at)
      }
    } catch (err) {
      console.error('Error checking completion status:', err)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Video */}
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={JOURNAL_VIDEO}
            thumbnailUrl={JOURNAL_POSTER}
            context="single"
            className="w-full"
          />
        </div>
        
        {/* Action button */}
        <div className="flex justify-center">
          {hasEntry ? (
            <Button variant="primary" size="sm" asChild className="flex items-center gap-2">
              <Link href="/intensive/journal">
                <Eye className="w-4 h-4" />
                View Entry
              </Link>
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild className="flex items-center gap-2">
              <Link href="/intensive/journal/new">
                <Plus className="w-4 h-4" />
                Add Entry
              </Link>
            </Button>
          )}
        </div>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What Is Vibrational Journaling?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Journal is your conscious creation log. It&apos;s where you:
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
              This isn&apos;t &quot;Dear Diary.&quot; It&apos;s a private place to track your vibration over time so you can see how your inner world is shaping your outer world.
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
                    Typing your thoughts out gets them out of your head and into a form you can actually work with. Writing helps you see what you&apos;re feeling, why you&apos;re feeling it, and what perspective would feel even slightly better.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Mic className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Voice, Video, and Images</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    If you don&apos;t feel like typing, you can record audio or video, and we&apos;ll transcribe it for you. You can also add photos or AI-generated images. Multimedia entries make it powerful to look back later and feel how far you&apos;ve come.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Tag className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Category Tags</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    You can tag entries with the same life categories as your Life Vision (Love, Money, Health, etc.). Over time, you&apos;ll start to see where you&apos;re growing the most, and which areas you tend to process or celebrate the most.
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
              <p>• <span className="text-white font-semibold">Celebrate Wins</span> – Big or small, write what went right.</p>
              <p>• <span className="text-white font-semibold">Process Contrast</span> – When something feels off, write it out without judgment.</p>
              <p>• <span className="text-white font-semibold">Document Manifestations</span> – Record the &quot;I wanted X, and now I have X&quot; moments.</p>
              <p>• <span className="text-white font-semibold">Capture Insights</span> – Aha moments, guidance, patterns, synchronicities.</p>
              <p>• <span className="text-white font-semibold">Appreciation &amp; Gratitude</span> – List what you love about your life right now.</p>
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
                    Don&apos;t edit yourself. This is private and judgment-free. Raw honesty is fuel.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <TrendingUp className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Reach for Relief</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    When you&apos;re processing something hard, aim for a thought that feels a bit better, not instant perfection.
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
                    Revisit past entries monthly. See your growth, remember manifestations, and appreciate how far you&apos;ve come.
                  </p>
                </div>
              </Inline>

              <Inline gap="sm" className="items-start flex-nowrap">
                <Lightbulb className="h-5 w-5 text-[#FF0040] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="sm" className="text-white font-semibold">Use Prompts if You&apos;re Stuck</Text>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">
                    If you don&apos;t know where to start, use prompts or simple questions like &quot;What feels alive for me right now?&quot; or &quot;What&apos;s one thing that went right today?&quot;
                  </p>
                </div>
              </Inline>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why This Step Matters
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              For the Intensive, you only need one entry to complete this step. That&apos;s your first rep and the start of your evidence log.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              After you graduate into your 28-day My Activation Plan, journaling becomes part of your regular practice – capturing intentions, evidence, and upgrades as they happen. The earlier you start, the more proof you&apos;ll have to look back on.
            </p>
          </Stack>
        </Card>

        {!hasEntry && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="md" className="text-center">
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Ready to Journal?
              </Text>
              <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
                You can&apos;t do this wrong. Start with one honest entry:
              </p>
              <Stack gap="xs" className="text-sm text-neutral-300 leading-relaxed max-w-2xl mx-auto">
                <p>• Celebrate a win</p>
                <p>• Process something that feels heavy</p>
                <p>• Capture an insight from this 72-hour journey</p>
              </Stack>
              <div className="flex justify-center">
                <Button variant="primary" size="sm" className="justify-center" asChild>
                  <Link href="/intensive/journal/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
                  </Link>
                </Button>
              </div>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
