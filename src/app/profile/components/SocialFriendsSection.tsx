'use client'

import React from 'react'
import { Card, Textarea } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { UserPlus } from 'lucide-react'

interface SocialFriendsSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

export function SocialFriendsSection({ profile, onProfileChange }: SocialFriendsSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="w-6 h-6 text-secondary-500" />
        <h3 className="text-xl font-bold text-white">Social & Friends</h3>
      </div>
      
      <div className="space-y-6">
        {/* Close Friends Count */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Close Friends Count
          </label>
          <select
            value={profile.close_friends_count || ''}
            onChange={(e) => handleInputChange('close_friends_count', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select count...</option>
            <option value="0">0</option>
            <option value="1-3">1-3</option>
            <option value="4-8">4-8</option>
            <option value="9+">9+</option>
          </select>
        </div>

        {/* Social Preference */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Social Preference
          </label>
          <select
            value={profile.social_preference || ''}
            onChange={(e) => handleInputChange('social_preference', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select preference...</option>
            <option value="introvert">Introvert</option>
            <option value="ambivert">Ambivert</option>
            <option value="extrovert">Extrovert</option>
          </select>
        </div>

        {/* Story Field */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            My Current Story Around Social & Friends
          </label>
          <Textarea
            value={profile.social_friends_story || ''}
            onChange={(e) => handleInputChange('social_friends_story', e.target.value)}
            placeholder="Share your current social life, friendships, how you connect with others..."
            rows={6}
            className="w-full"
          />
          <p className="text-xs text-neutral-400 mt-1">
            This personal story helps Viva understand your social context and provide more personalized guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your social preferences helps Viva provide relevant suggestions for social activities and relationship building.
        </p>
      </div>
    </Card>
  )
}
