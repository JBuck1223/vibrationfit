'use client'

import React from 'react'
import { Card, Input } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'

interface CareerSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
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

export function CareerSection({ profile, onProfileChange, onProfileReload }: CareerSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = { url, transcript, type, category: 'work', created_at: new Date().toISOString() }
    const updatedRecordings = [...(profile.story_recordings || []), newRecording]
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_recordings: updatedRecordings, work_story: updatedText }),
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) { alert('Failed to save recording.') }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'work')
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
      <h3 className="text-xl font-bold text-white mb-6">Business / Career</h3>
      
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

        {/* Career & Work Story */}
        <RecordingTextarea
          label="My Current Story Around Career & Work"
          value={profile.work_story || ''}
          onChange={(value) => handleInputChange('work_story', value)}
          placeholder="Share your career journey, professional goals, work experiences... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
        />

        <SavedRecordings
          key={`career-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="work"
          onDelete={handleDeleteRecording}
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Career information helps your AI assistant understand your professional goals and provide relevant business and career guidance.
        </p>
      </div>
    </Card>
  )
}
