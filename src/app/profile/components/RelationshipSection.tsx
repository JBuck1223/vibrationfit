'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'

interface RelationshipSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
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

export function RelationshipSection({ profile, onProfileChange }: RelationshipSectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const isSingle = profile.relationship_status === 'Single'
  const showRelationshipLength = !isSingle && profile.relationship_status

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Relationship</h3>
      
      <div className="space-y-6">
        {/* Relationship Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Relationship Status *
          </label>
          <select
            value={profile.relationship_status || ''}
            onChange={(e) => handleInputChange('relationship_status', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select relationship status</option>
            {relationshipStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Relationship Length - Conditional */}
        {showRelationshipLength && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              How long have you been together? *
            </label>
            <select
              value={profile.relationship_length || ''}
              onChange={(e) => handleInputChange('relationship_length', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select relationship length</option>
              {relationshipLengthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Understanding your relationship status helps your AI assistant provide relevant guidance for your personal growth journey.
        </p>
      </div>
    </Card>
  )
}
