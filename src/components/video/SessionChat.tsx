'use client'

/**
 * SessionChat Component
 * 
 * YouTube-live style chat feed for video sessions.
 * Uses Supabase realtime for instant message updates.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageCircle, X } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'

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
}

export function SessionChat({
  sessionId,
  currentUserId,
  currentUserName = 'You',
  isHost = false,
  onClose,
}: SessionChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/video/sessions/${sessionId}/messages`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load messages')
        }

        setMessages(data.messages || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError('Failed to load chat')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [sessionId])

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
            // Avoid duplicates
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
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()

    const trimmed = newMessage.trim()
    if (!trimmed || isSending) return

    setIsSending(true)

    // Optimistic update
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

      // Replace optimistic message with real one (realtime will handle this,
      // but we remove the optimistic one to avoid brief duplicate)
      const data = await response.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? data.message : m))
      )
    } catch (err) {
      console.error('Error sending message:', err)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setError('Failed to send message')
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if message is from current user
  const isOwnMessage = (msg: ChatMessage) => {
    return msg.user_id === currentUserId
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900/95 backdrop-blur rounded-2xl border border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
        <h3 className="text-white font-medium flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary-500" />
          Live Chat
          {messages.length > 0 && (
            <span className="text-xs text-neutral-500">({messages.length})</span>
          )}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="sm" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 text-sm py-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                isOwnMessage(msg) ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                  isOwnMessage(msg)
                    ? 'bg-primary-500/20 text-primary-500'
                    : 'bg-secondary-500/20 text-secondary-500'
                }`}
              >
                {getInitials(msg.sender_name)}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[75%] ${
                  isOwnMessage(msg) ? 'text-right' : ''
                }`}
              >
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span
                    className={`text-xs font-medium ${
                      isOwnMessage(msg) ? 'text-primary-400' : 'text-white'
                    }`}
                  >
                    {isOwnMessage(msg) ? 'You' : msg.sender_name}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {formatTime(msg.sent_at)}
                  </span>
                </div>
                <div
                  className={`inline-block px-3 py-1.5 rounded-2xl text-sm ${
                    isOwnMessage(msg)
                      ? 'bg-primary-500/20 text-white'
                      : 'bg-neutral-800 text-neutral-200'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
            disabled={isSending}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-black flex items-center justify-center transition-colors"
          >
            {isSending ? (
              <Spinner size="sm" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SessionChat
