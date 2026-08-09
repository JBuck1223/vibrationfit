'use client'

/**
 * VIVA — the unified conversational home.
 *
 * One clean thread-based chat. The mode detector routes everything
 * (connection / coaching / momentum / guide / crisis) behind the scenes —
 * no pickers, no dashboards. Threads are saved, renameable, and pinnable.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
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
} from 'lucide-react'
import { keys } from '@/lib/query/keys'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { ConstraintsPanel } from '@/components/viva/ConstraintsPanel'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
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

  // --- Thread state ---
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [indicators, setIndicators] = useState<RetrievalIndicator[]>([])
  const [isThinking, setIsThinking] = useState(false)

  // --- UI state ---
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [constraintsOpen, setConstraintsOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Admin model testing: /viva?model=anthropic/claude-sonnet-4-5
  // The API only honors this override for admin accounts.
  const [modelOverride, setModelOverride] = useState<string | null>(null)
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('model')
    if (m) setModelOverride(m)
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
    messageCountRef.current = 0
  }

  const openThread = async (id: string) => {
    setThreadId(id)
    setMessages([])
    setIndicators([])
    setSidebarOpen(false)
    try {
      const res = await fetch(`/api/viva/conversations/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(
          (data.messages || []).map((m: { id: string; role: 'user' | 'assistant'; message: string }) => ({
            id: m.id,
            role: m.role,
            content: m.message,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading thread:', err)
    }
  }

  const deleteThread = async (id: string) => {
    if (!confirm('Delete this thread?')) return
    await fetch(`/api/viva/conversations?id=${id}`, { method: 'DELETE' })
    refreshThreads()
    if (id === threadId) startNewThread()
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
  const sendMessage = async (overrideContent?: string) => {
    const content = (overrideContent || currentMessage).trim()
    if (!content || isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsStreaming(true)
    setIsThinking(true)
    setIndicators([])

    try {
      const messagesForAPI = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/viva/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForAPI,
          conversationId: threadId,
          isNewSession: !threadId,
          ...(modelOverride ? { modelOverride } : {}),
        }),
      })

      const newThreadId = response.headers.get('X-Conversation-Id')
      if (newThreadId) setThreadId(newThreadId)

      const retrievalHeader = response.headers.get('X-Retrieval-Indicators')
      if (retrievalHeader) {
        try {
          setIndicators(JSON.parse(retrievalHeader))
        } catch { /* ignore malformed header */ }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Request failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantId = (Date.now() + 1).toString()

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantContent += decoder.decode(value, { stream: true })
          if (assistantContent.trim()) {
            setIsThinking(false)
            setMessages(prev =>
              prev.map(m => (m.id === assistantId ? { ...m, content: assistantContent } : m))
            )
          }
        }
      }

      refreshThreads()
    } catch (err) {
      console.error('VIVA chat error:', err)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Let's try again in a moment.",
        },
      ])
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
    }
  }

  const activeThread = threads.find(t => t.id === threadId)
  const pinnedThreads = threads.filter(t => t.pinned)
  const recentThreads = threads.filter(t => !t.pinned)

  const renderThreadRow = (thread: Thread) => (
    <div
      key={thread.id}
      onClick={() => openThread(thread.id)}
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200',
        thread.id === threadId ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
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
            className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white outline-none focus:border-neutral-500"
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
          <div className="hidden group-hover:flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
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
            <Pin className="w-3 h-3 text-neutral-600 group-hover:hidden shrink-0" />
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="flex-1 min-h-0 bg-black flex overflow-hidden">
      {/* ---- Thread sidebar ---- */}
      <aside
        className={cn(
          'w-72 shrink-0 border-r border-neutral-900 bg-black flex-col transition-all duration-300',
          sidebarOpen ? 'flex fixed inset-y-0 left-0 z-40 md:static' : 'hidden md:flex'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm font-medium text-neutral-500">Threads</span>
          <div className="flex items-center gap-1">
            <button
              onClick={startNewThread}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              title="New thread"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          {pinnedThreads.length > 0 && (
            <div>
              <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-600">Pinned</p>
              <div className="space-y-0.5">{pinnedThreads.map(renderThreadRow)}</div>
            </div>
          )}
          {recentThreads.length > 0 && (
            <div>
              {pinnedThreads.length > 0 && (
                <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-600">Recent</p>
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
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---- Main column ---- */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors md:hidden"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-medium text-white truncate">
              {activeThread?.title || 'VIVA'}
            </h1>
            {modelOverride && (
              <span className="shrink-0 px-2 py-0.5 rounded-full border border-neutral-800 text-[11px] text-neutral-500">
                {modelOverride}
              </span>
            )}
          </div>
          <button
            onClick={() => setConstraintsOpen(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="My constraints"
          >
            <Waypoints className="w-4 h-4" />
          </button>
          <button
            onClick={startNewThread}
            className="hidden md:block p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="New thread"
          >
            <Plus className="w-4 h-4" />
          </button>
        </header>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">
            {messages.length === 0 && !isThinking && (
              <div className="pt-24 text-center space-y-2">
                <p className="text-xl text-white">What&apos;s on your mind?</p>
                <p className="text-sm text-neutral-500">
                  I know your vision, your patterns, your journey.
                </p>
              </div>
            )}

            {messages.map(message => {
              return (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-[15px] text-neutral-100 whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="prose prose-invert prose-neutral max-w-none text-[15px] leading-relaxed prose-p:my-3 prose-headings:text-white prose-strong:text-white">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
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
                ) : (
                  <p className="text-xs text-neutral-500 animate-pulse">Here with you...</p>
                )}
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-neutral-900">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
            <VivaChatInput
              value={currentMessage}
              onChange={setCurrentMessage}
              onSend={() => sendMessage()}
              disabled={isStreaming}
              placeholder="Talk to VIVA..."
              canSend={!!currentMessage.trim() && !isStreaming}
            />
          </div>
        </div>
      </main>

      {/* ---- Constraints drawer ---- */}
      {constraintsOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setConstraintsOpen(false)} />
          <aside className="fixed inset-y-0 right-0 w-full sm:w-96 bg-neutral-950 border-l border-neutral-900 z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-900">
              <div>
                <h2 className="text-sm font-medium text-white">My Constraints</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Beliefs uncovered in coaching, and their journey to dissolved
                </p>
              </div>
              <button
                onClick={() => setConstraintsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
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
  )
}
