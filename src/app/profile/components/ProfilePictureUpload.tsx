'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { Camera, Upload, X, Check, RotateCw } from 'lucide-react'
import NextImage from 'next/image'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  onError: (error: string) => void
  onUploadComplete?: () => void
}

export function ProfilePictureUpload({ currentImageUrl, onImageChange, onError, onUploadComplete }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [imageRotation, setImageRotation] = useState(0)
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 300,
    height: 300,
    x: 0,
    y: 0,
  })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      onError('Image must be smaller than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  // Set crop to center of image (like the reference)
  React.useEffect(() => {
    if (imgRef.current) {
      // Wait for image to load completely
      const img = imgRef.current;
      if (img.complete) {
        const { width, height } = img;
        const size = Math.min(width, height);
        setCrop({
          unit: 'px',
          width: size,
          height: size,
          x: (width - size) / 2,
          y: (height - size) / 2,
        });
      } else {
        // If image not loaded yet, wait for load event
        const handleLoad = () => {
          const { width, height } = img;
          const size = Math.min(width, height);
          setCrop({
            unit: 'px',
            width: size,
            height: size,
            x: (width - size) / 2,
            y: (height - size) / 2,
          });
        };
        img.addEventListener('load', handleLoad);
        return () => img.removeEventListener('load', handleLoad);
      }
    }
  }, [previewUrl]);

  // Rotate image
  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360)
  }


  // Crop and convert to blob (like the reference)
  const cropImage = useCallback(
    (image: HTMLImageElement, crop: Crop, fileName: string): Promise<File> => {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Calculate rotation
        const radians = (imageRotation * Math.PI) / 180;
        
        // Save context
        ctx.save();
        
        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Rotate
        ctx.rotate(radians);
        
        // Draw cropped and rotated image
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
        );
        
        // Restore context
        ctx.restore();
      }

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.9
        );
      });
    },
    [imageRotation]
  );

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) return

    setIsUploading(true)
    try {
      // Get current user
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        onError('Please log in to upload a profile picture')
        return
      }

      // Crop the image (like the reference)
      const croppedFile = await cropImage(
        imgRef.current,
        completedCrop,
        'profile-picture.jpg'
      )

      console.log('Starting upload for user:', user.id, 'file size:', croppedFile.size, 'file type:', croppedFile.type)

      // Upload directly using the same method as other features
      const uploadResult = await uploadUserFile('profilePicture', croppedFile, user.id)
      console.log('Upload result:', uploadResult)

      // Update user profile with new picture URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({ 
          user_id: user.id,
          profile_picture_url: uploadResult.url 
        }, { 
          onConflict: 'user_id' 
        })

      if (updateError) {
        console.error('Error updating profile with new picture:', updateError)
        onError('Failed to update profile')
        return
      }

      // Update parent component first
      console.log('ProfilePictureUpload: Notifying parent of new image URL:', uploadResult.url)
      onImageChange(uploadResult.url)
      
      // Notify parent that upload is complete
      if (onUploadComplete) {
        onUploadComplete()
      }
      
      // Clean up after parent has been notified
      setTimeout(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setShowCropper(false)
        setImageRotation(0)
        setCompletedCrop(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 100)
    } catch (error) {
      console.error('Upload error:', error)
      onError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        
        {/* Current/Preview Image - Hidden during cropping */}
        {!showCropper && (
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
              {currentImageUrl || previewUrl ? (
                <NextImage
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
            <button
              onClick={triggerFileSelect}
              className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Upload className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

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
            <p className="text-xs text-neutral-400">
              JPG, PNG, WebP up to 5MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-neutral-300 text-center">
              Drag to position and resize the crop area
            </div>
            
            {/* ReactCrop Component */}
            {previewUrl && (
              <div className="space-y-4">
                {/* Crop Area */}
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
                
                {/* Controls */}
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={rotateImage}
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Rotate ({imageRotation}°)
                  </Button>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowCropper(false)
                      setImageRotation(0)
                      setCompletedCrop(null)
                      if (previewUrl) URL.revokeObjectURL(previewUrl)
                      setPreviewUrl(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !completedCrop}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Use This Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
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
        
        {/* Hidden canvas for cropping */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </Card>
  )
}