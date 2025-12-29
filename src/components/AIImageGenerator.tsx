// /src/components/AIImageGenerator.tsx
// AI-powered image generation component using fal.ai Flux

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Textarea, Card, Spinner } from '@/lib/design-system/components'
import { Sparkles, Image as ImageIcon, Loader2, X, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

// Dimension/aspect ratio options
type ImageDimension = 'square' | 'landscape_4_3' | 'landscape_16_9' | 'portrait_4_3' | 'portrait_16_9'

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void
  type: 'vision_board' | 'journal'
  initialPrompt?: string
  className?: string
  // Vision board specific props
  visionText?: string
  title?: string
  description?: string
  // Journal specific props
  journalText?: string
  mood?: string
}

export function AIImageGenerator({ 
  onImageGenerated, 
  type, 
  initialPrompt = '',
  className = '',
  visionText,
  title,
  description,
  journalText,
  mood
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null)
  const [selectedDimension, setSelectedDimension] = useState<ImageDimension>(
    type === 'vision_board' ? 'landscape_4_3' : 'square'
  )
  const [customDescription, setCustomDescription] = useState<string>('')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [mode, setMode] = useState<'generate' | 'edit'>('generate')
  const [baseImage, setBaseImage] = useState<File | null>(null)
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState<string>('')
  const [isEditingGenerated, setIsEditingGenerated] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)

  // Refs for scrolling
  const containerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // VIVA loading messages with animation
  const loadingMessages = [
    "VIVA is bringing your vision to life...",
    "Crafting your perfect image...",
    "Channeling creative energy...",
    "Manifesting your vision...",
    "Almost ready to actualize..."
  ]

  // Dimension options (matches fal.ai supported sizes)
  // width/height are pixel units for visual representation (scaled to fit in 32px max height)
  const dimensionOptions: { id: ImageDimension; name: string; ratio: string; width: number; height: number }[] = [
    { id: 'square', name: 'Square', ratio: '1:1', width: 28, height: 28 },
    { id: 'landscape_4_3', name: 'Landscape', ratio: '4:3', width: 36, height: 27 },
    { id: 'landscape_16_9', name: 'Widescreen', ratio: '16:9', width: 50, height: 28 },
    { id: 'portrait_4_3', name: 'Portrait', ratio: '3:4', width: 21, height: 28 },
    { id: 'portrait_16_9', name: 'Tall', ratio: '9:16', width: 16, height: 28 },
  ]

  // Scroll to loading section when generating starts
  useEffect(() => {
    if (generating && loadingRef.current) {
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }, 100)
    }
  }, [generating])

  // Scroll to top of container when image is generated
  useEffect(() => {
    if (generatedImage && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }
  }, [generatedImage])

  // Cycle through loading messages every 3 seconds
  useEffect(() => {
    if (generating) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [generating, loadingMessages.length])

  // Auto-populate custom description for vision board
  useEffect(() => {
    if (type === 'vision_board' && (title || description || visionText)) {
      const autoDescription = title && description 
        ? `${title}. ${description}`
        : visionText || title || description || ''
      setCustomDescription(autoDescription)
    }
  }, [type, title, description, visionText])

  // Handle file preview for edit mode (with HEIC/HEIF conversion)
  useEffect(() => {
    if (baseImage) {
      const isHeic = baseImage.type === 'image/heic' || baseImage.type === 'image/heif' || 
                     baseImage.name.toLowerCase().endsWith('.heic') || 
                     baseImage.name.toLowerCase().endsWith('.heif')
      
      if (isHeic) {
        // Convert HEIC/HEIF to JPEG for preview
        import('heic2any')
          .then(({ default: heic2any }) => {
            return heic2any({
              blob: baseImage,
              toType: 'image/jpeg',
              quality: 0.9,
            })
          })
          .then((convertedBlob) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              setBaseImagePreview(reader.result as string)
            }
            reader.readAsDataURL(convertedBlob as Blob)
          })
          .catch((error) => {
            console.warn('HEIC preview not available:', error)
            // Fallback: show placeholder for HEIC files
            setBaseImagePreview('heic-placeholder')
          })
      } else {
        // Regular image preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setBaseImagePreview(reader.result as string)
        }
        reader.readAsDataURL(baseImage)
      }
    } else {
      setBaseImagePreview(null)
    }
  }, [baseImage])

  const handleGenerate = async () => {
    // Validation based on mode
    if (mode === 'edit' || isEditingGenerated) {
      if (!baseImage && !isEditingGenerated) {
        toast.error('Please upload an image to edit')
        return
      }
      if (!editPrompt.trim()) {
        toast.error('Please describe the changes you want to make')
        return
      }
    } else {
      // Generate mode validation
      if (type === 'vision_board') {
        if (!customDescription.trim()) {
          toast.error('Image description is required for vision board generation')
          return
        }
      } else if (type === 'journal') {
        if (!journalText) {
          toast.error('Journal text is required for journal image generation')
          return
        }
      } else {
        if (!prompt.trim()) {
          toast.error('Please enter a description')
          return
        }
      }
    }

    setGenerating(true)

    try {
      // Build the prompt based on mode
      let finalPrompt = ''
      
      if (mode === 'edit' || isEditingGenerated) {
        // Edit mode: use edit prompt
        finalPrompt = editPrompt.trim()
      } else {
        // Generate mode: build from type-specific content
        if (type === 'vision_board') {
          finalPrompt = customDescription || (title && description ? `${title}. ${description}` : visionText || '')
        } else if (type === 'journal') {
          finalPrompt = journalText || ''
        } else {
          finalPrompt = prompt.trim()
        }
      }

      const requestBody: any = {
        type: (mode === 'edit' || isEditingGenerated) ? 'edit' : type,
        quality: 'standard',
        dimension: selectedDimension,
        style: 'vivid',
        prompt: finalPrompt,
        model: 'nano-banana',
      }

      // Add base image for edit mode
      if (isEditingGenerated && generatedImage) {
        // Use the currently generated image URL
        requestBody.imageUrl = generatedImage
      } else if (mode === 'edit' && baseImage) {
        let fileToUpload = baseImage
        
        // Convert HEIC/HEIF to JPEG before uploading
        const isHeic = baseImage.type === 'image/heic' || baseImage.type === 'image/heif' || 
                       baseImage.name.toLowerCase().endsWith('.heic') || 
                       baseImage.name.toLowerCase().endsWith('.heif')
        
        if (isHeic) {
          try {
            const heic2any = (await import('heic2any')).default
            const convertedBlob = await heic2any({
              blob: baseImage,
              toType: 'image/jpeg',
              quality: 0.95, // Higher quality for API submission
            })
            fileToUpload = new File([convertedBlob as Blob], baseImage.name.replace(/\.(heic|heif)$/i, '.jpg'), { 
              type: 'image/jpeg' 
            })
          } catch (error) {
            console.warn('HEIC conversion failed, using original file:', error)
            // Try to use original file anyway - server might handle it
          }
        }
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(fileToUpload)
        })
        requestBody.imageDataUri = base64
      }

      console.log('🎨 Sending image request:', { mode, type, dimension: selectedDimension })
      
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${mode === 'edit' ? 'edit' : 'generate'} image`)
      }

      const data = await response.json()
      console.log('✅ Image response received:', { imageUrl: data.imageUrl, mode, isEditingGenerated })
      
      setGeneratedImage(data.imageUrl)
      setRevisedPrompt(data.revisedPrompt)
      
      // Reset editing state
      if (isEditingGenerated) {
        setIsEditingGenerated(false)
        setEditPrompt('')
        // Keep the original so they can restore
      } else {
        // Clear original when generating brand new image
        setOriginalImage(null)
      }
      
      // Hide overlay immediately when image is ready
      setGenerating(false)
      
      // Automatically use the image for vision board items (both generate and edit modes)
      if (type === 'vision_board' || ((mode === 'edit' || isEditingGenerated) && type !== 'journal')) {
        onImageGenerated(data.imageUrl)
        if (mode === 'edit' || isEditingGenerated) {
          toast.success('Image edited and automatically selected!')
        } else {
          toast.success('Image generated and automatically selected!')
        }
      } else {
        const successMessage = (mode === 'edit' || isEditingGenerated) ? 'Image edited!' : 'Image generated!'
        toast.success(`${successMessage} Click "Use This Image" to add it.`)
      }

    } catch (error: any) {
      console.error('Image generation error:', error)
      toast.error(error.message || 'Failed to generate image')
      setGenerating(false)
    }
  }

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage)
      toast.success('Image added!')
      handleClear()
    }
  }


  const handleClear = () => {
    setGeneratedImage(null)
    setRevisedPrompt(null)
    setPrompt('')
    setIsEditingGenerated(false)
    setEditPrompt('')
    setOriginalImage(null)
  }

  const handleEditGeneratedImage = () => {
    // Save the current image as original before editing
    if (generatedImage && !originalImage) {
      setOriginalImage(generatedImage)
    }
    setIsEditingGenerated(true)
    setEditPrompt('')
  }

  const handleRestoreOriginal = () => {
    if (originalImage) {
      setGeneratedImage(originalImage)
      setOriginalImage(null)
      onImageGenerated(originalImage)
      toast.success('Original image restored!')
    }
  }

  return (
    <Card ref={containerRef} className={`p-6 ${className} relative`}>
      {/* VIVA Loading Overlay */}
      {generating && (
        <div ref={loadingRef} className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-50">
          <div className="text-center space-y-6">
            {/* VIVA Logo Spinner */}
            <div className="flex justify-center">
              <Spinner size="lg" variant="branded" />
            </div>
            
            {/* Animated Loading Message */}
            <div className="space-y-2 px-4">
              <h3 className="text-lg sm:text-xl font-bold text-white text-center break-words hyphens-auto">
                {loadingMessages[loadingMessageIndex]}
              </h3>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            
            {/* Progress Indicator - matches text width */}
            <div className="w-full max-w-md mx-auto px-4">
              <div className="bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-sm text-neutral-400 px-4">
              Usually takes 15-30 seconds
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-accent-500 to-secondary-500 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">Generate Image with VIVA</h3>
      </div>

      {!generatedImage ? (
        <>
          {/* Vision Board Description */}
          {type === 'vision_board' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Image Description
              </label>
              <Textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe the image you want to create... (e.g., 'A peaceful mountain landscape at sunrise with vibrant colors, inspiring and uplifting')"
                className="min-h-[100px]"
                disabled={generating}
              />
            </div>
          ) : type === 'journal' ? (
            <div className="mb-4 p-4 bg-secondary-500/10 rounded-lg border border-secondary-500/20">
              <p className="text-sm text-secondary-400 mb-2">
                <strong>Journal Image Generation:</strong>
              </p>
              {mood && (
                <p className="text-sm text-neutral-300 mb-2">
                  <strong>Mood:</strong> {mood}
                </p>
              )}
              <p className="text-sm text-neutral-300">
                <strong>Journal Text:</strong> {journalText || 'Not provided'}
              </p>
            </div>
          ) : (
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create... (e.g., 'A peaceful mountain landscape at sunrise with vibrant colors, inspiring and uplifting')"
              className="mb-4 min-h-[120px]"
              disabled={generating}
            />
          )}

          {/* Dimension Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Dimensions
            </label>
            <div className="flex gap-3 flex-wrap">
              {dimensionOptions.map((dim) => (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => setSelectedDimension(dim.id)}
                  className={`flex flex-col items-center justify-between p-2 rounded-lg border-2 transition-all h-16 ${
                    selectedDimension === dim.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                  }`}
                  disabled={generating}
                >
                  {/* Visual aspect ratio box - centered vertically */}
                  <div className="flex-1 flex items-center justify-center">
                    <div 
                      className={`rounded-sm ${
                        selectedDimension === dim.id 
                          ? 'bg-primary-500' 
                          : 'bg-neutral-500'
                      }`}
                      style={{ 
                        width: `${dim.width}px`, 
                        height: `${dim.height}px` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-white mt-1">{dim.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Toggle: Generate vs Edit */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('generate')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  mode === 'generate'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                }`}
                disabled={generating}
              >
                <div className="text-center">
                  <Sparkles className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium text-white">Generate New</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  mode === 'edit'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                }`}
                disabled={generating}
              >
                <div className="text-center">
                  <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium text-white">Edit Image</span>
                </div>
              </button>
            </div>
          </div>

          {/* Edit Mode: Image Upload */}
          {mode === 'edit' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-200 mb-3">
                Upload Image to Edit
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setBaseImage(file)
                    }
                  }}
                  className="hidden"
                  id="base-image-upload"
                  disabled={generating}
                />
                <label
                  htmlFor="base-image-upload"
                  className="block p-6 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors text-center"
                >
                  {baseImagePreview ? (
                    <div className="relative">
                      {baseImagePreview === 'heic-placeholder' ? (
                        <div className="p-6 bg-neutral-800 rounded-lg">
                          <ImageIcon className="w-16 h-16 mx-auto mb-2 text-neutral-500" />
                          <p className="text-sm text-neutral-300 text-center font-medium">{baseImage?.name}</p>
                          <p className="text-xs text-neutral-500 text-center mt-1">HEIC/HEIF file uploaded (preview not available)</p>
                        </div>
                      ) : (
                        <img
                          src={baseImagePreview}
                          alt="Base image"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setBaseImage(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-neutral-500" />
                      <p className="text-sm text-neutral-400">Click to upload an image</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Edit Prompt */}
              {baseImage && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Edit Instructions
                  </label>
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe the changes you want (e.g., 'add mountains in the background', 'make it sunset colors')"
                    rows={3}
                    disabled={generating}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={
                generating ||
                (mode === 'edit' && (!baseImage || !editPrompt.trim())) ||
                (mode === 'generate' && type === 'vision_board' && !customDescription.trim()) ||
                (mode === 'generate' && type === 'journal' && !journalText)
              }
              className="flex-1"
              variant="primary"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Editing...' : 'Generating...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? <ImageIcon className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {mode === 'edit' ? 'Edit Image' : 'Generate Image'}
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Generated Image Preview */}
          <div className="relative group">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full rounded-xl border-2 border-primary-500 shadow-lg"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Revised Prompt (if available) */}
          {revisedPrompt && revisedPrompt !== prompt && (
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              <p className="text-xs font-semibold text-neutral-400 mb-1">VIVA Enhanced Prompt:</p>
              <p className="text-xs text-neutral-300">{revisedPrompt}</p>
            </div>
          )}

          {/* Edit Mode for Generated Image */}
          {isEditingGenerated ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  What changes would you like to make?
                </label>
                <Textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g., 'remove the car', 'change sky to sunset', 'add mountains in background'"
                  rows={3}
                  disabled={generating}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !editPrompt.trim()}
                  variant="primary"
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Editing...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Apply Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingGenerated(false)
                    setEditPrompt('')
                  }}
                  variant="ghost"
                  disabled={generating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleUseImage}
                  variant="primary"
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Use This Image
                </Button>
                
                <Button
                  onClick={handleClear}
                  variant="ghost"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setGeneratedImage(null)
                    setOriginalImage(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Generate Another
                </Button>
                <Button
                  onClick={handleEditGeneratedImage}
                  variant="outline"
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Edit This Image
                </Button>
              </div>

              {/* Restore Original Button - only show if there's an original saved */}
              {originalImage && (
                <Button
                  onClick={handleRestoreOriginal}
                  variant="ghost"
                  className="w-full"
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Restore Original
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  )
}

