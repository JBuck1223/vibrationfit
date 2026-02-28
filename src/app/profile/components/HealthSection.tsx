'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, SaveButton, RadioGroup } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface HealthSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

const exerciseFrequencyOptions = [
  { value: 'None', label: 'None' },
  { value: '1-2x', label: '1-2 times per week' },
  { value: '3-4x', label: '3-4 times per week' },
  { value: '5+', label: '5+ times per week' }
]

export function HealthSection({ profile, onProfileChange, onProfileReload, onSave, isSaving, hasUnsavedChanges = false }: HealthSectionProps) {
  const [isExerciseFrequencyDropdownOpen, setIsExerciseFrequencyDropdownOpen] = useState(false)
  const exerciseFrequencyDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exerciseFrequencyDropdownRef.current && !exerciseFrequencyDropdownRef.current.contains(event.target as Node)) {
        setIsExerciseFrequencyDropdownOpen(false)
      }
    }
    
    if (isExerciseFrequencyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExerciseFrequencyDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    console.log('🎯 HealthSection: handleRecordingSaved called', { 
      url, 
      type, 
      transcript: transcript.substring(0, 50) + '...',
      updatedTextLength: updatedText.length
    })
    
    // Add the recording to the story_recordings array
    const newRecording = {
      url,
      transcript,
      type,
      category: visionToRecordingKey('health'),
      created_at: new Date().toISOString()
    }

    const currentRecordings = profile.story_recordings || []
    const updatedRecordings = [...currentRecordings, newRecording]
    
    console.log('💾 Preparing to save story_recordings:', {
      previousCount: currentRecordings.length,
      newCount: updatedRecordings.length,
      newRecording
    })

    // Auto-save to database immediately (save both recordings and story text)
    try {
      console.log('💾 Auto-saving recording AND text to database...')
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_recordings: updatedRecordings,
          state_health: updatedText
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save recording to database')
      }

      const data = await response.json()
      console.log('✅ Recording auto-saved to database', {
        savedRecordings: data.profile?.story_recordings?.length || 0,
        storyTextLength: data.profile?.state_health?.length || 0,
        actualRecordings: data.profile?.story_recordings
      })

      // Trigger a full profile reload to get fresh data
      if (onProfileReload) {
        console.log('🔄 Triggering full profile reload...')
        await onProfileReload()
        console.log('✅ Profile reloaded, component should show new recording')
      } else {
        console.warn('⚠️ No onProfileReload callback provided')
      }
    } catch (error) {
      console.error('❌ Failed to auto-save recording:', error)
      alert('Recording uploaded but failed to save to profile. Please try again or click "Save Changes".')
    }
  }

  const handleDeleteRecording = async (index: number) => {
    const healthRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('health'))
    const allRecordings = profile.story_recordings || []
    
    // Find the actual index in the full array
    const recordingToDelete = healthRecordings[index]
    const actualIndex = allRecordings.findIndex(r => 
      r.url === recordingToDelete.url && r.created_at === recordingToDelete.created_at
    )
    
    if (actualIndex !== -1) {
      const recordingUrl = recordingToDelete.url
      const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
      
      try {
        console.log('🗑️ Deleting recording...', { url: recordingUrl })
        
        // Delete the file from S3
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(recordingUrl)
        console.log('✅ File deleted from S3')

        // Update database
        console.log('💾 Updating database after delete...')
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            story_recordings: updatedRecordings
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete recording from database')
        }

        console.log('✅ Recording deleted from database')
        
        // Reload profile to refresh UI
        if (onProfileReload) {
          await onProfileReload()
        }
      } catch (error) {
        console.error('❌ Failed to delete recording:', error)
        alert('Failed to delete recording. Please try again.')
      }
    }
  }

  const isMetric = profile.units === 'Metric'
  const heightUnit = isMetric ? 'cm' : 'in'
  const weightUnit = isMetric ? 'kg' : 'lbs'

  // Convert height for display (database stores in inches or cm)
  const getDisplayHeight = () => {
    if (!profile.height) return ''
    return profile.height.toString()
  }

  // Convert weight for display (database stores in pounds or kg)
  const getDisplayWeight = () => {
    if (!profile.weight) return ''
    return profile.weight.toString()
  }

  const handleHeightChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue >= 0) {
      handleInputChange('height', numValue)
    }
  }

  const handleWeightChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue >= 0) {
      handleInputChange('weight', numValue)
    }
  }

  const HealthIcon = getVisionCategoryIcon('health')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <HealthIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('health')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Units Toggle */}
        <RadioGroup
          label="Measurement Units *"
          name="units"
          value={profile.units ?? undefined}
          onChange={(value) => handleInputChange('units', value)}
          options={[
            { value: 'US', label: 'US (in, lbs)' },
            { value: 'Metric', label: 'Metric (cm, kg)' }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Height - Takes 1/4 of container */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Height ({heightUnit}) *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={getDisplayHeight()}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder={isMetric ? "170" : "68"}
                min="0"
                step="0.1"
                className="w-full pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-neutral-400">
                {heightUnit}
              </div>
            </div>
          </div>

          {/* Weight - Takes 1/4 of container */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Weight ({weightUnit}) *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={getDisplayWeight()}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder={isMetric ? "70" : "150"}
                min="0"
                step="0.1"
                className="w-full pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-neutral-400">
                {weightUnit}
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Exercise Frequency *
          </label>
          <div className="relative" ref={exerciseFrequencyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsExerciseFrequencyDropdownOpen(!isExerciseFrequencyDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.exercise_frequency 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {exerciseFrequencyOptions.find(opt => opt.value === (profile.exercise_frequency || ''))?.label || 'Select exercise frequency'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isExerciseFrequencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isExerciseFrequencyDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsExerciseFrequencyDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {exerciseFrequencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('exercise_frequency', option.value)
                        setIsExerciseFrequencyDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.exercise_frequency || '') === option.value 
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
          label={`Current State of ${getVisionCategoryLabel('health')}`}
          description="Describe your relationship with your body, energy, and overall wellness. What health habits are working for you and where do you feel stuck? Be honest about both the wins and the frustrations — this helps shape a vision that actually fits your life."
          value={profile.state_health || ''}
          onChange={(value) => handleInputChange('state_health', value)}
          placeholder="Type or click the microphone to turn your voice into text."
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          recordingPurpose="quick"
          category={visionToRecordingKey('health')}
          instanceId="state"
        />

        {/* Display Saved Recordings */}
        <SavedRecordings
          key={`health-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('health')}
          onDelete={handleDeleteRecording}
        />

      </div>

      {/* Save Button - Bottom Right */}
      {onSave && (
        <div className="flex justify-end mt-6">
          <SaveButton
            onClick={onSave}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
          />
        </div>
      )}
    </Card>
  )
}
