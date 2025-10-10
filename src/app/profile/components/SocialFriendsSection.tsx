'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { UserPlus } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'

interface SocialFriendsSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
}

export function SocialFriendsSection({ profile, onProfileChange, onProfileReload }: SocialFriendsSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'social_friends', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, social_friends_story: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'social_friends')
    const recordingToDelete = categoryRecordings[index]
    const allRecordings = profile.story_recordings || []
    const actualIndex = allRecordings.findIndex(r => r.url === recordingToDelete.url && r.created_at === recordingToDelete.created_at)
    if (actualIndex !== -1) {
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(recordingToDelete.url)
        const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
        await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings }) })
        if (onProfileReload) await onProfileReload()
      } catch (error) { alert('Failed to delete recording.') }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="w-6 h-6 text-secondary-500" />
        <h3 className="text-xl font-bold text-white">Social / Friends</h3>
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
        <RecordingTextarea
          label="My Current Story Around Social & Friends"
          value={profile.social_friends_story || ''}
          onChange={(value) => handleInputChange('social_friends_story', value)}
          placeholder="Share your social life, friendships, how you connect with others... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="evidence"
        />

        <SavedRecordings
          key={`social-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="social_friends"
          onDelete={handleDeleteRecording}
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your social preferences helps Viva provide relevant suggestions for social activities and relationship building.
        </p>
      </div>
    </Card>
  )
}
