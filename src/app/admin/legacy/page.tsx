'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ExternalLink,
  Search,
  X,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import {
  Container,
  Stack,
  PageHero,
  Card,
  Badge,
  Button,
  Input,
  Spinner,
} from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import {
  LEGACY_PAGES,
  LEGACY_STUDIOS,
  LEGACY_TIER_ORDER,
  LEGACY_PAGE_TIER_LABELS,
  LEGACY_PAGE_TIER_BADGE,
  buildLegacyHref,
  canPreviewLegacyPage,
  type LegacyPageEntry,
  type LegacyPageTier,
  type LegacySampleIds,
} from '@/lib/navigation/legacy-pages'

async function fetchLatestId(
  table: string,
  userId: string,
  userColumn = 'user_id'
): Promise<string | undefined> {
  const supabase = createClient()
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq(userColumn, userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.id
}

async function loadLegacySampleIds(): Promise<LegacySampleIds> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { categoryKey: 'fun' }

  const [
    visionId,
    storyId,
    journalId,
    visionBoardId,
    batchId,
    mapId,
    assessmentId,
    dailyPaperId,
    abundanceEventId,
  ] = await Promise.all([
    fetchLatestId('life_visions', user.id),
    fetchLatestId('stories', user.id),
    fetchLatestId('journal_entries', user.id),
    fetchLatestId('vision_board_items', user.id),
    fetchLatestId('audio_generation_batches', user.id),
    fetchLatestId('user_maps', user.id),
    fetchLatestId('assessment_results', user.id),
    fetchLatestId('daily_papers', user.id),
    fetchLatestId('abundance_events', user.id),
  ])

  let profileId: string | undefined
  try {
    const res = await fetch('/api/profile?includeVersions=true')
    if (res.ok) {
      const data = await res.json()
      profileId = data.versions?.[0]?.id
    }
  } catch {
    // Optional — profile preview links stay disabled without data
  }

  return {
    visionId,
    storyId,
    journalId,
    profileId,
    visionBoardId,
    batchId,
    mapId,
    assessmentId,
    dailyPaperId,
    abundanceEventId,
    categoryKey: 'fun',
  }
}

function LegacyPageRow({
  entry,
  samples,
}: {
  entry: LegacyPageEntry
  samples: LegacySampleIds
}) {
  const href = buildLegacyHref(entry, samples)
  const previewReady = canPreviewLegacyPage(entry, samples)
  const tierBadge = LEGACY_PAGE_TIER_BADGE[entry.tier]

  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{entry.label}</h3>
            <Badge variant={tierBadge}>{LEGACY_PAGE_TIER_LABELS[entry.tier]}</Badge>
            {entry.studio && (
              <Badge variant="neutral" className="text-neutral-400">
                {entry.studio}
              </Badge>
            )}
          </div>

          <code className="block text-xs md:text-sm text-[#00FFFF]/90 break-all">
            {entry.route}
          </code>

          <p className="text-sm text-neutral-400">{entry.reason}</p>

          {entry.replacement && (
            <p className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
              <span>Replace with</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
              <code className="text-[#39FF14]/90">{entry.replacement}</code>
            </p>
          )}

          {entry.file && (
            <p className="text-xs text-neutral-600 font-mono truncate">{entry.file}</p>
          )}

          {entry.sampleKeys && entry.sampleKeys.length > 0 && !previewReady && (
            <p className="text-xs text-[#FFB701] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Needs sample data: {entry.sampleKeys.join(', ')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {entry.archived && (
            <p className="text-xs text-neutral-500">
              Public URL redirects to {entry.replacement ?? '/admin/legacy'}
            </p>
          )}

          {href ? (
            <Button variant="primary" size="sm" asChild>
              <Link href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                {entry.archived ? 'Open archive' : 'Open page'}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              No preview
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function AdminLegacyPage() {
  const [samples, setSamples] = useState<LegacySampleIds>({ categoryKey: 'fun' })
  const [loadingSamples, setLoadingSamples] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<LegacyPageTier | 'all'>('all')
  const [studioFilter, setStudioFilter] = useState<string>('all')

  const refreshSamples = async () => {
    setLoadingSamples(true)
    try {
      setSamples(await loadLegacySampleIds())
    } finally {
      setLoadingSamples(false)
    }
  }

  useEffect(() => {
    refreshSamples()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return LEGACY_PAGES.filter(entry => {
      if (tierFilter !== 'all' && entry.tier !== tierFilter) return false
      if (studioFilter !== 'all' && entry.studio !== studioFilter) return false
      if (!q) return true
      return (
        entry.label.toLowerCase().includes(q) ||
        entry.route.toLowerCase().includes(q) ||
        entry.reason.toLowerCase().includes(q) ||
        (entry.replacement?.toLowerCase().includes(q) ?? false) ||
        (entry.studio?.toLowerCase().includes(q) ?? false) ||
        (entry.file?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [search, tierFilter, studioFilter])

  const grouped = useMemo(() => {
    const groups = new Map<LegacyPageTier, LegacyPageEntry[]>()
    for (const tier of LEGACY_TIER_ORDER) groups.set(tier, [])
    for (const entry of filtered) {
      groups.get(entry.tier)?.push(entry)
    }
    return LEGACY_TIER_ORDER
      .map(tier => ({ tier, entries: groups.get(tier) ?? [] }))
      .filter(g => g.entries.length > 0)
  }, [filtered])

  const counts = useMemo(() => {
    const byTier = Object.fromEntries(LEGACY_TIER_ORDER.map(t => [t, 0])) as Record<LegacyPageTier, number>
    for (const p of LEGACY_PAGES) byTier[p.tier]++
    return byTier
  }, [])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN"
          title="Legacy Pages"
          subtitle="Deprecated routes are archived under /admin/legacy/archive. Public URLs redirect to current studio pages. Open archive copies to compare before deleting."
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {LEGACY_TIER_ORDER.map(tier => (
              <Badge key={tier} variant={LEGACY_PAGE_TIER_BADGE[tier]}>
                {LEGACY_PAGE_TIER_LABELS[tier]}: {counts[tier]}
              </Badge>
            ))}
          </div>
        </PageHero>

        <Card className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search routes, labels, files…"
                  className="pl-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSamples}
                disabled={loadingSamples}
                className="shrink-0"
              >
                {loadingSamples ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh preview IDs
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTierFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  tierFilter === 'all'
                    ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
              >
                All tiers
              </button>
              {LEGACY_TIER_ORDER.map(tier => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    tierFilter === tier
                      ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {LEGACY_PAGE_TIER_LABELS[tier]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStudioFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  studioFilter === 'all'
                    ? 'border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/10'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
              >
                All studios
              </button>
              {LEGACY_STUDIOS.map(studio => (
                <button
                  key={studio}
                  type="button"
                  onClick={() => setStudioFilter(studio)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    studioFilter === studio
                      ? 'border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/10'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {studio}
                </button>
              ))}
            </div>

            {!loadingSamples && (
              <p className="text-xs text-neutral-500">
                Preview links use your account&apos;s latest records
                {samples.visionId && ` · vision ${samples.visionId.slice(0, 8)}…`}
                {samples.storyId && ` · story ${samples.storyId.slice(0, 8)}…`}
              </p>
            )}
          </div>
        </Card>

        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-neutral-400">
            <Archive className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No legacy pages match your filters.
          </Card>
        ) : (
          grouped.map(({ tier, entries }) => (
            <div key={tier}>
              <h2 className="text-lg font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                <Archive className="w-5 h-5" />
                {LEGACY_PAGE_TIER_LABELS[tier]}
                <span className="text-neutral-500 font-normal">({entries.length})</span>
              </h2>
              <Stack gap="md">
                {entries.map(entry => (
                  <LegacyPageRow key={entry.route} entry={entry} samples={samples} />
                ))}
              </Stack>
            </div>
          ))
        )}
      </Stack>
    </Container>
  )
}
