'use client'

import React from 'react'
import { Card, Input, Button } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

interface HealthSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
}

const exerciseFrequencyOptions = [
  { value: 'None', label: 'None' },
  { value: '1-2x', label: '1-2 times per week' },
  { value: '3-4x', label: '3-4 times per week' },
  { value: '5+', label: '5+ times per week' }
]

export function HealthSection({ profile, onProfileChange, onProfileReload }: HealthSectionProps) {
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
      category: 'health_vitality',
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
          clarity_health: updatedText // Save the updated story text with transcript
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save recording to database')
      }

      const data = await response.json()
      console.log('✅ Recording auto-saved to database', {
        savedRecordings: data.profile?.story_recordings?.length || 0,
        storyTextLength: data.profile?.clarity_health?.length || 0,
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
    const healthRecordings = (profile.story_recordings || []).filter(r => r.category === 'health_vitality')
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
  const heightUnit = isMetric ? 'cm' : 'inches'
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

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">{getVisionCategoryLabel('health')}</h3>
      
      <div className="space-y-6">
        {/* Units Toggle */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            Measurement Units *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="units"
                checked={profile.units === 'US'}
                onChange={() => handleInputChange('units', 'US')}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">US (ft/in, lbs)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="units"
                checked={profile.units === 'Metric'}
                onChange={() => handleInputChange('units', 'Metric')}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">Metric (cm, kg)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Height */}
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
                className="w-full pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-neutral-400">
                {heightUnit}
              </div>
            </div>
          </div>

          {/* Weight */}
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
                className="w-full pr-10"
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
          <select
            value={profile.exercise_frequency || ''}
            onChange={(e) => handleInputChange('exercise_frequency', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select exercise frequency</option>
            {exerciseFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* BMI Calculator - Optional */}
        {profile.height && profile.weight && (
          <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-primary-400 mb-2">Health Insights</h4>
            <p className="text-sm text-neutral-300">
              Your BMI is approximately <span className="font-medium text-white">
                {(() => {
                  const height = profile.height!
                  const weight = profile.weight!
                  const heightInMeters = isMetric ? height / 100 : height * 0.0254
                  const weightInKg = isMetric ? weight : weight * 0.453592
                  const bmi = weightInKg / (heightInMeters * heightInMeters)
                  return bmi.toFixed(1)
                })()}
              </span>
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              This information helps your AI assistant provide personalized health and wellness guidance.
            </p>
          </div>
        )}

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('health')}?`}
          value={profile.clarity_health || ''}
          onChange={(value) => handleInputChange('clarity_health', value)}
          placeholder="Share what's going well with your health journey, fitness goals, wellness practices... Or click the microphone to record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category="health_vitality"
        />

        {/* Display Saved Recordings */}
        <SavedRecordings
          key={`health-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="health_vitality"
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('health')}?`}
          value={profile.contrast_health || ''}
          onChange={(value) => handleInputChange('contrast_health', value)}
          placeholder="Share what's not going well with your health, fitness, or wellness, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category="health_vitality"
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Health information helps your AI assistant provide personalized fitness and wellness recommendations.
        </p>
      </div>
    </Card>
  )
}
