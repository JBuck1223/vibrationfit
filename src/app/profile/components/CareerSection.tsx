'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Textarea, SaveButton } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'

interface CareerSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  saveError?: string | null
}

const employmentTypeOptions = [
  { value: 'Employed', label: 'Employed' },
  { value: 'Business Owner', label: 'Business Owner' },
  { value: 'Freelance/Contractor', label: 'Freelance/Contractor' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Student (Full Time)', label: 'Student (Full Time)' },
  { value: 'Student (Working)', label: 'Student (Working)' },
  { value: 'Unemployed', label: 'Unemployed' }
]

const timeInRoleOptions = [
  { value: '<3 months', label: 'Less than 3 months' },
  { value: '3-6 months', label: '3-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: '1-2 years', label: '1-2 years' },
  { value: '2-3 years', label: '2-3 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10+ years', label: '10+ years' }
]

const educationOptions = [
  { value: 'High School', label: 'High School' },
  { value: 'Some College', label: 'Some College' },
  { value: 'Associate Degree', label: 'Associate Degree' },
  { value: 'Bachelor\'s Degree', label: 'Bachelor\'s Degree' },
  { value: 'Master\'s Degree', label: 'Master\'s Degree' },
  { value: 'Doctorate', label: 'Doctorate' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

export function CareerSection({ profile, onProfileChange, onProfileReload, onSave, isSaving, hasUnsavedChanges = false, saveError }: CareerSectionProps) {
  const [isEmploymentTypeDropdownOpen, setIsEmploymentTypeDropdownOpen] = useState(false)
  const [isTimeInRoleDropdownOpen, setIsTimeInRoleDropdownOpen] = useState(false)
  const [isEducationDropdownOpen, setIsEducationDropdownOpen] = useState(false)
  const employmentTypeDropdownRef = useRef<HTMLDivElement>(null)
  const timeInRoleDropdownRef = useRef<HTMLDivElement>(null)
  const educationDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employmentTypeDropdownRef.current && !employmentTypeDropdownRef.current.contains(event.target as Node)) {
        setIsEmploymentTypeDropdownOpen(false)
      }
      if (timeInRoleDropdownRef.current && !timeInRoleDropdownRef.current.contains(event.target as Node)) {
        setIsTimeInRoleDropdownOpen(false)
      }
      if (educationDropdownRef.current && !educationDropdownRef.current.contains(event.target as Node)) {
        setIsEducationDropdownOpen(false)
      }
    }
    
    if (isEmploymentTypeDropdownOpen || isTimeInRoleDropdownOpen || isEducationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEmploymentTypeDropdownOpen, isTimeInRoleDropdownOpen, isEducationDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('work'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_recordings: updatedRecordings, state_work: updatedText }),
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('work'))
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

  const WorkIcon = getVisionCategoryIcon('work')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <WorkIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel(visionToRecordingKey('work'))}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Employment Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Employment Type *
          </label>
          <div className="relative" ref={employmentTypeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsEmploymentTypeDropdownOpen(!isEmploymentTypeDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.employment_type 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {employmentTypeOptions.find(opt => opt.value === (profile.employment_type || ''))?.label || 'Select employment type'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isEmploymentTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isEmploymentTypeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsEmploymentTypeDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {employmentTypeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('employment_type', option.value)
                        setIsEmploymentTypeDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.employment_type || '') === option.value 
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

        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Occupation/Job Title *
          </label>
          <Input
            type="text"
            value={profile.occupation || ''}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            placeholder="e.g., Software Engineer, Marketing Manager, Teacher"
            className="w-full"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Company/Organization Name *
          </label>
          <Input
            type="text"
            value={profile.company || ''}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="Enter your company or organization name"
            className="w-full"
          />
        </div>

        {/* Time in Current Role */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            How long have you been in your current role? *
          </label>
          <div className="relative" ref={timeInRoleDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTimeInRoleDropdownOpen(!isTimeInRoleDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.time_in_role 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {timeInRoleOptions.find(opt => opt.value === (profile.time_in_role || ''))?.label || 'Select time in role'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isTimeInRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isTimeInRoleDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsTimeInRoleDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {timeInRoleOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('time_in_role', option.value)
                        setIsTimeInRoleDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.time_in_role || '') === option.value 
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

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Education *
          </label>
          <div className="relative" ref={educationDropdownRef}>
            <button
              type="button"
              onClick={() => setIsEducationDropdownOpen(!isEducationDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.education 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {educationOptions.find(opt => opt.value === (profile.education || ''))?.label || 'Select education level'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isEducationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isEducationDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsEducationDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {educationOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('education', option.value)
                        setIsEducationDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.education || '') === option.value 
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

        {/* Education Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Education Description
          </label>
          <Textarea
            value={profile.education_description || ''}
            onChange={(e) => handleInputChange('education_description', e.target.value)}
            placeholder="Additional education details (optional)"
            rows={4}
            className="w-full"
          />
        </div>

        {/* State Field */}
        <RecordingTextarea
          label={`Current State of ${getVisionCategoryLabel(visionToRecordingKey('work'))}`}
          description="Describe your current work situation — what energizes you and what drains you. What feels aligned and what feels like it needs to change? The more real you are here, the more powerful your vision will be."
          value={profile.state_work || ''}
          onChange={(value) => handleInputChange('state_work', value)}
          placeholder="Type or click the microphone to turn your voice into text."
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          recordingPurpose="quick"
          category={visionToRecordingKey('work')}
          instanceId="state"
        />
        <SavedRecordings
          key={`career-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('work')}
          onDelete={handleDeleteRecording}
        />      </div>

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
