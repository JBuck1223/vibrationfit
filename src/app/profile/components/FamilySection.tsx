'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button } from '@/lib/design-system/components'
import { Plus, X, Minus } from 'lucide-react'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'

interface FamilySectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
}

// Removed age range options - now using direct age input

export function FamilySection({ profile, onProfileChange, onProfileReload }: FamilySectionProps) {
  const [childrenAges, setChildrenAges] = useState<string[]>(
    profile.children_ages || []
  )
  const isUserActionRef = useRef(false)

  // Keep local state in sync with profile data, but preserve local changes
  useEffect(() => {
    // Don't sync if user is actively making changes
    if (isUserActionRef.current) {
      return
    }
    
    const profileAges = profile.children_ages || []
    const numberOfChildren = profile.number_of_children || 0
    
    // Only update local state if:
    // 1. Profile has data and we don't have any local data, OR
    // 2. The number of children in profile is different from our local array length
    // BUT don't sync if the profile data looks like it was reset (empty or default values)
    if ((profileAges.length > 0 && childrenAges.length === 0) ||
        (numberOfChildren > 0 && childrenAges.length !== numberOfChildren && numberOfChildren > 1)) {
      
      // Ensure the ages array matches the number of children
      const adjustedAges = [...profileAges]
      while (adjustedAges.length < numberOfChildren) {
        adjustedAges.push('')
      }
      if (adjustedAges.length > numberOfChildren) {
        adjustedAges.splice(numberOfChildren)
      }
      
      setChildrenAges(adjustedAges)
    }
  }, [profile.children_ages, profile.number_of_children])

  // Sync children ages with parent component when they change
  useEffect(() => {
    // Only update parent if we have actual data and it's different from what's stored
    if (childrenAges.length > 0) {
      const hasNonEmptyAges = childrenAges.some(age => age !== '')
      if (hasNonEmptyAges) {
        handleInputChange('children_ages', childrenAges)
      }
    }
  }, [childrenAges])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  const handleRecordingSaved = async (url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => {
    const newRecording = {
      url,
      transcript,
      type,
      category: 'family_parenting',
      created_at: new Date().toISOString()
    }

    const updatedRecordings = [...(profile.story_recordings || []), newRecording]

    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_recordings: updatedRecordings,
          family_parenting_story: updatedText
        }),
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) {
      alert('Failed to save recording.')
    }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === 'family_parenting')
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
        alert('Failed to delete recording.')
      }
    }
  }

  const handleHasChildrenChange = (hasChildren: boolean) => {
    handleInputChange('has_children', hasChildren)
    
    if (!hasChildren) {
      // Clear children-related fields if no children
      handleInputChange('number_of_children', null)
      setChildrenAges([])
      handleInputChange('children_ages', [])
    } else {
      // Set default number of children to 1 if they have children
      if (!profile.number_of_children) {
        handleInputChange('number_of_children', 1)
      }
    }
  }

  const handleNumberOfChildrenChange = (number: number) => {
    console.log('FamilySection: handleNumberOfChildrenChange called with:', number)
    console.log('FamilySection: Current childrenAges length:', childrenAges.length)
    console.log('FamilySection: Current numberOfChildren from profile:', profile.number_of_children)
    
    // Mark that user is making changes
    isUserActionRef.current = true
    
    handleInputChange('number_of_children', number)
    
    // Always create a new array with the exact number of children
    const newAges = Array.from({ length: number }, (_, index) => {
      // Preserve existing ages if they exist
      return childrenAges[index] || ''
    })
    
    console.log('FamilySection: Setting new childrenAges:', newAges)
    setChildrenAges(newAges)
    handleInputChange('children_ages', newAges)
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isUserActionRef.current = false
    }, 1000)
  }

  const handleChildAgeChange = (index: number, age: string) => {
    const newAges = [...childrenAges]
    newAges[index] = age
    setChildrenAges(newAges)
    // Don't immediately trigger auto-save for age changes to prevent profile reset
    // The parent component will handle saving when appropriate
  }

  const hasChildren = profile.has_children === true
  // Use childrenAges.length when we have local data, otherwise use profile
  // This ensures the UI reflects local changes even when profile save fails
  const numberOfChildren = childrenAges.length > 0 ? childrenAges.length : (profile.number_of_children || 0)
  
  console.log('FamilySection: Render - hasChildren:', hasChildren, 'numberOfChildren:', numberOfChildren, 'childrenAges.length:', childrenAges.length, 'profile.number_of_children:', profile.number_of_children)

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">Family</h3>
      
      <div className="space-y-6">
        {/* Has Children */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            Do you have children? *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_children"
                checked={hasChildren === true}
                onChange={() => handleHasChildrenChange(true)}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_children"
                checked={hasChildren === false}
                onChange={() => handleHasChildrenChange(false)}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">No</span>
            </label>
          </div>
        </div>

        {/* Number of Children - Conditional */}
        {hasChildren && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              How many children do you have? *
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('FamilySection: Minus button clicked, current numberOfChildren:', numberOfChildren)
                  if (numberOfChildren > 1) {
                    handleNumberOfChildrenChange(numberOfChildren - 1)
                  }
                }}
                disabled={numberOfChildren <= 1}
                className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-neutral-400" />
              </button>
              
              <Input
                type="number"
                value={numberOfChildren}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 0
                  if (num >= 0 && num <= 20) {
                    handleNumberOfChildrenChange(num)
                  }
                }}
                min="1"
                max="20"
                className="w-20 text-center"
              />
              
              <button
                onClick={() => {
                  console.log('FamilySection: Plus button clicked, current numberOfChildren:', numberOfChildren)
                  if (numberOfChildren < 20) {
                    handleNumberOfChildrenChange(numberOfChildren + 1)
                  }
                }}
                disabled={numberOfChildren >= 20}
                className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
        )}

        {/* Children Ages - Conditional */}
        {hasChildren && numberOfChildren > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Children's Ages *
            </label>
            <div className="space-y-3">
              {Array.from({ length: numberOfChildren }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400 w-20">
                    Child {index + 1}:
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="25"
                    value={childrenAges[index] || ''}
                    onChange={(e) => handleChildAgeChange(index, e.target.value)}
                    placeholder="Enter age"
                    className="flex-1"
                  />
                  <span className="text-sm text-neutral-400 w-16">
                    {childrenAges[index] === '1' ? 'year old' : 'years old'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Family & Parenting Story */}
        <RecordingTextarea
          label="My Current Story Around Family & Parenting"
          value={profile.family_parenting_story || ''}
          onChange={(value) => handleInputChange('family_parenting_story', value)}
          placeholder="Share your family journey, parenting experiences, family goals, or aspirations... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="evidence"
        />

        {/* Display Saved Recordings */}
        <SavedRecordings
          key={`family-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="family_parenting"
          onDelete={handleDeleteRecording}
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
        <p className="text-sm text-neutral-400">
          Family information helps your AI assistant understand your responsibilities and provide relevant guidance for your life planning.
        </p>
      </div>
    </Card>
  )
}
