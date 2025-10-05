'use client'

import React, { useState, useRef } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { Camera, Upload, X, Check } from 'lucide-react'
import Image from 'next/image'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  onError: (error: string) => void
}

export function ProfilePictureUpload({ currentImageUrl, onImageChange, onError }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      onError('Invalid file type. Please upload JPG, PNG, or WebP images only.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      onError('File too large. Please upload images smaller than 5MB.')
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setShowCropper(true)
  }

  const handleUpload = async () => {
    if (!previewUrl) return

    setIsUploading(true)
    try {
      // Convert preview URL back to file
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' })

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      })

      const result = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setShowCropper(false)

      // Update parent component
      onImageChange(result.url)
    } catch (error) {
      console.error('Upload error:', error)
      onError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setShowCropper(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        
        {/* Current/Preview Image */}
        <div className="relative inline-block mb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
            {currentImageUrl || previewUrl ? (
              <Image
                src={previewUrl || currentImageUrl || ''}
                alt="Profile picture"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-neutral-500" />
            )}
          </div>
          
          {/* Upload overlay */}
          {!showCropper && (
            <button
              onClick={triggerFileSelect}
              className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Upload className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        {!showCropper ? (
          <div className="space-y-3">
            <Button
              onClick={triggerFileSelect}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {currentImageUrl ? 'Change Picture' : 'Upload Picture'}
            </Button>
            
            <p className="text-sm text-neutral-400">
              JPG, PNG, WebP up to 5MB
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-neutral-300 mb-4">
              Crop your image to a square for the best results
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Save'}
              </Button>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </Card>
  )
}
