'use client'

/**
 * VIVA — the unified conversational home.
 *
 * One clean thread-based chat. The mode detector routes everything
 * (connection / coaching / momentum / guide / crisis) behind the scenes —
 * no pickers, no dashboards. Threads are saved, renameable, and pinnable.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { VivaAssistantMessage, VivaThinkingIndicator, VivaUserMessage } from '@/components/viva/VivaChatMessage'
import {
  PanelLeft,
  Plus,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Check,
  X,
  Waypoints,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { keys } from '@/lib/query/keys'
import { VivaChatInput, type ChatAttachment } from '@/components/viva/VivaChatInput'
import { ConstraintsPanel } from '@/components/viva/ConstraintsPanel'
import { cn } from '@/lib/utils'
import { SUGGEST_TOOLS_USER_MESSAGE } from '@/lib/viva/prompts/suggest-tools'
import { CoachStreamError, readCoachStream } from '@/lib/viva/coach-stream'
import {
  describeAttachments,
  parseVivaAttachments,
  type VivaPersistedAttachment,
} from '@/lib/viva/coach-attachments'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { ensureJpegCompatible } from '@/lib/life-explorer/ensure-jpeg'
import { ToolWalkthrough, WalkthroughToggle } from '@/components/tool-walkthrough'
import { ShellWalkthroughButton } from '@/components/app-shell/ShellWalkthroughButton'
import { MessageSaveMenu } from '@/components/viva/MessageSaveMenu'
import { useToolWalkthrough } from '@/hooks/useToolWalkthrough'
import { VivaWelcome } from '@/components/viva/VivaWelcome'
import { useInShell } from '@/components/app-shell/ShellContext'
import { DeleteConfirmationDialog } from '@/lib/design-system/components'
import { SCRIM } from '@/lib/app-shell/glass'

function vivaQuery(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function replaceVivaUrl(router: { replace: (href: string) => void }, thread: string | null) {
  const next = vivaQuery()
  if (thread) {
    next.set('thread', thread)
    next.delete('manifestation')
    next.delete('t')
  } else {
    next.delete('thread')
  }
  const q = next.toString()
  router.replace(q ? `/viva?${q}` : '/viva')
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: VivaPersistedAttachment[]
}

interface Thread {
  id: string
  title: string | null
  preview_message: string | null
  message_count: number
  pinned: boolean
  last_message_at: string | null
  updated_at: string
}

interface RetrievalIndicator {
  source: string
  detail: string
}

async function fetchThreads(): Promise<Thread[]> {
  const res = await fetch('/api/viva/conversations?mode=coach')
  if (!res.ok) return []
  const data = await res.json()
  return data.sessions || []
}

export default function VivaPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const walkthrough = useToolWalkthrough('viva')

  // --- Thread state ---
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [indicators, setIndicators] = useState<RetrievalIndicator[]>([])
  const [isThinking, setIsThinking] = useState(false)

  // --- UI state ---
  const inShell = useInShell()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Desktop: the thread list can be collapsed; remembered on this device.
  const [threadsCollapsed, setThreadsCollapsed] = useState(false)
  useEffect(() => {
    try {
      setThreadsCollapsed(localStorage.getItem('vf_viva_threads_collapsed') === '1')
    } catch {
      /* storage unavailable */
    }
  }, [])
  const toggleThreads = () => {
    // Phones open the list as a drawer; desktop collapses or expands it.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(true)
      return
    }
    setThreadsCollapsed((prev) => {
      try {
        localStorage.setItem('vf_viva_threads_collapsed', prev ? '0' : '1')
      } catch {
        /* storage unavailable */
      }
      return !prev
    })
  }
  const [constraintsOpen, setConstraintsOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Admin model testing: /viva?model=anthropic/claude-sonnet-4-5
  // The API only honors this override for admin accounts.
  const [modelOverride, setModelOverride] = useState<string | null>(null)
  const [flowIntent, setFlowIntent] = useState<string | null>(null)
  const [focusKitId, setFocusKitId] = useState<string | null>(null)
  const focusStartedRef = useRef(false)
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('model')
    if (m) setModelOverride(m)
    // A guided flow tells the coach which path the member chose.
    const flow = new URLSearchParams(window.location.search).get('flow')
    if (flow && /^[a-z-]{3,40}$/.test(flow)) setFlowIntent(`flow:${flow}`)
    // Capture's "Share with VIVA" hands over a draft; it waits in the composer.
    const draft = new URLSearchParams(window.location.search).get('draft')
    if (draft) {
      setCurrentMessage(draft)
      const next = new URL(window.location.href)
      next.searchParams.delete('draft')
      window.history.replaceState(null, '', next.pathname + next.search)
    }
  }, [])

  const { data: threads = [] } = useQuery({
    queryKey: keys.vivaConversations,
    queryFn: fetchThreads,
  })

  const refreshThreads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: keys.vivaConversations })
  }, [queryClient])

  // --- Scrolling ---
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageCountRef = useRef(0)
  useEffect(() => {
    const count = messages.length + (isThinking ? 1 : 0)
    if (count > messageCountRef.current) {
      messageCountRef.current = count
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [messages.length, isThinking])

  // --- Thread management ---
  const startNewThread = () => {
    setThreadId(null)
    setMessages([])
    setIndicators([])
    setFocusKitId(null)
    messageCountRef.current = 0
    replaceVivaUrl(router, null)
  }

  const openThread = async (id: string) => {
    setThreadId(id)
    setMessages([])
    setIndicators([])
    setSidebarOpen(false)
    if (vivaQuery().get('thread') !== id) replaceVivaUrl(router, id)
    try {
      const res = await fetch(`/api/viva/conversations/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(
          (data.messages || []).map((m: {
            id: string
            role: 'user' | 'assistant'
            message: string
            context?: { attachments?: unknown }
          }) => ({
            id: m.id,
            role: m.role,
            content: m.message,
            attachments: parseVivaAttachments(m.context?.attachments),
          }))
        )
      }
    } catch (err) {
      console.error('Error loading thread:', err)
    }
  }

  useEffect(() => {
    const thread = vivaQuery().get('thread')
    if (!thread || !/^[0-9a-f-]{36}$/i.test(thread)) return
    void openThread(thread)
    // Deep-link open on first paint only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deletingThread, setDeletingThread] = useState(false)
  const deleteThread = (id: string) => setPendingDeleteId(id)
  const confirmDeleteThread = async () => {
    const id = pendingDeleteId
    if (!id) return
    setDeletingThread(true)
    try {
      await fetch(`/api/viva/conversations?id=${id}`, { method: 'DELETE' })
      refreshThreads()
      if (id === threadId) startNewThread()
    } finally {
      setDeletingThread(false)
      setPendingDeleteId(null)
    }
  }

  const togglePin = async (thread: Thread) => {
    await fetch('/api/viva/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: thread.id, pinned: !thread.pinned }),
    })
    refreshThreads()
  }

  const commitRename = async (id: string) => {
    const title = renameValue.trim()
    setRenamingId(null)
    if (!title) return
    await fetch('/api/viva/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title }),
    })
    refreshThreads()
  }

  // --- Chat ---
  const sendMessage = async (
    incomingAttachments?: ChatAttachment[],
    overrideContent?: string,
    options?: { suggestTools?: boolean; kitId?: string },
  ) => {
    const content = (overrideContent ?? currentMessage).trim()
    const picked = incomingAttachments || []
    if ((!content && picked.length === 0) || isStreaming) return

    const localAttachments: VivaPersistedAttachment[] = picked.map((att) => ({
      url: att.preview || '',
      name: att.file.name || (att.type === 'image' ? 'photo.jpg' : 'file'),
      type: att.type,
      mimeType: att.file.type || undefined,
    }))

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content || describeAttachments(localAttachments.filter((a) => a.type === 'image' || a.url)),
      attachments: localAttachments,
    }
    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsStreaming(true)
    setIsThinking(true)
    setIndicators(
      options?.suggestTools
        ? [{ source: 'suggest', detail: 'Looking at what we could do from here' }]
        : picked.length > 0
          ? [{ source: 'upload', detail: 'Adding what you shared' }]
          : []
    )

    try {
      let persisted: VivaPersistedAttachment[] = []
      if (picked.length > 0) {
        const readyFiles = await Promise.all(
          picked.map(async (att) => {
            if (att.type !== 'image') return att.file
            try {
              return await ensureJpegCompatible(att.file)
            } catch {
              return att.file
            }
          })
        )
        const results = await uploadMultipleUserFiles('viva', readyFiles)
        persisted = results.flatMap((result, index) => {
          if (!result.url) {
            toast.error(result.error || getUploadErrorMessage(new Error('Upload failed')))
            return []
          }
          const source = picked[index]
          const uploadedFile = readyFiles[index]
          return [{
            url: result.url,
            name: uploadedFile.name || source.file.name || 'file',
            type: source.type,
            mimeType: uploadedFile.type || source.file.type || undefined,
          }]
        })
        if (persisted.length === 0 && !content) {
          throw new CoachStreamError('That file did not attach. Try choosing it again?')
        }
        setMessages(prev =>
          prev.map((m) => (m.id === userMessage.id ? { ...m, attachments: persisted } : m))
        )
      }

      const textForApi = content || describeAttachments(persisted)
      const messagesForAPI = [...messages, { ...userMessage, content: textForApi }].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const assistantId = (Date.now() + 1).toString()
      let receivedText = false

      const { parsed } = await readCoachStream({
        url: '/api/viva/coach',
        body: {
          messages: messagesForAPI,
          conversationId: threadId,
          isNewSession: !threadId,
          modeHint: 'auto',
          ...(persisted.length > 0 ? { attachments: persisted } : {}),
          ...(modelOverride ? { modelOverride } : {}),
          ...(flowIntent ? { userIntent: flowIntent } : {}),
          ...(options?.suggestTools ? { suggestTools: true } : {}),
          ...(options?.kitId || focusKitId ? { kitId: options?.kitId || focusKitId } : {}),
        },
        onHeaders: ({ conversationId }) => {
          if (!conversationId) return
          setThreadId(conversationId)
          if (vivaQuery().get('thread') !== conversationId) {
            replaceVivaUrl(router, conversationId)
          }
        },
        onUpdate: (next) => {
          if (next.indicators?.length) setIndicators(next.indicators)
          if (!next.text) return
          if (next.text.trim()) {
            receivedText = true
            setIsThinking(false)
          }
          setMessages(prev => {
            if (prev.some(m => m.id === assistantId)) {
              return prev.map(m => (m.id === assistantId ? { ...m, content: next.text } : m))
            }
            return [...prev, { id: assistantId, role: 'assistant', content: next.text }]
          })
        },
      })

      if (!parsed.text.trim() && !receivedText) {
        throw new CoachStreamError("I didn't get a response back. Try sending that again.")
      }

      refreshThreads()
      // Coach tools may have completed a flow step on the server.
      if (flowIntent) window.dispatchEvent(new CustomEvent('vf:flow-refresh'))
    } catch (err) {
      console.error('VIVA chat error:', err)
      const fallback =
        err instanceof CoachStreamError
          ? err.message
          : "I'm having trouble connecting right now. Let's try again in a moment."
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content.trim()) return prev
        return [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: fallback,
          },
        ]
      })
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
    }
  }

  useEffect(() => {
    const kitId = vivaQuery().get('manifestation')
    if (!kitId || !/^[0-9a-f-]{36}$/i.test(kitId)) return
    if (vivaQuery().get('thread')) return
    if (focusStartedRef.current) return
    const bootStamp = vivaQuery().get('t')
    const lockKey = bootStamp ? `viva-focus-boot:${kitId}:${bootStamp}` : `viva-focus-boot:${kitId}`
    const lockedAt = Number(sessionStorage.getItem(lockKey) || 0)
    if (!bootStamp && Date.now() - lockedAt < 2000) return
    if (bootStamp && sessionStorage.getItem(lockKey)) return
    focusStartedRef.current = true
    sessionStorage.setItem(lockKey, String(Date.now()))
    setFocusKitId(kitId)

    setThreadId(null)
    setMessages([])

    void (async () => {
      try {
        const res = await fetch(`/api/manifestations/${kitId}`)
        if (!res.ok) return
        const data = await res.json()
        const manifestation = data.manifestation as { name?: string } | undefined
        const name = manifestation?.name?.trim() || 'this manifestation'
        await sendMessage(undefined, `I want to talk about ${name}.`, { kitId })
      } catch (err) {
        console.error('Could not open this manifestation in VIVA:', err)
        sessionStorage.removeItem(lockKey)
        focusStartedRef.current = false
      }
    })()
    // Deep-link focus on first paint only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeThread = threads.find(t => t.id === threadId)
  const pinnedThreads = threads.filter(t => t.pinned)
  const recentThreads = threads.filter(t => !t.pinned)

  const renderThreadRow = (thread: Thread) => (
    <div
      key={thread.id}
      onClick={() => openThread(thread.id)}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-200',
        inShell
          ? cn('rounded-full', thread.id === threadId ? 'bg-[rgba(191,0,255,0.18)] text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white')
          : cn('rounded-lg', thread.id === threadId ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200')
      )}
    >
      {renamingId === thread.id ? (
        <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename(thread.id)
              if (e.key === 'Escape') setRenamingId(null)
            }}
            className={cn('flex-1 min-w-0 px-2 py-1 text-sm text-white outline-none', inShell ? 'rounded-full border border-white/20 bg-white/[0.06] focus:border-[#BF00FF]/50' : 'bg-neutral-800 border border-neutral-700 rounded focus:border-neutral-500')}
          />
          <button onClick={() => commitRename(thread.id)} className="text-neutral-400 hover:text-white shrink-0">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setRenamingId(null)} className="text-neutral-400 hover:text-white shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 min-w-0 truncate text-sm">
            {thread.title || thread.preview_message || 'New thread'}
          </span>
          <div className="flex items-center gap-1 shrink-0 md:hidden group-hover:md:flex" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setRenamingId(thread.id); setRenameValue(thread.title || '') }}
              className="text-neutral-500 hover:text-white transition-colors"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => togglePin(thread)}
              className="text-neutral-500 hover:text-white transition-colors"
              title={thread.pinned ? 'Unpin' : 'Pin'}
            >
              {thread.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => deleteThread(thread.id)}
              className="text-neutral-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {thread.pinned && (
            <Pin className="hidden md:block w-3 h-3 text-neutral-600 group-hover:hidden shrink-0" />
          )}
        </>
      )}
    </div>
  )

  return (
    <div className={cn("flex-1 min-h-0 flex flex-col overflow-hidden", inShell ? "bg-transparent" : "bg-black")}>
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ---- Thread sidebar ---- */}
      <aside
        className={cn(
          'w-72 max-w-[85vw] shrink-0 border-r flex-col transition-all duration-300',
          inShell
            ? 'vf-glass border-white/[0.14] bg-[linear-gradient(180deg,rgba(44,36,60,0.62)_0%,rgba(22,18,32,0.78)_100%)] backdrop-blur-2xl backdrop-saturate-150 md:my-2 md:ml-2 md:mr-4 md:rounded-[26px] md:border md:shadow-[0_14px_40px_rgba(0,0,0,0.25)]'
            : 'border-neutral-900 bg-black',
          sidebarOpen
            ? 'flex fixed inset-y-0 left-0 z-[60] pt-[env(safe-area-inset-top)] md:static md:z-auto md:pt-0'
            : 'hidden md:flex',
          threadsCollapsed && 'md:hidden'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className={cn('text-sm font-medium', inShell ? 'text-white/80' : 'text-neutral-500')}>Threads</span>
          <div className="flex items-center gap-1">
            <button
              onClick={startNewThread}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="New thread"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors md:hidden"
              aria-label="Close threads"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={toggleThreads}
              className="hidden p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors md:block"
              title="Collapse threads"
              aria-label="Collapse threads"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          {pinnedThreads.length > 0 && (
            <div>
              <p className={cn('px-3 pb-1', inShell ? 'text-xs font-medium text-white/45' : 'text-[11px] uppercase tracking-wide text-neutral-600')}>Pinned</p>
              <div className="space-y-0.5">{pinnedThreads.map(renderThreadRow)}</div>
            </div>
          )}
          {recentThreads.length > 0 && (
            <div>
              {pinnedThreads.length > 0 && (
                <p className={cn('px-3 pb-1', inShell ? 'text-xs font-medium text-white/45' : 'text-[11px] uppercase tracking-wide text-neutral-600')}>Recent</p>
              )}
              <div className="space-y-0.5">{recentThreads.map(renderThreadRow)}</div>
            </div>
          )}
          {threads.length === 0 && (
            <p className="px-3 text-sm text-neutral-600">No threads yet</p>
          )}
        </div>
      </aside>
      {sidebarOpen && (
        <div className={cn("fixed inset-0 z-[55] md:hidden", SCRIM)} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---- Main column ---- */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={cn("flex items-center gap-3 pr-4 md:px-4", inShell ? "pl-4 py-2" : "pl-16 py-3 border-b border-neutral-900")}>
          <button
            onClick={toggleThreads}
            className={cn(
              "p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors",
              !threadsCollapsed && "md:hidden",
            )}
            aria-label="Show threads"
            title="Show threads"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-medium text-white truncate">
              {activeThread?.title || (inShell ? 'New conversation' : 'VIVA')}
            </h1>
            {modelOverride && (
              <span className="shrink-0 px-2 py-0.5 rounded-full border border-neutral-800 text-[11px] text-neutral-500">
                {modelOverride}
              </span>
            )}
          </div>
          {inShell ? (
            // In the app shell the walkthrough is the lightbulb in the top bar.
            <ShellWalkthroughButton
              walkthrough={{ active: walkthrough.active, onToggle: walkthrough.toggle, available: walkthrough.steps.length > 0 }}
            />
          ) : (
            <WalkthroughToggle
              active={walkthrough.active}
              onToggle={walkthrough.toggle}
              pending={walkthrough.pending}
            />
          )}
          <button
            onClick={() => setConstraintsOpen(true)}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="My constraints"
          >
            <Waypoints className="w-4 h-4" />
          </button>
          <button
            onClick={startNewThread}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="New thread"
          >
            <Plus className="w-4 h-4" />
          </button>
        </header>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto" data-tour="viva-thread">
          <div className={cn("max-w-3xl mx-auto px-4 md:px-6 space-y-8", messages.length === 0 && !isThinking ? "py-4 md:py-6" : "py-8")}>
            {messages.length === 0 && !isThinking && (
              <VivaWelcome
                threads={threads}
                onSuggest={(text) => sendMessage(undefined, text)}
                onOpenThread={(id) => void openThread(id)}
              />
            )}

            {messages.map((message, index) => {
              const hideCopy = isStreaming && index === messages.length - 1 && !message.content.trim()
              return (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <VivaUserMessage copyText={message.content} hideCopy={hideCopy}>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap justify-end gap-2">
                          {message.attachments.map((att) =>
                            att.type === 'image' && att.url ? (
                              <a
                                key={att.url + att.name}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-40 max-w-[220px] rounded-lg object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={att.url + att.name}
                                href={att.url || undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/30 bg-[rgba(28,22,38,0.5)] px-2.5 py-1 text-xs text-white"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="max-w-[160px] truncate">{att.name}</span>
                              </a>
                            )
                          )}
                        </div>
                      )}
                      {message.content}
                    </VivaUserMessage>
                  ) : (
                    <VivaAssistantMessage
                      markdown={message.content}
                      copyText={message.content}
                      hideCopy={hideCopy}
                      actions={<MessageSaveMenu text={message.content} threadId={threadId} />}
                    />
                  )}
                </div>
              )
            })}

            {isThinking && (
              <div className="space-y-2">
                {indicators.length > 0 ? (
                  <p className="text-xs text-neutral-500 animate-pulse">
                    {indicators.map(i => i.detail).join('... ')}
                  </p>
                ) : null}
                <VivaThinkingIndicator label={indicators.length > 0 ? '' : 'Here with you'} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className={cn(inShell ? "pb-2" : "border-t border-neutral-900 pb-[max(0px,env(safe-area-inset-bottom))]")} data-tour="viva-composer">
          <div className={cn("max-w-3xl mx-auto px-4 md:px-6", inShell ? "py-2" : "py-4")}>
            {!inShell && (
            <div className="mb-3 flex items-center">
              <button
                type="button"
                data-tour="viva-suggest-tools"
                disabled={isStreaming || messages.length === 0}
                onClick={() => sendMessage(undefined, SUGGEST_TOOLS_USER_MESSAGE, { suggestTools: true })}
                title={
                  messages.length === 0
                    ? 'Talk first, then I can suggest from this conversation'
                    : 'Review this conversation and suggest what we could do'
                }
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  isStreaming || messages.length === 0
                    ? 'border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500',
                )}
              >
                Suggest tools
              </button>
            </div>
            )}
            <VivaChatInput
              value={currentMessage}
              onChange={setCurrentMessage}
              onSend={(attachments, text) => sendMessage(attachments, text)}
              disabled={isStreaming}
              placeholder="Talk to VIVA..."
              canSend={!isStreaming}
              extraActions={
                inShell ? (
                  <button
                    type="button"
                    data-tour="viva-suggest-tools"
                    disabled={isStreaming || messages.length === 0}
                    onClick={() => sendMessage(undefined, SUGGEST_TOOLS_USER_MESSAGE, { suggestTools: true })}
                    title={messages.length === 0 ? 'Talk first, then I can suggest from this conversation' : 'Review this conversation and suggest what we could do'}
                    className="ml-1 truncate rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suggest tools
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      </main>

      {/* ---- Constraints drawer ---- */}
      {constraintsOpen && (
        <>
          <div className={cn("fixed inset-0 z-40", SCRIM)} onClick={() => setConstraintsOpen(false)} />
          <aside className={cn(
            'fixed z-50 flex flex-col',
            inShell
              ? 'vf-glass inset-y-0 right-0 w-full border-l border-white/[0.14] bg-[linear-gradient(180deg,rgba(44,36,60,0.92)_0%,rgba(22,18,32,0.96)_100%)] backdrop-blur-2xl sm:inset-y-3 sm:right-3 sm:w-96 sm:rounded-[26px] sm:border sm:shadow-[0_18px_50px_rgba(0,0,0,0.35)]'
              : 'inset-y-0 right-0 w-full sm:w-96 bg-neutral-950 border-l border-neutral-900',
          )}>
            <div className={cn('flex items-center justify-between px-5 py-4', inShell ? 'pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4' : 'border-b border-neutral-900')}>
              <div>
                <h2 className={cn('font-medium text-white', inShell ? 'text-base font-semibold' : 'text-sm')}>My Constraints</h2>
                <p className={cn('text-xs mt-0.5', inShell ? 'text-white/55' : 'text-neutral-500')}>
                  Beliefs uncovered in coaching, and their journey to dissolved
                </p>
              </div>
              <button
                onClick={() => setConstraintsOpen(false)}
                aria-label="Close"
                className={cn('p-1.5 transition-colors', inShell ? 'rounded-full text-white/60 hover:bg-white/10 hover:text-white' : 'rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ConstraintsPanel />
            </div>
          </aside>
        </>
      )}
    </div>
    <DeleteConfirmationDialog
      isOpen={pendingDeleteId !== null}
      onClose={() => setPendingDeleteId(null)}
      onConfirm={confirmDeleteThread}
      title="Delete this thread?"
      message="The conversation and its messages are removed. This cannot be undone."
      isLoading={deletingThread}
    />
    <ToolWalkthrough
      active={walkthrough.active}
      steps={walkthrough.steps}
      onClose={walkthrough.close}
      onComplete={walkthrough.complete}
    />
    </div>
  )
}
