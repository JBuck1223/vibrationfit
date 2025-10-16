// /src/components/AIImageGenerator.tsx
// AI-powered image generation component using DALL-E 3

'use client'

import { useState } from 'react'
import { Button, Textarea, Card } from '@/lib/design-system/components'
import { Sparkles, Image as ImageIcon, Loader2, X, Download } from 'lucide-react'
import { toast } from 'sonner'

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void
  type: 'vision_board' | 'journal'
  initialPrompt?: string
  className?: string
  // Vision board specific props
  visionText?: string
  category?: string
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
  category,
  journalText,
  mood
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (type === 'vision_board') {
      if (!visionText || !category) {
        toast.error('Vision text and category are required for vision board generation')
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
      const requestBody: any = {
        type,
        quality: 'standard',
        size: type === 'vision_board' ? '1792x1024' : '1024x1024',
        style: 'vivid',
      }

      // Add type-specific parameters
      if (type === 'vision_board') {
        requestBody.visionText = visionText
        requestBody.category = category
      } else if (type === 'journal') {
        requestBody.journalText = journalText
        requestBody.mood = mood
      } else {
        requestBody.prompt = prompt.trim()
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
      
      toast.success('Image generated! Click "Use This Image" to add it.')

    } catch (error: any) {
      console.error('Image generation error:', error)
      toast.error(error.message || 'Failed to generate image')
    } finally {
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

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a')
      link.href = generatedImage
      link.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Image downloaded!')
    }
  }

  const handleClear = () => {
    setGeneratedImage(null)
    setRevisedPrompt(null)
    setPrompt('')
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-accent-500 to-secondary-500 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Generate Image with VIVA</h3>
          <p className="text-sm text-neutral-400">Powered by DALL-E 3</p>
        </div>
      </div>

      {!generatedImage ? (
        <>
          {type === 'vision_board' ? (
            <div className="mb-4 p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
              <p className="text-sm text-primary-400 mb-2">
                <strong>Vision Board Generation:</strong>
              </p>
              <p className="text-sm text-neutral-300 mb-2">
                <strong>Category:</strong> {category || 'Not selected'}
              </p>
              <p className="text-sm text-neutral-300">
                <strong>Vision Text:</strong> {visionText || 'Not provided'}
              </p>
            </div>
          ) : type === 'journal' ? (
            <div className="mb-4 p-4 bg-secondary-500/10 rounded-lg border border-secondary-500/20">
              <p className="text-sm text-secondary-400 mb-2">
                <strong>Journal Image Generation:</strong>
              </p>
              <p className="text-sm text-neutral-300 mb-2">
                <strong>Mood:</strong> {mood || 'Not specified'}
              </p>
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

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={
                generating || 
                (type === 'vision_board' && (!visionText || !category)) ||
                (type === 'journal' && !journalText) ||
                (type === 'custom' && !prompt.trim())
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

          <div className="mt-4 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-xs text-neutral-400">
              <strong>💡 Tips:</strong> Be specific and descriptive. Mention style, mood, colors, and composition. 
              {type === 'vision_board' 
                ? ' Images will be landscape-oriented (1792x1024).'
                : ' Images will be square (1024x1024).'}
            </p>
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
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Revised Prompt (if available) */}
          {revisedPrompt && revisedPrompt !== prompt && (
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              <p className="text-xs font-semibold text-neutral-400 mb-1">DALL-E Enhanced Prompt:</p>
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
              onClick={handleDownload}
              variant="secondary"
            >
              <Download className="w-4 h-4" />
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

