'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, SaveButton } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { UserPlus } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface SocialFriendsSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

const closeFriendsCountOptions = [
  { value: '0', label: '0' },
  { value: '1-3', label: '1-3' },
  { value: '4-8', label: '4-8' },
  { value: '9+', label: '9+' }
]

const socialPreferenceOptions = [
  { value: 'introvert', label: 'Introvert' },
  { value: 'ambivert', label: 'Ambivert' },
  { value: 'extrovert', label: 'Extrovert' }
]

export function SocialFriendsSection({ profile, onProfileChange, onProfileReload, onSave, isSaving, hasUnsavedChanges = false }: SocialFriendsSectionProps) {
  const [isCloseFriendsCountDropdownOpen, setIsCloseFriendsCountDropdownOpen] = useState(false)
  const [isSocialPreferenceDropdownOpen, setIsSocialPreferenceDropdownOpen] = useState(false)
  const closeFriendsCountDropdownRef = useRef<HTMLDivElement>(null)
  const socialPreferenceDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (closeFriendsCountDropdownRef.current && !closeFriendsCountDropdownRef.current.contains(event.target as Node)) {
        setIsCloseFriendsCountDropdownOpen(false)
      }
      if (socialPreferenceDropdownRef.current && !socialPreferenceDropdownRef.current.contains(event.target as Node)) {
        setIsSocialPreferenceDropdownOpen(false)
      }
    }
    
    if (isCloseFriendsCountDropdownOpen || isSocialPreferenceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCloseFriendsCountDropdownOpen, isSocialPreferenceDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('social'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, clarity_social: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('social'))
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
        <UserPlus className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('social')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Close Friends Count */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Close Friends Count
          </label>
          <div className="relative" ref={closeFriendsCountDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCloseFriendsCountDropdownOpen(!isCloseFriendsCountDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.close_friends_count 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {closeFriendsCountOptions.find(opt => opt.value === (profile.close_friends_count || ''))?.label || 'Select count...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isCloseFriendsCountDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isCloseFriendsCountDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsCloseFriendsCountDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {closeFriendsCountOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('close_friends_count', option.value)
                        setIsCloseFriendsCountDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.close_friends_count || '') === option.value 
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

        {/* Social Preference */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Social Preference
          </label>
          <div className="relative" ref={socialPreferenceDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSocialPreferenceDropdownOpen(!isSocialPreferenceDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.social_preference 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {socialPreferenceOptions.find(opt => opt.value === (profile.social_preference || ''))?.label || 'Select preference...'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isSocialPreferenceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isSocialPreferenceDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsSocialPreferenceDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {socialPreferenceOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('social_preference', option.value)
                        setIsSocialPreferenceDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.social_preference || '') === option.value 
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

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('social')}?`}
          value={profile.clarity_social || ''}
          onChange={(value) => handleInputChange('clarity_social', value)}
          placeholder="Share what's going well with your social life, friendships, how you connect with others... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('social')}
          instanceId="clarity"
        />
        <SavedRecordings
          key={`social-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('social')}
          onDelete={handleDeleteRecording}
        />
        {/* Dream Field */}
        <RecordingTextarea
          label={`What do you dream about in ${getVisionCategoryLabel('social')}?`}
          value={profile.dream_social || ''}
          onChange={(value) => handleInputChange('dream_social', value)}
          placeholder="What's your ideal vision for your social life and friendships?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('social')}
          instanceId="dream"
        />
        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('social')}?`}
          value={profile.contrast_social || ''}
          onChange={(value) => handleInputChange('contrast_social', value)}
          placeholder="Share what's not going well with your social life or friendships, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('social')}
          instanceId="contrast"
        />
        {/* Worry Field */}
        <RecordingTextarea
          label={`What do you worry about in ${getVisionCategoryLabel('social')}?`}
          value={profile.worry_social || ''}
          onChange={(value) => handleInputChange('worry_social', value)}
          placeholder="What concerns you most about your social connections and friendships?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('social')}
          instanceId="worry"
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
