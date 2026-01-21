'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, SaveButton, DatePicker } from '@/lib/design-system/components'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { UserProfile } from '@/lib/supabase/profile'
import { User } from 'lucide-react'
import { getHighlightClass } from './highlight-utils'

interface PersonalInfoSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onError: (error: string) => void
  onUploadComplete?: () => void
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  highlightedField?: string | null
}

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

const ethnicityOptions = [
  { value: 'Asian', label: 'Asian' },
  { value: 'Black', label: 'Black' },
  { value: 'Hispanic', label: 'Hispanic' },
  { value: 'Middle Eastern', label: 'Middle Eastern' },
  { value: 'Multi-ethnic', label: 'Multi-ethnic' },
  { value: 'Native American', label: 'Native American' },
  { value: 'Pacific Islander', label: 'Pacific Islander' },
  { value: 'White', label: 'White' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

export function PersonalInfoSection({ profile, onProfileChange, onError, onSave, isSaving, hasUnsavedChanges = false, highlightedField }: PersonalInfoSectionProps) {
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false)
  const [isEthnicityDropdownOpen, setIsEthnicityDropdownOpen] = useState(false)
  const genderDropdownRef = useRef<HTMLDivElement>(null)
  const ethnicityDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderDropdownOpen(false)
      }
      if (ethnicityDropdownRef.current && !ethnicityDropdownRef.current.contains(event.target as Node)) {
        setIsEthnicityDropdownOpen(false)
      }
    }

    if (isGenderDropdownOpen || isEthnicityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isGenderDropdownOpen, isEthnicityDropdownOpen])

  // Format phone number on initial load
  useEffect(() => {
    if (profile.phone && profile.phone.length > 0) {
      // Only format if it's not already formatted
      const cleaned = profile.phone.replace(/\D/g, '')
      const formatted = formatPhoneNumber(cleaned)
      if (formatted !== profile.phone) {
        handleInputChange('phone', formatted)
      }
    }
  }, []) // Run only once on mount

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleDateChange = (dateString: string) => {
    // Convert date string to proper format for database
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      handleInputChange('date_of_birth', date.toISOString().split('T')[0])
    }
  }

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10)
    
    // Format as (XXX) XXX-XXXX
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phone', formatted)
  }

  return (
    <div className="space-y-6">
      {/* Personal Information Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white">Personal Information</h3>
        </div>
        
        {/* Profile Picture */}
        <div className="mb-6">
          <ProfilePictureUpload
            currentImageUrl={profile.profile_picture_url}
            onImageChange={(url) => handleInputChange('profile_picture_url', url)}
            onError={onError}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              First Name *
            </label>
            <Input
              type="text"
              value={profile.first_name || ''}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter your first name"
              className={`w-full ${getHighlightClass('first_name', highlightedField)}`}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Last Name *
            </label>
            <Input
              type="text"
              value={profile.last_name || ''}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter your last name"
              className={`w-full ${getHighlightClass('last_name', highlightedField)}`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Email Address *
            </label>
            <Input
              type="email"
              value={profile.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              className={`w-full ${getHighlightClass('email', highlightedField)}`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Phone Number *
            </label>
            <Input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 123-4567"
              className={`w-full ${getHighlightClass('phone', highlightedField)}`}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Date of Birth *
            </label>
            <div className={getHighlightClass('date_of_birth', highlightedField)}>
              <DatePicker
                value={profile.date_of_birth || ''}
                onChange={(dateString: string) => handleDateChange(dateString)}
                maxDate={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Gender/Identity *
            </label>
            <div className="relative" ref={genderDropdownRef}>
            <button
              type="button"
              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.gender 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              } ${getHighlightClass('gender', highlightedField)}`}
            >
                {genderOptions.find(opt => opt.value === (profile.gender || ''))?.label || 'Select gender'}
              </button>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isGenderDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {isGenderDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsGenderDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                    {genderOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('gender', option.value)
                          setIsGenderDropdownOpen(false)
                        }}
                        className={`w-full px-6 py-2 text-left transition-colors ${
                          (profile.gender || '') === option.value 
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

          {/* Ethnicity */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Ethnicity *
            </label>
            <div className="relative" ref={ethnicityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsEthnicityDropdownOpen(!isEthnicityDropdownOpen)}
              className={`w-full pl-6 pr-12 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left ${
                profile.ethnicity 
                  ? 'text-white' 
                  : 'text-[#9CA3AF]'
              } ${getHighlightClass('ethnicity', highlightedField)}`}
            >
                {ethnicityOptions.find(opt => opt.value === (profile.ethnicity || ''))?.label || 'Select ethnicity'}
              </button>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isEthnicityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {isEthnicityDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsEthnicityDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
                    {ethnicityOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('ethnicity', option.value)
                          setIsEthnicityDropdownOpen(false)
                        }}
                        className={`w-full px-6 py-2 text-left transition-colors ${
                          (profile.ethnicity || '') === option.value 
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
    </div>
  )
}
