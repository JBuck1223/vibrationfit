'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { Camera, Upload, X, Check, RotateCw } from 'lucide-react'
import NextImage from 'next/image'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  onError: (error: string) => void
}

export function ProfilePictureUpload({ currentImageUrl, onImageChange, onError }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [imageRotation, setImageRotation] = useState(0)
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 300,
    height: 300,
    x: 0,
    y: 0,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [circularPreview, setCircularPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
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
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        setPreviewUrl(reader.result as string)
        setShowCropper(true)
        
        // Set initial crop to full width square
        const size = Math.min(img.width, img.height)
        const initialCrop = {
          unit: 'px' as const,
          width: size,
          height: size,
          x: (img.width - size) / 2,
          y: (img.height - size) / 2,
        }
        setCrop(initialCrop)
        
        // Set completed crop immediately so preview generates
        setCompletedCrop({
          x: initialCrop.x,
          y: initialCrop.y,
          width: initialCrop.width,
          height: initialCrop.height,
        })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // Rotate image
  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360)
  }

  // Generate circular preview
  const generateCircularPreview = useCallback(() => {
    if (!originalImage || !completedCrop || !previewCanvasRef.current) {
      console.log('generateCircularPreview: missing requirements', { 
        originalImage: !!originalImage, 
        completedCrop: !!completedCrop, 
        previewCanvasRef: !!previewCanvasRef.current 
      })
      return
    }

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('generateCircularPreview: no canvas context')
      return
    }

    // Set canvas size for circular preview
    canvas.width = 128
    canvas.height = 128

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create circular clipping path
    ctx.save()
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2)
    ctx.clip()

    // Calculate scale factors
    const scaleX = originalImage.naturalWidth / originalImage.width
    const scaleY = originalImage.naturalHeight / originalImage.height

    // Calculate rotation
    const radians = (imageRotation * Math.PI) / 180
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // Rotate
    ctx.rotate(radians)
    
    // Draw cropped and rotated image
    ctx.drawImage(
      originalImage,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    )
    
    // Restore context
    ctx.restore()
    
    // Convert to data URL for preview
    const dataURL = canvas.toDataURL('image/jpeg', 0.9)
    console.log('generateCircularPreview: generated preview', { dataURL: dataURL.substring(0, 50) + '...' })
    setCircularPreview(dataURL)
  }, [originalImage, completedCrop, imageRotation])

  // Update circular preview when crop or rotation changes
  React.useEffect(() => {
    if (completedCrop) {
      console.log('useEffect: triggering generateCircularPreview', { completedCrop, imageRotation })
      generateCircularPreview()
    }
  }, [completedCrop, imageRotation, generateCircularPreview])

  // Crop and convert to blob
  const cropImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!originalImage || !completedCrop || !canvasRef.current) {
        resolve(new Blob())
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(new Blob())
        return
      }

      // Set canvas size for output
      canvas.width = 300
      canvas.height = 300

      // Calculate scale factors
      const scaleX = originalImage.naturalWidth / originalImage.width
      const scaleY = originalImage.naturalHeight / originalImage.height

      // Calculate rotation
      const radians = (imageRotation * Math.PI) / 180
      
      // Save context
      ctx.save()
      
      // Move to center of canvas
      ctx.translate(canvas.width / 2, canvas.height / 2)
      
      // Rotate
      ctx.rotate(radians)
      
      // Draw cropped and rotated image
      ctx.drawImage(
        originalImage,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      )
      
      // Restore context
      ctx.restore()
      
      // Convert to blob
      canvas.toBlob((blob) => {
        resolve(blob || new Blob())
      }, 'image/jpeg', 0.9)
    })
  }, [originalImage, completedCrop, imageRotation])

  const handleUpload = async () => {
    if (!originalImage || !completedCrop) return

    setIsUploading(true)
    try {
      // Crop the image
      const croppedBlob = await cropImage()
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' })

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      })

      let result
      try {
        result = await uploadResponse.json()
      } catch (e) {
        console.error('Failed to parse response:', e)
        throw new Error(`Upload failed with status ${uploadResponse.status}`)
      }

      if (!uploadResponse.ok) {
        console.error('Upload failed:', result)
        throw new Error(result.error || result.message || `Upload failed with status ${uploadResponse.status}`)
      }

      // Clean up
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setShowCropper(false)
      setOriginalImage(null)
      setImageRotation(0)
      setCompletedCrop(null)
      setCircularPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Update parent component
      onImageChange(result.url)
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
        
        {/* Current/Preview Image */}
        <div className="relative inline-block mb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
            {showCropper && circularPreview ? (
              <img
                src={circularPreview}
                alt="Profile picture preview"
                className="w-full h-full object-cover"
              />
            ) : showCropper && previewUrl ? (
              <NextImage
                src={previewUrl}
                alt="Profile picture"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : currentImageUrl || previewUrl ? (
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
            {originalImage && (
              <div className="space-y-4">
                {/* Crop Area */}
                <div className="relative mx-auto bg-neutral-800 rounded-lg w-64 h-64 overflow-hidden">
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
                      src={originalImage.src}
                      alt="Crop preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
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
                      setOriginalImage(null)
                      setImageRotation(0)
                      setCompletedCrop(null)
                      setCircularPreview(null)
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
        
        {/* Hidden canvas for circular preview */}
        <canvas
          ref={previewCanvasRef}
          className="hidden"
        />
      </div>
    </Card>
  )
}