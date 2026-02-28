'use client'

import React from 'react'
import { Card, Input, Button, SaveButton, DatePicker, RadioGroup } from '@/lib/design-system/components'
import { Plus, Trash2 } from 'lucide-react'
import { UserProfile } from '@/lib/supabase/profile'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { getVisionCategoryLabel, getVisionCategoryIcon, visionToRecordingKey } from '@/lib/design-system/vision-categories'
import * as tokens from '@/lib/design-system/tokens'

interface FamilySectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  onProfileReload?: () => Promise<void>
  profileId?: string // Optional profile ID to target specific profile version
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  saveError?: string | null
}

type Child = {
  first_name: string
  birthday?: string | null
}

export function FamilySection({ profile, onProfileChange, onProfileReload, profileId, onSave, isSaving, hasUnsavedChanges = false, saveError }: FamilySectionProps) {
  const handleInputChange = (field: keyof UserProfile, value: any) => {
    onProfileChange({ [field]: value })
  }

  // Initialize children array and state
  const children: Child[] = profile.children || []
  const hasChildren = profile.has_children

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
      category: visionToRecordingKey('family'),
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
          state_family: updatedText
        }),
      })
      if (onProfileReload) await onProfileReload()
    } catch (error) {
      console.error('Failed to save recording:', error)
      alert('Failed to save recording.')
    }
  }

  const handleDeleteRecording = async (index: number) => {
    const categoryRecordings = (profile.story_recordings || []).filter(r => r.category === visionToRecordingKey('family'))
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

  const FamilyIcon = getVisionCategoryIcon('family')
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FamilyIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">{getVisionCategoryLabel('family')}</h3>
      </div>
      
      <div className="space-y-6">
        {/* Has Children */}
        <RadioGroup
          label="Do you have children? *"
          name="has_children"
          value={hasChildren ?? undefined}
          onChange={(value) => handleInputChange('has_children', value)}
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ]}
        />

        {/* Children Table - Shows when Yes is selected */}
        {hasChildren === true && (
          <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Children</h4>
              <button
                type="button"
                onClick={handleChildAdd}
                className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 rounded-lg transition-colors text-sm font-medium"
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
                        className="rounded-lg border-2 p-4 space-y-3"
                        style={{
                          backgroundColor: tokens.colors.neutral.cardBg,
                          borderColor: tokens.colors.neutral.borderLight
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-300 uppercase">Child {index + 1}</span>
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
                        <DatePicker
                          value={child.birthday || ''}
                          onChange={(dateString: string) => handleChildChange(index, 'birthday', dateString)}
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

        {/* State Field */}
        <RecordingTextarea
          label={`Current State of ${getVisionCategoryLabel('family')}`}
          description="Talk about your family dynamics right now. What feels nourishing and what feels heavy or complicated? Be thorough about the good and the tough parts — this gives us the full picture for crafting your vision."
          value={profile.state_family || ''}
          onChange={(value) => handleInputChange('state_family', value)}
          placeholder="Type or click the microphone to turn your voice into text."
          rows={6}
          onRecordingSaved={handleRecordingSaved}
          storageFolder="profile"
          recordingPurpose="quick"
          category={visionToRecordingKey('family')}
          instanceId="state"
        />

        {/* Display Saved Recordings */}
        <SavedRecordings
          key={`family-recordings-${profile.story_recordings?.length || 0}`}
          recordings={profile.story_recordings || []}
          categoryFilter={visionToRecordingKey('family')}
          onDelete={handleDeleteRecording}
        />
      </div>

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
