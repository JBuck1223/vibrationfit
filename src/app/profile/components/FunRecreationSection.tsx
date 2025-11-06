'use client'

import React, { useState } from 'react'
import { Card, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { PartyPopper, Plus, X } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

interface FunRecreationSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
}

export function FunRecreationSection({ profile, onProfileChange, onProfileReload, profileId }: FunRecreationSectionProps) {
  const [newHobby, setNewHobby] = useState('')

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'fun_recreation', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      // Build API URL with profileId if provided
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      await fetch(apiUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ story_recordings: updatedRecordings, clarity_fun: updatedText }) 
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) { 
      console.error('Failed to save recording:', error)
      alert('Failed to save recording.') 
    }
  }

  const handleDeleteRecording = async (index: number) => {
    console.log('🗑️ handleDeleteRecording called with index:', index)
    console.log('📋 Current profile.story_recordings:', profile.story_recordings)
    
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'fun_recreation')
    console.log('🎯 Filtered categoryRecordings:', categoryRecordings)
    
    const recordingToDelete = categoryRecordings[index]
    console.log('🎯 Recording to delete:', recordingToDelete)
    
    // Validate recording exists
    if (!recordingToDelete) {
      console.error('❌ Recording not found at index:', index, 'Available recordings:', categoryRecordings)
      alert('Recording not found. Please refresh the page and try again.')
      return
    }

    const allRecordings = profile.story_recordings || []
    const actualIndex = allRecordings.findIndex(r => 
      r.url === recordingToDelete.url && 
      r.created_at === recordingToDelete.created_at &&
      r.category === recordingToDelete.category
    )
    
    console.log('🔍 Found actual index in all recordings:', actualIndex)
    
    if (actualIndex === -1) {
      console.error('❌ Could not find recording in all recordings array')
      alert('Could not find recording to delete. Please refresh the page and try again.')
      return
    }
    
    try {
      console.log('🗑️ Starting deletion process...')
      
      // Delete from S3 (will skip if URL is invalid/empty)
      const { deleteRecording } = await import('@/lib/services/recordingService')
      if (recordingToDelete.url) {
        console.log('🗑️ Deleting from S3:', recordingToDelete.url)
        await deleteRecording(recordingToDelete.url)
        console.log('✅ S3 deletion complete')
      } else {
        console.warn('⚠️ No URL found for recording, skipping S3 deletion')
      }
      
      // Remove from database
      const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
      console.log('💾 Updating database, removing recording at index:', actualIndex)
      console.log('📊 Updated recordings count:', updatedRecordings.length, '(was:', allRecordings.length, ')')
      
      // Build API URL with profileId if provided
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      console.log('📡 API URL:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_recordings: updatedRecordings })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API response error:', response.status, errorText)
        throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`)
      }
      
      console.log('✅ Database update successful')
      
      if (onProfileReload) {
        console.log('🔄 Reloading profile...')
        await onProfileReload()
      }
    } catch (error) {
      console.error('❌ Failed to delete recording:', error)
      alert(`Failed to delete recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
        <PartyPopper className="w-6 h-6 text-accent-500" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('fun')}</h3>
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

        {/* Clarity Field */}
        <RecordingTextarea
          label="What's going well in Fun?"
          value={profile.clarity_fun || ''}
          onChange={(value) => handleInputChange('clarity_fun', value)}
          placeholder="Share what's going well with your recreational activities, leisure time, what brings you joy... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category="fun_recreation"
        />

        <SavedRecordings
          key={`fun-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="fun_recreation"
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label="What's not going well in Fun?"
          value={profile.contrast_fun || ''}
          onChange={(value) => handleInputChange('contrast_fun', value)}
          placeholder="Share what's not going well with your recreational activities, leisure time, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category="fun_recreation"
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your recreational interests helps Viva provide relevant suggestions for fun activities and leisure planning.
        </p>
      </div>
    </Card>
  )
}
