'use client'

import React, { useState } from 'react'
import { Card, Textarea, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Star, Plus, X } from 'lucide-react'

interface FunRecreationSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export function FunRecreationSection({ profile, onProfileChange }: FunRecreationSectionProps) {
  const [newHobby, setNewHobby] = useState('')

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleAddHobby = () => {
    if (newHobby.trim()) {
      const currentHobbies = profile.hobbies || []
      handleInputChange('hobbies', [...currentHobbies, newHobby.trim()])
      setNewHobby('')
    }
  }

  const handleRemoveHobby = (index: number) => {
    const currentHobbies = profile.hobbies || []
    handleInputChange('hobbies', currentHobbies.filter((_, i) => i !== index))
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 text-accent-500" />
        <h3 className="text-xl font-bold text-white">Fun & Recreation</h3>
      </div>
      
      <div className="space-y-6">
        {/* Current Hobbies */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Current Hobbies
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddHobby()}
              placeholder="Add a hobby..."
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleAddHobby}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {profile.hobbies && profile.hobbies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.hobbies.map((hobby, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-800 text-neutral-200 rounded-full text-sm"
                >
                  {hobby}
                  <button
                    type="button"
                    onClick={() => handleRemoveHobby(index)}
                    className="hover:text-danger-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Leisure Time Weekly */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Leisure Time Per Week
          </label>
          <select
            value={profile.leisure_time_weekly || ''}
            onChange={(e) => handleInputChange('leisure_time_weekly', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select hours per week...</option>
            <option value="0-5">0-5 hours</option>
            <option value="6-15">6-15 hours</option>
            <option value="16-25">16-25 hours</option>
            <option value="25+">25+ hours</option>
          </select>
        </div>

        {/* Story Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            My Current Story Around Fun & Recreation
          </label>
          <Textarea
            value={profile.fun_recreation_story || ''}
            onChange={(e) => handleInputChange('fun_recreation_story', e.target.value)}
            placeholder="Share your current recreational activities, how you spend your leisure time, what brings you joy..."
            rows={6}
            className="w-full"
          />
          <p className="text-xs text-neutral-400 mt-1">
            This personal story helps Viva understand your interests and provide more personalized guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your recreational interests helps Viva provide relevant suggestions for fun activities and leisure planning.
        </p>
      </div>
    </Card>
  )
}
