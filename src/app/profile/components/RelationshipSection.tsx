'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, SaveButton } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface RelationshipSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

const relationshipStatusOptions = [
  { value: 'Single', label: 'Single' },
  { value: 'In a Relationship', label: 'In a Relationship' },
  { value: 'Married', label: 'Married' }
]

const relationshipLengthOptions = [
  { value: '1-6 months', label: '1-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: '12-18 months', label: '12-18 months' },
  { value: '18-24 months', label: '18-24 months' },
  { value: '2-3 years', label: '2-3 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10+ years', label: '10+ years' }
]

export function RelationshipSection({ profile, onProfileChange, onProfileReload, onSave, isSaving, hasUnsavedChanges = false }: RelationshipSectionProps) {
  const [isRelationshipStatusDropdownOpen, setIsRelationshipStatusDropdownOpen] = useState(false)
  const [isRelationshipLengthDropdownOpen, setIsRelationshipLengthDropdownOpen] = useState(false)
  const relationshipStatusDropdownRef = useRef<HTMLDivElement>(null)
  const relationshipLengthDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (relationshipStatusDropdownRef.current && !relationshipStatusDropdownRef.current.contains(event.target as Node)) {
        setIsRelationshipStatusDropdownOpen(false)
      }
      if (relationshipLengthDropdownRef.current && !relationshipLengthDropdownRef.current.contains(event.target as Node)) {
        setIsRelationshipLengthDropdownOpen(false)
      }
    }
    
    if (isRelationshipStatusDropdownOpen || isRelationshipLengthDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRelationshipStatusDropdownOpen, isRelationshipLengthDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = {
      url,
      transcript,
      type,
      category: visionToRecordingKey('love'),
      created_at: new Date().toISOString()
    }

    const updatedRecordings = [...(profile.story_recordings || []), newRecording]

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_recordings: updatedRecordings,
          clarity_love: updatedText
        }),
      })

      if (!response.ok) throw new Error('Failed to save recording')

      if (onProfileReload) await onProfileReload()
    } catch (error) {
      console.error('Failed to save recording:', error)
      alert('Failed to save recording. Please try again.')
    }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('love'))
    const recordingToDelete = categoryRecordings[index]
    const allRecordings = profile.story_recordings || []
    const actualIndex = allRecordings.findIndex(r => 
      r.url === recordingToDelete.url && r.created_at === recordingToDelete.created_at
    )

    if (actualIndex !== -1) {
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(recordingToDelete.url)

        const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story_recordings: updatedRecordings }),
        })

        if (onProfileReload) await onProfileReload()
      } catch (error) {
        console.error('Failed to delete recording:', error)
        alert('Failed to delete recording.')
      }
    }
  }

  const isSingle = profile.relationship_status === 'Single'
  const showRelationshipLength = !isSingle && profile.relationship_status

  const LoveIcon = getVisionCategoryIcon('love')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <LoveIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel(visionToRecordingKey('love'))}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Relationship Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Relationship Status *
          </label>
          <div className="relative" ref={relationshipStatusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsRelationshipStatusDropdownOpen(!isRelationshipStatusDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.relationship_status 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {relationshipStatusOptions.find(opt => opt.value === (profile.relationship_status || ''))?.label || 'Select relationship status'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isRelationshipStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isRelationshipStatusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsRelationshipStatusDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {relationshipStatusOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('relationship_status', option.value)
                        setIsRelationshipStatusDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.relationship_status || '') === option.value 
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

        {/* Partner Name - Conditional */}
        {showRelationshipLength && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Partner's Name
            </label>
            <input
              type="text"
              value={profile.partner_name || ''}
              onChange={(e) => handleInputChange('partner_name', e.target.value)}
              placeholder="Enter your partner's name"
              className="w-full px-4 py-3 bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 transition-all duration-200 focus:ring-[#39FF14] focus:border-[#39FF14]"
            />
          </div>
        )}

        {/* Relationship Length - Conditional */}
        {showRelationshipLength && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              How long have you been together? *
            </label>
            <div className="relative" ref={relationshipLengthDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRelationshipLengthDropdownOpen(!isRelationshipLengthDropdownOpen)}
                className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                  profile.relationship_length 
                    ? 'text-white' 
                    : 'text-[#9CA3AF]'
                }`}
              >
                {relationshipLengthOptions.find(opt => opt.value === (profile.relationship_length || ''))?.label || 'Select relationship length'}
              </button>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isRelationshipLengthDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {isRelationshipLengthDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsRelationshipLengthDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                    {relationshipLengthOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('relationship_length', option.value)
                          setIsRelationshipLengthDropdownOpen(false)
                        }}
                        className={`w-full px-6 py-2 text-left transition-colors ${
                          (profile.relationship_length || '') === option.value 
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
        )}

        {/* Clear relationship length if status changes to Single */}
        {isSingle && profile.relationship_length && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">
              Relationship length cleared since status is "Single"
            </p>
          </div>
        )}

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel(visionToRecordingKey('love'))}?`}
          value={profile.clarity_love || ''}
          onChange={(value) => handleInputChange('clarity_love', value)}
          placeholder="Share what's going well with your relationship journey, love story, partnership goals... Or click the microphone to record!"
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('love')}
          instanceId="clarity"
        />

        {/* Display Saved Recordings */}
        <SavedRecordings
          key={`romance-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('love')}
          onDelete={handleDeleteRecording}
        />
        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel(visionToRecordingKey('love'))}?`}
          value={profile.contrast_love || ''}
          onChange={(value) => handleInputChange('contrast_love', value)}
          placeholder="Share what's not going well with your relationship or romantic life, or what you'd like to improve..."
          rows={6}
          storageFolder="profile"
          category={visionToRecordingKey('love')}
          instanceId="contrast"
        />      </div>

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
