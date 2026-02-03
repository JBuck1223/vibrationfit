'use client'

import { Trophy, Heart, Sparkles, Lightbulb } from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG } from '@/lib/vibe-tribe/types'

interface VibeTagBadgeProps {
  tag: VibeTag
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'filled' | 'outline'
  selected?: boolean
  className?: string
}

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

export function VibeTagBadge({ 
  tag, 
  size = 'md', 
  showLabel = true,
  variant = 'filled',
  selected = false,
  className = '' 
}: VibeTagBadgeProps) {
  const config = VIBE_TAG_CONFIG[tag]
  const Icon = ICON_MAP[tag]
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  // For outline variant, show fill only when selected
  const isFilled = variant === 'filled' || (variant === 'outline' && selected)

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        border-2 transition-all duration-200
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: isFilled ? config.color : 'transparent',
        borderColor: config.color,
        color: isFilled ? '#000' : config.color,
      }}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
