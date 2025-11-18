'use client'

import React from 'react'
import { UserProfile } from '@/lib/supabase/profile'
import { MediaUpload } from './MediaUpload'
import { Button } from '@/lib/design-system/components'
import { Save } from 'lucide-react'

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
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
          <span className="text-primary-500 font-bold text-sm">📸</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Media & Notes</h2>
          <p className="text-sm text-neutral-400">
            Document your progress and add personal notes
          </p>
        </div>
      </div>

      {/* Version Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Version Notes
          </label>
          <p className="text-sm text-neutral-400 mb-3">
            Add notes about this version of your profile (optional)
          </p>
          <textarea
            value={profile.version_notes || ''}
            onChange={(e) => onProfileChange({ version_notes: e.target.value })}
            placeholder="What's new in this version? Any significant changes or milestones?"
            disabled={disabled}
            className="w-full h-32 px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Media */}
      <div className="space-y-4">
        <MediaUpload
          photos={profile.progress_photos || []}
          onPhotosChange={(photos) => onProfileChange({ progress_photos: photos })}
          disabled={disabled}
        />
      </div>

      {/* Help Text */}
      <div className="bg-neutral-800/30 border border-neutral-700 rounded-lg p-4">
        <p className="text-sm text-neutral-400">
          <strong className="text-white">Note:</strong> Media and notes are optional and don't affect your profile completion percentage. 
          Use them to document your journey, achievements, or any personal context you'd like to remember.
        </p>
      </div>

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
  )
}
