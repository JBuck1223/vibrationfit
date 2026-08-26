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
  world_map?: Array<{
    key: string
    label: string
    hint: string
    items: Array<{ id: string; name: string; status: string; taste_looks_like?: string | null }>
  }>
  year_map?: Array<{
    idea: { key: string; subject: string; kid_prompt: string; weave_hint: string }
    level: 'green' | 'thin' | 'untouched'
    touches: number
    last_touched: string | null
  }>
  on_track?: string
  year_arc?: {
    school_year: string
    months: Array<{ month: string; tastes: Array<{ name: string; why: string }>; notes?: string }>
  } | null
  ledger?: {
    semester: { semester: number; aim: string }
    areas: Array<{ label: string; family: string; level: string; weather: string }>
  } | null
  categories: MapCategory[]
  coverage: CoverageRow[]
  suggestions: Array<{ kind: string; label: string }>
  expeditions?: Array<{ id: string; title: string; status: string }>
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
          <h2 className="text-3xl font-bold text-white">World Map</h2>
          <p className="text-neutral-400 mt-2">
            Everything {data?.student?.name || 'your explorer'} is set to taste this year, and how
            the record looks so far.{' '}
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
      {/* On-track sentence — the whole year in one breath */}
      {data.on_track && (
        <p className="rounded-2xl border border-[#39FF14]/25 bg-[#39FF14]/5 px-4 py-3 text-sm text-neutral-200 leading-relaxed">
          {data.on_track}
        </p>
      )}

      <ComposeBar />

      {/* Florida ledger weather */}
      <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Florida ledger</h3>
        <p className="text-sm text-neutral-500 mb-4">
          The last 30 days by subject, drawn automatically from lessons, evidence, and the
          activity log.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(data.ledger?.areas || data.coverage.map((c) => ({
            label: c.area.label,
            family: c.area.fl_benchmark_family,
            level: c.level,
            weather: `${c.level} · ${c.touches_last_30_days} touches`,
          }))).map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border p-3 ${
                c.level === 'green'
                  ? 'border-[#39FF14]/40 bg-[#39FF14]/5'
                  : c.level === 'thin'
                    ? 'border-amber-400/40 bg-amber-400/5'
                    : 'border-[#333] bg-[#0f0f0f]'
              }`}
            >
              <p className="text-white text-sm font-medium">{c.label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{c.family}</p>
              <p
                className={`text-xs mt-2 ${
                  c.level === 'green'
                    ? 'text-[#39FF14]'
                    : c.level === 'thin'
                      ? 'text-amber-300'
                      : 'text-neutral-500'
                }`}
              >
                {c.weather}
              </p>
            </div>
          ))}
        </div>
      </section>

      <WorldMapSection data={data} />

      <YearMapSection data={data} />

      {data.year_arc && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-1">
            {data.year_arc.school_year} arc
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            The year at a glance, drafted by VIVA. Edit anything.
          </p>
          <div className="space-y-2">
            {data.year_arc.months.map((m) => (
              <div key={m.month} className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
                <p className="text-white font-medium">{m.month}</p>
                <p className="text-sm text-neutral-400 mt-1">
                  {(m.tastes || []).map((t) => t.name).join(' · ') || m.notes}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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

function ComposeBar() {
  const [dump, setDump] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(kind: 'map' | 'arc') {
    setBusy(kind)
    setError(null)
    try {
      const url =
        kind === 'map' ? '/api/life-explorer/world-map' : '/api/life-explorer/year-arc'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: kind === 'map' ? 'draft' : undefined,
          parent_worlds_dump: dump,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'VIVA could not draft this')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft failed')
      setBusy(null)
    }
  }

  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
      <p className="text-white font-medium">Ask VIVA to draft</p>
      <p className="text-sm text-neutral-500 mt-1 mb-3">
        List worlds you&apos;re drawn to — sky, earth, water, motion, living things, places,
        making, people. VIVA drafts the map from the Life I Choose, and you can edit anything.
      </p>
      <textarea
        value={dump}
        onChange={(e) => setDump(e.target.value)}
        rows={3}
        placeholder="Ice, penguins, the backyard creek, how things freeze, maps, making boats…"
        className="w-full rounded-xl border border-[#333] bg-[#0a0a0a] text-white px-3 py-2 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void run('map')}
          className="rounded-full border border-[#39FF14]/40 px-4 py-2 text-sm text-[#39FF14] disabled:opacity-60"
        >
          {busy === 'map' ? 'Drafting map…' : 'Draft World Map'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void run('arc')}
          className="rounded-full border border-[#00FFFF]/40 px-4 py-2 text-sm text-[#00FFFF] disabled:opacity-60"
        >
          {busy === 'arc' ? 'Drafting year…' : 'Draft 9-month arc'}
        </button>
      </div>
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
    </div>
  )
}

function WorldMapSection({ data }: { data: MapResponse }) {
  const clusters = data.world_map || []
  const empty = clusters.every((c) => c.items.length === 0)
  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-1">World Map</h3>
      <p className="text-sm text-neutral-500 mb-4">
        The tastes ahead — sky, earth, water, motion, living things, places, making, people.
        Lessons pick one up when it fits the current expedition.
      </p>
      {empty && (
        <p className="text-sm text-neutral-500 mb-3">
          The map is empty. Ask VIVA to draft it from the Life I Choose, then edit.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {clusters.map((c) => (
          <div key={c.key} className="rounded-2xl border border-[#222] bg-[#111] p-4">
            <p className="text-white font-semibold">{c.label}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{c.hint}</p>
            <div className="mt-3 space-y-1.5">
              {c.items.length === 0 && <p className="text-xs text-neutral-600">—</p>}
              {c.items.map((i) => (
                <p key={i.id} className="text-sm text-neutral-200">
                  {i.name}
                  <span className="text-xs text-neutral-500"> · {i.status}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      {(data.expeditions || []).length > 0 && (
        <p className="text-xs text-neutral-500 mt-4">
          <Link href="/homeschool/life-explorer/expeditions" className="text-neutral-400 hover:text-white">
            Expeditions lived
          </Link>
          {': '}
          {(data.expeditions || []).map((e) => e.title).join(' · ')}
          {' · '}
          <Link href="/homeschool/oliver-ocean-adventures" className="text-neutral-400 hover:text-white">
            Ocean Adventures (archive)
          </Link>
        </p>
      )}
    </section>
  )
}

function YearMapSection({ data }: { data: MapResponse }) {
  const ideas = data.year_map || []
  if (ideas.length === 0) return null
  const science = ideas.filter((s) => s.idea.subject === 'science')
  const social = ideas.filter((s) => s.idea.subject === 'social_studies')

  const badge = (level: 'green' | 'thin' | 'untouched') =>
    level === 'green'
      ? 'border-[#39FF14]/40 text-[#39FF14]'
      : level === 'thin'
        ? 'border-amber-400/40 text-amber-300'
        : 'border-[#333] text-neutral-500'

  const label = (level: 'green' | 'thin' | 'untouched') =>
    level === 'green' ? 'met' : level === 'thin' ? 'touched once' : 'still ahead'

  const column = (title: string, rows: typeof ideas) => (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-4">
      <p className="text-white font-semibold mb-3">{title}</p>
      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.idea.key} className="flex items-start gap-2">
            <span
              className={`flex-none mt-0.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${badge(s.level)}`}
            >
              {label(s.level)}
            </span>
            <p className="text-sm text-neutral-300">{s.idea.kid_prompt}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-1">Year Map — Big Ideas</h3>
      <p className="text-sm text-neutral-500 mb-4">
        The first-grade science and social-studies ideas this year touches. Status comes from
        lived lessons and evidence — a checklist, not a calendar. Ideas still ahead softly
        steer future lessons and the next expedition&apos;s Unknown card.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {column('Science', science)}
        {column('Social studies', social)}
      </div>
    </section>
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
