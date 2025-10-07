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
  
  // Determine emotion color based on score (1-7 above green line, 8-22 below)
  const getEmotionColor = () => {
    if (!emotionScore) return null
    if (emotionScore <= 7) return 'bg-[#199D67]/10 border-[#199D67]' // Above Green Line
    return 'bg-[#D03739]/10 border-[#D03739]' // Below Green Line
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fadeIn`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`
            px-6 py-4 rounded-2xl
            ${isUser 
              ? 'bg-[#199D67] text-white rounded-br-sm' 
              : 'bg-[#1F1F1F] border-2 border-[#333] text-neutral-100 rounded-bl-sm'
            }
            ${!isUser && emotionScore ? getEmotionColor() : ''}
            transition-all duration-300
          `}
        >
          {/* Viva icon for assistant messages */}
          {!isUser && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-[#14B8A6]">Viva</span>
            </div>
          )}
          
          {/* Message content */}
          <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
          
          {/* Timestamp */}
          {timestamp && (
            <p className={`text-xs mt-2 ${isUser ? 'text-white/70' : 'text-neutral-500'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        
        {/* Emotion indicator for assistant messages */}
        {!isUser && emotionScore && (
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${emotionScore <= 7 ? 'bg-[#199D67]' : 'bg-[#D03739]'}`} />
            <span className="text-xs text-neutral-500">
              {emotionScore <= 7 ? 'Above Green Line' : 'Below Green Line'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
