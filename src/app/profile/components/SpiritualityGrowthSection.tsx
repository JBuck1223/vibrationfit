'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Checkbox } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'
import { Save } from 'lucide-react'

interface SpiritualityGrowthSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
}

export function SpiritualityGrowthSection({ profile, onProfileChange, onProfileReload, onSave, isSaving }: SpiritualityGrowthSectionProps) {
  const [isSpiritualPracticeDropdownOpen, setIsSpiritualPracticeDropdownOpen] = useState(false)
  const [isMeditationFrequencyDropdownOpen, setIsMeditationFrequencyDropdownOpen] = useState(false)
  const spiritualPracticeDropdownRef = useRef<HTMLDivElement>(null)
  const meditationFrequencyDropdownRef = useRef<HTMLDivElement>(null)

  const spiritualPracticeOptions = [
    { value: '', label: 'Select practice...' },
    { value: 'none', label: 'None' },
    { value: 'religious', label: 'Religious' },
    { value: 'spiritual', label: 'Spiritual (non-religious)' },
    { value: 'secular', label: 'Secular (mindfulness, etc.)' },
  ]

  const meditationFrequencyOptions = [
    { value: '', label: 'Select frequency...' },
    { value: 'never', label: 'Never' },
    { value: 'rarely', label: 'Rarely' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (spiritualPracticeDropdownRef.current && !spiritualPracticeDropdownRef.current.contains(event.target as Node)) {
        setIsSpiritualPracticeDropdownOpen(false)
      }
      if (meditationFrequencyDropdownRef.current && !meditationFrequencyDropdownRef.current.contains(event.target as Node)) {
        setIsMeditationFrequencyDropdownOpen(false)
      }
    }

    if (isSpiritualPracticeDropdownOpen || isMeditationFrequencyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSpiritualPracticeDropdownOpen, isMeditationFrequencyDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('spirituality'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, clarity_spirituality: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('spirituality'))
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

  const SpiritualityIcon = getVisionCategoryIcon('spirituality')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <SpiritualityIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">Spirituality</h3>
      </div>
      
      <div className="space-y-6">
        {/* Spiritual Practice */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Spiritual Practice
          </label>
          <div className="relative" ref={spiritualPracticeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSpiritualPracticeDropdownOpen(!isSpiritualPracticeDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.spiritual_practice 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {spiritualPracticeOptions.find(opt => opt.value === (profile.spiritual_practice || ''))?.label || 'Select practice...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isSpiritualPracticeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isSpiritualPracticeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsSpiritualPracticeDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {spiritualPracticeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('spiritual_practice', option.value)
                        setIsSpiritualPracticeDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.spiritual_practice || '') === option.value 
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

        {/* Meditation Frequency */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Meditation Frequency
          </label>
          <div className="relative" ref={meditationFrequencyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMeditationFrequencyDropdownOpen(!isMeditationFrequencyDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.meditation_frequency 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {meditationFrequencyOptions.find(opt => opt.value === (profile.meditation_frequency || ''))?.label || 'Select frequency...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isMeditationFrequencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isMeditationFrequencyDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMeditationFrequencyDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {meditationFrequencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('meditation_frequency', option.value)
                        setIsMeditationFrequencyDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.meditation_frequency || '') === option.value 
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

        {/* Personal Growth Focus */}
        <div>
          <Checkbox
            label="Actively focused on personal growth"
            checked={profile.personal_growth_focus || false}
            onChange={(e) => handleInputChange('personal_growth_focus', e.target.checked)}
          />
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('spirituality')}?`}
          value={profile.clarity_spirituality || ''}
          onChange={(value) => handleInputChange('clarity_spirituality', value)}
          placeholder="Share what's going well with your spiritual journey, personal growth practices, what you're learning... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('spirituality')}
          instanceId="clarity"
        />

        <SavedRecordings
          key={`spirituality-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('spirituality')}
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('spirituality')}?`}
          value={profile.contrast_spirituality || ''}
          onChange={(value) => handleInputChange('contrast_spirituality', value)}
          placeholder="Share what's not going well with your spiritual or growth journey, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('spirituality')}
          instanceId="contrast"
        />

        {/* Dream Field */}
        <RecordingTextarea
          label={`What do you dream about in ${getVisionCategoryLabel('spirituality')}?`}
          value={profile.dream_spirituality || ''}
          onChange={(value) => handleInputChange('dream_spirituality', value)}
          placeholder="What's your ideal vision for your spiritual journey and personal growth?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('spirituality')}
          instanceId="dream"
        />

        {/* Worry Field */}
        <RecordingTextarea
          label={`What do you worry about in ${getVisionCategoryLabel('spirituality')}?`}
          value={profile.worry_spirituality || ''}
          onChange={(value) => handleInputChange('worry_spirituality', value)}
          placeholder="What concerns you most about your spiritual path or personal development?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('spirituality')}
          instanceId="worry"
        />
      </div>

      {/* Save Button - Bottom Right */}
      {onSave && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={onSave}
            variant="primary"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </Card>
  )
}
