'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/lib/design-system/components'
import { FileUpload } from '@/components/FileUpload'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { X, Upload, FileImage, Loader2, ChevronLeft, ChevronRight, Play, AlertCircle } from 'lucide-react'

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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showSaveReminder, setShowSaveReminder] = useState(false)

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadUserFile('profile', file)
        return result.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onPhotosChange([...photos, ...uploadedUrls])
      
      // Show save reminder after successful upload
      setShowSaveReminder(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
    setShowSaveReminder(true) // Show save reminder after removal
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextMedia = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length)
  }

  const prevMedia = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|quicktime)$/i.test(url) || url.includes('video/')
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          prevMedia()
          break
        case 'ArrowRight':
          nextMedia()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, photos.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileImage className="w-5 h-5 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">Media</h4>
        <span className="text-sm text-neutral-400">(Optional)</span>
      </div>
      
      <p className="text-sm text-neutral-400">
        Upload photos or videos to document your achievements or milestones. These won't affect your completion percentage.
      </p>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-neutral-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
        <FileUpload
          accept="image/*,video/*"
          multiple={true}
          maxFiles={10}
          maxSize={500} // 500MB for media files
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

      {/* Save Reminder */}
      {showSaveReminder && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium text-sm">Don't forget to save!</p>
              <p className="text-yellow-300/80 text-sm">
                Your media has been uploaded but you need to save your profile to keep the changes.
              </p>
            </div>
            <button
              onClick={() => setShowSaveReminder(false)}
              className="ml-auto text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((media, index) => (
            <div key={index} className="relative group">
              {isVideo(media) ? (
                <div className="relative">
                  <video
                    src={media}
                    className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => openLightbox(index)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <img
                  src={media}
                  alt={`Media ${index + 1}`}
                  className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => openLightbox(index)}
                />
              )}
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

      {/* Media Count */}
      {photos.length > 0 && (
        <p className="text-sm text-neutral-400">
          {photos.length} media file{photos.length !== 1 ? 's' : ''} uploaded • Click to view in lightbox
        </p>
      )}

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content */}
            <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center">
              {isVideo(photos[lightboxIndex]) ? (
                <video
                  src={photos[lightboxIndex]}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={photos[lightboxIndex]}
                  alt={`Media ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Media Counter */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} of {photos.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                {photos.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === lightboxIndex ? 'border-primary-500' : 'border-neutral-600'
                    }`}
                  >
                    {isVideo(media) ? (
                      <div className="relative w-full h-full">
                        <video
                          src={media}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
