'use client'

import React from 'react'
import { Card, Input, Button } from '@/lib/design-system/components'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { UserProfile } from '@/lib/supabase/profile'

interface PersonalInfoSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onError: (error: string) => void
  onUploadComplete?: () => void
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

export function PersonalInfoSection({ profile, onProfileChange, onError }: PersonalInfoSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    console.log('PersonalInfoSection: Updating field', field, 'with value', value)
    onProfileChange({ [field]: value })
  }

  const handleDateChange = (dateString: string) => {
    // Convert date string to proper format for database
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      handleInputChange('date_of_birth', date.toISOString().split('T')[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <ProfilePictureUpload
        currentImageUrl={profile.profile_picture_url}
        onImageChange={(url) => handleInputChange('profile_picture_url', url)}
        onError={onError}
      />

      {/* Personal Information Form */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Date of Birth *
            </label>
            <Input
              type="date"
              value={profile.date_of_birth || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Gender/Identity *
            </label>
            <select
              value={profile.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select gender</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ethnicity */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Ethnicity *
            </label>
            <select
              value={profile.ethnicity || ''}
              onChange={(e) => handleInputChange('ethnicity', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select ethnicity</option>
              {ethnicityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
          <p className="text-sm text-neutral-400">
            <span className="font-medium text-primary-400">Privacy Note:</span> This information helps your AI Vibrational Assistant provide more personalized guidance. All data is encrypted and never shared with third parties.
          </p>
        </div>
      </Card>
    </div>
  )
}
