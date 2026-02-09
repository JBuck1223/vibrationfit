'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/lib/design-system'
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Heart, 
  Sparkles, 
  Lightbulb,
  Filter,
  MessageCircle,
} from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG } from '@/lib/vibe-tribe/types'

const STORAGE_KEY = 'vibrationfit-how-to-vibe-collapsed'

const ICON_MAP: Record<VibeTag, typeof Trophy> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

const TAG_DESCRIPTIONS: Record<VibeTag, string> = {
  win: 'Evidence, synchronicities, "this matched my Life Vision today"',
  wobble: 'Doubt, resistance, contrast you\'re working through',
  vision: 'Updates, insights, new clarity about what you want',
  collaboration: 'Share what\'s working and invite others to try it, adapt it, or build on it',
}

export function HowToVibeCard() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(STORAGE_KEY, String(newState))
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden !p-0">
      {/* Header - Always visible */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#BF00FF]/20 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-[#BF00FF]" />
          </div>
          <span className="font-medium text-white">How to Vibe With the Tribe</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        )}
      </button>

      {/* Expandable Content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-3 border-t border-neutral-800 pt-3">
          {/* Tag Guide */}
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Use Tags to Categorize Your Posts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(['win', 'wobble', 'vision', 'collaboration'] as VibeTag[]).map((tag) => {
                const config = VIBE_TAG_CONFIG[tag]
                const Icon = ICON_MAP[tag]
                
                return (
                  <div 
                    key={tag}
                    className="flex items-start gap-2 p-2 rounded-lg bg-neutral-800/50"
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: config.color }}>
                        {config.label}
                      </p>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {TAG_DESCRIPTIONS[tag]}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Life Categories Reminder */}
          <div className="bg-neutral-800/30 rounded-lg p-3">
            <p className="text-sm text-neutral-300">
              <span className="text-white font-medium">Add Life Categories</span> to your posts (money, love, health, etc.) so others can filter and find posts that resonate.
            </p>
          </div>

          {/* Connection Practice */}
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">2-Minute Connection Practice</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <Filter className="w-4 h-4 text-neutral-500" />
                <span>Filter the feed by your top Life Category</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <Heart className="w-4 h-4 text-neutral-500" />
                <span>Find 2-3 posts and drop a heart</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <MessageCircle className="w-4 h-4 text-neutral-500" />
                <span>Leave 1 sentence of support or celebration</span>
              </div>
            </div>
          </div>

          {/* Closing */}
          <p className="text-xs text-neutral-500 text-center pt-2 border-t border-neutral-800">
            Every tagged post is a rep for "I am a conscious creator in action."
          </p>
        </div>
      )}
    </Card>
  )
}
