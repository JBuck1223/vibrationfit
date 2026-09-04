'use client'

/**
 * VIVA-led Life Vision update — /life-vision/update
 *
 * Two panes: chat with VIVA (talk or speak about what changed) and the live
 * draft (all categories, editable). VIVA streams proposed category text into
 * the draft pane as accept/edit/discard proposals; accepted text saves through
 * the existing draft APIs. Commit as Active finishes with the Activation Kit
 * dialog.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Diff from 'diff'
import {
  Sparkles, CheckCircle, ChevronDown, ChevronUp, X, Check,
  MessageCircle, FileText, Loader2,
} from 'lucide-react'
import { Button, Card, Spinner, Container, AutoResizeTextarea, Badge, Modal, VIVALoadingOverlay } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { useLifeVisionStudioAreaChrome } from '@/components/life-vision-studio/useLifeVisionStudioAreaChrome'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { VivaMarkdown } from '@/components/viva/VivaMarkdown'
import { VivaThinkingIndicator, VivaUserMessage } from '@/components/viva/VivaChatMessage'
import { readCoachStream, CoachStreamError } from '@/lib/viva/coach-stream'
import {
  parseVisionUpdateMessage,
  type VisionUpdateProposal,
} from '@/lib/life-vision/vision-update-stream'
import {
  updateDraftCategory,
  getVisionCategoryText,
  getCategoriesChangedFromActive,
  type VisionData,
} from '@/lib/life-vision/draft-helpers'
import {
  ORDERED_VISION_CATEGORIES,
  getVisionCategoryIcon,
  type VisionCategoryKey,
} from '@/lib/design-system/vision-categories'
import { CommitVisionDialog } from '@/components/life-vision/CommitVisionDialog'
import {
  VisionUpdateTour,
  hasSeenVisionUpdateTour,
  markVisionUpdateTourSeen,
  type VisionUpdateTourHandle,
  type VisionUpdateTourStepId,
} from '@/components/life-vision/VisionUpdateTour'

const CATEGORY_KEYS = ORDERED_VISION_CATEGORIES.map((c) => c.key)

const OPENING_MESSAGE =
  "I'm here with your whole vision open beside us. Tell me what's changed in your life — something new that's arrived, a dream that's grown, a chapter that's complete. Speak it or type it, and I'll propose the updates. You accept, edit, or discard every one before it touches your draft."

interface ChatMessage {
  role: 'user' | 'assistant'
  /** Raw text (assistant messages keep proposal markers for model context). */
  content: string
}

interface ProposalState extends VisionUpdateProposal {
  /** Member edits before accepting */
  editedText: string
}

type CategoryView = 'edits' | 'draft' | 'active'

const normText = (v: string) => v.replace(/\r\n/g, '\n').trim()

/** Word diff of active → draft: green highlights = added, red strikethrough = removed. */
function DiffText({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = useMemo(() => Diff.diffWords(oldText, newText), [oldText, newText])
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-300">
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="rounded bg-[#39FF14]/20 px-0.5 text-[#a4ff8a]">
              {part.value}
            </span>
          )
        }
        if (part.removed) {
          return (
            <span key={i} className="rounded bg-[#FF0040]/20 px-0.5 text-[#ff8ba7] line-through">
              {part.value}
            </span>
          )
        }
        return <span key={i}>{part.value}</span>
      })}
    </p>
  )
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Serialize contentEditable back to plain text, skipping removed-word spans. */
function editableToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (!(node instanceof HTMLElement)) return ''
  if (node.hasAttribute('data-removed')) return ''
  if (node.tagName === 'BR') return '\n'
  let inner = ''
  node.childNodes.forEach((child) => {
    inner += editableToText(child)
  })
  // contentEditable wraps new lines in block elements
  if (node.tagName === 'DIV' || node.tagName === 'P') return '\n' + inner
  return inner
}

/**
 * Editable text with the word-diff living right in the box: green = added,
 * red strikethrough = removed. The strikethroughs stay visible while typing
 * (they're non-editable inline spans); highlights recompute when focus leaves
 * the field.
 */
function EditableDiffField({
  oldText,
  value,
  onChange,
  minHeight = 100,
  placeholder,
}: {
  oldText: string
  value: string
  onChange: (value: string) => void
  minHeight?: number
  placeholder?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)

  const seed = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const parts = Diff.diffWords(oldText, value)
    el.innerHTML = parts
      .map((part) => {
        const text = escapeHtml(part.value)
        if (part.added) {
          return `<span class="rounded bg-[#39FF14]/20 px-0.5 text-[#a4ff8a]">${text}</span>`
        }
        if (part.removed) {
          return `<span data-removed contenteditable="false" class="rounded bg-[#FF0040]/20 px-0.5 text-[#ff8ba7] line-through">${text}</span>`
        }
        return text
      })
      .join('')
  }, [oldText, value])

  // Render the diff whenever the value changes from outside (VIVA restream,
  // revert, accept). While the member is typing, leave the DOM alone so the
  // caret never jumps.
  useEffect(() => {
    if (!focusedRef.current) seed()
  }, [seed])

  const showPlaceholder = !value.trim() && !oldText.trim()

  return (
    <div className="relative">
      {showPlaceholder && (
        <span className="pointer-events-none absolute left-3 top-3 text-sm text-neutral-600">
          {placeholder || 'Start writing…'}
        </span>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onFocus={() => {
          focusedRef.current = true
        }}
        onInput={() => {
          const el = editorRef.current
          if (el) onChange(editableToText(el).replace(/^\n/, ''))
        }}
        onBlur={() => {
          focusedRef.current = false
          seed()
        }}
        className="w-full cursor-text rounded-xl border border-[#333] bg-[#0A0A0A] p-3 text-sm leading-relaxed whitespace-pre-wrap break-words text-neutral-300 outline-none transition-colors focus:border-[#555] selection:bg-[#39FF14]/30"
        style={{ minHeight }}
      />
    </div>
  )
}

export default function VisionUpdatePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { activeVisionId, draftId, loading: studioLoading, refreshVisions } = useLifeVisionStudio()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<VisionData | null>(null)
  const [active, setActive] = useState<VisionData | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: OPENING_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const [proposals, setProposals] = useState<Record<string, ProposalState>>({})
  const [savingCategory, setSavingCategory] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<Record<string, CategoryView>>({})
  const [manualEdits, setManualEdits] = useState<Record<string, string>>({})

  const [mobilePane, setMobilePane] = useState<'chat' | 'draft'>('chat')
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  // Pre-commit VIVA cleanse: ask → running → clean | found (checklist) | error
  // Each item is one sentence-level finding; a category can carry several.
  const [cleanse, setCleanse] = useState<
    { step: 'closed' } | { step: 'ask' } | { step: 'running' } | { step: 'clean' } |
    { step: 'found'; items: Array<{ id: string; category: string; label: string; original: string; revised: string }> } |
    { step: 'error'; message: string }
  >({ step: 'closed' })
  // Which cleanse recommendations are checked to apply
  const [cleanseSelected, setCleanseSelected] = useState<Record<string, boolean>>({})
  const [cleanseApplying, setCleanseApplying] = useState(false)
  // Once a cleanse has run for this session, Commit as Active skips the ask
  const [hasCleansed, setHasCleansed] = useState(false)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const tourRef = useRef<VisionUpdateTourHandle>(null)
  const restoredThreadRef = useRef(false)

  const [tourActive, setTourActive] = useState(false)
  const [tourDemoKey, setTourDemoKey] = useState<string | null>(null)
  const [tourShowViews, setTourShowViews] = useState(false)

  const closeTour = useCallback(() => {
    markVisionUpdateTourSeen()
    setTourActive(false)
    setTourDemoKey(null)
    setTourShowViews(false)
  }, [])

  const toggleWalkthrough = useCallback(() => {
    setTourActive((prev) => {
      if (prev) {
        markVisionUpdateTourSeen()
        setTourDemoKey(null)
        setTourShowViews(false)
        return false
      }
      return true
    })
  }, [])

  const pickTourCategory = useCallback((prev: string | null) => {
    if (prev) return prev
    if (!draft) return 'fun'
    const withText = CATEGORY_KEYS.find(
      (k) => !proposals[k] && getVisionCategoryText(draft, k).trim(),
    )
    const free = CATEGORY_KEYS.find((k) => !proposals[k])
    return withText || free || 'fun'
  }, [draft, proposals])

  const handleTourStepChange = useCallback((id: VisionUpdateTourStepId | null) => {
    if (id === 'chat') setMobilePane('chat')
    else if (id) setMobilePane('draft')

    if (id === 'proposal' || id === 'views') {
      setTourDemoKey(pickTourCategory)
      setTourShowViews(id === 'views')
    } else {
      setTourDemoKey(null)
      setTourShowViews(false)
    }
  }, [pickTourCategory])

  useEffect(() => {
    if (!tourShowViews || !tourDemoKey) return
    setExpanded((prev) => ({ ...prev, [tourDemoKey]: true }))
    setViewMode((prev) => ({ ...prev, [tourDemoKey]: 'edits' }))
  }, [tourShowViews, tourDemoKey])

  useLifeVisionStudioAreaChrome(
    useMemo(() => ({
      contextText: 'Tell VIVA what has changed. Review each update, Accept to save it into your draft, then edit there if you want — then commit when it feels right.',
      walkthrough: {
        active: tourActive,
        onToggle: toggleWalkthrough,
      },
    }), [tourActive, toggleWalkthrough]),
  )

  // ------------------------------------------------------------------
  // Load / ensure draft
  // ------------------------------------------------------------------
  useEffect(() => {
    if (studioLoading) return
    let cancelled = false
    ;(async () => {
      try {
        if (!activeVisionId && !draftId) {
          router.replace('/life-vision/create')
          return
        }

        let resolvedDraftId = draftId
        if (!resolvedDraftId) {
          const res = await fetch('/api/vision/draft/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visionId: activeVisionId }),
          })
          if (!res.ok) throw new Error('Failed to create a draft from your active vision')
          const { draft: newDraft } = await res.json()
          resolvedDraftId = newDraft.id
          refreshVisions().catch(() => {})
        }

        const { data: draftRow } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', resolvedDraftId!)
          .single()
        if (!draftRow) throw new Error('Draft not found')

        let activeRow: VisionData | null = null
        if (activeVisionId) {
          const { data } = await supabase
            .from('vision_versions')
            .select('*')
            .eq('id', activeVisionId)
            .single()
          activeRow = (data as VisionData) || null
        }

        if (cancelled) return
        setDraft(draftRow as VisionData)
        setActive(activeRow)

        // Restore the saved VIVA thread for this draft (best-effort) so a
        // page refresh doesn't lose the conversation.
        try {
          const { data: session } = await supabase
            .from('conversation_sessions')
            .select('id')
            .eq('mode', 'vision_update')
            .eq('vision_id', resolvedDraftId!)
            .order('last_message_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (session?.id && !cancelled) {
            const res = await fetch(`/api/viva/conversations/${session.id}/messages`)
            if (res.ok) {
              const { messages: saved } = await res.json()
              const restored: ChatMessage[] = (saved || [])
                .filter((m: { role?: string; message?: string }) =>
                  (m.role === 'user' || m.role === 'assistant') && typeof m.message === 'string' && m.message)
                .map((m: { role: 'user' | 'assistant'; message: string }) => ({
                  role: m.role,
                  content: m.message,
                }))

              if (restored.length > 0 && !cancelled) {
                restoredThreadRef.current = true
                setConversationId(session.id)
                setMessages([{ role: 'assistant', content: OPENING_MESSAGE }, ...restored])

                // Re-surface still-pending proposals from the last VIVA reply:
                // skip any whose text already matches the draft (accepted).
                const lastAssistant = [...restored].reverse().find((m) => m.role === 'assistant')
                if (lastAssistant) {
                  const parsed = parseVisionUpdateMessage(lastAssistant.content)
                  const pending: Record<string, ProposalState> = {}
                  for (const p of parsed.proposals) {
                    if (!p.complete) continue
                    const savedText = normText(getVisionCategoryText(draftRow as VisionData, p.category))
                    if (normText(p.text) !== savedText) {
                      pending[p.category] = { ...p, editedText: p.text }
                    }
                  }
                  if (Object.keys(pending).length > 0) setProposals(pending)
                }
              }
            }
          }
        } catch {
          /* thread restore is best-effort — never block the page */
        }

        if (cancelled) return
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load your draft')
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [studioLoading, activeVisionId, draftId, supabase, router, refreshVisions])

  useEffect(() => {
    if (loading || !draft) return
    if (hasSeenVisionUpdateTour()) return
    if (restoredThreadRef.current) return
    const id = window.setTimeout(() => setTourActive(true), 400)
    return () => window.clearTimeout(id)
  }, [loading, draft])

  // Auto-scroll chat
  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isStreaming])

  const changedCategories = useMemo(
    () => getCategoriesChangedFromActive(active, draft, CATEGORY_KEYS),
    [active, draft],
  )

  const tourDemoText = useMemo(() => {
    if (!draft || !tourDemoKey) return ''
    const existing = getVisionCategoryText(draft, tourDemoKey).trim()
    const addition = 'I live this chapter fully, with joy already here.'
    return existing ? `${existing}\n${addition}` : addition
  }, [draft, tourDemoKey])

  const pendingProposalCount = Object.keys(proposals).length

  // ------------------------------------------------------------------
  // Chat send + stream
  // ------------------------------------------------------------------
  const handleSend = useCallback(async (_attachments?: unknown, textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || isStreaming || !draft) return

    setChatError(null)
    setInput('')

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    const applyRaw = (raw: string) => {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: raw }
        return next
      })
      const parsed = parseVisionUpdateMessage(raw)
      if (parsed.proposals.length > 0) {
        setProposals((prev) => {
          const next = { ...prev }
          for (const p of parsed.proposals) {
            const existing = next[p.category]
            next[p.category] = {
              ...p,
              // Preserve member edits unless VIVA is actively re-streaming this category
              editedText: existing && existing.complete && p.complete && existing.text === p.text
                ? existing.editedText
                : p.text,
            }
          }
          return next
        })
      }
    }

    try {
      await readCoachStream({
        url: '/api/viva/vision-update',
        body: { messages: history, draftId: draft.id, conversationId },
        signal: controller.signal,
        onHeaders: ({ conversationId: id }) => {
          if (id) setConversationId(id)
        },
        onUpdate: (parsed) => {
          if (parsed.ready) applyRaw(parsed.text)
        },
      })
    } catch (err) {
      if (err instanceof CoachStreamError && err.message === 'Request cancelled') {
        // member navigated / cancelled — keep whatever streamed
      } else {
        setChatError(err instanceof Error ? err.message : 'Something went wrong')
        setMessages((prev) => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [input, isStreaming, draft, messages, conversationId])

  useEffect(() => () => abortRef.current?.abort(), [])

  // ------------------------------------------------------------------
  // Draft mutations
  // ------------------------------------------------------------------
  const saveCategory = useCallback(async (category: string, content: string) => {
    if (!draft) return
    setSavingCategory(category)
    try {
      const updated = await updateDraftCategory(draft.id, category, content)
      setDraft(updated)
      setManualEdits((prev) => {
        const next = { ...prev }
        delete next[category]
        return next
      })
    } catch {
      setChatError('Failed to save — try again')
    } finally {
      setSavingCategory(null)
    }
  }, [draft])

  const acceptProposal = useCallback(async (category: string) => {
    const proposal = proposals[category]
    if (!proposal) return
    await saveCategory(category, proposal.editedText)
    setProposals((prev) => {
      const next = { ...prev }
      delete next[category]
      return next
    })
    setExpanded((prev) => ({ ...prev, [category]: true }))
  }, [proposals, saveCategory])

  const discardProposal = useCallback((category: string) => {
    setProposals((prev) => {
      const next = { ...prev }
      delete next[category]
      return next
    })
  }, [])

  // ------------------------------------------------------------------
  // Pre-commit VIVA cleanse
  // ------------------------------------------------------------------
  const runCleanse = useCallback(async () => {
    if (!draft) return
    setCleanse({ step: 'running' })
    try {
      const res = await fetch('/api/viva/vision-cleanse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'The cleanse could not run — try again')
      }
      const { findings } = (await res.json()) as {
        findings: Array<{ category: string; original: string; revised: string }>
      }

      setHasCleansed(true)

      if (!findings || findings.length === 0) {
        setCleanse({ step: 'clean' })
        return
      }

      // Checklist of sentence-level findings in category order — all checked
      // by default. A category can carry several.
      const items = ORDERED_VISION_CATEGORIES.flatMap((c) =>
        findings
          .filter((f) => f.category === c.key)
          .map((f, i) => ({
            id: `${c.key}-${i}`,
            category: c.key,
            label: c.label,
            original: f.original,
            revised: f.revised,
          })),
      )
      setCleanseSelected(Object.fromEntries(items.map((i) => [i.id, true])))
      setCleanse({ step: 'found', items })
    } catch (err) {
      setCleanse({ step: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }, [draft])

  // Apply the checked sentence-level findings (replace each original sentence
  // in its category's draft text), then continue to commit + kit
  const applyCleanse = useCallback(async () => {
    if (!draft || cleanse.step !== 'found') return
    const chosen = cleanse.items.filter((i) => cleanseSelected[i.id])
    setCleanseApplying(true)
    try {
      let updated: VisionData | null = null
      const byCategory = new Map<string, typeof chosen>()
      for (const item of chosen) {
        const list = byCategory.get(item.category) || []
        list.push(item)
        byCategory.set(item.category, list)
      }
      for (const [category, items] of byCategory) {
        let text = getVisionCategoryText(updated ?? draft, category)
        for (const item of items) {
          text = text.replace(item.original, item.revised)
        }
        updated = await updateDraftCategory(draft.id, category, text)
      }
      if (updated) setDraft(updated)
      setCleanse({ step: 'closed' })
      setShowCommitDialog(true)
    } catch {
      setCleanse({ step: 'error', message: 'Failed to save the selected changes — try again' })
    } finally {
      setCleanseApplying(false)
    }
  }, [draft, cleanse, cleanseSelected])

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>
      </Container>
    )
  }

  if (error || !draft) {
    return (
      <Container size="xl">
        <Card className="p-8 text-center">
          <p className="text-neutral-300 mb-4">{error || 'Draft not found'}</p>
          <Button variant="outline" onClick={() => router.push('/life-vision')}>Back to Life Vision</Button>
        </Card>
      </Container>
    )
  }

  // Both panes share this height on desktop so the columns always match;
  // each scrolls independently inside its own shell.
  const paneHeight = 'lg:h-[calc(100dvh-13rem)] lg:min-h-[480px]'
  const thinScrollbar =
    '[scrollbar-width:thin] [scrollbar-color:#2c2c2c_transparent] ' +
    '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
    '[&::-webkit-scrollbar-thumb]:bg-[#2c2c2c] [&::-webkit-scrollbar-thumb]:rounded-full'

  const chatPane = (
    <div data-tour="chat" className={`rounded-3xl p-px bg-gradient-to-b from-[#BF00FF]/50 via-[#2a2a2a] to-[#00FFFF]/30 h-[70vh] ${paneHeight}`}>
      <div className="flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0D0D0D]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#BF00FF] to-[#00FFFF] shadow-[0_0_18px_rgba(191,0,255,0.35)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0D0D0D] bg-[#39FF14]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight text-white">VIVA</div>
            <div className="text-[11px] leading-tight text-neutral-500">
              {isStreaming ? 'Writing with you…' : 'Vision Update'}
            </div>
          </div>
          {isStreaming && <Loader2 className="h-4 w-4 animate-spin text-[#BF00FF]" />}
        </div>

        {/* Messages */}
        <div ref={chatScrollRef} className={`flex-1 space-y-5 overflow-y-auto px-4 py-5 ${thinScrollbar}`}>
          {messages.map((message, i) => {
            if (message.role === 'user') {
              return (
                <VivaUserMessage key={i} hideCopy>
                  {message.content}
                </VivaUserMessage>
              )
            }
            const parsed = parseVisionUpdateMessage(message.content)
            const isLast = i === messages.length - 1
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%]">
                  {parsed.chatText ? (
                    <VivaMarkdown>{parsed.chatText}</VivaMarkdown>
                  ) : isLast && isStreaming ? (
                    <VivaThinkingIndicator />
                  ) : null}
                  {parsed.proposals.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parsed.proposals.map((p) => (
                        <button
                          key={p.category}
                          onClick={() => {
                            setMobilePane('draft')
                            setExpanded((prev) => ({ ...prev, [p.category]: true }))
                            document.getElementById(`vision-cat-${p.category}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#BF00FF]/40 bg-[#BF00FF]/10 px-3 py-1.5 text-xs text-[#d580ff] shadow-[0_0_12px_rgba(191,0,255,0.15)] transition-all hover:-translate-y-0.5 hover:border-[#BF00FF] hover:bg-[#BF00FF]/20"
                        >
                          <Sparkles className="h-3 w-3" />
                          {ORDERED_VISION_CATEGORIES.find((c) => c.key === p.category)?.label || p.category}
                          {!p.complete && <Loader2 className="h-3 w-3 animate-spin" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {chatError && <p className="text-sm text-[#FF0040]">{chatError}</p>}
        </div>

        {/* Input */}
        <div className="border-t border-white/5 bg-white/[0.02] p-3">
          <VivaChatInput
            value={input}
            onChange={setInput}
            onSend={(_attachments, text) => handleSend(_attachments, text)}
            disabled={isStreaming}
            placeholder="What's changed in your life?"
          />
        </div>
      </div>
    </div>
  )

  const draftPane = (
    <div data-tour="draft" className={`flex flex-col lg:overflow-hidden lg:rounded-3xl lg:border lg:border-[#262626] lg:bg-[#0D0D0D] ${paneHeight}`}>
      {/* Header — fixed above the scrolling category list */}
      <div className="flex items-center justify-between gap-3 pb-3 lg:border-b lg:border-white/5 lg:bg-white/[0.03] lg:px-5 lg:py-3.5 lg:pb-3.5">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Your Draft</div>
          <div className="text-xs text-neutral-500">
            {changedCategories.length > 0
              ? `${changedCategories.length} ${changedCategories.length === 1 ? 'category' : 'categories'} updated from active`
              : 'No changes from your active vision yet'}
          </div>
        </div>
        <Button
          data-tour="commit"
          variant="primary"
          size="sm"
          disabled={changedCategories.length === 0 && !tourActive}
          onClick={() => {
            if (tourActive) {
              tourRef.current?.next()
              return
            }
            if (hasCleansed) setShowCommitDialog(true)
            else setCleanse({ step: 'ask' })
          }}
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />Commit as Active
        </Button>
      </div>

      <div className={`space-y-3 lg:flex-1 lg:overflow-y-auto lg:p-4 ${thinScrollbar}`}>
      {ORDERED_VISION_CATEGORIES.map((category) => {
        const key = category.key
        const Icon = getVisionCategoryIcon(key as VisionCategoryKey)
        const savedText = getVisionCategoryText(draft, key)
        const editorText = manualEdits[key] ?? savedText
        const isChanged = changedCategories.includes(key)
        const isDirty = key in manualEdits && manualEdits[key] !== savedText
        const isTourDemo = tourDemoKey === key && !tourShowViews
        const isTourViews = tourShowViews && tourDemoKey === key
        const realProposal = proposals[key]
        const proposal: ProposalState | undefined = isTourDemo
          ? { category: key, text: tourDemoText, editedText: tourDemoText, complete: true }
          : realProposal
        const isExpanded = isTourDemo || isTourViews || (expanded[key] ?? Boolean(realProposal))
        const activeText = active ? getVisionCategoryText(active, key) : ''
        const hasEdits = Boolean(active) && normText(editorText) !== normText(activeText)
        // Edits is the default view; falls back to Draft when nothing differs
        const requestedView = viewMode[key] ?? 'edits'
        const view: CategoryView =
          (requestedView === 'edits' && !hasEdits && !isTourViews) || (requestedView === 'active' && !active)
            ? 'draft'
            : requestedView

        const onAccept = () => {
          if (isTourDemo) {
            tourRef.current?.next()
            return
          }
          acceptProposal(key)
        }
        const onDiscard = () => {
          if (isTourDemo) {
            tourRef.current?.next()
            return
          }
          discardProposal(key)
        }

        return (
          <div
            key={key}
            id={`vision-cat-${key}`}
            data-tour={isTourDemo ? 'proposal' : undefined}
            className={`rounded-2xl border bg-[#161616] transition-all ${
              proposal
                ? 'border-[#BF00FF]/60 shadow-[0_0_20px_rgba(191,0,255,0.12)]'
                : isChanged
                  ? 'border-[#FFFF00]/40'
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [key]: !isExpanded }))}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  proposal ? 'text-[#BF00FF]' : isChanged ? 'text-[#FFFF00]' : 'text-neutral-500'
                }`} />
                <span className="text-sm font-medium text-white truncate">{category.label}</span>
              </button>

              {proposal && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onAccept}
                    disabled={!proposal.complete || savingCategory === key}
                    title={isTourDemo ? 'Continue walkthrough' : 'Accept & Save to Draft'}
                    className="inline-flex items-center gap-1 rounded-full bg-[#39FF14] px-2 sm:px-3 py-1 text-[11px] font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingCategory === key
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Check className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{savingCategory === key ? 'Saving' : 'Accept'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDiscard}
                    disabled={savingCategory === key}
                    title={isTourDemo ? 'Continue walkthrough' : 'Discard'}
                    className="inline-flex items-center gap-1 rounded-full border border-[#333] px-1.5 sm:px-2.5 py-1 text-[11px] text-neutral-300 transition-colors hover:border-[#555] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Discard</span>
                  </button>
                  <Badge variant="info" className="border-[#BF00FF]/50 text-[#BF00FF] bg-[#BF00FF]/10">
                    {isTourDemo ? 'Example' : 'VIVA update'}
                  </Badge>
                </div>
              )}

              {isChanged && !proposal && (
                <span className="rounded-full bg-[#FFFF00]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#FFFF00]/90 shrink-0">
                  Updated
                </span>
              )}

              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [key]: !isExpanded }))}
                className="shrink-0 text-neutral-500"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* VIVA update — same chrome as Draft (toggles left, legend right),
                    plus Accept / Discard as a slim action strip top + bottom. */}
                {proposal && (() => {
                  const busy = !proposal.complete || savingCategory === key
                  const actionButtons = (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={onAccept}
                        disabled={busy}
                        title={isTourDemo ? 'Continue walkthrough' : 'Accept & Save to Draft'}
                        className="inline-flex items-center gap-1 rounded-full bg-[#39FF14] px-2 sm:px-3 py-1 text-[11px] font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {savingCategory === key
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{savingCategory === key ? 'Saving' : 'Accept'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onDiscard}
                        disabled={savingCategory === key}
                        title={isTourDemo ? 'Continue walkthrough' : 'Discard'}
                        className="inline-flex items-center gap-1 rounded-full border border-[#333] px-1.5 sm:px-2.5 py-1 text-[11px] text-neutral-300 transition-colors hover:border-[#555] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Discard</span>
                      </button>
                    </div>
                  )

                  return (
                    <div className="space-y-3">
                      {proposal.complete ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] text-neutral-500">
                            {isTourDemo
                              ? 'Example only — Accept or Discard here just continues the walkthrough.'
                              : 'Accept to save into your draft — edit anytime after.'}
                          </p>
                          <span className="text-[10px] text-neutral-500 shrink-0">
                            <span className="rounded bg-[#39FF14]/20 px-1 text-[#a4ff8a]">added</span>
                            {' · '}
                            <span className="rounded bg-[#FF0040]/20 px-1 text-[#ff8ba7] line-through">removed</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-[#BF00FF]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          VIVA is writing this update…
                        </div>
                      )}

                      <div className="rounded-xl border border-[#333] bg-[#0A0A0A] p-3">
                        <DiffText oldText={savedText} newText={proposal.editedText} />
                      </div>

                      {proposal.complete && actionButtons}
                    </div>
                  )
                })()}

                {/* Draft view chrome — hidden while a VIVA update is pending */}
                {!proposal && (active || isTourViews) && (
                  <div
                    data-tour={isTourViews ? 'views' : undefined}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="inline-flex rounded-lg border border-[#2a2a2a] bg-[#0A0A0A] p-0.5">
                      {([
                        ...(hasEdits || isTourViews ? [['edits', 'Edits'] as const] : []),
                        ['draft', 'Draft'] as const,
                        ...(active ? [['active', 'Active'] as const] : []),
                      ]).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setViewMode((prev) => ({ ...prev, [key]: value }))}
                          className={`rounded-md px-3 py-1 text-xs transition-colors ${
                            view === value
                              ? value === 'edits'
                                ? 'bg-[#FFFF00]/15 text-[#FFFF00]'
                                : 'bg-[#333] text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {view === 'edits' && (
                      <span className="text-[10px] text-neutral-500">
                        <span className="rounded bg-[#39FF14]/20 px-1 text-[#a4ff8a]">added</span>
                        {' · '}
                        <span className="rounded bg-[#FF0040]/20 px-1 text-[#ff8ba7] line-through">removed</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Edits: editable, live word diff of active → draft */}
                {!proposal && view === 'edits' && (
                  <div>
                    <EditableDiffField
                      oldText={activeText}
                      value={editorText}
                      onChange={(value) => setManualEdits((prev) => ({ ...prev, [key]: value }))}
                      minHeight={100}
                      placeholder="Nothing written for this category yet"
                    />
                    {isDirty && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => saveCategory(key, manualEdits[key])}
                          disabled={savingCategory === key}
                        >
                          {savingCategory === key
                            ? <><Spinner size="sm" className="mr-1.5" />Saving…</>
                            : 'Save to Draft'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setManualEdits((prev) => { const next = { ...prev }; delete next[key]; return next })}
                        >
                          Revert
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Active: read-only committed version */}
                {!proposal && view === 'active' && (
                  <div className="rounded-xl border border-[#333] bg-[#0A0A0A] p-3">
                    <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">
                      {activeText || '(empty)'}
                    </p>
                  </div>
                )}

                {/* Draft: editable */}
                {!proposal && view === 'draft' && (
                  <div>
                    <AutoResizeTextarea
                      value={editorText}
                      onChange={(value) => setManualEdits((prev) => ({ ...prev, [key]: value }))}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg p-3 text-sm text-neutral-100 leading-relaxed"
                      minHeight={100}
                      placeholder="Nothing written for this category yet"
                    />
                    {isDirty && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => saveCategory(key, manualEdits[key])}
                          disabled={savingCategory === key}
                        >
                          {savingCategory === key
                            ? <><Spinner size="sm" className="mr-1.5" />Saving…</>
                            : 'Save to Draft'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setManualEdits((prev) => { const next = { ...prev }; delete next[key]; return next })}
                        >
                          Revert
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )

  return (
    <Container size="xl">
      {/* Mobile pane switcher */}
      <div className="lg:hidden flex rounded-xl border-2 border-[#333] bg-[#141414] p-1 mb-4">
        <button
          onClick={() => setMobilePane('chat')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors ${mobilePane === 'chat' ? 'bg-[#333] text-white' : 'text-neutral-400'}`}
        >
          <MessageCircle className="w-4 h-4" />Chat
        </button>
        <button
          onClick={() => setMobilePane('draft')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors ${mobilePane === 'draft' ? 'bg-[#333] text-white' : 'text-neutral-400'}`}
        >
          <FileText className="w-4 h-4" />Draft
          {pendingProposalCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-[#BF00FF] text-white text-xs px-1">
              {pendingProposalCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-[minmax(360px,2fr)_3fr]">
        <div className={mobilePane === 'chat' ? '' : 'hidden lg:block'}>{chatPane}</div>
        <div className={mobilePane === 'draft' ? '' : 'hidden lg:block'}>{draftPane}</div>
      </div>

      <VisionUpdateTour
        ref={tourRef}
        active={tourActive && !loading && !!draft}
        onClose={closeTour}
        onStepChange={handleTourStepChange}
      />

      <VIVALoadingOverlay
        isVisible={cleanse.step === 'running'}
        messages={[
          'VIVA is reading through your updates…',
          'Checking vibrational grammar…',
          'Looking for clear misses only…',
          'Almost ready…',
        ]}
        cycleDuration={2500}
        estimatedTime="Usually takes a few seconds"
        estimatedDuration={8000}
        size="md"
        className="fixed inset-0 z-50 rounded-none"
      />

      {/* Pre-commit VIVA cleanse */}
      <Modal
        isOpen={cleanse.step !== 'closed' && cleanse.step !== 'running'}
        onClose={() => setCleanse({ step: 'closed' })}
        size={cleanse.step === 'found' ? 'lg' : 'sm'}
        showCloseButton={false}
      >
        <button
          type="button"
          onClick={() => setCleanse({ step: 'closed' })}
          className="absolute right-4 top-4 text-neutral-400 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {cleanse.step === 'ask' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#BF00FF] to-[#00FFFF]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Run a VIVA Cleanse?</h3>
            <p className="text-sm text-neutral-400">
              Would you like VIVA to run a cleanse to ensure your Life Vision is written in
              vibrational grammar? She only flags clear misses — a clean vision comes back untouched.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="primary" size="sm" onClick={runCleanse}>
                <Sparkles className="mr-1.5 h-4 w-4" />Yes, run the cleanse
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCleanse({ step: 'closed' })
                  setShowCommitDialog(true)
                }}
              >
                Skip &amp; commit
              </Button>
            </div>
          </div>
        )}

        {cleanse.step === 'clean' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#39FF14]/15">
              <CheckCircle className="h-5 w-5 text-[#39FF14]" />
            </div>
            <h3 className="text-lg font-semibold text-white">Your vision reads clean</h3>
            <p className="text-sm text-neutral-400">
              Everything is already in vibrational grammar — nothing to change.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCleanse({ step: 'closed' })
                setShowCommitDialog(true)
              }}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />Continue to Commit
            </Button>
          </div>
        )}

        {cleanse.step === 'found' && (() => {
          const selectedCount = cleanse.items.filter((i) => cleanseSelected[i.id]).length
          return (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#BF00FF]/15">
                  <Sparkles className="h-5 w-5 text-[#BF00FF]" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {cleanse.items.length === 1
                    ? '1 recommended change'
                    : `${cleanse.items.length} recommended changes`}
                </h3>
                <p className="text-sm text-neutral-400">
                  Check the ones you want, then apply and commit.{' '}
                  <span className="rounded bg-[#39FF14]/20 px-1 text-[#a4ff8a]">added</span>
                  {' · '}
                  <span className="rounded bg-[#FF0040]/20 px-1 text-[#ff8ba7] line-through">removed</span>
                </p>
              </div>

              <div className={`max-h-[50vh] space-y-3 overflow-y-auto ${thinScrollbar}`}>
                {cleanse.items.map((item, idx) => {
                  const checked = Boolean(cleanseSelected[item.id])
                  const isNewCategory = idx === 0 || cleanse.items[idx - 1].category !== item.category
                  const CategoryIcon = getVisionCategoryIcon(item.category as VisionCategoryKey)
                  return (
                    <div key={item.id}>
                      {isNewCategory && (
                        <div className={`mb-1.5 flex items-center gap-2 ${idx === 0 ? '' : 'mt-1'}`}>
                          <CategoryIcon className="h-3.5 w-3.5 text-neutral-500" />
                          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                            {item.label}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-xl border p-3 transition-colors ${
                          checked ? 'border-[#39FF14]/40 bg-[#39FF14]/[0.04]' : 'border-[#2a2a2a] bg-[#0A0A0A]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setCleanseSelected((prev) => ({ ...prev, [item.id]: !checked }))
                          }
                          className="flex w-full items-start gap-2.5 text-left"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                              checked
                                ? 'border-[#39FF14] bg-[#39FF14] text-black'
                                : 'border-[#444] bg-transparent'
                            }`}
                          >
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <DiffText oldText={item.original} newText={item.revised} />
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button variant="primary" size="sm" onClick={applyCleanse} disabled={cleanseApplying}>
                  {cleanseApplying ? (
                    <><Spinner size="sm" className="mr-1.5" />Applying…</>
                  ) : selectedCount > 0 ? (
                    <><Check className="mr-1.5 h-4 w-4" />Apply {selectedCount} &amp; Continue</>
                  ) : (
                    'Continue without changes'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCleanse({ step: 'closed' })}
                  disabled={cleanseApplying}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        })()}

        {cleanse.step === 'error' && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold text-white">The cleanse didn&apos;t finish</h3>
            <p className="text-sm text-neutral-400">{cleanse.message}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="primary" size="sm" onClick={runCleanse}>Try again</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCleanse({ step: 'closed' })
                  setShowCommitDialog(true)
                }}
              >
                Skip &amp; commit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <CommitVisionDialog
        isOpen={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        draftId={draft.id}
        onCommitted={async (visionId) => {
          await refreshVisions()
          router.push(`/life-vision/${visionId}`)
        }}
      />
    </Container>
  )
}
