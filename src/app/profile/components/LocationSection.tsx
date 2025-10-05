'use client'

import React from 'react'
import { Card, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'

interface LocationSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
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

export function LocationSection({ profile, onProfileChange }: LocationSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Living Situation</h3>
      
      <div className="space-y-6">
        {/* Living Situation */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Living Situation *
          </label>
          <select
            value={profile.living_situation || ''}
            onChange={(e) => handleInputChange('living_situation', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select living situation</option>
            {livingSituationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time at Current Location */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            How long have you lived at your current location? *
          </label>
          <select
            value={profile.time_at_location || ''}
            onChange={(e) => handleInputChange('time_at_location', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select time at location</option>
            {timeAtLocationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            <select
              value={profile.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select country</option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Location information helps your AI assistant understand your local context and provide relevant regional guidance.
        </p>
      </div>
    </Card>
  )
}
