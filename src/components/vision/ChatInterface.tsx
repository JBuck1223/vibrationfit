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
    <div className="flex flex-col h-full">
      {/* Category header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {category}
          </h2>
          {vibrationalState && messages.length > 0 && (
            <div className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${vibrationalState === 'above_green_line' 
                ? 'bg-[#199D67]/20 text-[#199D67] border border-[#199D67]' 
                : vibrationalState === 'below_green_line'
                ? 'bg-[#D03739]/20 text-[#D03739] border border-[#D03739]'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }
            `}>
              {vibrationalState === 'above_green_line' 
                ? 'Above Green Line' 
                : vibrationalState === 'below_green_line'
                ? 'Below Green Line'
                : 'Neutral'
              }
            </div>
          )}
        </div>
      </div>

      {/* Messages container */}
      <Card variant="default" className="flex-1 overflow-hidden flex flex-col mb-4">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to Create Your Vision
                </h3>
                <p className="text-neutral-400 max-w-md">
                  Share your thoughts about {category}. I&apos;ll guide you to clarity through our conversation.
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
                <div className="flex justify-start mb-6">
                  <div className="bg-[#1F1F1F] border-2 border-[#333] rounded-2xl rounded-bl-sm px-6 py-4">
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
      </Card>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Card variant="default" className="flex-1">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Share your thoughts about ${category}...`}
            className="w-full bg-transparent text-white placeholder-neutral-500 resize-none focus:outline-none min-h-[60px] max-h-[200px]"
            rows={2}
            disabled={isLoading}
          />
        </Card>
        <Button
          type="submit"
          variant="primary"
          disabled={!inputValue.trim() || isLoading}
          className="h-auto px-6"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </div>
  )
}
