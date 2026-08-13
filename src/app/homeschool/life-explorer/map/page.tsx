'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Container, Stack, Spinner } from '@/lib/design-system/components'

interface MapExpedition {
  id: string
  life_category: string
  title: string
  status: string
  start_date: string
  lessons_total: number
  lessons_completed: number
}

interface MapCategory {
  key: string
  label: string
  theme: string
  expeditions: MapExpedition[]
  has_active: boolean
  has_completed: boolean
}

interface CoverageRow {
  area: { key: string; label: string; fl_benchmark_family: string }
  touches_last_30_days: number
  level: 'green' | 'thin' | 'untouched'
  last_touched: string | null
}

interface MapResponse {
  student: { id: string; name: string; state_code?: string | null } | null
  state_profile: { name: string; statute: string; recommended_evaluation: string }
  categories: MapCategory[]
  coverage: CoverageRow[]
  suggestions: Array<{ kind: string; label: string }>
}

type Tab = 'map' | 'reports'

function LearningMapContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (searchParams.get('tab') === 'calendar') {
      router.replace('/homeschool/life-explorer/calendar')
    }
  }, [searchParams, router])

  const tab: Tab = searchParams.get('tab') === 'reports' ? 'reports' : 'map'
  const [data, setData] = useState<MapResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/map')
        const json = await res.json()
        setData(json)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  function setTab(next: Tab) {
    router.replace(`/homeschool/life-explorer/map${next === 'map' ? '' : `?tab=${next}`}`)
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <h2 className="text-3xl font-bold text-white">Learning Map</h2>
          <p className="text-neutral-400 mt-2">
            Where {data?.student?.name || 'your explorer'} stands across all of life — and proof
            for the state, one click away.{' '}
            <Link
              href="/homeschool/life-explorer/overview"
              className="text-[#00FFFF] hover:underline"
            >
              How Life Explorer works
            </Link>
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(
            [
              { key: 'map', label: 'Map' },
              { key: 'reports', label: 'Reports' },
            ] as Array<{ key: Tab; label: string }>
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                tab === t.key
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-neutral-300 hover:border-[#39FF14]/40'
              }`}
            >
              {t.label}
            </button>
          ))}
          <Link
            href="/homeschool/life-explorer/calendar"
            className="rounded-full px-4 py-2 text-sm border border-[#333] text-neutral-300 hover:border-[#39FF14]/40 transition-colors"
          >
            Calendar
          </Link>
        </div>

        {tab === 'reports' && <ReportsPanel />}
        {tab === 'map' &&
          (loading ? (
            <div className="py-16 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <MapPanel data={data} />
          ))}
      </Stack>
    </Container>
  )
}

export default function LearningMapPage() {
  return (
    <Suspense
      fallback={
        <Container size="lg" className="py-20 flex justify-center">
          <Spinner />
        </Container>
      }
    >
      <LearningMapContent />
    </Suspense>
  )
}

function MapPanel({ data }: { data: MapResponse | null }) {
  if (!data?.student) {
    return (
      <p className="text-amber-200 text-sm">
        No explorer yet — start from{' '}
        <Link href="/homeschool/life-explorer" className="underline text-[#39FF14]">
          Today
        </Link>
        .
      </p>
    )
  }

  return (
    <Stack gap="lg">
      {/* Coverage radar */}
      <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Coverage Radar</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Last 30 days by subject area. Thin areas softly steer future lessons — never guilt.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.coverage.map((c) => (
            <div
              key={c.area.key}
              className={`rounded-xl border p-3 ${
                c.level === 'green'
                  ? 'border-[#39FF14]/40 bg-[#39FF14]/5'
                  : c.level === 'thin'
                    ? 'border-amber-400/40 bg-amber-400/5'
                    : 'border-[#333] bg-[#0f0f0f]'
              }`}
            >
              <p className="text-white text-sm font-medium">{c.area.label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{c.area.fl_benchmark_family}</p>
              <p
                className={`text-xs mt-2 capitalize ${
                  c.level === 'green'
                    ? 'text-[#39FF14]'
                    : c.level === 'thin'
                      ? 'text-amber-300'
                      : 'text-neutral-500'
                }`}
              >
                {c.level} · {c.touches_last_30_days} touches
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 12 Life Categories → Expeditions */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-1">Life Categories & Expeditions</h3>
        <p className="text-sm text-neutral-500 mb-4">
          The open world: done, active, and unexplored. Curiosity picks the next destination.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.categories.map((cat) => (
            <div
              key={cat.key}
              className={`rounded-2xl border p-4 ${
                cat.has_active
                  ? 'border-[#39FF14]/50 bg-[#39FF14]/5'
                  : cat.has_completed
                    ? 'border-[#00FFFF]/30 bg-[#00FFFF]/5'
                    : 'border-[#222] bg-[#111]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">{cat.label}</p>
                {cat.has_active && (
                  <span className="text-[10px] uppercase tracking-wide text-[#39FF14] border border-[#39FF14]/40 rounded-full px-2 py-0.5">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{cat.theme}</p>
              <div className="mt-3 space-y-1.5">
                {cat.expeditions.length === 0 && (
                  <p className="text-xs text-neutral-600">Unexplored territory</p>
                )}
                {cat.expeditions.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-200">{e.title}</span>
                    <span className="text-xs text-neutral-500 capitalize">
                      {e.status} · {e.lessons_completed}/{e.lessons_total}
                    </span>
                  </div>
                ))}
                {/* Imported archive: finished static unit as a completed expedition */}
                {cat.key === 'fun' && (
                  <Link
                    href="/homeschool/oliver-ocean-adventures"
                    className="flex items-center justify-between text-sm group"
                  >
                    <span className="text-neutral-400 group-hover:text-white">
                      Ocean Adventures (archive)
                    </span>
                    <span className="text-xs text-neutral-600">completed</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Where next?</h3>
          <ul className="space-y-2">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-neutral-300 flex gap-2">
                <span className="text-[#00FFFF]">→</span>
                {s.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-neutral-600">
        {data.state_profile?.name} · {data.state_profile?.statute} · Recommended evaluation:{' '}
        {data.state_profile?.recommended_evaluation}
      </p>
    </Stack>
  )
}

function ReportsPanel() {
  const reports = [
    {
      section: 'activity-log',
      title: 'Daily Activity Log',
      description:
        'The contemporaneous log Florida requires — auto-written by every completed lesson plus your quick-adds.',
    },
    {
      section: 'reading-list',
      title: 'Reading List',
      description: 'Every title read or read aloud, auto-built from lesson resources.',
    },
    {
      section: 'portfolio',
      title: 'Portfolio Packet',
      description:
        'Work samples with the student\u2019s own explanations — the Journey Feed as evaluator-ready pages.',
    },
    {
      section: 'binder',
      title: 'Annual Evaluation Binder',
      description:
        'Everything above plus the sequentially-progressive skills timeline. Print and hand to the evaluator.',
    },
  ]
  return (
    <Stack gap="md">
      <p className="text-sm text-neutral-500">
        One-click artifacts, all derived from lesson records — never manually maintained. Opens
        print-ready in a new tab.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((r) => (
          <a
            key={r.section}
            href={`/api/life-explorer/reports/binder?section=${r.section}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-[#222] bg-[#111] p-5 hover:border-[#39FF14]/40 transition-colors"
          >
            <p className="text-white font-semibold">{r.title}</p>
            <p className="text-sm text-neutral-400 mt-1">{r.description}</p>
            <p className="text-xs text-[#39FF14] mt-3">Open print-ready →</p>
          </a>
        ))}
      </div>
    </Stack>
  )
}
