"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { MessageBubble } from './MessageBubble'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  emotion_score?: number
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
  category: string
  vibrationalState?: 'above_green_line' | 'below_green_line' | 'neutral'
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  category,
  vibrationalState
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue('')
    
    await onSendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Category header - cleaner, centered */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {category}
        </h2>
        {vibrationalState && messages.length > 0 && (
          <div className="inline-flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              vibrationalState === 'above_green_line' 
                ? 'bg-[#199D67]' 
                : vibrationalState === 'below_green_line'
                ? 'bg-[#D03739]'
                : 'bg-neutral-500'
            }`} />
            <span className={`text-sm font-medium ${
              vibrationalState === 'above_green_line' 
                ? 'text-[#199D67]' 
                : vibrationalState === 'below_green_line'
                ? 'text-[#D03739]'
                : 'text-neutral-400'
            }`}>
              {vibrationalState === 'above_green_line' 
                ? 'Above Green Line' 
                : vibrationalState === 'below_green_line'
                ? 'Below Green Line'
                : 'Neutral'
              }
            </span>
          </div>
        )}
      </div>

      {/* Messages container - no card, clean background like Claude */}
      <div className="flex-1 overflow-y-auto mb-6 px-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Let&apos;s Create Your {category} Vision
              </h3>
              <p className="text-neutral-400">
                Share your thoughts, dreams, and desires. I&apos;ll guide you to clarity through our conversation.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                emotionScore={message.emotion_score}
              />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 mb-8 animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin" />
                    <span className="text-neutral-400 text-sm">Viva is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - modern, clean like ChatGPT */}
      <div className="border-t border-neutral-800 pt-4 px-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative bg-neutral-900 rounded-2xl border border-neutral-700 hover:border-neutral-600 focus-within:border-[#14B8A6] transition-colors">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Share your thoughts about ${category}...`}
              className="w-full bg-transparent text-white placeholder-neutral-500 resize-none focus:outline-none px-4 py-3 pr-12 min-h-[56px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`
                absolute right-2 bottom-2 w-8 h-8 rounded-lg
                flex items-center justify-center
                transition-all duration-200
                ${inputValue.trim() && !isLoading
                  ? 'bg-[#14B8A6] hover:bg-[#0D9488] text-white'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}
