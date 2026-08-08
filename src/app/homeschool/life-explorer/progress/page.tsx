'use client'

import { useEffect, useState } from 'react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'

interface ProgressSummary {
  student_name: string
  expedition_title: string | null
  life_category: string | null
  lessons_this_week: number
  reading_practiced: number
  writing_observed: number
  math_practiced: number
  research_questions: number
  evidence_this_week: number
  strongest_interest: string | null
  skills: Array<{
    skill: string
    subject: string
    status: string
    notes: string | null
  }>
}

export default function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/progress')
        const json = await res.json()
        setSummary(json.summary)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  if (!summary) {
    return (
      <Container size="md" className="py-16">
        <p className="text-neutral-400">No progress yet. Start an expedition from Today.</p>
      </Container>
    )
  }

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <h2 className="text-3xl font-bold text-white">Progress</h2>
          <p className="text-neutral-400 mt-2">
            A calm summary for {summary.student_name}
            {summary.expedition_title
              ? ` · ${summary.life_category} / ${summary.expedition_title}`
              : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Stat label="Lessons this week" value={String(summary.lessons_this_week)} />
          <Stat label="Reading practiced" value={`${summary.reading_practiced} times`} />
          <Stat label="Writing observed" value={`${summary.writing_observed} activities`} />
          <Stat label="Math practiced" value={`${summary.math_practiced} times`} />
          <Stat label="Research questions" value={String(summary.research_questions)} />
          <Stat label="Evidence this week" value={String(summary.evidence_this_week)} />
        </div>

        {summary.strongest_interest && (
          <div className="rounded-xl border border-[#222] bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Current strongest interest
            </p>
            <p className="text-white mt-1 text-lg">{summary.strongest_interest}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Skills observed</h3>
          {(summary.skills || []).length === 0 && (
            <p className="text-neutral-500 text-sm">Skills will appear after check-ins.</p>
          )}
          <ul className="space-y-2">
            {(summary.skills || []).map((skill, i) => (
              <li
                key={`${skill.skill}-${i}`}
                className="rounded-xl border border-[#222] bg-[#111] px-4 py-3"
              >
                <p className="text-white capitalize">
                  {skill.skill}{' '}
                  <span className="text-neutral-500 text-sm">({skill.subject})</span>
                </p>
                <p className="text-sm text-[#00FFFF] capitalize mt-0.5">{skill.status.replace(/_/g, ' ')}</p>
                {skill.notes && <p className="text-sm text-neutral-400 mt-1">{skill.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      </Stack>
    </Container>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-white text-xl font-semibold mt-1">{value}</p>
    </div>
  )
}
