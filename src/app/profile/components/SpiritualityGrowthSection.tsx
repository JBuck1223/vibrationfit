'use client'

import React from 'react'
import { Card, Textarea } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { GraduationCap } from 'lucide-react'

interface SpiritualityGrowthSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export function SpiritualityGrowthSection({ profile, onProfileChange }: SpiritualityGrowthSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-6 h-6 text-accent-500" />
        <h3 className="text-xl font-bold text-white">Spirituality & Growth</h3>
      </div>
      
      <div className="space-y-6">
        {/* Spiritual Practice */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Spiritual Practice
          </label>
          <select
            value={profile.spiritual_practice || ''}
            onChange={(e) => handleInputChange('spiritual_practice', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select practice...</option>
            <option value="none">None</option>
            <option value="religious">Religious</option>
            <option value="spiritual">Spiritual (non-religious)</option>
            <option value="secular">Secular (mindfulness, etc.)</option>
          </select>
        </div>

        {/* Meditation Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Meditation Frequency
          </label>
          <select
            value={profile.meditation_frequency || ''}
            onChange={(e) => handleInputChange('meditation_frequency', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select frequency...</option>
            <option value="never">Never</option>
            <option value="rarely">Rarely</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        {/* Personal Growth Focus */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.personal_growth_focus || false}
              onChange={(e) => handleInputChange('personal_growth_focus', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-neutral-700 bg-neutral-800 checked:bg-primary-500 checked:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors cursor-pointer"
            />
            <span className="text-sm font-medium text-neutral-200">Actively focused on personal growth</span>
          </label>
        </div>

        {/* Story Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            My Current Story Around Spirituality & Growth
          </label>
          <Textarea
            value={profile.spirituality_growth_story || ''}
            onChange={(e) => handleInputChange('spirituality_growth_story', e.target.value)}
            placeholder="Share your current spiritual journey, personal growth practices, what you're learning..."
            rows={6}
            className="w-full"
          />
          <p className="text-xs text-neutral-400 mt-1">
            This personal story helps Viva understand your spiritual context and provide more personalized guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your spiritual and growth journey helps Viva provide relevant guidance for personal development and self-actualization.
        </p>
      </div>
    </Card>
  )
}
