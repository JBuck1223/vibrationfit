'use client'

import React from 'react'
import { Card, Input } from '@/lib/design-system/components'
import { Plus, Trash2 } from 'lucide-react'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

interface FamilySectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
}

type Child = {
  first_name: string
  birthday?: string | null
}

export function FamilySection({ profile, onProfileChange, onProfileReload, profileId }: FamilySectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  // Initialize children array and state
  const children: Child[] = profile.children || []
  const hasChildren = profile.has_children ?? false

  const handleChildChange = (index: number, field: keyof Child, value: string) => {
    const updated = [...children]
    updated[index] = { ...updated[index], [field]: value }
    handleInputChange('children', updated)
  }

  const handleChildAdd = () => {
    const newChild: Child = {
      first_name: '',
      birthday: null
    }
    handleInputChange('children', [...children, newChild])
  }

  const handleChildRemove = (index: number) => {
    const updated = children.filter((_, i) => i !== index)
    handleInputChange('children', updated)
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
      // Build API URL with profileId if provided
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_recordings: updatedRecordings,
          clarity_family: updatedText
        }),
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) {
      console.error('Failed to save recording:', error)
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
        if (recordingToDelete.url) {
          await deleteRecording(recordingToDelete.url)
        }
        
        const updatedRecordings = allRecordings.filter((_, i) => i !== actualIndex)
        
        // Build API URL with profileId if provided
        const apiUrl = profileId 
          ? `/api/profile?profileId=${profileId}`
          : '/api/profile'
        
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story_recordings: updatedRecordings }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update profile')
        }
        
        if (onProfileReload) await onProfileReload()
      } catch (error) {
        console.error('Failed to delete recording:', error)
        alert('Failed to delete recording.')
      }
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">{getVisionCategoryLabel('family')}</h3>
      
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
                onChange={() => handleInputChange('has_children', true)}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_children"
                checked={hasChildren === false}
                onChange={() => handleInputChange('has_children', false)}
                className="w-4 h-4 text-primary-500 bg-neutral-800 border-neutral-700 focus:ring-primary-500"
              />
              <span className="text-neutral-200">No</span>
            </label>
          </div>
        </div>

        {/* Children Table - Shows when Yes is selected */}
        {hasChildren === true && (
          <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Children</h4>
              <button
                type="button"
                onClick={handleChildAdd}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Child
              </button>
            </div>

            {children.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">
                Click "Add Child" to add your first child
              </p>
            ) : (
              <div className="space-y-3">
                {children.map((child, index) => (
                  <div
                    key={index}
                    className="bg-neutral-900 rounded-lg border border-neutral-700 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-neutral-400">Child {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleChildRemove(index)}
                        className="text-neutral-400 hover:text-red-400 transition-colors"
                        title="Remove child"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          First Name *
                        </label>
                        <Input
                          type="text"
                          value={child.first_name || ''}
                          onChange={(e) => handleChildChange(index, 'first_name', e.target.value)}
                          placeholder="e.g., Emma"
                          className="w-full text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Birthday
                        </label>
                        <Input
                          type="date"
                          value={child.birthday || ''}
                          onChange={(e) => handleChildChange(index, 'birthday', e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clarity Field */}
        <RecordingTextarea
          label={`What's going well in ${getVisionCategoryLabel('family')}?`}
          value={profile.clarity_family || ''}
          onChange={(value) => handleInputChange('clarity_family', value)}
          placeholder="Share what's going well with your family journey, parenting experiences, family goals... Or record your story!"
          rows={6}
          allowVideo={true}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          category="family_parenting"
        />

        {/* Display Saved Recordings */}
        <SavedRecordings
          key={`family-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter="family_parenting"
          onDelete={handleDeleteRecording}
        />

        {/* Contrast Field */}
        <RecordingTextarea
          label={`What's not going well in ${getVisionCategoryLabel('family')}?`}
          value={profile.contrast_family || ''}
          onChange={(value) => handleInputChange('contrast_family', value)}
          placeholder="Share what's not going well with your family or parenting, or what you'd like to improve..."
          rows={6}
          allowVideo={true}
          storageFolder="profile"
          category="family_parenting"
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
