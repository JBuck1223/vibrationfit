'use client'

import React from 'react'
import { UserProfile } from '@/lib/supabase/profile'
import { MediaUpload } from './MediaUpload'
import { ProfileSectionCardHeading } from './ProfileSectionCardHeading'
import { SaveButton, Card } from '@/lib/design-system/components'
import { Camera } from 'lucide-react'

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
      <ProfileSectionCardHeading icon={MediaIcon} title="Media" />

      <div className="space-y-4">
        <MediaUpload
          photos={profile.progress_photos || []}
          onPhotosChange={(photos) => onProfileChange({ progress_photos: photos })}
          disabled={disabled}
        />

        {/* Save Button - Bottom Right */}
        {onSave && (
          <div className="border-t border-neutral-800/50 pt-2">
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
