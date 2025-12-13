// Unified conversation thread component
// Displays emails, SMS, and replies in chronological order

'use client'

import { Mail, MessageSquare, User, Clock } from 'lucide-react'
import { Badge } from '@/lib/design-system/components'

interface Message {
  type: 'email' | 'sms' | 'reply'
  id: string
  content: string
  htmlContent?: string
  subject?: string
  direction: 'inbound' | 'outbound'
  timestamp: string
  metadata?: {
    from?: string
    to?: string
    status?: string
    isStaff?: boolean
    userId?: string
  }
}

interface ConversationThreadProps {
  messages: Message[]
  loading?: boolean
}

export function ConversationThread({ messages, loading }: ConversationThreadProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-[#1F1F1F] rounded-xl h-24"
          />
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1F1F1F] rounded-xl border-2 border-[#333]">
        <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-400 mb-2">
          No Messages Yet
        </h3>
        <p className="text-sm text-neutral-500">
          Start the conversation by sending a message
        </p>
      </div>
    )
  }

  // Group messages into threads
  const threads = groupMessagesIntoThreads(messages)

  return (
    <div className="space-y-8">
      {threads.map((thread, index) => (
        <div key={index} className="space-y-4">
          {/* Thread Separator */}
          {index > 0 && (
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#333]" />
              <span className="text-xs text-neutral-600 font-medium">
                {getThreadLabel(thread)}
              </span>
              <div className="flex-1 h-px bg-[#333]" />
            </div>
          )}
          
          {/* Messages in this thread */}
          {thread.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}

interface Thread {
  id: string
  subject?: string
  startTime: string
  messages: Message[]
}

function groupMessagesIntoThreads(messages: Message[]): Thread[] {
  const threads: Thread[] = []
  let currentThread: Thread | null = null
  
  const THREAD_GAP_HOURS = 6 // Messages more than 6 hours apart start new thread

  messages.forEach((message, index) => {
    const messageTime = new Date(message.timestamp)
    
    // Start a new thread if:
    // 1. First message
    // 2. Different email subject (for emails)
    // 3. Gap of more than THREAD_GAP_HOURS since last message
    const shouldStartNewThread = 
      !currentThread ||
      (message.type === 'email' && message.subject && currentThread.subject !== message.subject) ||
      (index > 0 && 
        Math.abs(messageTime.getTime() - new Date(messages[index - 1].timestamp).getTime()) 
        > THREAD_GAP_HOURS * 60 * 60 * 1000)
    
    if (shouldStartNewThread) {
      currentThread = {
        id: message.id,
        subject: message.subject,
        startTime: message.timestamp,
        messages: []
      }
      threads.push(currentThread)
    }
    
    currentThread!.messages.push(message)
  })

  return threads
}

function getThreadLabel(thread: Thread): string {
  const startDate = new Date(thread.startTime)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Earlier Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} Days Ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} Weeks Ago`
  
  return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'
  const isStaff = message.metadata?.isStaff ?? isOutbound

  return (
    <div
      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] ${
          isOutbound
            ? 'bg-[#1F1F1F] text-neutral-200 border-2 border-primary-500'
            : 'bg-[#1F1F1F] text-neutral-200 border-2 border-[#333]'
        } rounded-2xl p-4 shadow-lg`}
      >
        {/* Message Header */}
        <div className="flex items-center gap-2 mb-2">
          {/* Type Icon */}
          {message.type === 'email' && (
            <Mail className="w-4 h-4" />
          )}
          {message.type === 'sms' && (
            <MessageSquare className="w-4 h-4" />
          )}
          {message.type === 'reply' && (
            <User className="w-4 h-4" />
          )}

          {/* Type Badge */}
          <Badge
            className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-400"
          >
            {message.type === 'email' && '📧 Email'}
            {message.type === 'sms' && '💬 SMS'}
            {message.type === 'reply' && '💭 Reply'}
          </Badge>

          {/* Direction Badge */}
          <Badge
            className={`text-xs px-2 py-0.5 ${
              isOutbound
                ? 'bg-primary-500/20 text-primary-500'
                : 'bg-secondary-500/20 text-secondary-500'
            }`}
          >
            {isOutbound ? '↑ Sent' : '↓ Received'}
          </Badge>
        </div>

        {/* Email Subject (if email) */}
        {message.type === 'email' && message.subject && (
          <div className="mb-2">
            <strong className="text-sm text-white">
              {message.subject}
            </strong>
          </div>
        )}

        {/* Message Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-200">
          {message.content}
        </div>

        {/* Metadata (from/to, status) */}
        {message.metadata && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-700">
            {message.metadata.from && (
              <span className="text-xs text-neutral-500">
                From: {message.metadata.from}
              </span>
            )}
            {message.metadata.status && (
              <span className="text-xs text-neutral-500">
                • {message.metadata.status}
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

