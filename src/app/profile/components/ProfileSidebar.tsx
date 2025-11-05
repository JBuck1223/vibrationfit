'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { User, CheckCircle, Camera } from 'lucide-react'

interface ProfileSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  completedSections: string[]
}

// Helper function to get category info from design system
const getCategoryInfo = (categoryId: string) => {
  // Map profile section IDs to vision category keys
  const categoryMapping: Record<string, string> = {
    'personal': 'personal', // Special case - not in vision categories
    'fun-recreation': 'fun',
    'health': 'health',
    'travel-adventure': 'travel',
    'relationship': 'love',
    'family': 'family',
    'social-friends': 'social',
    'location': 'home',
    'career': 'work',
    'financial': 'money',
    'possessions-lifestyle': 'stuff',
    'giving-legacy': 'giving',
    'spirituality-growth': 'spirituality'
  }
  
  const visionCategoryKey = categoryMapping[categoryId] || categoryId
  const category = getVisionCategory(visionCategoryKey)
  
  if (category) {
    return {
      id: categoryId,
      title: category.label,
      icon: category.icon,
      description: category.description
    }
  }
  
  // Fallback for personal info (not in vision categories)
  if (categoryId === 'personal') {
    return {
      id: 'personal',
      title: 'Personal Info',
      icon: User,
      description: 'Basic information about you'
    }
  }
  
  // Fallback for other categories
  return {
    id: categoryId,
    title: categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: User,
    description: 'Profile section'
  }
}

// Sections in design system order (excluding forward and conclusion)
const sections = [
  {
    id: 'personal',
    title: 'Personal Info',
    icon: User,
    description: 'Basic information about you',
    category: 'basics',
    order: 0 // Personal info comes first
  },
  {
    id: 'fun-recreation',
    title: 'Fun',
    icon: getCategoryInfo('fun-recreation').icon,
    description: 'Hobbies and joyful activities',
    category: 'life-vision',
    order: 2
  },
  {
    id: 'health',
    title: 'Health',
    icon: getCategoryInfo('health').icon,
    description: 'Physical and mental well-being',
    category: 'life-vision',
    order: 3
  },
  {
    id: 'travel-adventure',
    title: 'Travel',
    icon: getCategoryInfo('travel-adventure').icon,
    description: 'Places to explore and adventures',
    category: 'life-vision',
    order: 4
  },
  {
    id: 'relationship',
    title: 'Love',
    icon: getCategoryInfo('relationship').icon,
    description: 'Romantic relationships',
    category: 'life-vision',
    order: 5
  },
  {
    id: 'family',
    title: 'Family',
    icon: getCategoryInfo('family').icon,
    description: 'Family relationships and life',
    category: 'life-vision',
    order: 6
  },
  {
    id: 'social-friends',
    title: 'Social',
    icon: getCategoryInfo('social-friends').icon,
    description: 'Social connections and friendships',
    category: 'life-vision',
    order: 7
  },
  {
    id: 'location',
    title: 'Home',
    icon: getCategoryInfo('location').icon,
    description: 'Living space and environment',
    category: 'life-vision',
    order: 8
  },
  {
    id: 'career',
    title: 'Work',
    icon: getCategoryInfo('career').icon,
    description: 'Work and career aspirations',
    category: 'life-vision',
    order: 9
  },
  {
    id: 'financial',
    title: 'Money',
    icon: getCategoryInfo('financial').icon,
    description: 'Financial goals and wealth',
    category: 'life-vision',
    order: 10
  },
  {
    id: 'possessions-lifestyle',
    title: 'Possessions',
    icon: getCategoryInfo('possessions-lifestyle').icon,
    description: 'Material belongings and things',
    category: 'life-vision',
    order: 11
  },
  {
    id: 'giving-legacy',
    title: 'Giving',
    icon: getCategoryInfo('giving-legacy').icon,
    description: 'Contribution and legacy',
    category: 'life-vision',
    order: 12
  },
  {
    id: 'spirituality-growth',
    title: 'Spirituality',
    icon: getCategoryInfo('spirituality-growth').icon,
    description: 'Spiritual growth and expansion',
    category: 'life-vision',
    order: 13
  },
  {
    id: 'photos-notes',
    title: 'Photos & Notes',
    icon: Camera,
    description: 'Media and additional notes',
    category: 'basics',
    order: 14
  }
].sort((a, b) => a.order - b.order)

export function ProfileSidebar({ activeSection, onSectionChange, completedSections }: ProfileSidebarProps) {
  const basicsSections = sections.filter(s => s.category === 'basics')
  const lifeVisionSections = sections.filter(s => s.category === 'life-vision')

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
      </nav>

    </Card>
  )
}
