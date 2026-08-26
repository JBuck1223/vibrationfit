'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import {
  MATH_LADDER,
  READING_LADDER,
  WRITING_LADDER,
  currentLadderPosition,
} from '@/lib/life-explorer/ladders'
import { lifeLearningWeather } from '@/lib/life-explorer/life-learning'
import { COMPASS_SLICES } from '@/lib/life-explorer/vf-kids'
import type { JourneyFeedItem, LeSkillProgress, LeStudent } from '@/lib/life-explorer/types'

interface MapCategory {
  key: string
  label: string
  theme: string
  expeditions: Array<{
    id: string
    title: string
    status: string
    lessons_completed: number
    lessons_total: number
  }>
}

export default function ProfilePage() {
  const [student, setStudent] = useState<LeStudent | null>(null)
  const [skills, setSkills] = useState<LeSkillProgress[]>([])
  const [categories, setCategories] = useState<MapCategory[]>([])
  const [feed, setFeed] = useState<JourneyFeedItem[]>([])
  const [expeditions, setExpeditions] = useState<Array<{ id: string; title: string; life_category: string }>>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [today, map, feedRes] = await Promise.all([
          fetch('/api/life-explorer/lessons/today').then((r) => r.json()),
          fetch('/api/life-explorer/map').then((r) => r.json()),
          fetch('/api/life-explorer/feed').then((r) => r.json()),
        ])
        setStudent(today.student || null)
        setSkills(today.skills || [])
        setCategories(map.categories || [])
        setFeed(feedRes.items || [])
        setExpeditions(feedRes.expeditions || [])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filteredFeed = useMemo(() => {
    if (filter === 'all') return feed
    return feed.filter((i) => i.expedition_id === filter)
  }, [feed, filter])

  const securedSkills = skills.filter((s) => s.status === 'secure')
  const completedExpeditions = categories.flatMap((c) =>
    c.expeditions.filter((e) => e.status === 'completed')
  )

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  if (!student) {
    return (
      <Container size="md" className="py-16">
        <p className="text-neutral-400">No explorer yet. Start from Today.</p>
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        {/* Identity + portrait */}
        <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#39FF14]/80 mb-2">
            Explorer Profile
          </p>
          <h2 className="text-3xl font-bold text-white">{student.name}</h2>
          <p className="text-neutral-400 mt-1">
            Grade {student.grade_level}
            {student.current_age ? ` · Age ${student.current_age}` : ''}
            {student.state_code ? ` · ${student.state_code}` : ' · FL'}
            {' · '}
            <Link href="/homeschool/life-explorer/vision" className="text-[#00FFFF] hover:underline">
              Life I Choose
            </Link>
            {' · '}
            <Link
              href="/homeschool/life-explorer/vision?step=profile"
              className="text-[#00FFFF] hover:underline"
            >
              Current-state profile
            </Link>
            {' · '}
            <Link href="/homeschool/life-explorer/progress" className="text-[#00FFFF] hover:underline">
              Progress
            </Link>
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <PortraitList label="Interests" items={student.interests || []} />
            <PortraitList label="Strengths" items={student.strengths || []} />
            <PortraitList label="Growing in" items={student.skills_needing_support || []} />
          </div>
        </div>

        {/* Experience ledger */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Expeditions completed" value={String(completedExpeditions.length)} />
          <Stat label="Creations captured" value={String(feed.length)} />
          <Stat label="Skills secured" value={String(securedSkills.length)} />
        </div>

        {/* Expeditions lived */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-1">Expeditions lived</h3>
          <p className="text-sm text-neutral-500 mb-3">
            Every world explored so far — tap one to revisit its chapters, or see{' '}
            <Link href="/homeschool/life-explorer/expeditions" className="text-[#00FFFF] hover:underline">
              all expeditions
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.flatMap((c) => c.expeditions).map((e) => (
              <Link
                key={e.id}
                href={`/homeschool/life-explorer/expeditions/${e.id}`}
                className="rounded-full border border-[#222] bg-[#111] px-3 py-1.5 text-sm text-neutral-200 hover:border-[#39FF14]/40 transition-colors"
              >
                {e.title}
                {e.status === 'active' ? ' · now' : ''}
              </Link>
            ))}
          </div>
        </section>

        {/* Ladders + Life Learning */}
        <LaddersAndLifeLearning student={student} skills={skills} />

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Skill Progress</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span
                  key={`${s.skill}-${i}`}
                  className={`rounded-full border px-3 py-1 text-xs capitalize ${
                    s.status === 'secure'
                      ? 'border-[#39FF14]/40 text-[#39FF14]'
                      : s.status === 'needs_support'
                        ? 'border-amber-400/40 text-amber-300'
                        : 'border-[#333] text-neutral-300'
                  }`}
                >
                  {s.skill} · {s.status.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Journey Feed */}
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Journey Feed</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Everything {student.name} made this year, newest first. This is the page
                grandparents get sent.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FeedFilter active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FeedFilter>
              {expeditions.map((e) => (
                <FeedFilter key={e.id} active={filter === e.id} onClick={() => setFilter(e.id)}>
                  {e.title}
                </FeedFilter>
              ))}
            </div>
          </div>

          {filteredFeed.length === 0 && (
            <p className="text-neutral-500 text-sm">
              No creations captured yet — finish a lesson and snap the artifact.
            </p>
          )}

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
            {filteredFeed.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </Stack>
    </Container>
  )
}

function LaddersAndLifeLearning({
  student,
  skills,
}: {
  student: LeStudent
  skills: LeSkillProgress[]
}) {
  const ladders = [
    { title: 'Math', pos: currentLadderPosition(MATH_LADDER, skills, student.grade_level) },
    { title: 'Reading', pos: currentLadderPosition(READING_LADDER, skills, student.grade_level) },
    { title: 'Writing', pos: currentLadderPosition(WRITING_LADDER, skills, student.grade_level) },
  ]
  const resources = lifeLearningWeather(skills)
  const storiedSlices = new Set(
    skills
      .filter(
        (s) =>
          s.subject === 'life_learning' && s.skill.startsWith('compass-') && s.status === 'secure'
      )
      .map((s) => s.skill.replace(/^compass-/, ''))
  )

  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-1">Ladders & Life Learning</h3>
      <p className="text-sm text-neutral-500 mb-3">
        Where the sequences stand right now — the current rung of each ladder and the year-long
        practice worlds.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {ladders.map((l) => (
          <div key={l.title} className="rounded-xl border border-[#222] bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{l.title} ladder</p>
            <p className="text-white text-sm font-medium mt-1">{l.pos.current_rung.label}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Rung {l.pos.rung_index + 1} of {l.pos.total_rungs}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {resources.map((r) => (
          <span
            key={r.resource.key}
            title={r.rung.label}
            className={`rounded-full border px-3 py-1 text-xs ${
              r.band === 'strong'
                ? 'border-[#39FF14]/40 text-[#39FF14]'
                : r.band === 'wobbly'
                  ? 'border-amber-400/40 text-amber-300'
                  : 'border-[#333] text-neutral-400'
            }`}
          >
            {r.resource.name} · {r.secured_count}/{r.total_rungs}
          </span>
        ))}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Life Compass — slices with a story
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMPASS_SLICES.map((s) => (
            <span
              key={s.key}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                storiedSlices.has(s.key)
                  ? 'border-[#39FF14]/40 text-[#39FF14] bg-[#39FF14]/5'
                  : 'border-[#2a2a2a] text-neutral-500'
              }`}
            >
              {s.kid_name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function PortraitList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{label}</p>
      {items.length === 0 ? (
        <p className="text-neutral-600 text-sm">—</p>
      ) : (
        <ul className="text-neutral-300 space-y-0.5">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-bold text-[#39FF14] mt-1">{value}</p>
    </div>
  )
}

function FeedFilter({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
        active
          ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
          : 'border-[#333] text-neutral-300 hover:border-[#39FF14]/40'
      }`}
    >
      {children}
    </button>
  )
}

function FeedCard({ item }: { item: JourneyFeedItem }) {
  const date = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <div className="break-inside-avoid rounded-2xl border border-[#222] bg-[#111] overflow-hidden">
      {item.media_url &&
        (item.media_type === 'video' ? (
          <video src={item.media_url} controls preload="metadata" className="w-full" />
        ) : item.media_type === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.media_url} alt={item.title} className="w-full object-cover" />
        ) : null)}
      <div className="p-4">
        <p className="text-white font-medium">{item.title}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {date}
          {item.expedition_title && (
            <span className="text-[#00FFFF]"> · {item.expedition_title}</span>
          )}
          {item.lesson_title && <span> · {item.lesson_title}</span>}
        </p>
        {item.student_explanation && (
          <p className="text-sm text-neutral-300 mt-2">&ldquo;{item.student_explanation}&rdquo;</p>
        )}
        {item.academic_tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.academic_tags.map((t, i) => (
              <span
                key={i}
                className="rounded-full border border-[#2a2a2a] px-2 py-0.5 text-[10px] text-neutral-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
