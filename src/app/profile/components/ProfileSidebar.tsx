'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { User, Heart, Users, Activity, MapPin, Briefcase, DollarSign, CheckCircle } from 'lucide-react'

interface ProfileSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  completedSections: string[]
}

const sections = [
  {
    id: 'personal',
    title: 'Personal Info',
    icon: User,
    description: 'Basic information about you'
  },
  {
    id: 'relationship',
    title: 'Relationship',
    icon: Heart,
    description: 'Relationship status and details'
  },
  {
    id: 'family',
    title: 'Family',
    icon: Users,
    description: 'Children and family information'
  },
  {
    id: 'health',
    title: 'Health & Fitness',
    icon: Activity,
    description: 'Physical health and exercise'
  },
  {
    id: 'location',
    title: 'Living Situation',
    icon: MapPin,
    description: 'Where and how you live'
  },
  {
    id: 'career',
    title: 'Career',
    icon: Briefcase,
    description: 'Work and employment details'
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: DollarSign,
    description: 'Income and financial overview'
  }
]

export function ProfileSidebar({ activeSection, onSectionChange, completedSections }: ProfileSidebarProps) {
  return (
    <Card className="p-6 lg:sticky lg:top-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-sm text-neutral-400">
          Help your AI Vibrational Assistant understand you better
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
          <div className="text-sm text-neutral-400">Profile Complete</div>
        </div>
      </div>
    </Card>
  )
}
