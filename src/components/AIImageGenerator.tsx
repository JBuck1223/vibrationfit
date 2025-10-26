// /src/components/AIImageGenerator.tsx
// AI-powered image generation component using DALL-E 3

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Textarea, Card, Spinner } from '@/lib/design-system/components'
import { Sparkles, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

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
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic')
  const [customDescription, setCustomDescription] = useState<string>('')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // Refs for scrolling
  const containerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // VIVA loading messages with animation
  const loadingMessages = [
    "VIVA is bringing your vision to life...",
    "Crafting your perfect image...",
    "Channeling creative energy...",
    "Manifesting your vision...",
    "Weaving magic into pixels...",
    "Almost ready to actualize..."
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

  // VIVA Style Options - Practical for Vision Boards
  const styleOptions = [
    {
      id: 'photorealistic',
      name: 'Photorealistic',
      description: 'Realistic photos - perfect for travel, places, objects',
      prompt: 'Photorealistic, high-quality photography, natural lighting, detailed textures, realistic colors.',
      icon: '📸'
    },
    {
      id: 'cosmic_realism',
      name: 'Cosmic Realism',
      description: 'Realistic with mystical energy - spiritual transformation',
      prompt: 'Cosmic realism style — realistic lighting and textures with subtle starlight, nebula glows, and energy particles.',
      icon: '⭐️'
    },
    {
      id: 'cinematic_realism',
      name: 'Cinematic',
      description: 'Movie-like scenes with emotional depth and atmosphere',
      prompt: 'Cinematic lighting, shallow depth of field, emotional realism, atmospheric haze, film photography style.',
      icon: '🎬'
    },
    {
      id: 'minimalist_clean',
      name: 'Clean Icons',
      description: 'Simple, clean design - great for icons and concepts',
      prompt: 'Minimalist design, clean lines, simple composition, white or neutral background, modern aesthetic.',
      icon: '🧩'
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Ultra-clean, focused designs with maximum impact',
      prompt: 'Ultra-minimalist design, single focal point, clean composition, negative space, modern simplicity.',
      icon: '⚪'
    },
    {
      id: 'vibrant',
      name: 'Vibrant',
      description: 'Bold, energetic, high-contrast images for ambitious goals',
      prompt: 'Vibrant colors, high contrast, bold composition, energetic atmosphere, dynamic lighting.',
      icon: '🌈'
    },
    {
      id: 'symbolic_collage',
      name: 'Symbolic Collage',
      description: 'Floating elements and symbols - great for multi-concept goals',
      prompt: 'Symbolic collage style, floating objects and symbols, soft depth-of-field, inspirational composition.',
      icon: '🪄'
    },
    {
      id: 'watercolor_artistic',
      name: 'Watercolor Artistic',
      description: 'Soft, artistic interpretation - gentle and emotional',
      prompt: 'Soft watercolor illustration, artistic interpretation, gentle colors, flowing textures, dreamy aesthetic.',
      icon: '🌸'
    },
    {
      id: 'energy_transformation',
      name: 'Energy & Transformation',
      description: 'Glowing energy fields - perfect for growth and change',
      prompt: 'Glowing energy field, particle light effects, transformation energy, ethereal background, cosmic elements.',
      icon: '⚡️'
    }
  ]

  const handleGenerate = async () => {
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

    setGenerating(true)

    try {
      const selectedStyleOption = styleOptions.find(s => s.id === selectedStyle)
      
      // Build the enhanced prompt
      let enhancedPrompt = ''
      
      if (type === 'vision_board') {
        const content = customDescription || (title && description ? `${title}. ${description}` : visionText || '')
        enhancedPrompt = `${content}. ${selectedStyleOption?.prompt || ''}`
      } else if (type === 'journal') {
        enhancedPrompt = `${journalText}. ${selectedStyleOption?.prompt || ''}`
      } else {
        enhancedPrompt = `${prompt.trim()}. ${selectedStyleOption?.prompt || ''}`
      }

      const requestBody: any = {
        type,
        quality: 'standard',
        size: type === 'vision_board' ? '1792x1024' : '1024x1024',
        style: 'vivid',
        prompt: enhancedPrompt
      }

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      
      setGeneratedImage(data.imageUrl)
      setRevisedPrompt(data.revisedPrompt)
      
      // Hide overlay immediately when image is ready
      setGenerating(false)
      
      // Automatically use the generated image for vision board items
      if (type === 'vision_board') {
        onImageGenerated(data.imageUrl)
        toast.success('Image generated and automatically selected!')
      } else {
        toast.success('Image generated! Click "Use This Image" to add it.')
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
              This usually takes 15-30 seconds
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-accent-500 to-secondary-500 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Generate Image with VIVA</h3>
          <p className="text-sm text-neutral-400">Powered by VIVA</p>
        </div>
      </div>

      {!generatedImage ? (
        <>
          {/* Content Preview */}
          {type === 'vision_board' ? (
            <div className="mb-4">
              <div className="mb-4 p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
                <p className="text-sm text-primary-400 mb-2">
                  <strong>Vision Board Generation:</strong>
                </p>
                {title && (
                  <p className="text-sm text-neutral-300 mb-1">
                    <strong>Title:</strong> {title}
                  </p>
                )}
                {description && (
                  <p className="text-sm text-neutral-300 mb-2">
                    <strong>Description:</strong> {description}
                  </p>
                )}
                {visionText && !title && !description && (
                  <p className="text-sm text-neutral-300">
                    <strong>Vision Text:</strong> {visionText}
                  </p>
                )}
              </div>
              
              {/* Editable Description Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Image Description (Auto-filled, but editable)
                </label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe the image you want to create... (e.g., 'A peaceful mountain landscape at sunrise with vibrant colors, inspiring and uplifting')"
                  className="min-h-[100px]"
                  disabled={generating}
                />
              </div>
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

          {/* Style Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Choose Style ({styleOptions.find(s => s.id === selectedStyle)?.icon} {styleOptions.find(s => s.id === selectedStyle)?.name})
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedStyle === style.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                  }`}
                  disabled={generating}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{style.icon}</span>
                    <span className="text-sm font-medium text-white">{style.name}</span>
                  </div>
                  <p className="text-xs text-neutral-400">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={
                generating ||
                (type === 'vision_board' && !customDescription.trim()) ||
                (type === 'journal' && !journalText)
              }
              className="flex-1"
              variant="primary"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
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

          <Button
            onClick={() => setGeneratedImage(null)}
            variant="outline"
            className="w-full"
          >
            Generate Another Image
          </Button>
        </div>
      )}
    </Card>
  )
}

