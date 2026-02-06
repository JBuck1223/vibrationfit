'use client'

import Link from 'next/link'
import { Trophy, Heart, Sparkles, Lightbulb } from 'lucide-react'
import { Card } from '@/lib/design-system'
import { VIBE_TAG_CONFIG, VibeTag } from '@/lib/vibe-tribe/types'

interface VibeTribeNavProps {
  className?: string
}

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

// VibeTribeNav is no longer needed since we consolidated to /vibe-tribe
// Keeping the export for backwards compatibility but it renders nothing
export function VibeTribeNav({ className = '' }: VibeTribeNavProps) {
  return null
}

// Card-based navigation for dedicated section pages (optional use)
export function VibeTribeSectionCards({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {(Object.entries(VIBE_TAG_CONFIG) as [VibeTag, typeof VIBE_TAG_CONFIG[VibeTag]][]).map(([key, config]) => {
        const Icon = ICON_MAP[key]
        
        return (
          <Link key={key} href={config.route}>
            <Card 
              className="p-4 md:p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 border border-neutral-700 hover:border-neutral-500"
            >
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.bgColor }}
              >
                <Icon className="w-6 h-6" style={{ color: config.color }} />
              </div>
              <h3 className="font-semibold text-white text-sm md:text-base">
                {config.displayName}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 hidden md:block">
                {config.description}
              </p>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
