'use client'

import React from 'react'
import { Card, Textarea, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Building } from 'lucide-react'

interface PossessionsLifestyleSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export function PossessionsLifestyleSection({ profile, onProfileChange }: PossessionsLifestyleSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-6 h-6 text-primary-500" />
        <h3 className="text-xl font-bold text-white">Possessions & Lifestyle</h3>
      </div>
      
      <div className="space-y-6">
        {/* Lifestyle Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Lifestyle Category
          </label>
          <select
            value={profile.lifestyle_category || ''}
            onChange={(e) => handleInputChange('lifestyle_category', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select category...</option>
            <option value="minimalist">Minimalist</option>
            <option value="moderate">Moderate</option>
            <option value="comfortable">Comfortable</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>

        {/* Primary Vehicle */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Primary Vehicle
          </label>
          <Input
            type="text"
            value={profile.primary_vehicle || ''}
            onChange={(e) => handleInputChange('primary_vehicle', e.target.value)}
            placeholder="e.g., 2020 Toyota Camry, Tesla Model 3, etc."
            className="w-full"
          />
        </div>

        {/* Story Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            My Current Story Around Possessions & Lifestyle
          </label>
          <Textarea
            value={profile.possessions_lifestyle_story || ''}
            onChange={(e) => handleInputChange('possessions_lifestyle_story', e.target.value)}
            placeholder="Share your current lifestyle, what possessions matter to you, how you live day-to-day..."
            rows={6}
            className="w-full"
          />
          <p className="text-xs text-neutral-400 mt-1">
            This personal story helps Viva understand your lifestyle context and provide more personalized guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your lifestyle preferences helps Viva provide relevant suggestions for lifestyle improvements and material goals.
        </p>
      </div>
    </Card>
  )
}
