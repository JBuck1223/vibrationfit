"use client"

import React from 'react'
import { Sparkles } from 'lucide-react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  emotionScore?: number
}

export function MessageBubble({ role, content, timestamp, emotionScore }: MessageBubbleProps) {
  const isUser = role === 'user'

  if (isUser) {
    // User message - right-aligned with bubble
    return (
      <div className="flex justify-end mb-6 animate-fadeIn">
        <div className="max-w-[85%]">
          <div className="bg-[#14B8A6] text-white px-5 py-3 rounded-2xl rounded-br-md">
            <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          {timestamp && (
            <p className="text-xs text-neutral-500 mt-1 text-right">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Assistant message - Claude-style with avatar on left
  return (
    <div className="flex items-start gap-3 mb-8 animate-fadeIn group">
      {/* Viva avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      {/* Message content */}
      <div className="flex-1 max-w-[85%]">
        <div className="mb-1">
          <span className="text-sm font-medium text-[#14B8A6]">Viva</span>
          {emotionScore && (
            <span className="ml-2 inline-flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${emotionScore <= 7 ? 'bg-[#199D67]' : 'bg-[#D03739]'}`} />
              <span className={`text-xs ${emotionScore <= 7 ? 'text-[#199D67]' : 'text-[#D03739]'}`}>
                {emotionScore <= 7 ? 'Above Green Line' : 'Below Green Line'}
              </span>
            </span>
          )}
        </div>
        
        {/* Message text - clean, no background like Claude */}
        <div className="text-neutral-100 text-base leading-relaxed whitespace-pre-wrap">
          {content}
        </div>

        {timestamp && (
          <p className="text-xs text-neutral-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
