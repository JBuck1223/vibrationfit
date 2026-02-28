'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, SaveButton } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { PartyPopper, Plus, X } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface FunRecreationSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  saveError?: string | null
}

export function FunRecreationSection({ profile, onProfileChange, onProfileReload, profileId, onSave, isSaving, hasUnsavedChanges = false, saveError }: FunRecreationSectionProps) {
  const [newHobby, setNewHobby] = useState('')
  const [isLeisureDropdownOpen, setIsLeisureDropdownOpen] = useState(false)
  const leisureDropdownRef = useRef<HTMLDivElement>(null)

  const leisureOptions = [
    { value: '', label: 'Select hours per week...' },
    { value: '0-5', label: '0-5 hours' },
    { value: '6-15', label: '6-15 hours' },
    { value: '16-25', label: '16-25 hours' },
    { value: '25+', label: '25+ hours' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leisureDropdownRef.current && !leisureDropdownRef.current.contains(event.target as Node)) {
        setIsLeisureDropdownOpen(false)
      }
    }

    if (isLeisureDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLeisureDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('fun'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      // Build API URL with profileId if provided
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      await fetch(apiUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ story_recordings: updatedRecordings, state_fun: updatedText }) 
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
    
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('fun'))
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
        <PartyPopper className="w-6 h-6 text-white" />
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
              className="px-4 py-2 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] rounded-lg hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 transition-all duration-300"
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
          <div className="relative" ref={leisureDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLeisureDropdownOpen(!isLeisureDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.leisure_time_weekly 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {leisureOptions.find(opt => opt.value === (profile.leisure_time_weekly || ''))?.label || 'Select hours per week...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isLeisureDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isLeisureDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLeisureDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {leisureOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('leisure_time_weekly', option.value)
                        setIsLeisureDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.leisure_time_weekly || '') === option.value 
                          ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                          : 'text-white hover:bg-[#333]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* State Field */}
        <RecordingTextarea
          label="Current State of Fun & Recreation"
          description="Explain what fun looks like in your day-to-day reality. What do you do that feels really fun and what potentially feels like it's missing? Be thorough explaining what's going well and venting about what's not going well — we will use this later when crafting your vision."
          value={profile.state_fun || ''}
          onChange={(value) => handleInputChange('state_fun', value)}
          placeholder="Type or click the microphone to turn your voice into text."
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          recordingPurpose="quick"
          category={visionToRecordingKey('fun')}
          instanceId="state"
        />

        <SavedRecordings
          key={`fun-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('fun')}
          onDelete={handleDeleteRecording}
        />
      </div>

      {/* Save Button - Bottom Right */}
      {onSave && (
        <div className="mt-6">
          {saveError && hasUnsavedChanges && (
            <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-sm text-red-400">{saveError}</span>
            </div>
          )}
          <div className="flex justify-end">
            <SaveButton
              onClick={onSave}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              saveError={saveError}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
