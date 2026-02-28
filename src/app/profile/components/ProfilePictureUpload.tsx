'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { FileUpload } from '@/lib/design-system/components/forms/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { Upload, X, Check, RotateCw } from 'lucide-react'
import NextImage from 'next/image'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'

export const DEFAULT_PROFILE_IMAGE_URL = 'https://media.vibrationfit.com/site-assets/brand/default-profile-image/default-profile-image.jpg'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  onError: (error: string) => void
  onUploadComplete?: () => void
  profileId?: string | null
  initialFile?: File | null
}

export function ProfilePictureUpload({ currentImageUrl, onImageChange, onError, onUploadComplete, profileId, initialFile }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [imageRotation, setImageRotation] = useState(0)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 300,
    height: 300,
    x: 0,
    y: 0,
  })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setImageLoadError(false)
  }, [currentImageUrl])

  const processFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }, [])

  // Process initial file if provided
  useEffect(() => {
    if (initialFile) {
      processFile(initialFile)
    }
  }, [initialFile, processFile])

  // Center crop on image load
  useEffect(() => {
    if (imgRef.current) {
      const img = imgRef.current
      const setCenteredCrop = () => {
        const { width, height } = img
        const size = Math.min(width, height)
        setCrop({
          unit: 'px',
          width: size,
          height: size,
          x: (width - size) / 2,
          y: (height - size) / 2,
        })
      }

      if (img.complete) {
        setCenteredCrop()
      } else {
        img.addEventListener('load', setCenteredCrop)
        return () => img.removeEventListener('load', setCenteredCrop)
      }
    }
  }, [previewUrl])

  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360)
  }

  const cropImage = useCallback(
    (image: HTMLImageElement, crop: Crop): Promise<File> => {
      const canvas = document.createElement('canvas')
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      canvas.width = 300
      canvas.height = 300
      const ctx = canvas.getContext('2d')

      if (ctx) {
        const radians = (imageRotation * Math.PI) / 180
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(radians)
        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        )
        ctx.restore()
      }

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'))
              return
            }
            resolve(new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.9
        )
      })
    },
    [imageRotation]
  )

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) return

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        onError('Please log in to upload a profile picture')
        return
      }

      const croppedFile = await cropImage(imgRef.current, completedCrop)
      setUploadProgress(10)

      const uploadResult = await uploadUserFile('profilePicture', croppedFile, user.id, (progress) => {
        setUploadProgress(10 + Math.round(progress * 0.7))
      })
      setUploadProgress(80)

      if (profileId) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            profile_picture_url: uploadResult.url,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating profile with new picture:', updateError)
          onError('Failed to update profile')
          return
        }
      } else {
        const { data: activeProfile, error: findError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('is_draft', false)
          .maybeSingle()

        if (findError) {
          console.error('Error finding active profile:', findError)
          onError('Failed to find active profile')
          return
        }

        if (activeProfile?.id) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              profile_picture_url: uploadResult.url,
              updated_at: new Date().toISOString()
            })
            .eq('id', activeProfile.id)

          if (updateError) {
            console.error('Error updating profile with new picture:', updateError)
            onError('Failed to update profile')
            return
          }
        } else {
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              profile_picture_url: uploadResult.url,
              is_active: true,
              is_draft: false,
              version_number: 1
            })

          if (createError) {
            console.error('Error creating profile with picture:', createError)
            onError('Failed to create profile')
            return
          }
        }
      }

      setUploadProgress(90)

      fetch('/api/sync/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePictureUrl: uploadResult.url })
      }).catch(err => {
        console.error('Failed to sync profile picture to metadata (non-blocking):', err)
      })

      setUploadProgress(100)
      onImageChange(uploadResult.url)

      if (onUploadComplete) {
        onUploadComplete()
      }

      setTimeout(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setShowCropper(false)
        setImageRotation(0)
        setCompletedCrop(null)
        setUploadProgress(0)
      }, 100)
    } catch (error) {
      console.error('Upload error:', error)
      onError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const cancelCrop = () => {
    setShowCropper(false)
    setImageRotation(0)
    setCompletedCrop(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  return (
    <Card className="p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">Profile Picture</h3>

        {/* Current Image - shown when not cropping */}
        {!showCropper && (
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
              {imageLoadError ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                  <Upload className="w-8 h-8 text-neutral-400" />
                </div>
              ) : (
                <NextImage
                  src={previewUrl || currentImageUrl || DEFAULT_PROFILE_IMAGE_URL}
                  alt="Profile picture"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  onError={() => setImageLoadError(true)}
                  unoptimized={!(previewUrl || currentImageUrl)}
                />
              )}
            </div>
          </div>
        )}

        {/* File Selection via FileUpload - shown when not cropping */}
        {!showCropper && (
          <FileUpload
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
            multiple={false}
            maxSize={20}
            dragDrop={true}
            showPreviews={false}
            dragDropText={currentImageUrl ? 'Drop new photo or click to update' : 'Drop photo or click to upload'}
            dragDropSubtext="JPG, PNG, WebP, HEIC up to 20MB"
            onUpload={(files) => {
              if (files.length > 0) {
                processFile(files[0])
              }
            }}
            disabled={isUploading}
          />
        )}

        {/* Cropper View */}
        {showCropper && previewUrl && (
          <div className="space-y-4">
            <div className="text-sm text-neutral-300 text-center">
              Drag to position and resize the crop area
            </div>

            <div className="relative mx-auto bg-neutral-800 rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Crop preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    transform: `rotate(${imageRotation}deg)`,
                    transformOrigin: 'center'
                  }}
                  draggable={false}
                />
              </ReactCrop>
            </div>

            <div className="flex justify-center gap-2">
              <Button
                onClick={rotateImage}
                variant="outline"
                size="sm"
                disabled={isUploading}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate ({imageRotation})
              </Button>
            </div>

            {/* Upload Progress */}
            <UploadProgress
              progress={uploadProgress}
              status={
                uploadProgress < 10 ? 'Preparing image...' :
                uploadProgress < 80 ? 'Uploading to cloud...' :
                uploadProgress < 100 ? 'Saving to profile...' :
                'Complete!'
              }
              isVisible={isUploading}
            />

            {/* Action Buttons */}
            {!isUploading && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelCrop}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!completedCrop}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use This Image
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
