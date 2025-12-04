'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  Inline,
  Badge,
  Text,
  TrackingMilestoneCard,
  PageHeader,
} from '@/lib/design-system/components'
import { ArrowRight, RefreshCcw, FileText, HelpCircle, Plus, Sparkles } from 'lucide-react'
import { DailyPaperEntry, useDailyPaperEntries } from '@/hooks/useDailyPaper'

const PREVIEW_LENGTH = 180

function truncate(text: string, length = PREVIEW_LENGTH) {
  if (!text) return ''
  if (text.length <= length) return text
  return `${text.slice(0, length - 1)}…`
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function calculateCurrentStreak(entries: DailyPaperEntry[]) {
  if (entries.length === 0) return 0

  const recordedDays = new Set(entries.map((entry) => entry.entry_date))
  const cursor = new Date()

  let streak = 0
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!recordedDays.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function countEntriesInLastDays(entries: DailyPaperEntry[], days: number) {
  if (entries.length === 0) return 0

  const today = new Date()
  const threshold = new Date()
  threshold.setDate(today.getDate() - (days - 1))

  return entries.filter((entry) => {
    const entryDate = new Date(`${entry.entry_date}T00:00:00`)
    return entryDate >= threshold && entryDate <= today
  }).length
}

export default function DailyPaperIndexPage() {
  const router = useRouter()
  const { entries, isLoading, isRefreshing, error, refresh } = useDailyPaperEntries()

  const metrics = useMemo(() => {
    const total = entries.length
    const thisWeek = countEntriesInLastDays(entries, 7)
    const streak = calculateCurrentStreak(entries)
    const mostRecent = entries[0] ?? null
    return { total, thisWeek, streak, mostRecent }
  }, [entries])

  const handleRefresh = () => {
    void refresh()
  }

  const EmptyState = () => (
    <Card className="max-w-md mx-auto">
      <Stack gap="md" className="items-center text-center">
        <FileText className="w-16 h-16 text-neutral-400 mx-auto" />
        <Text size="lg" className="text-white font-semibold">
          No Daily Papers yet
        </Text>
        <p className="text-sm text-neutral-400 max-w-sm">
          Start with gratitude, align three actions and focus on the fun.
        </p>
        <div className="flex flex-col md:flex-row gap-3 w-full justify-center">
          <Button 
            variant="primary"
            size="sm"
            onClick={() => router.push('/daily-paper/new')}
            className="w-full md:w-auto md:min-w-[200px] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add entry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/daily-paper/resources')}
            className="w-full md:w-auto md:min-w-[200px] flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Resources
          </Button>
        </div>
      </Stack>
    </Card>
  )

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Gradient Card Container */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <PageHeader
              eyebrow="STAY ON TRACK"
              title="Daily Paper"
              subtitle="Start with gratitude, align three actions and focus on the fun."
              metaItems={metrics.mostRecent ? [
                {
                  label: 'Last entry',
                  value: formatDateLabel(metrics.mostRecent.entry_date)
                }
              ] : []}
              actions={[
                {
                  label: 'Add entry',
                  icon: Plus,
                  iconPosition: 'left',
                  onClick: () => router.push('/daily-paper/new'),
                  variant: 'outline',
                  size: 'sm',
                },
                {
                  label: 'Resources',
                  icon: HelpCircle,
                  iconPosition: 'left',
                  onClick: () => router.push('/daily-paper/resources'),
                  variant: 'outline',
                  size: 'sm',
                }
              ]}
              gradient={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <TrackingMilestoneCard
            label="Total entries"
            value={metrics.total}
            theme="primary"
          />
          <TrackingMilestoneCard
            label="This week"
            value={metrics.thisWeek}
            theme="secondary"
          />
          <TrackingMilestoneCard
            label="Current streak"
            value={`${metrics.streak} ${metrics.streak === 1 ? 'day' : 'days'}`}
            theme="accent"
          />
        </div>

        {error && (
          <Card variant="outlined" className="border-[#D03739]/40 bg-[#D03739]/10">
            <Stack gap="sm">
              <Text size="sm" className="text-[#FFB4B4] font-semibold">
                We couldn&apos;t load your Daily Papers.
              </Text>
              <Inline gap="sm" className="justify-between items-center">
                <p className="text-xs text-[#FFB4B4]/80">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try again
                </Button>
              </Inline>
            </Stack>
          </Card>
        )}

        {isLoading ? (
          <Card variant="outlined" className="border-[#333] bg-[#111111]">
            <Inline gap="sm" className="items-center text-neutral-300">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
              <span>Loading your archive…</span>
            </Inline>
          </Card>
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack gap="lg">
            {entries.map((entry) => {
              const tasks = [entry.task_one, entry.task_two, entry.task_three].filter(
                (task) => task && task.trim().length > 0,
              )
              const hasAttachment = Boolean(entry.attachment_url)

              return (
                <Card
                  key={entry.id}
                  variant="outlined"
                  className="bg-[#101010] border-[#1F1F1F] transition-all duration-300 hover:border-[#199D67]"
                >
                  <Stack gap="lg">
                    <Inline className="items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                          {formatDateLabel(entry.entry_date)}
                        </p>
                        <Text size="lg" className="text-white font-semibold">
                          Gratitude · Actions · Fun
                        </Text>
                      </div>
                      <Inline gap="xs" className="justify-end">
                        {hasAttachment && <Badge variant="info">Attachment</Badge>}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push('/daily-paper/new')}
                        >
                          Repeat flow
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Inline>
                    </Inline>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                          Gratitude
                        </p>
                        <p className="mt-3 text-neutral-200 leading-relaxed whitespace-pre-line">
                          {truncate(entry.gratitude)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                          Today&apos;s actions
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-neutral-100">
                          {tasks.length === 0 ? (
                            <p className="text-neutral-500">No actions logged.</p>
                          ) : (
                            tasks.map((task, index) => (
                              <div key={`${entry.id}-task-${index}`} className="flex gap-2">
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#199D67]/50 bg-[#199D67]/15 text-xs text-[#5EC49A]">
                                  {index + 1}
                                </span>
                                <span className="flex-1">{task}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Fun promise
                      </p>
                      <p className="mt-3 text-sm text-neutral-100">
                        {entry.fun_plan || 'No promise captured.'}
                      </p>
                    </div>

                    <Inline gap="sm" className="flex-wrap justify-between items-center">
                      <p className="text-xs text-neutral-500">
                        Logged at{' '}
                        {new Date(entry.created_at).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <Inline gap="sm" className="items-center">
                        {hasAttachment && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={entry.attachment_url ?? '#'} target="_blank">
                              <FileText className="mr-2 h-4 w-4" />
                              View attachment
                            </Link>
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/daily-paper/new?from=${entry.entry_date}`}>
                            Bring into today
                          </Link>
                        </Button>
                      </Inline>
                    </Inline>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

