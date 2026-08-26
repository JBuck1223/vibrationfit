'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import type { LeBook, LeCharacter, BookReadingMode } from '@/lib/life-explorer/types'

interface TodayContext {
  studentName: string | null
  expeditionTitle: string | null
  topWonder: string | null
}

interface TopicIdea {
  topic: string
  source: 'life_learning' | 'year_map'
  label: string
}

const SPECIES_EMOJI: Record<string, string> = {
  penguin: '🐧',
  hamster: '🐹',
  raccoon: '🦝',
  octopus: '🐙',
  puppy: '🐶',
  dog: '🐶',
  cat: '🐱',
}

function characterEmoji(c: LeCharacter): string {
  return SPECIES_EMOJI[(c.species || '').toLowerCase()] || '⭐'
}

export default function BooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<LeBook[]>([])
  const [topicIdeas, setTopicIdeas] = useState<TopicIdea[]>([])
  const [characters, setCharacters] = useState<LeCharacter[]>([])
  const [ctx, setCtx] = useState<TodayContext>({
    studentName: null,
    expeditionTitle: null,
    topWonder: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create-book form
  const [topic, setTopic] = useState('')
  const topicTouched = useRef(false)
  const [readingMode, setReadingMode] = useState<BookReadingMode>('read_to_me')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Custom character form
  const [showCharForm, setShowCharForm] = useState(false)
  const [charForm, setCharForm] = useState({
    name: '',
    species: '',
    personality: '',
    catchphrase: '',
    visual_description: '',
  })
  const [charSaving, setCharSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [todayRes, charsRes, booksRes] = await Promise.all([
        fetch('/api/life-explorer/lessons/today'),
        fetch('/api/life-explorer/book-characters'),
        fetch('/api/life-explorer/books?ideas=1'),
      ])
      const today = await todayRes.json()
      const wonders = (today.wonder_wall?.wonder || []) as Array<{
        statement: string
        priority: number | null
        interest_level: number | null
        status: string
      }>
      const top =
        wonders
          .filter((w) => w.status !== 'answered')
          .sort((a, b) => {
            const aQ = a.priority != null
            const bQ = b.priority != null
            if (aQ && bQ) return (a.priority || 0) - (b.priority || 0)
            if (aQ !== bQ) return aQ ? -1 : 1
            return (b.interest_level ?? 0) - (a.interest_level ?? 0)
          })[0]?.statement || null
      setCtx({
        studentName: today.student?.name || null,
        expeditionTitle: today.expedition?.title || null,
        topWonder: top,
      })
      if (top && !topicTouched.current) setTopic(top)

      const charsJson = await charsRes.json()
      if (charsRes.ok) setCharacters(charsJson.characters || [])

      const booksJson = await booksRes.json()
      if (booksRes.ok) {
        setBooks(booksJson.books || [])
        setTopicIdeas(booksJson.topic_ideas || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Poll while any book is still illustrating
  const anyGenerating = useMemo(() => books.some((b) => b.status === 'generating'), [books])
  useEffect(() => {
    if (!anyGenerating) return
    const t = setInterval(async () => {
      const res = await fetch('/api/life-explorer/books')
      if (res.ok) {
        const json = await res.json()
        setBooks(json.books || [])
      }
    }, 5000)
    return () => clearInterval(t)
  }, [anyGenerating])

  function toggleCharacter(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]
    )
  }

  async function createBook() {
    if (!topic.trim() || selectedIds.length === 0 || creating) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          reading_mode: readingMode,
          character_ids: selectedIds,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Book generation failed')
      setBooks((prev) => [json.book, ...prev])
      setSelectedIds([])
      topicTouched.current = false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Book generation failed')
    } finally {
      setCreating(false)
    }
  }

  async function saveCharacter() {
    if (!charForm.name.trim() || !charForm.personality.trim() || !charForm.visual_description.trim())
      return
    setCharSaving(true)
    try {
      const res = await fetch('/api/life-explorer/book-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(charForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create character')
      setCharacters((prev) => [...prev, json.character])
      setShowCharForm(false)
      setCharForm({ name: '', species: '', personality: '', catchphrase: '', visual_description: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character')
    } finally {
      setCharSaving(false)
    }
  }

  async function deleteBook(id: string) {
    if (!confirm('Delete this book? This can’t be undone.')) return
    const res = await fetch(`/api/life-explorer/books/${id}`, { method: 'DELETE' })
    if (res.ok) setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  async function retryBook(id: string) {
    const res = await fetch(`/api/life-explorer/books/${id}`, { method: 'POST' })
    if (res.ok) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: 'generating', status_detail: 'Picking the paintbrushes back up…' } : b
        )
      )
    }
  }

  if (loading) {
    return (
      <Container size="lg" className="py-16 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Storybooks</h2>
          <p className="text-neutral-400 mt-2">
            Original picture books starring the Life Explorers — written and illustrated for{' '}
            {ctx.studentName || 'your explorer'}, about whatever they&apos;re wondering right now.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Make a new book */}
        <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white">Make a new book</h3>
          {ctx.topWonder && (
            <p className="text-xs text-[#00FFFF] mt-1">
              Top wonder right now: “{ctx.topWonder}”
            </p>
          )}

          <label className="block mt-4 text-sm text-neutral-300">
            What is the book about?
            <input
              value={topic}
              onChange={(e) => {
                topicTouched.current = true
                setTopic(e.target.value)
              }}
              placeholder="e.g. How does ice fishing work?"
              className="mt-1.5 w-full rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-3 text-white placeholder-neutral-600 focus:border-[#39FF14] focus:outline-none"
            />
          </label>

          {topicIdeas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {topicIdeas.map((idea) => (
                <button
                  key={idea.topic}
                  type="button"
                  onClick={() => {
                    topicTouched.current = true
                    setTopic(idea.topic)
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    topic === idea.topic
                      ? 'border-[#39FF14]/60 text-[#39FF14]'
                      : 'border-[#2a2a2a] text-neutral-400 hover:border-[#444] hover:text-neutral-200'
                  }`}
                >
                  <span className="text-neutral-600 mr-1.5">{idea.label}</span>
                  {idea.topic}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-neutral-300 mb-1.5">Who reads it?</p>
            <div className="inline-flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-1">
              {(
                [
                  { key: 'i_read', label: 'I read it' },
                  { key: 'read_to_me', label: 'Read to me' },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setReadingMode(m.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    readingMode === m.key
                      ? 'bg-[#39FF14] text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              {readingMode === 'i_read'
                ? 'Short decodable sentences at the current reading rung — they read it out loud themselves.'
                : 'Richer, funnier read-aloud text for a grown-up to perform.'}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm text-neutral-300 mb-2">
              Pick the cast <span className="text-neutral-500">(1–3 explorers)</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {characters.map((c) => {
                const selected = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCharacter(c.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? 'border-[#39FF14] bg-[#39FF14]/10'
                        : 'border-[#2a2a2a] bg-[#0c0c0c] hover:border-[#444]'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                      {c.portrait_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.portrait_url}
                          alt={c.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{characterEmoji(c)}</span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm font-semibold ${selected ? 'text-[#39FF14]' : 'text-white'}`}>
                      {c.name}
                    </p>
                    {c.catchphrase && (
                      <p className="text-[11px] text-neutral-500 italic leading-snug mt-0.5">
                        “{c.catchphrase}”
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Portraits paint themselves the first time an explorer stars in a book.
            </p>
          </div>

          <button
            onClick={createBook}
            disabled={creating || !topic.trim() || selectedIds.length === 0}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#5FFF3E] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Writing the story… (about a minute)
              </>
            ) : (
              'Write our book'
            )}
          </button>
          {creating && (
            <p className="text-xs text-neutral-500 mt-2">
              The story gets written first, then every page is illustrated one by one — the book
              appears on the shelf below and fills in as it paints.
            </p>
          )}
        </section>

        {/* Bookshelf */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">
            {ctx.studentName ? `${ctx.studentName}’s bookshelf` : 'Bookshelf'}
          </h3>
          {books.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2a2a2a] p-8 text-center text-neutral-500 text-sm">
              No books yet — the first one is one wonder away.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="group relative rounded-2xl border border-[#222] bg-[#111] overflow-hidden"
                >
                  <button
                    onClick={() => router.push(`/homeschool/life-explorer/books/${b.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="aspect-square w-full bg-[#1a1a1a] flex items-center justify-center">
                      {b.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-4 text-center">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#39FF14]/30 border-t-[#39FF14]" />
                          <span className="text-xs text-neutral-500">
                            {b.status === 'failed' ? 'Didn’t finish' : b.status_detail || 'Working…'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white leading-snug">{b.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-[#1f1f1f] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#00FFFF]">
                          {b.reading_mode === 'i_read' ? 'I read it' : 'Read to me'}
                        </span>
                        {b.status === 'generating' && (
                          <span className="rounded-full bg-[#39FF14]/10 px-2 py-0.5 text-[10px] text-[#39FF14]">
                            {b.status_detail || 'Illustrating…'}
                          </span>
                        )}
                        {b.status === 'failed' && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                            failed
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {b.status === 'failed' && (
                      <button
                        onClick={() => retryBook(b.id)}
                        title="Try illustrating again"
                        className="rounded-full bg-black/70 px-2 py-1 text-[10px] text-[#39FF14] hover:bg-black"
                      >
                        retry
                      </button>
                    )}
                    <button
                      onClick={() => deleteBook(b.id)}
                      title="Delete book"
                      className="rounded-full bg-black/70 px-2 py-1 text-[10px] text-red-400 hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Meet the Explorers */}
        <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Meet the Life Explorers</h3>
            <button
              onClick={() => setShowCharForm((v) => !v)}
              className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors"
            >
              {showCharForm ? 'Close' : '+ Add your own explorer'}
            </button>
          </div>

          {showCharForm && (
            <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={charForm.name}
                  onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                  placeholder="Name (e.g. Explorer Oliver)"
                  className="rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#39FF14] focus:outline-none"
                />
                <input
                  value={charForm.species}
                  onChange={(e) => setCharForm({ ...charForm, species: e.target.value })}
                  placeholder="Species (e.g. kid, tiger, robot)"
                  className="rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#39FF14] focus:outline-none"
                />
              </div>
              <input
                value={charForm.catchphrase}
                onChange={(e) => setCharForm({ ...charForm, catchphrase: e.target.value })}
                placeholder="Catchphrase (optional, e.g. “To the wonder wall!”)"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#39FF14] focus:outline-none"
              />
              <textarea
                value={charForm.personality}
                onChange={(e) => setCharForm({ ...charForm, personality: e.target.value })}
                placeholder="Personality — what makes them funny? (e.g. brave but always loses one shoe)"
                rows={2}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#39FF14] focus:outline-none"
              />
              <textarea
                value={charForm.visual_description}
                onChange={(e) => setCharForm({ ...charForm, visual_description: e.target.value })}
                placeholder="What do they look like? Be specific — hair, clothes, colors, what they carry. This keeps them looking the same in every book."
                rows={3}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#39FF14] focus:outline-none"
              />
              <button
                onClick={saveCharacter}
                disabled={
                  charSaving ||
                  !charForm.name.trim() ||
                  !charForm.personality.trim() ||
                  !charForm.visual_description.trim()
                }
                className="rounded-lg bg-[#39FF14] px-4 py-2 text-xs font-semibold text-black hover:bg-[#5FFF3E] transition-colors disabled:opacity-40"
              >
                {charSaving ? 'Creating…' : 'Create explorer'}
              </button>
              <p className="text-[11px] text-neutral-500">
                Their portrait paints itself in the background — refresh in a minute to see it.
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {characters.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                  {c.portrait_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.portrait_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">{characterEmoji(c)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {c.name}
                    {c.species && <span className="text-neutral-500 font-normal"> · {c.species}</span>}
                  </p>
                  <p className="text-xs text-neutral-400 leading-snug mt-0.5 line-clamp-3">
                    {c.personality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Stack>
    </Container>
  )
}
