'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { 
  Sparkles, 
  PartyPopper, 
  Plane, 
  Home, 
  Users, 
  Heart, 
  Activity, 
  DollarSign, 
  Briefcase, 
  UserPlus, 
  Package, 
  Gift, 
  Zap, 
  CheckCircle 
} from 'lucide-react'

interface LifeVisionSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  completedSections: string[]
}

const sections = [
  {
    id: 'forward',
    title: 'Forward',
    icon: Sparkles,
    description: 'Opening statement and intention'
  },
  {
    id: 'fun',
    title: 'Fun / Recreation',
    icon: PartyPopper,
    description: 'Hobbies and joyful activities'
  },
  {
    id: 'travel',
    title: 'Travel / Adventure',
    icon: Plane,
    description: 'Places to explore and adventures'
  },
  {
    id: 'home',
    title: 'Home / Environment',
    icon: Home,
    description: 'Living space and environment'
  },
  {
    id: 'family',
    title: 'Family / Parenting',
    icon: Users,
    description: 'Family relationships and life'
  },
  {
    id: 'romance',
    title: 'Love / Romance',
    icon: Heart,
    description: 'Romantic relationships'
  },
  {
    id: 'health',
    title: 'Health / Vitality',
    icon: Activity,
    description: 'Physical and mental well-being'
  },
  {
    id: 'money',
    title: 'Money / Wealth',
    icon: DollarSign,
    description: 'Financial goals and wealth'
  },
  {
    id: 'business',
    title: 'Business / Career',
    icon: Briefcase,
    description: 'Work and career aspirations'
  },
  {
    id: 'social',
    title: 'Social / Friends',
    icon: UserPlus,
    description: 'Social connections and friendships'
  },
  {
    id: 'possessions',
    title: 'Possessions / Stuff',
    icon: Package,
    description: 'Material belongings and things'
  },
  {
    id: 'giving',
    title: 'Giving / Legacy',
    icon: Gift,
    description: 'Contribution and legacy'
  },
  {
    id: 'spirituality',
    title: 'Spirituality',
    icon: Zap,
    description: 'Spiritual growth and expansion'
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    icon: CheckCircle,
    description: 'Closing thoughts and commitment'
  }
]

export function LifeVisionSidebar({ activeSection, onSectionChange, completedSections }: LifeVisionSidebarProps) {
  return (
    <Card className="p-6 lg:sticky lg:top-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Complete Your Life Vision</h2>
        <p className="text-sm text-neutral-400">
          Define what you want to create across all areas of your life
        </p>
      </div>

      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          const isCompleted = completedSections.includes(section.id)

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                  : 'hover:bg-neutral-800 border border-transparent text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-neutral-500'}`} />
                  {isCompleted && (
                    <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-green-500 bg-black rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {section.title}
                    </span>
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-neutral-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-500 mb-1">
            {Math.round((completedSections.length / sections.length) * 100)}%
          </div>
          <div className="text-sm text-neutral-400">Vision Complete</div>
        </div>
      </div>
    </Card>
  )
}
