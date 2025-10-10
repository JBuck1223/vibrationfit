'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Gift } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'

interface GivingLegacySectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
}

export function GivingLegacySection({ profile, onProfileChange, onProfileReload }: GivingLegacySectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'giving_legacy', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, giving_legacy_story: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'giving_legacy')
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
        <Gift className="w-6 h-6 text-secondary-500" />
        <h3 className="text-xl font-bold text-white">Giving / Legacy</h3>
      </div>
      
      <div className="space-y-6">
        {/* Volunteer Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Volunteer Status
          </label>
          <select
            value={profile.volunteer_status || ''}
            onChange={(e) => handleInputChange('volunteer_status', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select status...</option>
            <option value="none">None</option>
            <option value="occasional">Occasional</option>
            <option value="regular">Regular</option>
            <option value="frequent">Frequent</option>
          </select>
        </div>

        {/* Charitable Giving */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Annual Charitable Giving
          </label>
          <select
            value={profile.charitable_giving || ''}
            onChange={(e) => handleInputChange('charitable_giving', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Select amount...</option>
            <option value="none">None</option>
            <option value="<500">Under $500</option>
            <option value="500-2000">$500 - $2,000</option>
            <option value="2000+">$2,000+</option>
          </select>
        </div>

        {/* Legacy Mindset */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.legacy_mindset || false}
              onChange={(e) => handleInputChange('legacy_mindset', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-neutral-700 bg-neutral-800 checked:bg-primary-500 checked:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors cursor-pointer"
            />
            <span className="text-sm font-medium text-neutral-200">I think about my legacy in day-to-day decisions</span>
          </label>
        </div>

        {/* Story Field */}
        <RecordingTextarea
          label="My Current Story Around Giving & Legacy"
          value={profile.giving_legacy_story || ''}
          onChange={(value) => handleInputChange('giving_legacy_story', value)}
          placeholder="Share your giving practices, what causes matter to you, how you're contributing... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="evidence"
        />

        <SavedRecordings
          key={`giving-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="giving_legacy"
          onDelete={handleDeleteRecording}
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your giving and legacy goals helps Viva provide relevant guidance for making a meaningful impact and leaving a lasting legacy.
        </p>
      </div>
    </Card>
  )
}
