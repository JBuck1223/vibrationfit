'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system'
import { CheckCircle } from 'lucide-react'

interface LifeVisionSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  completedSections: string[]
}

// Use centralized vision categories
const sections = VISION_CATEGORIES

export function LifeVisionSidebar({ activeSection, onSectionChange, completedSections }: LifeVisionSidebarProps) {
  return (
    <Card className="p-6 lg:sticky lg:top-6">

      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.key
          const isCompleted = completedSections.includes(section.key)

          return (
            <button
              key={section.key}
              onClick={() => {
                onSectionChange(section.key)
                // Scroll to top of page
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
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
                      {section.label}
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
          <div className="text-sm text-neutral-400">Life Vision Complete</div>
        </div>
      </div>
    </Card>
  )
}
