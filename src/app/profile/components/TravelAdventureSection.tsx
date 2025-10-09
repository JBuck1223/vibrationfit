'use client'

import React from 'react'
import { Card, Textarea, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Plane } from 'lucide-react'

interface TravelAdventureSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export function TravelAdventureSection({ profile, onProfileChange }: TravelAdventureSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Plane className="w-6 h-6 text-secondary-500" />
        <h3 className="text-xl font-bold text-white">Travel & Adventure</h3>
      </div>
      
      <div className="space-y-6">
        {/* Travel Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Travel Frequency
          </label>
          <select
            value={profile.travel_frequency || ''}
            onChange={(e) => handleInputChange('travel_frequency', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select frequency...</option>
            <option value="never">Never</option>
            <option value="yearly">Yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Passport */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.passport || false}
              onChange={(e) => handleInputChange('passport', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-neutral-700 bg-neutral-800 checked:bg-primary-500 checked:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors cursor-pointer"
            />
            <span className="text-sm font-medium text-neutral-200">I have a valid passport</span>
          </label>
        </div>

        {/* Countries Visited */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Countries Visited
          </label>
          <Input
            type="number"
            min="0"
            value={profile.countries_visited || 0}
            onChange={(e) => handleInputChange('countries_visited', parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full"
          />
        </div>

        {/* Story Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            My Current Story Around Travel & Adventure
          </label>
          <Textarea
            value={profile.travel_adventure_story || ''}
            onChange={(e) => handleInputChange('travel_adventure_story', e.target.value)}
            placeholder="Share your current travel experiences, where you've been, how you like to travel..."
            rows={6}
            className="w-full"
          />
          <p className="text-xs text-neutral-400 mt-1">
            This personal story helps Viva understand your travel context and provide more personalized guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your travel interests helps Viva provide relevant destination suggestions and adventure planning guidance.
        </p>
      </div>
    </Card>
  )
}
