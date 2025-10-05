'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { Camera, Upload, X, Check, Move, RotateCw } from 'lucide-react'
import Image from 'next/image'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  onError: (error: string) => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ProfilePictureUpload({ currentImageUrl, onImageChange, onError }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageRotation, setImageRotation] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

    // Load image and set up cropping
    const img = new Image()
    img.onload = () => {
      setOriginalImage(img)
      // Initialize crop area to center of image
      const size = Math.min(img.width, img.height)
      setCropArea({
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        width: size,
        height: size
      })
    }
    img.src = URL.createObjectURL(file)
    setPreviewUrl(URL.createObjectURL(file))
    setShowCropper(true)
  }

  // Handle mouse events for cropping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDragging(true)
    setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !originalImage || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragStart.x
    const y = e.clientY - rect.top - dragStart.y
    
    // Constrain crop area within image bounds
    const maxX = originalImage.width - cropArea.width
    const maxY = originalImage.height - cropArea.height
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Rotate image
  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360)
  }

  // Crop and convert to blob
  const cropImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!originalImage || !canvasRef.current) {
        resolve(new Blob())
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(new Blob())
        return
      }

      // Set canvas size to crop area
      canvas.width = 300
      canvas.height = 300

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
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
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
  }, [originalImage, cropArea, imageRotation])

  const handleUpload = async () => {
    if (!originalImage) return

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

      const result = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Clean up
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setShowCropper(false)
      setOriginalImage(null)
      setImageRotation(0)

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
    setOriginalImage(null)
    setImageRotation(0)
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
          <div className="space-y-4">
            <div className="text-sm text-neutral-300 text-center">
              Crop your image to a square for the best results
            </div>
            
            {/* Cropping Interface */}
            {originalImage && (
              <div className="space-y-3">
                {/* Image with crop overlay */}
                <div 
                  ref={containerRef}
                  className="relative mx-auto bg-neutral-800 rounded-lg overflow-hidden"
                  style={{ 
                    width: Math.min(300, originalImage.width), 
                    height: Math.min(300, originalImage.height),
                    maxWidth: '100%'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={originalImage.src}
                    alt="Crop preview"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `rotate(${imageRotation}deg)`,
                      transformOrigin: 'center'
                    }}
                    draggable={false}
                  />
                  
                  {/* Crop overlay */}
                  <div
                    className="absolute border-2 border-primary-500 bg-primary-500/20 cursor-move"
                    style={{
                      left: (cropArea.x / originalImage.width) * 100 + '%',
                      top: (cropArea.y / originalImage.height) * 100 + '%',
                      width: (cropArea.width / originalImage.width) * 100 + '%',
                      height: (cropArea.height / originalImage.height) * 100 + '%',
                    }}
                  >
                    <div className="absolute inset-0 border border-white/50"></div>
                    <div className="absolute top-1 left-1 w-2 h-2 bg-primary-500 border border-white"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 border border-white"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 bg-primary-500 border border-white"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-primary-500 border border-white"></div>
                  </div>
                  
                  {/* Dark overlay outside crop area */}
                  <div className="absolute inset-0 bg-black/50 pointer-events-none">
                    <div
                      className="absolute bg-transparent"
                      style={{
                        left: (cropArea.x / originalImage.width) * 100 + '%',
                        top: (cropArea.y / originalImage.height) * 100 + '%',
                        width: (cropArea.width / originalImage.width) * 100 + '%',
                        height: (cropArea.height / originalImage.height) * 100 + '%',
                      }}
                    ></div>
                  </div>
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
                    Rotate
                  </Button>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Save & Upload'}
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
