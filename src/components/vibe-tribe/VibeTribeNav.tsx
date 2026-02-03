'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Heart, Sparkles, Lightbulb, Home, Activity } from 'lucide-react'
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

export function VibeTribeNav({ className = '' }: VibeTribeNavProps) {
  const pathname = usePathname()
  
  const isActive = (route: string) => {
    if (route === '/vibe-tribe') {
      return pathname === '/vibe-tribe'
    }
    return pathname?.startsWith(route)
  }

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 ${className}`}>
      {/* Hub */}
      <Link 
        href="/vibe-tribe"
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
          transition-all duration-200 text-sm font-medium
          ${isActive('/vibe-tribe') && pathname === '/vibe-tribe'
            ? 'bg-[#39FF14] text-black' 
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }
        `}
      >
        <Home className="w-4 h-4" />
        <span>Hub</span>
      </Link>

      {/* Activity */}
      <Link 
        href="/vibe-tribe/activity"
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
          transition-all duration-200 text-sm font-medium
          ${isActive('/vibe-tribe/activity')
            ? 'bg-white text-black' 
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }
        `}
      >
        <Activity className="w-4 h-4" />
        <span>My Activity</span>
      </Link>
    </div>
  )
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
