'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button, Card } from '@/lib/design-system/components'
import { Camera, Upload, X, Check, RotateCw } from 'lucide-react'
import NextImage from 'next/image'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageChange: (url: string) => void
  onError: (error: string) => void
}

export function ProfilePictureUpload({ currentImageUrl, onImageChange, onError }: ProfilePictureUploadProps) {
  // Add custom styles for the slider
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #199D67;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .slider::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #199D67;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [imageRotation, setImageRotation] = useState(0)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [previewCanvas, setPreviewCanvas] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

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

    // Load image for cropping
    const img = new window.Image()
    img.onload = () => {
      setOriginalImage(img)
    }
    img.src = URL.createObjectURL(file)
    setPreviewUrl(URL.createObjectURL(file))
    setShowCropper(true)
  }

  // Handle mouse events for positioning the image
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ 
      x: e.clientX - (imagePosition.x / 0.5), // Account for reduced sensitivity
      y: e.clientY + (imagePosition.y / 0.5)  // Account for reduced sensitivity and invert Y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const newX = (e.clientX - dragStart.x) * 0.5 // Reduce sensitivity by 50%
    const newY = (e.clientY - dragStart.y) * 0.5 // Reduce sensitivity by 50%
    
    // Constrain movement within reasonable bounds
    const maxOffset = 100 // Maximum pixels to move in any direction
    setImagePosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, -newY)) // Invert Y to fix movement direction
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Simple crop function - uses the positioned image
  const getCropArea = () => {
    if (!originalImage) return { x: 0, y: 0, width: 0, height: 0 }
    
    const size = Math.min(originalImage.width, originalImage.height)
    return {
      x: (originalImage.width - size) / 2,
      y: (originalImage.height - size) / 2,
      width: size,
      height: size
    }
  }

  // Rotate image
  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360)
  }

  // Reset position
  const resetPosition = () => {
    setImagePosition({ x: 0, y: 0 })
  }

  // Reset scale
  const resetScale = () => {
    setImageScale(1)
  }

  // Generate circular preview
  const generateCircularPreview = useCallback(() => {
    if (!originalImage || !previewCanvasRef.current) {
      console.log('generateCircularPreview: missing originalImage or previewCanvasRef', { originalImage: !!originalImage, previewCanvasRef: !!previewCanvasRef.current })
      return
    }

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('generateCircularPreview: no canvas context')
      return
    }

    // Set canvas size for circular preview
    canvas.width = 120
    canvas.height = 120

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create circular clipping path
    ctx.save()
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2)
    ctx.clip()

    // Get crop area (centered square)
    const cropArea = getCropArea()
    
    // Calculate rotation
    const radians = (imageRotation * Math.PI) / 180
    
    // Apply image position offset and scale to crop area
    const adjustedCropArea = {
      x: cropArea.x + imagePosition.x,
      y: cropArea.y + imagePosition.y,
      width: cropArea.width / imageScale,
      height: cropArea.height / imageScale
    }
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // Rotate
    ctx.rotate(radians)
    
    // Draw cropped and rotated image
    ctx.drawImage(
      originalImage,
      adjustedCropArea.x,
      adjustedCropArea.y,
      adjustedCropArea.width,
      adjustedCropArea.height,
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
    setPreviewCanvas(dataURL)
  }, [originalImage, imageRotation, imagePosition, imageScale])

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

      // Set canvas size for output
      canvas.width = 300
      canvas.height = 300

      // Get crop area (centered square)
      const cropArea = getCropArea()
      
      // Calculate rotation
      const radians = (imageRotation * Math.PI) / 180
      
      // Save context
      ctx.save()
      
      // Move to center of canvas
      ctx.translate(canvas.width / 2, canvas.height / 2)
      
      // Rotate
      ctx.rotate(radians)
      
      // Apply image position offset and scale to crop area
      const adjustedCropArea = {
        x: cropArea.x + imagePosition.x,
        y: cropArea.y + imagePosition.y,
        width: cropArea.width / imageScale,
        height: cropArea.height / imageScale
      }
      
      // Draw cropped and rotated image
      ctx.drawImage(
        originalImage,
        adjustedCropArea.x,
        adjustedCropArea.y,
        adjustedCropArea.width,
        adjustedCropArea.height,
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
  }, [originalImage, imageRotation, imagePosition, imageScale])

  // Update circular preview when transforms change
  React.useEffect(() => {
    if (originalImage) {
      console.log('useEffect: triggering generateCircularPreview', { 
        originalImage: !!originalImage, 
        imageRotation, 
        imagePosition, 
        imageScale 
      })
      generateCircularPreview()
    }
  }, [originalImage, imageRotation, imagePosition, imageScale, generateCircularPreview])

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
            {showCropper && previewCanvas ? (
              <img
                src={previewCanvas}
                alt="Profile picture preview"
                className="w-full h-full object-cover"
              />
            ) : showCropper && originalImage ? (
              <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                <div className="text-neutral-500 text-xs text-center">
                  Generating preview...
                </div>
              </div>
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
            
            <p className="text-sm text-neutral-400">
              JPG, PNG, WebP up to 5MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-neutral-300 text-center">
              Your image will be automatically cropped to a square and rotated as needed
            </div>
            
            {/* Simple Preview */}
            {originalImage && (
              <div className="space-y-4">
                {/* Square Crop Preview */}
                <div className="relative mx-auto bg-neutral-800 rounded-lg w-64 h-64 overflow-hidden">
                  {/* Larger container to show full image */}
                  <div 
                    className="relative w-full h-full cursor-move select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Full image that can be moved around */}
                    <img
                      src={originalImage.src}
                      alt="Preview"
                      className="absolute"
                      style={{
                        width: '200%',
                        height: '200%',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${imageRotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
                        transformOrigin: 'center',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        objectFit: 'contain'
                      }}
                      draggable={false}
                    />
                    
                    {/* Show the actual crop area in the center */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary-500 bg-primary-500/10 rounded">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-500 text-xs bg-black/70 px-2 py-1 rounded">
                        {isDragging ? 'Dragging...' : 'Drag to position'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scale Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">Scale</span>
                    <span className="text-primary-500 font-medium">{Math.round(imageScale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">50%</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={imageScale}
                      onChange={(e) => setImageScale(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                      disabled={isUploading}
                    />
                    <span className="text-xs text-neutral-400">200%</span>
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
                    Rotate ({imageRotation}°)
                  </Button>
                  <Button
                    onClick={resetPosition}
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    Reset Position
                  </Button>
                  <Button
                    onClick={resetScale}
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    Reset Scale
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
        
        {/* Hidden canvas for circular preview */}
        <canvas
          ref={previewCanvasRef}
          className="hidden"
        />
      </div>
    </Card>
  )
}
