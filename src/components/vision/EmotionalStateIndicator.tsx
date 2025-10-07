"use client"

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface EmotionalStateIndicatorProps {
  state: 'above_green_line' | 'below_green_line' | 'neutral'
  emotionScore?: number
}

const emotionNames = [
  '', // 0 (not used)
  'Joy',
  'Appreciation',
  'Passion',
  'Enthusiasm',
  'Positive Expectation',
  'Optimism',
  'Hopefulness',
  'Contentment',
  'Boredom',
  'Pessimism',
  'Frustration',
  'Irritation',
  'Impatience',
  'Overwhelm',
  'Disappointment',
  'Doubt',
  'Worry',
  'Blame',
  'Discouragement',
  'Anger',
  'Revenge',
  'Hatred',
  'Jealousy',
  'Insecurity',
  'Guilt',
  'Unworthiness',
  'Fear',
  'Grief',
  'Depression',
  'Despair',
  'Powerlessness'
]

export function EmotionalStateIndicator({ state, emotionScore }: EmotionalStateIndicatorProps) {
  const isAboveGreenLine = state === 'above_green_line'
  const isBelowGreenLine = state === 'below_green_line'
  const isNeutral = state === 'neutral'

  const getStateColor = () => {
    if (isAboveGreenLine) return 'from-[#199D67] to-[#5EC49A]'
    if (isBelowGreenLine) return 'from-[#D03739] to-[#EF4444]'
    return 'from-neutral-600 to-neutral-500'
  }

  const getIcon = () => {
    if (isAboveGreenLine) return <TrendingUp className="w-5 h-5" />
    if (isBelowGreenLine) return <TrendingDown className="w-5 h-5" />
    return <Minus className="w-5 h-5" />
  }

  const getStateText = () => {
    if (isAboveGreenLine) return 'Above the Green Line'
    if (isBelowGreenLine) return 'Below the Green Line'
    return 'Neutral'
  }

  const getEmotionName = () => {
    if (!emotionScore || emotionScore < 1 || emotionScore > 22) return null
    return emotionNames[emotionScore]
  }

  return (
    <div className={`
      inline-flex items-center gap-3 px-4 py-2 rounded-full
      bg-gradient-to-r ${getStateColor()}
      text-white text-sm font-medium
      shadow-lg
      ${isAboveGreenLine || isBelowGreenLine ? 'animate-pulse-subtle' : ''}
    `}>
      {getIcon()}
      <div className="flex flex-col">
        <span className="font-semibold">{getStateText()}</span>
        {getEmotionName() && (
          <span className="text-xs opacity-90">{getEmotionName()}</span>
        )}
      </div>
    </div>
  )
}
