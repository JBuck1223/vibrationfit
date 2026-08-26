'use client'

import { Suspense, use, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Library, Paperclip } from 'lucide-react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { FacilitatorGuide } from '@/components/life-explorer/FacilitatorGuide'
import { WeekLessonList } from '@/components/life-explorer/WeekLessonList'
import type { LeExpedition, LeWonderItem, LessonStatus } from '@/lib/life-explorer/types'
import type { ExpeditionSequence } from '@/lib/life-explorer/sequence'

interface ChapterMedia {
  id: string
  url: string
  media_type: 'photo' | 'video' | 'file'
  caption: string | null
}

interface Chapter {
  id: string
  lesson_number: number
  title: string
  essential_question: string | null
  status: LessonStatus
  planned_for: string
  started_at: string | null
  completed_at: string | null
  estimated_total_minutes: number | null
  story_mission: string | null
  celebration_close: string | null
  child_output: string | null
  check_in: {
    enjoyed_most: string | null
    created_said_demonstrated: string | null
    easy_or_difficult: string | null
    new_questions: string[] | null
    direction: string | null
  } | null
  media: ChapterMedia[]
}

interface GalleryItem {
  id: string
  url: string
  media_type: 'photo' | 'video' | 'file'
  caption: string | null
  explanation: string | null
  file_name: string | null
  source: 'lesson' | 'evidence' | 'calendar'
  lesson_id: string | null
  lesson_title: string | null
  date: string
}

interface BookRow {
  id: string
  title: string
  premise: string | null
  status: string
  cover_url: string | null
  page_count: number | null
}

interface DayRow {
  id: string
  entry_date: string
  title: string
  duration_minutes: number | null
  reading_materials: string[] | null
  subjects: string[] | null
}

interface RecordResponse {
  expedition: LeExpedition
  sequence?: ExpeditionSequence
  chapters: Chapter[]
  wonder_wall: { know: LeWonderItem[]; wonder: LeWonderItem[]; learned: LeWonderItem[] }
  gallery: GalleryItem[]
  books: BookRow[]
  days: DayRow[]
  totals: {
    chapters_total: number
    chapters_completed: number
    minutes: number
    wonders_total: number
    wonders_answered: number
    gallery_items: number
    days_logged: number
  }
}

const LESSON_STATUS: Record<LessonStatus, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-[#00FFFF]/10 text-[#00FFFF]' },
  in_progress: { label: 'In progress', className: 'bg-[#FFFF00]/10 text-[#FFFF00]' },
  completed: { label: 'Completed', className: 'bg-[#39FF14]/10 text-[#39FF14]' },
  skipped: { label: 'Set aside', className: 'bg-neutral-500/10 text-neutral-400' },
}

const EXPEDITION_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-[#39FF14]/10 text-[#39FF14]' },
  paused: { label: 'Paused', className: 'bg-[#FFFF00]/10 text-[#FFFF00]' },
  completed: { label: 'Completed', className: 'bg-[#00FFFF]/10 text-[#00FFFF]' },
}

function fmtDate(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function hoursLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function ExpeditionRecordPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <Container size="lg" className="flex justify-center py-20">
          <Spinner />
        </Container>
      }
    >
      <ExpeditionRecordInner {...props} />
    </Suspense>
  )
}

function ExpeditionRecordInner({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const [data, setData] = useState<RecordResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/life-explorer/expeditions/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load the expedition record')
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load the expedition record')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  if (!data?.expedition) {
    return (
      <Container size="md" className="py-16">
        <p className="text-neutral-400">
          {error || 'Expedition not found.'}{' '}
          <Link href="/homeschool/life-explorer/expeditions" className="text-[#39FF14] underline">
            All expeditions
          </Link>
        </p>
      </Container>
    )
  }

  const { expedition, sequence, chapters, wonder_wall: wall, gallery, books, days, totals } = data
  const badge = EXPEDITION_STATUS[expedition.status] || EXPEDITION_STATUS.paused
  const photos = gallery.filter((g) => g.media_type === 'photo' || g.media_type === 'video')
  const files = gallery.filter((g) => g.media_type === 'file')
  const dayParam = Number(searchParams.get('day') || '')
  const selectedDay =
    sequence && sequence.steps.some((s) => s.day === dayParam)
      ? dayParam
      : sequence?.current_day || 1
  const selectedChapter = chapters.find((c) => c.lesson_number === selectedDay)

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Link
            href="/homeschool/life-explorer/expeditions"
            className="text-sm text-neutral-400 hover:text-white"
          >
            ← All expeditions
          </Link>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#39FF14]/80 mb-1.5">
                Expedition
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {expedition.title}
              </h2>
            </div>
            <span
              className={`mt-7 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          {expedition.why_this_matters && (
            <p className="mt-2 text-sm text-[#00FFFF]">
              <span className="text-neutral-500">Why this matters: </span>
              {expedition.why_this_matters}
            </p>
          )}
          <p className="text-sm text-neutral-500 mt-2">Started {fmtDate(expedition.start_date)}</p>
          {(expedition.essential_questions || []).length > 0 && (
            <ul className="mt-3 space-y-1">
              {expedition.essential_questions.map((q, i) => (
                <li key={i} className="text-sm text-neutral-300">
                  · {q}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Chapters" value={`${totals.chapters_completed}/${totals.chapters_total}`} />
          <Stat label="On the clock" value={totals.minutes > 0 ? hoursLabel(totals.minutes) : '—'} />
          <Stat
            label="Wonders answered"
            value={totals.wonders_total > 0 ? `${totals.wonders_answered}/${totals.wonders_total}` : '—'}
          />
          <Stat label="Photos & files" value={String(totals.gallery_items)} />
          <Stat label="Days logged" value={String(totals.days_logged)} />
        </div>

        {/* Live / closing card */}
        {expedition.status === 'active' ? (
          <div className="rounded-2xl border-2 border-[#39FF14]/60 bg-gradient-to-br from-[#0d1a0d] to-[#111] p-6">
            <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">Live now</p>
            <p className="text-neutral-200">
              This expedition is being lived right now — today&apos;s chapter composes on the Today
              page.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/homeschool/life-explorer"
                className="inline-flex items-center rounded-xl bg-[#39FF14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
              >
                Go to Today
              </Link>
              <Link
                href="/homeschool/life-explorer/wonder"
                className="inline-flex items-center rounded-xl border border-[#333] px-5 py-2.5 text-sm font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
              >
                Wonder Wall
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
              Keepsakes
            </p>
            <p className="text-sm text-neutral-300">
              Print the Expedition Kit — including the certificate — any time.
            </p>
            <a
              href={`/api/life-explorer/print/kit?expedition_id=${expedition.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center rounded-lg border border-[#333] px-4 py-2 text-xs font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
            >
              Print Expedition Kit
            </a>
          </div>
        )}

        {sequence && sequence.steps.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                This week’s lessons
              </p>
              <WeekLessonList sequence={sequence} />
            </div>
            {sequence.guide && <FacilitatorGuide guide={sequence.guide} />}
          </section>
        )}

        {selectedChapter && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Open chapter
            </p>
            <ChapterCard chapter={selectedChapter} />
          </section>
        )}

        {/* How his thinking changed */}
        {(wall.know.length > 0 || wall.wonder.length > 0 || wall.learned.length > 0) && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              How his thinking changed
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <WonderColumn
                title="What I knew"
                hint="His starting beliefs — original words, never corrected."
                items={wall.know.map((w) => ({ id: w.id, text: w.statement, dim: false }))}
              />
              <WonderColumn
                title="What I wondered"
                hint="Questions that pulled the expedition forward."
                items={wall.wonder.map((w) => ({
                  id: w.id,
                  text: w.statement,
                  dim: false,
                  tag: w.status === 'answered' ? 'answered' : 'open',
                }))}
              />
              <WonderColumn
                title="What I learned"
                hint="Discoveries in his own words."
                items={wall.learned.map((w) => ({ id: w.id, text: w.statement, dim: false }))}
              />
            </div>
          </section>
        )}

        {/* The journey in pictures */}
        {photos.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              The journey in pictures
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((g) => (
                <GalleryTile key={g.id} item={g} />
              ))}
            </div>
          </section>
        )}

        {/* Files */}
        {files.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Files</p>
            <ul className="space-y-2">
              {files.map((g) => (
                <li key={g.id}>
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#111] px-4 py-3 hover:border-[#39FF14]/40 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white truncate">
                        {g.file_name || g.caption || 'File'}
                      </span>
                      {g.lesson_title && (
                        <span className="block text-xs text-neutral-500 mt-0.5">
                          {g.lesson_title}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-neutral-500 shrink-0">{fmtDate(g.date)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Books from this world */}
        {books.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Books from this world
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/homeschool/life-explorer/books/${b.id}`}
                  className="rounded-xl border border-[#222] bg-[#111] p-3 hover:border-[#39FF14]/40 transition-colors"
                >
                  {b.cover_url ? (
                    <Image
                      src={b.cover_url}
                      alt={b.title}
                      width={200}
                      height={200}
                      unoptimized
                      className="w-full aspect-square rounded-lg border border-[#2a2a2a] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center">
                      <Library className="h-8 w-8 text-neutral-600" />
                    </div>
                  )}
                  <p className="text-sm text-white font-medium mt-2 truncate">{b.title}</p>
                  {b.page_count != null && (
                    <p className="text-xs text-neutral-500 mt-0.5">{b.page_count} pages</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Days lived */}
        {days.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Days lived
            </p>
            <ul className="space-y-2">
              {days.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-[#222] bg-[#111] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-white min-w-0">{d.title}</p>
                    <p className="text-xs text-neutral-500 shrink-0">
                      {fmtDate(d.entry_date)}
                      {d.duration_minutes ? ` · ${hoursLabel(d.duration_minutes)}` : ''}
                    </p>
                  </div>
                  {(d.reading_materials || []).length > 0 && (
                    <p className="text-xs text-neutral-500 mt-1.5 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {(d.reading_materials || []).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </Stack>
    </Container>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] px-3 py-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-0.5">{label}</p>
    </div>
  )
}

function ChapterCard({ chapter: c }: { chapter: Chapter }) {
  const badge = LESSON_STATUS[c.status] || LESSON_STATUS.ready
  const checkIn = c.check_in
  const photos = c.media.filter((m) => m.media_type !== 'file')
  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
      <Link href={`/homeschool/life-explorer/lesson/${c.id}`} className="block group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Chapter {c.lesson_number} · {fmtDate(c.planned_for)}
            </p>
            <p className="text-white font-semibold mt-0.5 group-hover:text-[#39FF14] transition-colors">
              {c.title}
            </p>
            {c.essential_question && (
              <p className="text-sm text-neutral-400 mt-1">{c.essential_question}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </Link>

      {checkIn &&
        (checkIn.enjoyed_most ||
          checkIn.created_said_demonstrated ||
          (checkIn.new_questions || []).length > 0) && (
          <div className="mt-3 rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-3 space-y-1.5">
            {checkIn.enjoyed_most && (
              <p className="text-sm text-neutral-300">
                <span className="text-neutral-500">Loved: </span>
                {checkIn.enjoyed_most}
              </p>
            )}
            {checkIn.created_said_demonstrated && (
              <p className="text-sm text-neutral-300">
                <span className="text-neutral-500">Made / said: </span>
                {checkIn.created_said_demonstrated}
              </p>
            )}
            {(checkIn.new_questions || []).map((q, i) => (
              <p key={i} className="text-sm text-[#00FFFF]">
                <span className="text-neutral-500">New question: </span>
                {q}
              </p>
            ))}
          </div>
        )}

      {photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((m) => (
            <Image
              key={m.id}
              src={m.url}
              alt={m.caption || 'Upload'}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 shrink-0 rounded-lg border border-[#2a2a2a] object-cover"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WonderColumn({
  title,
  hint,
  items,
}: {
  title: string
  hint: string
  items: Array<{ id: string; text: string; dim: boolean; tag?: string }>
}) {
  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-4">
      <p className="text-white font-semibold text-sm">{title}</p>
      <p className="text-xs text-neutral-500 mt-0.5 mb-3">{hint}</p>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-600">Nothing recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="text-sm text-neutral-300">
              {i.text}
              {i.tag && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    i.tag === 'answered'
                      ? 'bg-[#39FF14]/10 text-[#39FF14]'
                      : 'bg-[#2a2a2a] text-neutral-400'
                  }`}
                >
                  {i.tag}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function GalleryTile({ item }: { item: GalleryItem }) {
  const inner = (
    <>
      <Image
        src={item.url}
        alt={item.caption || 'Journey photo'}
        width={400}
        height={400}
        unoptimized
        className="w-full aspect-square rounded-lg border border-[#2a2a2a] object-cover"
      />
      {(item.caption || item.explanation) && (
        <p className="text-xs text-neutral-300 mt-1.5 line-clamp-2">
          {item.explanation ? `“${item.explanation}”` : item.caption}
        </p>
      )}
      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
        {item.lesson_title || (item.source === 'calendar' ? 'Calendar day' : fmtDate(item.date))}
      </p>
    </>
  )
  if (item.lesson_id) {
    return (
      <Link
        href={`/homeschool/life-explorer/lesson/${item.lesson_id}`}
        className="block hover:opacity-90 transition-opacity"
      >
        {inner}
      </Link>
    )
  }
  return <div>{inner}</div>
}
