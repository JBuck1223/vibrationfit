'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Mic, Trash2, Undo2 } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Button } from '@/lib/design-system/components'
import { keys } from '@/lib/query/keys'
import type { SeoIdeaSource, SeoPageIdea } from '@/lib/seo/ideas'
import { Panel, Pill } from './ui'

type Props = {
  /** Roadmap path (no leading slash) or '_general' for ideas not tied to a page yet. */
  path: string
  title?: string
  description?: string
}

async function readJson<T>(pending: Promise<Response>): Promise<T> {
  const response = await pending
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status})`)
  return body as T
}

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Founder idea inbox for one SEO page: tap the mic, talk, Whisper transcribes
 * into the box, save. Saved ideas are what Claude Code reads
 * (`npx tsx scripts/seo/ideas.ts <path>`) when it writes or redesigns the page.
 */
export function SeoIdeaCapture({ path, title = 'Ideas for this page', description }: Props) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  // A single onChange that adds a sentence or more came from a transcription, not a keystroke.
  const sourceRef = useRef<SeoIdeaSource>('typed')
  const queryKey = keys.seoPageIdeasFor(path)

  const ideas = useQuery({
    queryKey,
    queryFn: () => readJson<{ ideas: SeoPageIdea[] }>(fetch(`/api/admin/seo/ideas?path=${encodeURIComponent(path)}`)).then(b => b.ideas),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.seoPageIdeas })

  const save = useMutation({
    mutationFn: (transcript: string) =>
      readJson<{ idea: SeoPageIdea }>(
        fetch('/api/admin/seo/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, transcript, source: sourceRef.current }),
        }),
      ),
    onSuccess: () => {
      setDraft('')
      sourceRef.current = 'typed'
      setError(null)
      void invalidate()
    },
    onError: (e: Error) => setError(e.message),
  })

  const toggleApplied = useMutation({
    mutationFn: (idea: SeoPageIdea) =>
      readJson(fetch('/api/admin/seo/ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idea.id, applied: !idea.applied_at }),
      })),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => readJson(fetch(`/api/admin/seo/ideas?id=${encodeURIComponent(id)}`, { method: 'DELETE' })),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  })

  const handleChange = (next: string) => {
    if (!next) sourceRef.current = 'typed'
    else if (next.length - draft.length > 40) sourceRef.current = 'voice'
    setDraft(next)
  }

  const open = (ideas.data ?? []).filter(i => !i.applied_at)
  const applied = (ideas.data ?? []).filter(i => i.applied_at)

  return (
    <Panel
      title={<span className="flex items-center gap-2"><Mic className="h-4 w-4 text-[#39FF14]" /> {title}</span>}
      action={ideas.data && <span className="text-xs text-neutral-500">{open.length} open · {applied.length} applied</span>}
    >
      {description && <p className="mb-3 text-sm text-neutral-400">{description}</p>}

      <RecordingTextarea
        value={draft}
        onChange={handleChange}
        placeholder="Type or record what this page should do, say, show or feel like."
        rows={5}
        className="w-full"
        recordingPurpose="quick"
        storageFolder="journal"
        category="seo-ideas"
        instanceId={`seo-idea-${path}`}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">Saved ideas are read by Claude Code when it writes or redesigns this page.</p>
        <div className="flex gap-2">
          <Button variant="accent" size="sm" onClick={() => save.mutate(draft)} disabled={!draft.trim() || save.isPending} loading={save.isPending}>
            Save idea
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {ideas.isError && <p className="mt-4 text-sm text-red-400">Could not load ideas: {(ideas.error as Error).message}</p>}
      {ideas.data && ideas.data.length > 0 && (
        <ul className="mt-5 divide-y divide-white/5">
          {[...open, ...applied].map(idea => (
            <li key={idea.id} className={`flex gap-3 py-3 ${idea.applied_at ? 'opacity-50' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-neutral-200">{idea.transcript}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>{when(idea.created_at)}</span>
                  <Pill>{idea.source === 'voice' ? 'spoken' : 'typed'}</Pill>
                  {idea.applied_at && <Pill tone="success">applied</Pill>}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <button
                  type="button"
                  onClick={() => toggleApplied.mutate(idea)}
                  className="rounded-full p-2 text-neutral-500 hover:bg-white/5 hover:text-[#39FF14]"
                  aria-label={idea.applied_at ? 'Mark as open' : 'Mark as applied'}
                  title={idea.applied_at ? 'Mark as open' : 'Mark as applied'}
                >
                  {idea.applied_at ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { if (window.confirm('Delete this idea?')) remove.mutate(idea.id) }}
                  className="rounded-full p-2 text-neutral-500 hover:bg-white/5 hover:text-red-400"
                  aria-label="Delete idea"
                  title="Delete idea"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

