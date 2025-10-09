'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { User, Heart, Users, Activity, MapPin, Briefcase, DollarSign, CheckCircle, Camera, FileText, Star, Plane, UserPlus, Home, Building, GraduationCap, Gift } from 'lucide-react'

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
    description: 'Basic information about you',
    category: 'basics'
  },
  {
    id: 'health',
    title: 'Health & Vitality',
    icon: Activity,
    description: 'Physical health and wellness',
    category: 'life-vision'
  },
  {
    id: 'relationship',
    title: 'Romance & Partnership',
    icon: Heart,
    description: 'Relationship status and story',
    category: 'life-vision'
  },
  {
    id: 'family',
    title: 'Family & Parenting',
    icon: Users,
    description: 'Children and family story',
    category: 'life-vision'
  },
  {
    id: 'career',
    title: 'Career & Work',
    icon: Briefcase,
    description: 'Work and career story',
    category: 'life-vision'
  },
  {
    id: 'financial',
    title: 'Money & Wealth',
    icon: DollarSign,
    description: 'Financial overview and story',
    category: 'life-vision'
  },
  {
    id: 'location',
    title: 'Home & Environment',
    icon: Home,
    description: 'Living situation and story',
    category: 'life-vision'
  },
  {
    id: 'fun-recreation',
    title: 'Fun & Recreation',
    icon: Star,
    description: 'Hobbies and leisure activities',
    category: 'life-vision'
  },
  {
    id: 'travel-adventure',
    title: 'Travel & Adventure',
    icon: Plane,
    description: 'Travel experiences and goals',
    category: 'life-vision'
  },
  {
    id: 'social-friends',
    title: 'Social & Friends',
    icon: UserPlus,
    description: 'Social life and friendships',
    category: 'life-vision'
  },
  {
    id: 'possessions-lifestyle',
    title: 'Possessions & Lifestyle',
    icon: Building,
    description: 'Lifestyle and material goals',
    category: 'life-vision'
  },
  {
    id: 'spirituality-growth',
    title: 'Spirituality & Growth',
    icon: GraduationCap,
    description: 'Personal growth and spirituality',
    category: 'life-vision'
  },
  {
    id: 'giving-legacy',
    title: 'Giving & Legacy',
    icon: Gift,
    description: 'Philanthropy and legacy goals',
    category: 'life-vision'
  },
  {
    id: 'photos-notes',
    title: 'Media & Notes',
    icon: Camera,
    description: 'Photos, videos, and notes',
    category: 'extras'
  }
]

export function ProfileSidebar({ activeSection, onSectionChange, completedSections }: ProfileSidebarProps) {
  const basicsSections = sections.filter(s => s.category === 'basics')
  const lifeVisionSections = sections.filter(s => s.category === 'life-vision')
  const extrasSections = sections.filter(s => s.category === 'extras')

  const renderSection = (section: typeof sections[0]) => {
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
  }

  return (
    <Card className="p-6 lg:sticky lg:top-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-sm text-neutral-400">
          Help Viva understand your full life story
        </p>
      </div>

      <nav className="space-y-6">
        {/* Basics Section */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">
            Basics
          </h3>
          <div className="space-y-2">
            {basicsSections.map(renderSection)}
          </div>
        </div>

        {/* Life Vision Categories */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">
            12 Life Categories
          </h3>
          <div className="space-y-2">
            {lifeVisionSections.map(renderSection)}
          </div>
        </div>

        {/* Extras Section */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">
            Extras
          </h3>
          <div className="space-y-2">
            {extrasSections.map(renderSection)}
          </div>
        </div>
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
