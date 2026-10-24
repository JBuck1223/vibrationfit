'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Check, ChevronDown, Loader2, NotebookPen, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GLASS_MENU } from '@/lib/app-shell/glass'
import { createClient } from '@/lib/supabase/client'
import { reportFlowSignal } from '@/hooks/useActiveFlow'

type SaveTarget = 'journal' | 'story' | 'incantation'

const TARGETS: { id: SaveTarget; label: string; icon: typeof BookOpen }[] = [
  { id: 'journal', label: 'Journal entry', icon: NotebookPen },
  { id: 'story', label: 'Story', icon: BookOpen },
  { id: 'incantation', label: 'Incantation', icon: Sparkles },
]

/** A short title from the reply's first line, without markdown marks. */
function titleFrom(text: string, fallback: string) {
  const first = text
    .split('\n')
    .map((l) => l.replace(/^[#>*\-\s]+/, '').replace(/[*_`]/g, '').trim())
    .find(Boolean)
  if (!first) return fallback
  return first.length > 60 ? `${first.slice(0, 57).trimEnd()}...` : first
}

/**
 * Save one VIVA reply exactly as written to the Journal, a Story or an
 * Incantation, always linked to the thread it came from. Counts toward an
 * open flow (journal_saved, story_created...).
 */
export function MessageSaveMenu({ text, threadId }: { text: string; threadId: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState<SaveTarget | null>(null)
  const [saved, setSaved] = useState<SaveTarget | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const save = async (target: SaveTarget) => {
    const content = text.trim()
    if (!content || saving) return
    setOpen(false)
    setSaving(target)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Please sign in to save this.')

      let href: string
      if (target === 'journal') {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            date: new Date().toLocaleDateString('en-CA'),
            title: titleFrom(content, 'From my VIVA conversation'),
            content,
            journal_tag: null,
            conversation_id: threadId,
            categories: [],
            image_urls: [],
            audio_recordings: [],
          })
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('Could not save to your Journal')
        href = `/journal/${data.id}`
        try {
          await supabase.rpc('increment_journal_stats', { p_user_id: user.id })
        } catch {
          /* stats are non-critical */
        }
        reportFlowSignal('journal_saved', href)
      } else {
        const words = content.split(/\s+/).filter(Boolean).length
        const { data, error } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            entity_type: 'custom',
            // Same link VIVA's own story tools use: the thread is the source entity.
            entity_id: threadId ?? crypto.randomUUID(),
            title: titleFrom(content, target === 'incantation' ? 'My Incantation' : 'My Story'),
            content,
            source: 'ai_generated',
            status: 'completed',
            word_count: words,
            metadata: {
              ...(target === 'incantation' ? { is_incantation: true } : {}),
              created_by: 'viva_saved_reply',
              source_label: 'VIVA conversation',
              viva_thread_id: threadId,
            },
          })
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('Could not save the story')
        href = `/story/${data.id}`
        reportFlowSignal(target === 'incantation' ? 'incantation_created' : 'story_created', href)
      }

      setSaved(target)
      window.setTimeout(() => setSaved(null), 2500)
      const label = TARGETS.find((t) => t.id === target)?.label ?? 'it'
      toast.success(`Saved as ${target === 'journal' ? 'a journal entry' : `a ${label.toLowerCase()}`}`, {
        action: { label: 'Open', onClick: () => router.push(href) },
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save this')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!!saving}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5 text-[#39FF14]" /> : <NotebookPen className="h-3.5 w-3.5" />}
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(GLASS_MENU, 'absolute bottom-full left-0 z-30 mb-1 w-48 overflow-hidden p-1')}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] text-white/50">Save exactly as written</p>
          {TARGETS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              onClick={() => void save(id)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <Icon className="h-4 w-4 text-[#d68bff]" /> {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
