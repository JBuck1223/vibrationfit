'use client'

import React from 'react'
import { Card, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'

interface CareerSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
}

const employmentTypeOptions = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Business Owner', label: 'Business Owner' },
  { value: 'Contractor/Freelancer', label: 'Contractor/Freelancer' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
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

export function CareerSection({ profile, onProfileChange }: CareerSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Career</h3>
      
      <div className="space-y-6">
        {/* Employment Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Employment Type *
          </label>
          <select
            value={profile.employment_type || ''}
            onChange={(e) => handleInputChange('employment_type', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select employment type</option>
            {employmentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
          <select
            value={profile.time_in_role || ''}
            onChange={(e) => handleInputChange('time_in_role', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select time in role</option>
            {timeInRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Career Insights */}
        <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-primary-400 mb-2">Career Insights</h4>
          <p className="text-sm text-neutral-300">
            Understanding your career context helps your AI assistant provide relevant professional development and goal-setting guidance.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Career information helps your AI assistant understand your professional goals and provide relevant business and career guidance.
        </p>
      </div>
    </Card>
  )
}
