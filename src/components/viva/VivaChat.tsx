// /src/components/viva/VivaChat.tsx
// Snappy streaming chat interface with optimistic UI

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface VivaChatProps {
  visionBuildPhase: 'contrast' | 'peak' | 'specific'
  currentCategory?: string
  onSaveVision?: (content: string) => Promise<void>
}

// Individual message component with streaming support
function Message({ message, onQuickAction }: { message: Message; onQuickAction: (action: string, content?: string) => void }) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-900 border border-neutral-800 text-white'
        )}
      >
        {/* Message content with streaming effect */}
        <div className="prose prose-invert prose-sm max-w-none">
          {message.content}
        </div>

        {/* Inline action buttons (appear after message completes) */}
        {!isUser && message.content.length > 50 && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-800">
            <button
              onClick={() => onQuickAction('Save', message.content)}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Save This
            </button>
            <button
              onClick={() => onQuickAction('Refine')}
              className="text-xs text-secondary-400 hover:text-secondary-300 transition-colors"
            >
              Make It Better
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
          You
        </div>
      )}
    </div>
  )
}

// Welcome message for first interaction
function WelcomeMessage({ phase }: { phase: string }) {
  const phaseMessages = {
    contrast: "Let's explore what you're ready to move beyond. What's no longer serving you?",
    peak: "Tell me about a time you felt absolutely AMAZING. What was happening?",
    specific: "Let's get crystal clear on what you desire. Make it real enough to taste."
  }

  return (
    <div className="text-center py-12 space-y-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-semibold text-white">Hey there! I'm VIVA ✨</h3>
      <p className="text-neutral-400 max-w-md mx-auto">
        {phaseMessages[phase as keyof typeof phaseMessages]}
      </p>
    </div>
  )
}

export default function VivaChat({ visionBuildPhase, currentCategory, onSaveVision }: VivaChatProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    // Add user message optimistically
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          visionBuildPhase,
          context: { category: currentCategory }
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      const assistantId = (Date.now() + 1).toString()

      setIsTyping(false)

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: ''
      }])

      // Stream tokens
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        // Update the assistant message as it streams
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: assistantMessage }
            : m
        ))
      }

      setIsLoading(false)

    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error')
      setError(errorObj)
      setIsLoading(false)
      setIsTyping(false)
      toast.error('Connection lost. Trying again...')
      console.error('Chat error:', err)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollContainer = messagesContainerRef.current
    if (!scrollContainer) return

    // Smooth scroll to bottom of chat container
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth'
    })
  }, [messages])

  // Initialize with VIVA's welcome message
  useEffect(() => {
    if (hasInitialized) return
    
    async function initializeChat() {
      setHasInitialized(true)
      setIsLoading(true)
      setIsTyping(true)

      try {
        // Send initial context request to get personalized greeting
        const response = await fetch('/api/viva/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: 'START_SESSION' // Special flag for VIVA to introduce itself
            }],
            visionBuildPhase,
            context: { category: currentCategory, isInitialGreeting: true }
          })
        })

        if (!response.ok) {
          console.error('Failed to initialize VIVA')
          setIsLoading(false)
          setIsTyping(false)
          return
        }

        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''
        const assistantId = Date.now().toString()

        setIsTyping(false)

        // Add empty assistant message that we'll update
        setMessages([{
          id: assistantId,
          role: 'assistant',
          content: ''
        }])

        // Stream tokens
        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          // Update the assistant message as it streams
          setMessages([{
            id: assistantId,
            role: 'assistant',
            content: assistantMessage
          }])
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize chat:', err)
        setIsLoading(false)
        setIsTyping(false)
      }
    }

    initializeChat()
  }, [hasInitialized, visionBuildPhase, currentCategory])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleQuickAction = async (action: string, content?: string) => {
    // Optimistic UI - show action immediately
    toast.success(`${action}...`)
    
    // Perform action (save, edit, etc.)
    if (action === 'Save' && content && onSaveVision) {
      try {
        await onSaveVision(content)
        toast.success('Vision saved! ✨')
      } catch (error) {
        toast.error('Failed to save. Try again?')
      }
    }
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Chat Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {messages.length === 0 && (
          <WelcomeMessage phase={visionBuildPhase} />
        )}

        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onQuickAction={handleQuickAction}
          />
        ))}

        {/* Typing Indicator */}
        {(isLoading || isTyping) && (
          <div className="flex items-center gap-2 text-primary-500 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">VIVA is tuning in...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-500 text-sm">Connection interrupted. Please try again.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Share what's on your mind..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}