'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Container,
  Card,
  Button,
  Spinner,
  Badge,
  Stack,
  Grid,
  Inline,
} from '@/lib/design-system/components'
import { ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react'
import type {
  EmotionalSnapshotRecord,
  EmotionalValence,
  SceneRecord,
  TrendingDirection,
  VibrationalEventRecord,
} from '@/lib/types/vibration'

type VibrationalEventPoint = Pick<
  VibrationalEventRecord,
  'id' | 'created_at' | 'emotional_valence' | 'essence_word' | 'intensity' | 'summary_in_their_voice' | 'dominant_emotions'
>

interface CategoryDetail {
  snapshot: EmotionalSnapshotRecord | null
  events: VibrationalEventPoint[]
  scenes: SceneRecord[]
  reflection: string | null
}

const CATEGORIES = [
  { key: 'fun', label: 'Fun & Recreation' },
  { key: 'travel', label: 'Variety & Adventure' },
  { key: 'home', label: 'Home & Environment' },
  { key: 'family', label: 'Family & Parenting' },
  { key: 'love', label: 'Love & Partnership' },
  { key: 'health', label: 'Health & Vitality' },
  { key: 'money', label: 'Money & Wealth' },
  { key: 'work', label: 'Business & Work' },
  { key: 'social', label: 'Social & Community' },
  { key: 'giving', label: 'Giving & Legacy' },
  { key: 'stuff', label: 'Things & Lifestyle' },
  { key: 'spirituality', label: 'Expansion & Spirituality' },
]

const VALENCE_STYLES: Record<EmotionalValence, string> = {
  above_green_line: 'bg-[#199D67] text-white shadow-[0_12px_30px_rgba(25,157,103,0.35)]',
  near_green_line: 'bg-[#1F1F1F] text-neutral-200 border border-[#404040]',
  below_green_line: 'bg-[#D03739] text-white shadow-[0_12px_30px_rgba(208,55,57,0.35)]',
}

const TREND_ICONS: Record<TrendingDirection, React.ReactNode> = {
  up: <ArrowUpRight className="h-4 w-4 text-[#199D67]" />,
  down: <ArrowDownRight className="h-4 w-4 text-[#D03739]" />,
  stable: <Minus className="h-4 w-4 text-neutral-400" />,
}

function valenceToScore(valence: EmotionalValence): number {
  switch (valence) {
    case 'above_green_line':
      return 1
    case 'below_green_line':
      return -1
    default:
      return 0
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'No recent events'
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function Sparkline({ events }: { events: VibrationalEventPoint[] }) {
  const points = useMemo(() => {
    if (!events.length) {
      return '0,20 120,20'
    }
    const scores = events.map((event) => valenceToScore(event.emotional_valence))
    const min = -1
    const max = 1
    const width = 120
    const height = 40
    return scores
      .map((score, index) => {
        const x = (index / Math.max(scores.length - 1, 1)) * width
        const normalized = (score - min) / (max - min)
        const y = height - normalized * height
        return `${x},${y}`
      })
      .join(' ')
  }, [events])

  return (
    <svg width="120" height="40" viewBox="0 0 120 40" className="text-[#39FF14]">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

export default function NorthStarDashboardPage() {
  const [snapshots, setSnapshots] = useState<Record<string, EmotionalSnapshotRecord>>({})
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    const loadSnapshots = async () => {
      setIsLoadingSnapshots(true)
      try {
        const response = await fetch('/api/vibration/dashboard/snapshots')
        if (!response.ok) {
          throw new Error('Unable to fetch snapshots.')
        }
        const data = await response.json()
        const snapshotsArray: EmotionalSnapshotRecord[] = Array.isArray(data.snapshots)
          ? data.snapshots
          : []
        const mapped: Record<string, EmotionalSnapshotRecord> = {}
        snapshotsArray.forEach((snapshot) => {
          mapped[snapshot.category] = snapshot
        })
        setSnapshots(mapped)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingSnapshots(false)
      }
    }

    loadSnapshots()
  }, [])

  const handleSelectCategory = async (category: string) => {
    setSelectedCategory(category)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const response = await fetch(`/api/vibration/dashboard/category?category=${category}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to load category detail.')
      }
      const data = await response.json()
      setCategoryDetail({
        snapshot: data.snapshot,
        events: data.events ?? [],
        scenes: data.scenes ?? [],
        reflection: data.reflection ?? null,
      })
    } catch (error) {
      console.error(error)
      setDetailError(error instanceof Error ? error.message : 'Unable to load category detail.')
      setCategoryDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Stack gap="sm" className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            North Star Dashboard
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Track your vibrational alignment across every category. Tap a tile to explore VIVA’s
            reflection, trendline, and suggested focus.
          </p>
        </Stack>

        <Card>
          {isLoadingSnapshots ? (
            <div className="flex items-center justify-center py-12 text-neutral-400">
              <Spinner />
            </div>
          ) : (
            <Grid responsiveCols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
              {CATEGORIES.map((category) => {
                const snapshot = snapshots[category.key]
                const valence = snapshot?.current_valence ?? 'near_green_line'
                const essence = snapshot?.primary_essence ?? 'essence'
                const tileClass = VALENCE_STYLES[valence]

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => handleSelectCategory(category.key)}
                    className={`
                      w-full text-left rounded-3xl p-6 transition-transform duration-300
                      hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#39FF14]
                      ${tileClass}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-wide opacity-80">
                          {category.label}
                        </p>
                        <h3 className="text-2xl font-semibold mt-2">
                          {essence ? essence.replace(/_/g, ' ') : 'Alignment'}
                        </h3>
                      </div>
                      <Badge variant="neutral">
                        {formatDate(snapshot?.last_event_at ?? null)}
                      </Badge>
                    </div>
                    <Inline justify="between" align="center" className="mt-6 text-sm">
                      <Inline gap="xs" align="center">
                        {snapshot ? TREND_ICONS[snapshot.trending_direction] : TREND_ICONS.stable}
                        <span className="uppercase tracking-wide text-xs">
                          {snapshot?.trending_direction ?? 'stable'}
                        </span>
                      </Inline>
                      <span className="text-xs uppercase tracking-wide">
                        {snapshot?.event_count_30d ?? 0} moments / 30d
                      </span>
                    </Inline>
                  </button>
                )
              })}
            </Grid>
          )}
        </Card>

        <Card>
          <Stack gap="md">
            <Inline justify="between" align="center" className="flex-col md:flex-row gap-2">
              <h2 className="text-2xl font-semibold text-white">
                {selectedCategory
                  ? CATEGORIES.find((category) => category.key === selectedCategory)?.label
                  : 'Select a category tile to view insight'}
              </h2>
              <Inline gap="sm">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/scenes/builder">
                    Scene Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/abundance">
                    Log Abundance
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Inline>
            </Inline>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12 text-neutral-400">
                <Spinner />
              </div>
            ) : detailError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
                {detailError}
              </div>
            ) : categoryDetail && selectedCategory ? (
              <Stack gap="lg">
                {categoryDetail.reflection ? (
                  <div className="rounded-2xl border border-[#39FF14]/40 bg-[#39FF14]/10 p-6">
                    <h3 className="text-lg font-semibold text-[#39FF14] mb-3">
                      VIVA’s Reflection
                    </h3>
                    <p className="text-neutral-100 text-sm leading-6 whitespace-pre-line">
                      {categoryDetail.reflection}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
                    Reflection will appear once we have more vibrational data in this category.
                  </div>
                )}

                <Grid responsiveCols={{ mobile: 1, tablet: 2 }} gap="lg">
                  <div className="rounded-2xl border border-[#333] bg-[#1F1F1F] p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Trendline</h3>
                    <Sparkline events={categoryDetail.events} />
                    <div className="mt-4 text-xs text-neutral-400">
                      Showing last {categoryDetail.events.length} vibrational moments.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#333] bg-[#1F1F1F] p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-white">Essence Signals</h3>
                    <Inline gap="sm" wrap>
                      {(categoryDetail.snapshot?.dominant_essence_words ?? []).map((word) => (
                        <Badge key={word} variant="accent">
                          {word.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </Inline>
                    <div className="text-sm text-neutral-300">
                      <span className="text-neutral-400">Intensity:</span>{' '}
                      {categoryDetail.snapshot?.avg_intensity
                        ? categoryDetail.snapshot.avg_intensity.toFixed(1)
                        : '—'}
                    </div>
                    <div className="text-sm text-neutral-300">
                      <span className="text-neutral-400">Events this week:</span>{' '}
                      {categoryDetail.snapshot?.event_count_7d ?? 0}
                    </div>
                  </div>
                </Grid>

                <Stack gap="md">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Vibrational Moments
                  </h3>
                  {categoryDetail.events.length === 0 ? (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
                      No recorded moments yet. Capture one through journaling, scene editing, or logging an abundance note.
                    </div>
                  ) : (
                    <Stack gap="sm">
                      {categoryDetail.events
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                          >
                            <Inline justify="between" align="center" className="text-xs text-neutral-400 mb-2">
                              <span>{new Date(event.created_at).toLocaleString()}</span>
                              <Badge variant="info">
                                {event.emotional_valence.replace(/_/g, ' ')}
                              </Badge>
                            </Inline>
                            <p className="text-sm text-neutral-200 leading-6">
                              {event.summary_in_their_voice || 'No summary available.'}
                            </p>
                          </div>
                        ))}
                    </Stack>
                  )}
                </Stack>

                <Stack gap="md">
                  <Inline justify="between" align="center">
                    <h3 className="text-lg font-semibold text-white">Scenes for this Category</h3>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/scenes/builder?category=${selectedCategory}`}>
                        Edit Scenes
                      </Link>
                    </Button>
                  </Inline>

                  {categoryDetail.scenes.length === 0 ? (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
                      No saved scenes yet. Generate your first visualization in the Scene Builder.
                    </div>
                  ) : (
                    <Stack gap="md">
                      {categoryDetail.scenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-6 space-y-3"
                        >
                          <Inline justify="between" align="center">
                            <h4 className="text-lg font-semibold text-white">{scene.title}</h4>
                            <Badge variant="premium">
                              {scene.essence_word ? `Essence: ${scene.essence_word}` : 'Essence pending'}
                            </Badge>
                          </Inline>
                          <p className="text-sm text-neutral-300 line-clamp-4 md:line-clamp-none">
                            {scene.text}
                          </p>
                        </div>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
                Select a category tile from the grid above to view detailed insights.
              </div>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

