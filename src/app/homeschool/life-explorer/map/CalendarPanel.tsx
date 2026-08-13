'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Container,
  Stack,
  Spinner,
  Button,
  Input,
  Textarea,
  FileUpload,
} from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { ensureJpegCompatible } from '@/lib/life-explorer/ensure-jpeg'
import type { LeActivityLog, LeStudent, ActivityMediaType } from '@/lib/life-explorer/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface MediaDraft {
  media_type: ActivityMediaType
  url: string
  caption: string | null
}

function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayKey() {
  const now = new Date()
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate())
}

function formatDuration(minutes: number) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function formatDateLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CalendarPanel() {
  const searchParams = useSearchParams()
  const initialDate = (() => {
    const d = searchParams.get('date')
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayKey()
  })()
  const [year, setYear] = useState(() => Number(initialDate.slice(0, 4)))
  const [monthIndex, setMonthIndex] = useState(() => Number(initialDate.slice(5, 7)) - 1)
  const [student, setStudent] = useState<LeStudent | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [entries, setEntries] = useState<LeActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [editing, setEditing] = useState<LeActivityLog | 'new' | null>(
    searchParams.get('new') === '1' ? 'new' : null
  )
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const prefillTitle = searchParams.get('title') || ''

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  useEffect(() => {
    async function loadStudent() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const res = await fetch('/api/life-explorer/students')
      const json = await res.json()
      setStudent(json.students?.[0] || null)
      if (!json.students?.[0]) setLoading(false)
    }
    void loadStudent()
  }, [])

  const loadEntries = useCallback(async () => {
    if (!student) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/life-explorer/activity-log?student_id=${student.id}&month=${monthStr}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load activity log')
      setEntries(json.entries || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }, [student, monthStr])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, LeActivityLog[]>()
    for (const entry of entries) {
      const list = map.get(entry.entry_date) || []
      list.push(entry)
      map.set(entry.entry_date, list)
    }
    return map
  }, [entries])

  const monthTotals = useMemo(() => {
    const daysLogged = entriesByDate.size
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    return { daysLogged, totalMinutes, entryCount: entries.length }
  }, [entries, entriesByDate])

  // Calendar grid: leading blanks + days of month
  const grid = useMemo(() => {
    const firstWeekday = new Date(year, monthIndex, 1).getDay()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const cells: Array<number | null> = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [year, monthIndex])

  function changeMonth(delta: number) {
    const next = new Date(year, monthIndex + delta, 1)
    setYear(next.getFullYear())
    setMonthIndex(next.getMonth())
    setEditing(null)
  }

  function goToToday() {
    const t = new Date()
    setYear(t.getFullYear())
    setMonthIndex(t.getMonth())
    setSelectedDate(todayKey())
    setEditing(null)
  }

  async function deleteEntry(entry: LeActivityLog) {
    if (!confirm(`Delete "${entry.title}"? This removes it from your portfolio log.`)) return
    const res = await fetch(`/api/life-explorer/activity-log/${entry.id}`, { method: 'DELETE' })
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    } else {
      const json = await res.json()
      setError(json.error || 'Delete failed')
    }
  }

  const selectedEntries = entriesByDate.get(selectedDate) || []
  const today = todayKey()

  if (!student && !loading) {
    return (
      <Container size="md" className="py-10 md:py-14">
        <Stack gap="lg">
          <div>
            <h2 className="text-3xl font-bold text-white">Learning Calendar</h2>
            <p className="text-neutral-400 mt-2">Your contemporaneous log of educational activities.</p>
          </div>
          <p className="text-amber-200 text-sm">No student yet. Start from Today to set up your explorer.</p>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Learning Calendar</h2>
            <p className="text-neutral-400 mt-2">
              Log what you did, how long you schooled, reading titles, and photos/videos — your
              Florida portfolio record.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="rounded-full border border-[#333] px-3 py-1.5 text-sm text-neutral-300 hover:border-[#39FF14]/40 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              ←
            </button>
            <span className="text-white font-semibold min-w-[10rem] text-center">
              {MONTH_NAMES[monthIndex]} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="rounded-full border border-[#333] px-3 py-1.5 text-sm text-neutral-300 hover:border-[#39FF14]/40 hover:text-white transition-colors"
              aria-label="Next month"
            >
              →
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-full border border-[#333] px-3 py-1.5 text-sm text-neutral-300 hover:border-[#39FF14]/40 hover:text-white transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        {/* Month summary — useful for the FL portfolio */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryStat label="Days schooled" value={String(monthTotals.daysLogged)} />
          <SummaryStat label="Total time" value={formatDuration(monthTotals.totalMinutes)} />
          <SummaryStat label="Activities logged" value={String(monthTotals.entryCount)} />
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-3 md:p-4">
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs uppercase tracking-wide text-neutral-500 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {grid.map((day, i) => {
                if (day === null) return <div key={`blank-${i}`} />
                const dateKey = toDateKey(year, monthIndex, day)
                const dayEntries = entriesByDate.get(dateKey) || []
                const minutes = dayEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0)
                const hasMedia = dayEntries.some((e) => (e.media?.length || 0) > 0)
                const isSelected = dateKey === selectedDate
                const isToday = dateKey === today
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey)
                      setEditing(null)
                    }}
                    className={`min-h-[3.5rem] md:min-h-[4.5rem] rounded-lg border p-1.5 md:p-2 text-left transition-colors ${
                      isSelected
                        ? 'border-[#39FF14] bg-[#39FF14]/10'
                        : dayEntries.length > 0
                          ? 'border-[#00FFFF]/40 bg-[#00FFFF]/5 hover:border-[#39FF14]/50'
                          : 'border-[#222] hover:border-[#39FF14]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-xs md:text-sm font-medium ${
                          isToday
                            ? 'text-[#39FF14]'
                            : dayEntries.length > 0
                              ? 'text-white'
                              : 'text-neutral-500'
                        }`}
                      >
                        {day}
                      </span>
                      {hasMedia && <span className="text-[10px] md:text-xs">📷</span>}
                    </div>
                    {dayEntries.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] md:text-xs text-[#00FFFF] font-medium">
                          {formatDuration(minutes)}
                        </p>
                        <p className="text-[10px] md:text-xs text-neutral-400 truncate hidden md:block">
                          {dayEntries.length === 1
                            ? dayEntries[0].title
                            : `${dayEntries.length} activities`}
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected day detail */}
        <div className="rounded-2xl border border-[#222] bg-[#111] p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-white">{formatDateLabel(selectedDate)}</h3>
            {editing === null && (
              <Button variant="primary" onClick={() => setEditing('new')}>
                + Log Activity
              </Button>
            )}
          </div>

          {editing !== null && student && (
            <div className="mt-5">
              <EntryForm
                key={editing === 'new' ? `new-${selectedDate}` : editing.id}
                studentId={student.id}
                userId={userId}
                entryDate={selectedDate}
                existing={editing === 'new' ? null : editing}
                defaultTitle={editing === 'new' ? prefillTitle : ''}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  setEntries((prev) => {
                    const rest = prev.filter((e) => e.id !== saved.id)
                    return [...rest, saved].sort((a, b) =>
                      a.entry_date === b.entry_date
                        ? a.created_at.localeCompare(b.created_at)
                        : a.entry_date.localeCompare(b.entry_date)
                    )
                  })
                  setEditing(null)
                }}
              />
            </div>
          )}

          {editing === null && (
            <div className="mt-5 space-y-4">
              {selectedEntries.length === 0 && (
                <p className="text-neutral-500 text-sm">
                  Nothing logged for this day yet. Florida requires a contemporaneous log — record
                  activities the day they happen when you can.
                </p>
              )}
              {selectedEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[#222] bg-[#0f0f0f] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{entry.title}</p>
                      <p className="text-[#00FFFF] text-sm mt-0.5">
                        {formatDuration(entry.duration_minutes)}
                        {entry.subjects.length > 0 && (
                          <span className="text-neutral-400"> · {entry.subjects.join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing(entry)}
                        className="text-sm text-neutral-400 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry)}
                        className="text-sm text-neutral-400 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {entry.description && (
                    <p className="text-neutral-300 text-sm mt-2 whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  )}
                  {entry.reading_materials.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Reading materials
                      </p>
                      <ul className="mt-1 list-disc list-inside text-sm text-neutral-300">
                        {entry.reading_materials.map((title, i) => (
                          <li key={i}>{title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(entry.media?.length || 0) > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.media!.map((m) =>
                        m.media_type === 'video' ? (
                          <video
                            key={m.id}
                            src={m.url}
                            controls
                            preload="metadata"
                            className="h-32 rounded-lg border border-[#222]"
                          />
                        ) : (
                          <button
                            key={m.id}
                            type="button"
                            aria-label="View photo full size"
                            onClick={() => setLightbox(m.url)}
                            className="block"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.url}
                              alt={m.caption || entry.title}
                              className="h-32 w-32 rounded-lg object-cover border border-[#222] transition-transform hover:scale-[1.02]"
                            />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-neutral-600">
          Florida portfolio reminder: keep a log of educational activities made at the time of
          instruction (with reading material titles) plus samples of the student&apos;s work. Keep
          the portfolio for two years after completion.
        </p>
      </Stack>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Activity photo"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </Container>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-bold text-[#39FF14] mt-1">{value}</p>
    </div>
  )
}

function EntryForm({
  studentId,
  userId,
  entryDate,
  existing,
  defaultTitle = '',
  onCancel,
  onSaved,
}: {
  studentId: string
  userId: string | null
  entryDate: string
  existing: LeActivityLog | null
  defaultTitle?: string
  onCancel: () => void
  onSaved: (entry: LeActivityLog) => void
}) {
  const [title, setTitle] = useState(existing?.title || defaultTitle)
  const [description, setDescription] = useState(existing?.description || '')
  const [hours, setHours] = useState(
    existing ? String(Math.floor(existing.duration_minutes / 60)) : '0'
  )
  const [minutes, setMinutes] = useState(existing ? String(existing.duration_minutes % 60) : '0')
  const [readingMaterials, setReadingMaterials] = useState(
    (existing?.reading_materials || []).join('\n')
  )
  const [subjects, setSubjects] = useState((existing?.subjects || []).join(', '))
  const [media, setMedia] = useState<MediaDraft[]>(
    (existing?.media || []).map((m) => ({
      media_type: m.media_type,
      url: m.url,
      caption: m.caption,
    }))
  )
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: File[]) {
    if (files.length === 0) return
    setError(null)
    setUploadingCount(files.length)
    try {
      for (const file of files) {
        setUploadProgress(0)
        const mediaType: ActivityMediaType = file.type.startsWith('video/') ? 'video' : 'photo'
        // Browsers can't render HEIC — convert photos to JPEG before upload.
        const toUpload = mediaType === 'photo' ? await ensureJpegCompatible(file) : file
        const result = await uploadUserFile('lifeExplorer', toUpload, userId || undefined, (p) =>
          setUploadProgress(p)
        )
        setMedia((prev) => [...prev, { media_type: mediaType, url: result.url, caption: null }])
        setUploadingCount((c) => c - 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadingCount(0)
    }
  }

  async function save() {
    if (!title.trim()) {
      setError('Give the activity a short title (e.g. "Read about penguins, math workbook p. 12")')
      return
    }
    setSaving(true)
    setError(null)
    const durationMinutes =
      Math.max(0, parseInt(hours || '0', 10) || 0) * 60 +
      Math.max(0, parseInt(minutes || '0', 10) || 0)
    const payload = {
      student_id: studentId,
      entry_date: entryDate,
      title: title.trim(),
      description: description.trim() || null,
      duration_minutes: durationMinutes,
      reading_materials: readingMaterials
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      subjects: subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      media,
    }
    try {
      const res = existing
        ? await fetch(`/api/life-explorer/activity-log/${existing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/life-explorer/activity-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      onSaved(json.entry)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const isUploading = uploadingCount > 0

  return (
    <div className="rounded-xl border border-[#39FF14]/30 bg-[#0f0f0f] p-4 md:p-5 space-y-4">
      <h4 className="text-white font-semibold">
        {existing ? 'Edit activity' : 'Log activity'} — {formatDateLabel(entryDate)}
      </h4>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <Field label="What did you do?">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Penguin habitat experiment + reading"'
        />
      </Field>

      <Field label="Details (optional)">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What was covered, what the student made or said…"
        />
      </Field>

      <Field label="Time spent schooling">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-24"
          />
          <span className="text-neutral-400 text-sm">hours</span>
          <Input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-24"
          />
          <span className="text-neutral-400 text-sm">minutes</span>
        </div>
      </Field>

      <Field label="Reading materials used (one title per line)">
        <Textarea
          value={readingMaterials}
          onChange={(e) => setReadingMaterials(e.target.value)}
          rows={3}
          placeholder={'The Emperor\u2019s Egg by Martin Jenkins\nNational Geographic Kids: Penguins'}
        />
      </Field>

      <Field label="Subjects (comma-separated, optional)">
        <Input
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          placeholder="science, reading, math"
        />
      </Field>

      <Field label="Photos / videos">
        <FileUpload
          accept="image/*,video/*"
          multiple
          maxFiles={10}
          maxSize={5120}
          onUpload={handleFiles}
          isUploading={isUploading}
          showProgress
          uploadProgress={uploadProgress}
          showPreviews={false}
          label="Add photos or videos"
          value={[]}
        />
        {media.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {media.map((m, i) => (
              <div key={`${m.url}-${i}`} className="relative">
                {m.media_type === 'video' ? (
                  <video
                    src={m.url}
                    preload="metadata"
                    className="h-24 w-24 rounded-lg object-cover border border-[#222]"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt="Uploaded media"
                    className="h-24 w-24 rounded-lg object-cover border border-[#222]"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 rounded-full bg-[#1F1F1F] border border-[#333] w-6 h-6 text-xs text-neutral-300 hover:text-red-400"
                  aria-label="Remove media"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button variant="primary" onClick={save} disabled={saving || isUploading}>
          {saving ? 'Saving…' : isUploading ? 'Uploading…' : existing ? 'Save Changes' : 'Save to Log'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-300 mb-2">{label}</span>
      {children}
    </label>
  )
}
