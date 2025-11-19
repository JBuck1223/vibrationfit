'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Checkbox } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { Gift, Save } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

interface GivingLegacySectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
}

export function GivingLegacySection({ profile, onProfileChange, onProfileReload, onSave, isSaving }: GivingLegacySectionProps) {
  const [isVolunteerStatusDropdownOpen, setIsVolunteerStatusDropdownOpen] = useState(false)
  const [isCharitableGivingDropdownOpen, setIsCharitableGivingDropdownOpen] = useState(false)
  const volunteerStatusDropdownRef = useRef<HTMLDivElement>(null)
  const charitableGivingDropdownRef = useRef<HTMLDivElement>(null)

  const volunteerStatusOptions = [
    { value: '', label: 'Select status...' },
    { value: 'none', label: 'None' },
    { value: 'occasional', label: 'Occasional' },
    { value: 'regular', label: 'Regular' },
    { value: 'frequent', label: 'Frequent' },
  ]

  const charitableGivingOptions = [
    { value: '', label: 'Select amount...' },
    { value: 'none', label: 'None' },
    { value: '<500', label: 'Under $500' },
    { value: '500-2000', label: '$500 - $2,000' },
    { value: '2000+', label: '$2,000+' },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volunteerStatusDropdownRef.current && !volunteerStatusDropdownRef.current.contains(event.target as Node)) {
        setIsVolunteerStatusDropdownOpen(false)
      }
      if (charitableGivingDropdownRef.current && !charitableGivingDropdownRef.current.contains(event.target as Node)) {
        setIsCharitableGivingDropdownOpen(false)
      }
    }

    if (isVolunteerStatusDropdownOpen || isCharitableGivingDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVolunteerStatusDropdownOpen, isCharitableGivingDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'giving_legacy', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, clarity_giving: updatedText }) })
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
        <Gift className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('giving')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Volunteer Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Volunteer Status
          </label>
          <div className="relative" ref={volunteerStatusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsVolunteerStatusDropdownOpen(!isVolunteerStatusDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.volunteer_status 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {volunteerStatusOptions.find(opt => opt.value === (profile.volunteer_status || ''))?.label || 'Select status...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isVolunteerStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isVolunteerStatusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsVolunteerStatusDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {volunteerStatusOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('volunteer_status', option.value)
                        setIsVolunteerStatusDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.volunteer_status || '') === option.value 
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

        {/* Charitable Giving */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Annual Charitable Giving
          </label>
          <div className="relative" ref={charitableGivingDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCharitableGivingDropdownOpen(!isCharitableGivingDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.charitable_giving 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {charitableGivingOptions.find(opt => opt.value === (profile.charitable_giving || ''))?.label || 'Select amount...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isCharitableGivingDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isCharitableGivingDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsCharitableGivingDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {charitableGivingOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('charitable_giving', option.value)
                        setIsCharitableGivingDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.charitable_giving || '') === option.value 
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

        {/* Legacy Mindset */}
        <div>
          <Checkbox
            label="I think about my legacy in day-to-day decisions"
            checked={profile.legacy_mindset || false}
            onChange={(e) => handleInputChange('legacy_mindset', e.target.checked)}
          />
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('giving')}?`}
          value={profile.clarity_giving || ''}
          onChange={(value) => handleInputChange('clarity_giving', value)}
          placeholder="Share what's going well with your giving practices, what causes matter to you, how you're contributing... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category="giving_legacy"
        />

        <SavedRecordings
          key={`giving-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="giving_legacy"
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('giving')}?`}
          value={profile.contrast_giving || ''}
          onChange={(value) => handleInputChange('contrast_giving', value)}
          placeholder="Share what's not going well with your giving or legacy goals, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category="giving_legacy"
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
