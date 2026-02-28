'use client'

import React from 'react'
import { UserProfile } from '@/lib/supabase/profile'
import { MediaUpload } from './MediaUpload'
import { SaveButton, Card } from '@/lib/design-system/components'
import { Camera } from 'lucide-react'
import { getVisionCategoryIcon } from '@/lib/design-system/vision-categories'

interface PhotosAndNotesSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  disabled?: boolean
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  saveError?: string | null
}

export const PhotosAndNotesSection: React.FC<PhotosAndNotesSectionProps> = ({
  profile,
  onProfileChange,
  disabled = false,
  onSave,
  isSaving,
  hasUnsavedChanges = false,
  saveError
}) => {
  const MediaIcon = Camera
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MediaIcon className="w-6 h-6 text-white" />
        <h3 className="text-xl font-bold text-white">Media</h3>
      </div>
      
      <div className="space-y-6">
        <MediaUpload
          photos={profile.progress_photos || []}
          onPhotosChange={(photos) => onProfileChange({ progress_photos: photos })}
          disabled={disabled}
        />

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
      </div>
    </Card>
  )
}
