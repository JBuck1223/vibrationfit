'use client'

/**
 * SessionChat Component
 * 
 * YouTube-live style chat feed for video sessions.
 * Uses Supabase realtime for instant message updates.
 * Host can highlight/pin a message to display it prominently.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, X, Pin, PinOff } from 'lucide-react'
import { Spinner } from '@/lib/design-system/components'

interface ChatMessage {
  id: string
  session_id: string
  user_id: string | null
  sender_name: string
  message: string
  message_type: string
  sent_at: string
  created_at: string
}

interface SessionChatProps {
  sessionId: string
  currentUserId?: string
  currentUserName?: string
  isHost?: boolean
  onClose?: () => void
  /** Callback when a message is highlighted — parent can display it prominently */
  onHighlightChange?: (message: ChatMessage | null) => void
}

export function SessionChat({
  sessionId,
  currentUserId,
  currentUserName = 'You',
  isHost = false,
  onClose,
  onHighlightChange,
}: SessionChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [highlightingId, setHighlightingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch initial messages + highlighted state
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const [messagesRes, highlightRes] = await Promise.all([
          fetch(`/api/video/sessions/${sessionId}/messages`),
          fetch(`/api/video/sessions/${sessionId}/highlight`),
        ])
        const messagesData = await messagesRes.json()
        const highlightData = await highlightRes.json()

        if (!messagesRes.ok) {
          throw new Error(messagesData.error || 'Failed to load messages')
        }

        setMessages(messagesData.messages || [])
        if (highlightData.highlighted_message) {
          setHighlightedId(highlightData.highlighted_message.id)
          onHighlightChange?.(highlightData.highlighted_message)
        }
        setError(null)
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError('Failed to load chat')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`session-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_session_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev
            }
            return [...prev, newMsg]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'video_session_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setMessages((prev) => prev.filter((m) => m.id !== deletedId))
          // Clear highlight if deleted message was highlighted
          if (deletedId === highlightedId) {
            setHighlightedId(null)
            onHighlightChange?.(null)
          }
        }
      )
      // Listen for highlight changes on the session itself
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as { highlighted_message_id: string | null }
          setHighlightedId(updated.highlighted_message_id)
          if (updated.highlighted_message_id) {
            // Find the message in our local state
            setMessages((prev) => {
              const msg = prev.find((m) => m.id === updated.highlighted_message_id)
              if (msg) onHighlightChange?.(msg)
              return prev
            })
          } else {
            onHighlightChange?.(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, highlightedId, onHighlightChange])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Highlight / unhighlight a message (host only)
  const toggleHighlight = useCallback(async (messageId: string) => {
    if (!isHost) return
    setHighlightingId(messageId)

    const newHighlightId = highlightedId === messageId ? null : messageId

    try {
      const response = await fetch(`/api/video/sessions/${sessionId}/highlight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: newHighlightId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update highlight')
      }

      setHighlightedId(newHighlightId)

      if (newHighlightId) {
        const msg = messages.find((m) => m.id === newHighlightId)
        onHighlightChange?.(msg || null)
      } else {
        onHighlightChange?.(null)
      }
    } catch (err) {
      console.error('Error toggling highlight:', err)
    } finally {
      setHighlightingId(null)
    }
  }, [isHost, highlightedId, sessionId, messages, onHighlightChange])

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()

    const trimmed = newMessage.trim()
    if (!trimmed || isSending) return

    setIsSending(true)

    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      session_id: sessionId,
      user_id: currentUserId || null,
      sender_name: currentUserName,
      message: trimmed,
      message_type: 'chat',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')

    try {
      const response = await fetch(`/api/video/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? data.message : m))
      )
    } catch (err) {
      console.error('Error sending message:', err)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setError('Failed to send message')
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const isOwnMessage = (msg: ChatMessage) => {
    return msg.user_id === currentUserId
  }

  // Assign stable colors to usernames
  const nameColors = [
    'text-primary-400',
    'text-secondary-400',
    'text-accent-400',
    'text-energy-400',
    'text-blue-400',
    'text-pink-400',
    'text-orange-400',
    'text-cyan-400',
  ]

  const getNameColor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return nameColors[Math.abs(hash) % nameColors.length]
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <span className="text-sm text-neutral-300 font-medium">Live chat</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Pinned / Highlighted message */}
      {highlightedId && (() => {
        const hlMsg = messages.find((m) => m.id === highlightedId)
        if (!hlMsg) return null
        return (
          <div className="px-3 py-2 bg-energy-500/10 border-b border-energy-500/30 flex items-center gap-2">
            <Pin className="w-3 h-3 text-energy-500 flex-shrink-0" />
            <p className="text-xs text-neutral-200 truncate flex-1">
              <span className="text-energy-400 font-medium">{hlMsg.sender_name}</span>{' '}
              {hlMsg.message}
            </p>
            {isHost && (
              <button
                onClick={() => toggleHighlight(highlightedId)}
                className="p-0.5 hover:bg-neutral-800 rounded transition-colors flex-shrink-0"
                title="Unpin"
              >
                <PinOff className="w-3 h-3 text-neutral-500" />
              </button>
            )}
          </div>
        )
      })()}

      {/* Messages — YouTube Live style feed */}
      <div className="flex-1 overflow-y-auto px-3 py-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="sm" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 text-xs py-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-600 text-xs">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isHighlighted = msg.id === highlightedId
            const own = isOwnMessage(msg)
            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-1.5 py-[3px] hover:bg-neutral-800/50 px-1 -mx-1 rounded ${
                  isHighlighted ? 'bg-energy-500/10' : ''
                }`}
              >
                {/* Compact message: @Name message */}
                <p className="text-[13px] leading-5 flex-1 min-w-0 break-words">
                  <span className={`font-medium ${
                    isHighlighted ? 'text-energy-400' : own ? 'text-primary-400' : getNameColor(msg.sender_name)
                  }`}>
                    {own ? 'You' : msg.sender_name}
                  </span>
                  <span className="text-neutral-200 ml-1.5">{msg.message}</span>
                </p>

                {/* Host: pin button on hover */}
                {isHost && !msg.id.startsWith('optimistic-') && (
                  <button
                    onClick={() => toggleHighlight(msg.id)}
                    disabled={highlightingId === msg.id}
                    className={`mt-0.5 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all flex-shrink-0 ${
                      isHighlighted
                        ? 'opacity-100 text-energy-500'
                        : 'text-neutral-600 hover:text-white'
                    }`}
                    title={isHighlighted ? 'Unpin' : 'Pin to feed'}
                  >
                    {isHighlighted ? (
                      <PinOff className="w-3 h-3" />
                    ) : (
                      <Pin className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 py-2 border-t border-neutral-800">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-neutral-600 focus:outline-none"
            disabled={isSending}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-1.5 text-primary-500 disabled:text-neutral-700 hover:text-primary-400 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default SessionChat
