'use client'

import React, { useState } from 'react'
import { Button } from '@/lib/design-system/components'
import { FileUpload } from '@/components/FileUpload'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'

interface MediaUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  disabled?: boolean
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  photos,
  onPhotosChange,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadUserFile('evidence', file)
        return result.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onPhotosChange([...photos, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">Media</h4>
        <span className="text-sm text-neutral-400">(Optional)</span>
      </div>
      
      <p className="text-sm text-neutral-400">
        Upload photos or videos to document your achievements or milestones. These won't affect your completion percentage.
      </p>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-neutral-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
        <FileUpload
          accept="image/*"
          multiple={true}
          maxFiles={10}
          maxSize={10} // 10MB per image
          onUpload={handleUpload}
          disabled={disabled || uploading}
          label="Upload Media"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="flex items-center gap-2 text-primary-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Uploading media...</span>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Progress photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-neutral-700"
              />
              <button
                onClick={() => handleRemovePhoto(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <p className="text-sm text-neutral-400">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
        </p>
      )}
    </div>
  )
}
