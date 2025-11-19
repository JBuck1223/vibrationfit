'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'
import { Save } from 'lucide-react'

interface LocationSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  onSave?: () => void
  isSaving?: boolean
}

const livingSituationOptions = [
  { value: 'Own', label: 'Own' },
  { value: 'Rent', label: 'Rent' },
  { value: 'With family/friends', label: 'With family/friends' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

const timeAtLocationOptions = [
  { value: '<3 months', label: 'Less than 3 months' },
  { value: '3-6 months', label: '3-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: '1-2 years', label: '1-2 years' },
  { value: '2-3 years', label: '2-3 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10+ years', label: '10+ years' }
]

const countryOptions = [
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Other', label: 'Other' }
]

export function LocationSection({ profile, onProfileChange, onProfileReload, onSave, isSaving }: LocationSectionProps) {
  const [isLivingSituationDropdownOpen, setIsLivingSituationDropdownOpen] = useState(false)
  const [isTimeAtLocationDropdownOpen, setIsTimeAtLocationDropdownOpen] = useState(false)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const livingSituationDropdownRef = useRef<HTMLDivElement>(null)
  const timeAtLocationDropdownRef = useRef<HTMLDivElement>(null)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (livingSituationDropdownRef.current && !livingSituationDropdownRef.current.contains(event.target as Node)) {
        setIsLivingSituationDropdownOpen(false)
      }
      if (timeAtLocationDropdownRef.current && !timeAtLocationDropdownRef.current.contains(event.target as Node)) {
        setIsTimeAtLocationDropdownOpen(false)
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false)
      }
    }
    
    if (isLivingSituationDropdownOpen || isTimeAtLocationDropdownOpen || isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLivingSituationDropdownOpen, isTimeAtLocationDropdownOpen, isCountryDropdownOpen])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: visionToRecordingKey('home'), created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story_recordings: updatedRecordings, clarity_home: updatedText }) })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('home'))
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

  const HomeIcon = getVisionCategoryIcon('home')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <HomeIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('home')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Living Situation */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Living Situation *
          </label>
          <div className="relative" ref={livingSituationDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLivingSituationDropdownOpen(!isLivingSituationDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.living_situation 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {livingSituationOptions.find(opt => opt.value === (profile.living_situation || ''))?.label || 'Select living situation'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isLivingSituationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isLivingSituationDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLivingSituationDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {livingSituationOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('living_situation', option.value)
                        setIsLivingSituationDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.living_situation || '') === option.value 
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

        {/* Time at Current Location */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            How long have you lived at your current location? *
          </label>
          <div className="relative" ref={timeAtLocationDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTimeAtLocationDropdownOpen(!isTimeAtLocationDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.time_at_location 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              }`}
            >
              {timeAtLocationOptions.find(opt => opt.value === (profile.time_at_location || ''))?.label || 'Select time at location'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isTimeAtLocationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isTimeAtLocationDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsTimeAtLocationDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                  {timeAtLocationOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('time_at_location', option.value)
                        setIsTimeAtLocationDropdownOpen(false)
                      }}
                      className={`w-full px-6 py-2 text-left transition-colors ${
                        (profile.time_at_location || '') === option.value 
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              City *
            </label>
            <Input
              type="text"
              value={profile.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter your city"
              className="w-full"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              State/Province *
            </label>
            <Input
              type="text"
              value={profile.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Enter your state/province"
              className="w-full"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              ZIP/Postal Code *
            </label>
            <Input
              type="text"
              value={profile.postal_code || ''}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              placeholder="Enter your postal code"
              className="w-full"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Country *
            </label>
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                  profile.country 
                    ? 'text-white' 
                    : 'text-[#9CA3AF]'
                }`}
              >
                {countryOptions.find(opt => opt.value === (profile.country || ''))?.label || 'Select country'}
              </button>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {isCountryDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCountryDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                    {countryOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('country', option.value)
                          setIsCountryDropdownOpen(false)
                        }}
                        className={`w-full px-6 py-2 text-left transition-colors ${
                          (profile.country || '') === option.value 
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
        </div>

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('home')}?`}
          value={profile.clarity_home || ''}
          onChange={(value) => handleInputChange('clarity_home', value)}
          placeholder="Share what's going well with your home story, living environment, space goals... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category={visionToRecordingKey('home')}
          instanceId="clarity"
        />

        <SavedRecordings
          key={`home-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('home')}
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('home')}?`}
          value={profile.contrast_home || ''}
          onChange={(value) => handleInputChange('contrast_home', value)}
          placeholder="Share what's not going well with your home or living environment, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('home')}
          instanceId="contrast"
        />

        {/* Dream Field */}
        <RecordingTextarea
          label={`What do you dream about in ${getVisionCategoryLabel('home')}?`}
          value={profile.dream_home || ''}
          onChange={(value) => handleInputChange('dream_home', value)}
          placeholder="What's your ideal vision for your home and living environment?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('home')}
          instanceId="dream"
        />

        {/* Worry Field */}
        <RecordingTextarea
          label={`What do you worry about in ${getVisionCategoryLabel('home')}?`}
          value={profile.worry_home || ''}
          onChange={(value) => handleInputChange('worry_home', value)}
          placeholder="What concerns you most about your home, location, or living situation?"
          rows={4}
          allowVideo={true}
          storageFolder="profile"
          category={visionToRecordingKey('home')}
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
