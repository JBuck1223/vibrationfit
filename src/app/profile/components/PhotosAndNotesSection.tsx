'use client'

import React from 'react'
import { UserProfile } from '@/lib/supabase/profile'
import { MediaUpload } from './MediaUpload'
import { Button, Card } from '@/lib/design-system/components'
import { Save, Camera } from 'lucide-react'
import { getVisionCategoryIcon } from '@/lib/design-system/vision-categories'

interface PhotosAndNotesSectionProps {
  profile: Partial<UserProfile>
  onProfileChange: (updates: Partial<UserProfile>) => void
  disabled?: boolean
  onSave?: () => void
  isSaving?: boolean
}

export const PhotosAndNotesSection: React.FC<PhotosAndNotesSectionProps> = ({
  profile,
  onProfileChange,
  disabled = false,
  onSave,
  isSaving
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
          <div className="flex justify-end mt-6">
            <Button
              onClick={onSave}
              variant="primary"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
