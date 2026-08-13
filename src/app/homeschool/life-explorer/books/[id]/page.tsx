'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Spinner } from '@/lib/design-system/components'
import type { LeBook, LeBookPage } from '@/lib/life-explorer/types'

interface CastMember {
  id: string
  name: string
  species: string | null
  catchphrase: string | null
  portrait_url: string | null
}

/**
 * Full-screen storybook reader.
 * Sheets: 0 = cover, 1..n = story pages, n+1 = "The End" back cover.
 * Turn pages by tapping the page edges, swiping, or arrow keys.
 */
export default function BookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [book, setBook] = useState<LeBook | null>(null)
  const [pages, setPages] = useState<LeBookPage[]>([])
  const [cast, setCast] = useState<CastMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [idx, setIdx] = useState(0)
  const [flip, setFlip] = useState<'next' | 'prev' | null>(null)
  const [entering, setEntering] = useState<'next' | 'prev' | null>(null)
  const touchStartX = useRef<number | null>(null)

  const [redoOpen, setRedoOpen] = useState(false)
  const [redoNotes, setRedoNotes] = useState('')
  const [redoBusy, setRedoBusy] = useState(false)
  const [redoError, setRedoError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/life-explorer/books/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load book')
      setBook(json.book)
      setPages(json.pages || [])
      setCast(json.characters || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Poll while the book is still illustrating
  useEffect(() => {
    if (!book || book.status !== 'generating') return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [book, load])

  const total = pages.length + 2 // cover + pages + end

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (flip) return
      const target = idx + (dir === 'next' ? 1 : -1)
      if (target < 0 || target > total - 1) return
      setFlip(dir)
      setTimeout(() => {
        setIdx(target)
        setFlip(null)
        setEntering(dir)
        setTimeout(() => setEntering(null), 260)
      }, 220)
    },
    [flip, idx, total]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (redoOpen) return
      if (e.key === 'ArrowRight' || e.key === ' ') go('next')
      if (e.key === 'ArrowLeft') go('prev')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, redoOpen])

  const sheet = useMemo(() => {
    if (!book) return null
    if (idx === 0) return { kind: 'cover' as const }
    if (idx === total - 1) return { kind: 'end' as const }
    return { kind: 'page' as const, page: pages[idx - 1] }
  }, [book, idx, total, pages])

  // A picture can be redone on the cover and story pages, once the book isn't
  // actively illustrating.
  const canRedo =
    !!book &&
    book.status !== 'generating' &&
    (sheet?.kind === 'cover' || (sheet?.kind === 'page' && !!sheet.page))

  const submitRedo = async () => {
    if (!book || !sheet || sheet.kind === 'end') return
    setRedoBusy(true)
    setRedoError(null)
    try {
      const target = sheet.kind === 'cover' ? 'cover' : sheet.page.id
      const res = await fetch(`/api/life-explorer/books/${book.id}/redo-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, notes: redoNotes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Redo failed')
      setRedoOpen(false)
      setRedoNotes('')
      await load() // book is now 'generating' → the existing poll takes over
    } catch (err) {
      setRedoError(err instanceof Error ? err.message : 'Redo failed')
    } finally {
      setRedoBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (error || !book) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-red-400 text-sm">{error || 'Book not found'}</p>
        <Link
          href="/homeschool/life-explorer/books"
          className="mt-4 inline-block text-sm text-neutral-400 hover:text-white"
        >
          ← Back to the bookshelf
        </Link>
      </div>
    )
  }

  const iRead = book.reading_mode === 'i_read'
  const flipStyle =
    flip === 'next'
      ? 'origin-left [transform:perspective(1400px)_rotateY(-70deg)] opacity-40'
      : flip === 'prev'
        ? 'origin-right [transform:perspective(1400px)_rotateY(70deg)] opacity-40'
        : entering === 'next'
          ? 'animate-[pageInNext_0.26s_ease-out]'
          : entering === 'prev'
            ? 'animate-[pageInPrev_0.26s_ease-out]'
            : ''

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a0a]">
      <style>{`
        @keyframes pageInNext {
          from { transform: perspective(1400px) rotateY(60deg); opacity: 0.3; transform-origin: right; }
          to { transform: none; opacity: 1; }
        }
        @keyframes pageInPrev {
          from { transform: perspective(1400px) rotateY(-60deg); opacity: 0.3; transform-origin: left; }
          to { transform: none; opacity: 1; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#1c1c1c] px-4 py-3">
        <Link
          href="/homeschool/life-explorer/books"
          className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors"
        >
          ← Bookshelf
        </Link>
        <p className="min-w-0 truncate text-sm text-neutral-400">
          <span className="text-white font-medium">{book.title}</span>
          <span className="ml-2 rounded-full bg-[#1f1f1f] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#00FFFF]">
            {iRead ? 'I read it' : 'Read to me'}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {canRedo && (
            <button
              onClick={() => {
                setRedoError(null)
                setRedoOpen(true)
              }}
              className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#FF00FF] hover:text-[#FF00FF] transition-colors"
            >
              Redo picture
            </button>
          )}
          <p className="text-xs text-neutral-500">
            {idx === 0 ? 'Cover' : idx === total - 1 ? 'The End' : `${idx} / ${pages.length}`}
          </p>
        </div>
      </div>

      {book.status === 'generating' && (
        <div className="border-b border-[#1c1c1c] bg-[#39FF14]/5 px-4 py-2 text-center text-xs text-[#39FF14]">
          {book.status_detail || 'Illustrating…'} — pages appear as they finish painting.
        </div>
      )}

      {/* The page */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-3 py-4 select-none"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(dx) < 40) return
          go(dx < 0 ? 'next' : 'prev')
        }}
      >
        <div
          key={idx}
          className={`flex max-h-full w-full max-w-2xl flex-col items-center transition-all duration-200 ${flipStyle}`}
        >
          {sheet?.kind === 'cover' && (
            <div className="w-full rounded-3xl border border-[#2a2a2a] bg-[#111] p-4 md:p-6 shadow-[0_0_60px_rgba(57,255,20,0.06)]">
              <div className="aspect-square w-full overflow-hidden rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-500 text-sm">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#39FF14]/30 border-t-[#39FF14]" />
                    Painting the cover…
                  </div>
                )}
              </div>
              <h1 className="mt-4 text-center text-2xl md:text-3xl font-bold text-white">
                {book.title}
              </h1>
              <p className="mt-1 text-center text-xs uppercase tracking-[0.22em] text-[#39FF14]/80">
                A Life Explorers Book
              </p>
              {book.premise && (
                <p className="mt-2 text-center text-sm text-neutral-400">{book.premise}</p>
              )}
            </div>
          )}

          {sheet?.kind === 'page' && sheet.page && (
            <div className="w-full rounded-3xl border border-[#2a2a2a] bg-[#111] p-4 md:p-6">
              <div className="aspect-square w-full overflow-hidden rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                {sheet.page.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sheet.page.image_url}
                    alt={`Page ${sheet.page.page_number}`}
                    className="h-full w-full object-cover"
                  />
                ) : sheet.page.status === 'failed' ? (
                  <p className="px-6 text-center text-xs text-neutral-500">
                    This picture didn&apos;t come out — the words still work!
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-500 text-sm">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#39FF14]/30 border-t-[#39FF14]" />
                    Painting this page…
                  </div>
                )}
              </div>
              <p
                className={`mt-4 text-center text-white ${
                  iRead
                    ? 'text-2xl md:text-3xl font-semibold leading-relaxed tracking-wide'
                    : 'text-lg md:text-xl leading-relaxed'
                }`}
              >
                {sheet.page.text}
              </p>
            </div>
          )}

          {sheet?.kind === 'end' && (
            <div className="w-full rounded-3xl border border-[#2a2a2a] bg-[#111] p-8 text-center">
              <p className="text-4xl">🎉</p>
              <h2 className="mt-3 text-3xl font-bold text-white">The End</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Starring {cast.map((c) => c.name).join(', ') || 'the Life Explorers'}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {cast.map(
                  (c) =>
                    c.portrait_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={c.id}
                        src={c.portrait_url}
                        alt={c.name}
                        className="h-14 w-14 rounded-full border border-[#2a2a2a] object-cover"
                      />
                    )
                )}
              </div>
              {book.facts_taught && book.facts_taught.length > 0 && (
                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FFFF]">
                    Real things this book taught
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {book.facts_taught.map((fact, i) => (
                      <li key={i} className="flex gap-2 text-sm text-neutral-300">
                        <span className="text-[#00FFFF]">✓</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setIdx(0)}
                  className="rounded-xl bg-[#39FF14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
                >
                  Read it again
                </button>
                <Link
                  href="/homeschool/life-explorer/books"
                  className="rounded-xl border border-[#2a2a2a] px-5 py-2.5 text-sm text-neutral-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors"
                >
                  Back to the bookshelf
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Tap zones */}
        {idx > 0 && (
          <button
            aria-label="Previous page"
            onClick={() => go('prev')}
            className="absolute inset-y-0 left-0 w-1/5 cursor-w-resize"
          />
        )}
        {idx < total - 1 && (
          <button
            aria-label="Next page"
            onClick={() => go('next')}
            className="absolute inset-y-0 right-0 w-1/5 cursor-e-resize"
          />
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 border-t border-[#1c1c1c] px-4 py-3">
        <button
          onClick={() => go('prev')}
          disabled={idx === 0}
          className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-[#39FF14] hover:text-[#39FF14] disabled:opacity-30"
        >
          ← Back
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-5 bg-[#39FF14]' : 'w-1.5 bg-[#2a2a2a]'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go('next')}
          disabled={idx === total - 1}
          className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-[#39FF14] hover:text-[#39FF14] disabled:opacity-30"
        >
          Turn the page →
        </button>
      </div>

      {/* Redo picture dialog */}
      {redoOpen && sheet && sheet.kind !== 'end' && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !redoBusy && setRedoOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#141414] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">
              Redo {sheet.kind === 'cover' ? 'the cover' : `page ${sheet.page.page_number}`}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              The picture gets repainted in the same setting with the same characters. Add notes
              to tell the illustrator what to fix — they stick to this page for any future redo.
            </p>
            <textarea
              value={redoNotes}
              onChange={(e) => setRedoNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              autoFocus
              placeholder={`What's wrong? e.g. "They should be out on the ice, and Pip needs his fishing pole"`}
              className="mt-3 w-full resize-none rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14] focus:outline-none"
            />
            {redoError && <p className="mt-2 text-xs text-red-400">{redoError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRedoOpen(false)}
                disabled={redoBusy}
                className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={submitRedo}
                disabled={redoBusy}
                className="rounded-xl bg-[#39FF14] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors disabled:opacity-50"
              >
                {redoBusy ? 'Sending…' : 'Repaint it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
