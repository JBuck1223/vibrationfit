'use client'

import { useState, useRef, useEffect } from 'react'
import { History, Plus, Trash2, X, ArrowLeft, Sparkles } from 'lucide-react'
import { Button, Card, Text, CategoryGrid, Spinner } from '@/lib/design-system'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { cn } from '@/lib/utils'

const COACH_CATEGORIES = VISION_CATEGORIES.filter(
  category => category.key !== 'forward' && category.key !== 'conclusion'
)

const INTENT_OPTIONS = [
  { id: 'talk', label: 'I just need to talk', description: 'Process what you\'re feeling', mode: 'connection' as const },
  { id: 'shift', label: 'Help me shift', description: 'I want to feel better about something', mode: 'coaching' as const },
  { id: 'guide', label: 'Help me do something', description: 'Navigate the platform with VIVA', mode: 'guide' as const },
  { id: 'celebrate', label: 'Something good happened', description: 'Share a win', mode: 'momentum' as const },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ReasoningStep {
  label: string
  detail: string
}

export default function VivaCoachPage() {
  // --- Entry State ---
  const [phase, setPhase] = useState<'intent' | 'chat'>('intent')
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])
  const [isReasoning, setIsReasoning] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [showConversations, setShowConversations] = useState(false)

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll only when new messages arrive (not on every content change during streaming)
  const messageCountRef = useRef(0)
  useEffect(() => {
    const newCount = messages.length + (isTyping ? 1 : 0)
    if (newCount > messageCountRef.current) {
      messageCountRef.current = newCount
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [messages.length, isTyping])

  useEffect(() => {
    loadConversations()
  }, [])


  // --- Data Loading ---
  const loadConversations = async () => {
    try {
      const response = await fetch('/api/viva/conversations?mode=coach')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading coaching conversations:', error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      setMessages([])
      setCurrentConversationId(conversationId)
      setPhase('chat')
      setShowConversations(false)

      const response = await fetch(`/api/viva/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.message,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Delete this coaching session?')) return
    try {
      const response = await fetch(`/api/viva/conversations?id=${conversationId}`, { method: 'DELETE' })
      if (response.ok) {
        await loadConversations()
        if (conversationId === currentConversationId) {
          startNew()
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  // --- Session Management ---
  const startNew = () => {
    setPhase('intent')
    setMessages([])
    setCurrentConversationId(null)
    setSelectedIntent(null)
    setSelectedCategories([])
    setReasoningSteps([])
    setIsReasoning(false)
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const beginCoaching = () => {
    setPhase('chat')
  }

  // --- Chat ---
  const sendMessage = async (overrideContent?: string) => {
    const content = overrideContent || currentMessage.trim()
    if (!content) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)
    setIsReasoning(true)
    setReasoningSteps([])

    try {
      const messagesForAPI = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      const isNewSession = !currentConversationId
      const intentOption = selectedIntent
        ? INTENT_OPTIONS.find(o => o.id === selectedIntent)
        : undefined
      const userIntent = intentOption?.label
      const modeHint = intentOption?.mode

      const response = await fetch('/api/viva/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForAPI,
          conversationId: currentConversationId,
          selectedCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
          userIntent,
          modeHint,
          isNewSession,
        }),
      })

      // Extract headers
      const conversationIdHeader = response.headers.get('X-Conversation-Id')
      if (conversationIdHeader) {
        setCurrentConversationId(conversationIdHeader)
      }

      // Parse reasoning steps from header
      const retrievalHeader = response.headers.get('X-Retrieval-Indicators')
      if (retrievalHeader) {
        try {
          const indicators = JSON.parse(retrievalHeader) as { source: string; detail: string }[]
          // Progressively reveal reasoning steps with delays
          indicators.forEach((ind, i) => {
            setTimeout(() => {
              setReasoningSteps(prev => [...prev, { label: ind.source, detail: ind.detail }])
            }, i * 400)
          })
        } catch {
          // ignore
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to get coaching response')
      }

      // Stream response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantMessageId = (Date.now() + 1).toString()

      // Once streaming starts, collapse reasoning
      let reasoningCollapsed = false

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk

          if (assistantContent.trim() && !reasoningCollapsed) {
            reasoningCollapsed = true
            setIsReasoning(false)
          }

          if (assistantContent.trim()) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            )
          }
        }

        if (assistantContent.trim()) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          )
        }
      }

      setIsReasoning(false)
      await loadConversations()
    } catch (error) {
      console.error('Error in coaching chat:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Let\'s try again.',
        timestamp: new Date(),
      }])
      setIsReasoning(false)
    } finally {
      setIsTyping(false)
    }
  }


  // --- Voice Recording ---

  // ========================================================================
  // RENDER
  // ========================================================================

  // --- Intent Selection Phase ---
  if (phase === 'intent') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">VIVA Coach</h1>
                <Text size="sm" className="text-neutral-400">
                  I know your vision, your patterns, your journey. What&apos;s up?
                </Text>
              </div>
              {conversations.length > 0 && (
                <Button
                  onClick={() => setShowConversations(!showConversations)}
                  variant="ghost"
                  size="lg"
                  title="Past coaching sessions"
                >
                  <History className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Conversations Sidebar */}
        {showConversations && (
          <>
            <div className="fixed inset-y-0 left-0 w-80 bg-[#1F1F1F] border-r border-neutral-800 z-20 flex flex-col pt-24">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <h2 className="text-lg font-bold text-white">Past Sessions</h2>
                <Button onClick={() => setShowConversations(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center"><Text size="sm" className="text-neutral-400">No sessions yet</Text></div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="group relative p-3 rounded-lg cursor-pointer bg-neutral-800/50 hover:bg-neutral-800 border border-transparent transition-colors"
                        onClick={() => loadConversation(conv.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {conv.title || conv.preview_message || 'Coaching session'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                              <span>{conv.message_count || 0} messages</span>
                              <span>&middot;</span>
                              <span>{new Date(conv.last_message_at || conv.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setShowConversations(false)} />
          </>
        )}

        {/* Intent Selection Content */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
          {/* Intent Options */}
          <div className="space-y-3 mb-10">
            <Text size="sm" className="text-neutral-400 uppercase tracking-wide font-semibold">
              What brings you here?
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedIntent(prev => prev === option.id ? null : option.id)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all duration-200',
                    selectedIntent === option.id
                      ? 'bg-accent-500/15 border-accent-500/50 ring-1 ring-accent-500/30'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  )}
                >
                  <div className="font-semibold text-white text-sm">{option.label}</div>
                  <div className="text-xs text-neutral-400 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-10">
            <CategoryGrid
              title="What area of life?"
              categories={COACH_CATEGORIES}
              selectedCategories={selectedCategories}
              onCategoryClick={toggleCategory}
              pillLabel="What area of life?"
              lifeVisionCategoryStrip
              desktopColumnCount={6}
            />
          </div>

          {/* Quick Start */}
          <div className="space-y-4">
            <Button
              onClick={beginCoaching}
              variant="accent"
              size="md"
            >
              Start Talking
            </Button>
            <Text size="xs" className="text-neutral-500 text-center">
              Or just start typing below — no selection needed
            </Text>

            {/* Direct input */}
            <VivaChatInput
              value={currentMessage}
              onChange={setCurrentMessage}
              onSend={() => {
                if (currentMessage.trim()) {
                  setPhase('chat')
                  setTimeout(() => sendMessage(), 100)
                }
              }}
              placeholder="Or just start talking... tap mic to record."
              canSend={!!currentMessage.trim()}
            />
          </div>
        </div>
      </div>
    )
  }

  // --- Chat Phase ---
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={startNew} className="text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">VIVA Coach</h1>
              {selectedCategories.length > 0 && (
                <Text size="xs" className="text-accent-500">
                  {selectedCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                </Text>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConversations(!showConversations)}
                variant="ghost"
                size="sm"
                title="Past sessions"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                onClick={startNew}
                variant="ghost"
                size="sm"
                title="New session"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations Sidebar (in chat phase) */}
      {showConversations && (
        <>
          <div className="fixed inset-y-0 left-0 w-80 bg-[#1F1F1F] border-r border-neutral-800 z-20 flex flex-col pt-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Past Sessions</h2>
              <Button onClick={() => setShowConversations(false)} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative p-3 rounded-lg cursor-pointer transition-colors',
                      conv.id === currentConversationId
                        ? 'bg-accent-500/15 border border-accent-500/30'
                        : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                    )}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <h3 className="text-sm font-semibold text-white truncate">
                      {conv.title || conv.preview_message || 'Coaching session'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                      <span>{conv.message_count || 0} messages</span>
                      <span>&middot;</span>
                      <span>{new Date(conv.last_message_at || conv.updated_at).toLocaleDateString()}</span>
                    </div>
                    <Button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setShowConversations(false)} />
        </>
      )}


      {/* Chat Messages */}
      <div className={cn(
        'flex-1 flex flex-col mx-auto w-full px-6 py-6 transition-all duration-300',
        showConversations ? 'md:ml-80 max-w-4xl' : 'max-w-4xl'
      )}>
        <div className="flex-1 overflow-y-auto space-y-5 mb-6">
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-accent-500" />
                </div>
                <Text size="lg" className="text-white font-semibold">
                  I&apos;m here.
                </Text>
                <Text size="sm" className="text-neutral-400 max-w-sm">
                  Say whatever&apos;s on your mind. I know your vision, your patterns, your journey.
                </Text>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-neutral-900/50 border border-neutral-800/50 text-white'
                )}
              >
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                  {message.content
                    ? (message.role === 'assistant'
                        ? message.content.replace(/\*\*\*/g, '').replace(/\*\*/g, '').replace(/#{1,6}\s/g, '')
                        : message.content)
                    : <span className="text-transparent">...</span>
                  }
                </div>
              </div>
            </div>
          ))}

          {/* Reasoning flow — Hormozi-style progressive reveal */}
          {isReasoning && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-500" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Text size="sm" className="text-white font-medium">Reasoning</Text>
                  <Spinner size="sm" variant="accent" />
                </div>
                <div className="space-y-1.5 pl-1 border-l border-neutral-700 ml-0.5">
                  {reasoningSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 pl-3 animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <Text size="xs" className="text-neutral-500 font-medium whitespace-nowrap min-w-[80px]">
                        {step.label}
                      </Text>
                      <Text size="xs" className="text-neutral-400 italic">
                        &ldquo;{step.detail}&rdquo;
                      </Text>
                    </div>
                  ))}
                  {reasoningSteps.length === 0 && (
                    <div className="pl-3">
                      <Text size="xs" className="text-neutral-500">Gathering context...</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="pt-4">
          <VivaChatInput
            value={currentMessage}
            onChange={setCurrentMessage}
            onSend={() => sendMessage()}
            disabled={isTyping}
            placeholder="Send a message..."
            canSend={!!currentMessage.trim()}
          />
        </div>
      </div>
    </div>
  )
}
