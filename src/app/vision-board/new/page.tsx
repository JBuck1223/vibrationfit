'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLayout, Container, Card, Input, Button, Textarea, Badge } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload } from 'lucide-react'

const LIFE_CATEGORIES = [
  'Fun / Recreation',
  'Variety / Travel / Adventure',
  'Home / Environment',
  'Family / Parenting',
  'Love / Romance / Partner',
  'Health / Body / Vitality',
  'Money / Wealth / Investments',
  'Business / Career / Work',
  'Social / Friends',
  'Giving / Contribution / Legacy',
  'Things / Belongings / Stuff',
  'Expansion / Spirituality',
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'actualized', label: 'Actualized' },
  { value: 'inactive', label: 'Inactive' },
]

export default function NewVisionBoardItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveMode = searchParams.get('intensive') === 'true'
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [existingItems, setExistingItems] = useState<any[]>([])
  const [categoriesNeeded, setCategoriesNeeded] = useState<string[]>(LIFE_CATEGORIES)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    categories: [] as string[]
  })
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load existing vision board items to check which categories are covered
  useEffect(() => {
    const loadExistingItems = async () => {
      if (!isIntensiveMode) return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: items } = await supabase
          .from('vision_board_items')
          .select('categories')
          .eq('user_id', user.id)

        if (items) {
          setExistingItems(items)
          
          // Get all unique categories that already have items
          const coveredCategories = new Set<string>()
          items.forEach(item => {
            if (item.categories && Array.isArray(item.categories)) {
              item.categories.forEach((cat: string) => coveredCategories.add(cat))
            }
          })
          
          // Calculate which categories still need items
          const needed = LIFE_CATEGORIES.filter(cat => !coveredCategories.has(cat))
          setCategoriesNeeded(needed)
        }
      } catch (error) {
        console.error('Error loading existing items:', error)
      }
    }
    
    loadExistingItems()
  }, [isIntensiveMode])

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to create a vision board item')
        return
      }

      // Get image URL (either from upload or AI generation)
      let imageUrl = ''
      if (imageSource === 'ai' && aiGeneratedImageUrl) {
        imageUrl = aiGeneratedImageUrl
      } else if (imageSource === 'upload' && file) {
        try {
          const uploadResult = await uploadUserFile('visionBoard', file, user.id)
          imageUrl = uploadResult.url
        } catch (error) {
          alert(`Upload failed: ${error}`)
          return
        }
      }

      // Create vision board item
      const { error } = await supabase
        .from('vision_board_items')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          image_url: imageUrl,
          status: formData.status,
          categories: formData.categories,
          actualized_at: formData.status === 'actualized' ? new Date().toISOString() : null
        })

      if (error) throw error

      // Update user stats
      await supabase.rpc('increment_vision_board_stats', { 
        p_user_id: user.id,
        p_status: formData.status 
      })

      // If in intensive mode, check if all categories are now covered
      if (isIntensiveMode) {
        // Reload items to check completion
        const { data: allItems } = await supabase
          .from('vision_board_items')
          .select('categories')
          .eq('user_id', user.id)

        if (allItems) {
          const coveredCategories = new Set<string>()
          allItems.forEach(item => {
            if (item.categories && Array.isArray(item.categories)) {
              item.categories.forEach((cat: string) => coveredCategories.add(cat))
            }
          })

          // Check if all 12 life categories are covered
          const allCategoriesCovered = LIFE_CATEGORIES.every(cat => coveredCategories.has(cat))

          if (allCategoriesCovered) {
            const { markIntensiveStep } = await import('@/lib/intensive/checklist')
            await markIntensiveStep('vision_board_completed')
            alert('🎉 Vision Board Complete! All life areas covered.')
            router.push('/intensive/dashboard')
            return
          } else {
            // Show which categories still need items
            const remaining = LIFE_CATEGORIES.filter(cat => !coveredCategories.has(cat))
            alert(`Great! ${remaining.length} more ${remaining.length === 1 ? 'category' : 'categories'} to go: ${remaining.join(', ')}`)
            router.push('/vision-board/new?intensive=true')
            return
          }
        }
      }

      router.push('/vision-board')
    } catch (error) {
      console.error('Error creating vision board item:', error)
      alert('Failed to create vision board item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Container size="md" className="py-8">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Add to Vision Board
            </h1>
            <p className="text-neutral-400">
              Create a visual representation of what you want to manifest
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <Input
                label="Creation Name"
                type="text"
                placeholder="What do you want to create or manifest?"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              {/* Description */}
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe this creation in detail. What does it look like? How does it feel? What will it bring to your life?"
              />

              {/* Image Source Toggle */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Vision Image (Optional)
                </label>
                
                {/* Toggle Buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (imageSource === 'upload') {
                        // Already in upload mode, trigger file picker
                        fileInputRef.current?.click()
                      } else {
                        // Switch to upload mode
                        setImageSource('upload')
                        setAiGeneratedImageUrl(null)
                      }
                    }}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    type="button"
                    variant={imageSource === 'ai' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageSource('ai')
                      setFile(null)
                    }}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with VIVA
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) {
                      setFile(selectedFile)
                      setImageSource('upload')
                    }
                  }}
                  className="hidden"
                />

                {/* Show drag-drop zone or selected file */}
                {imageSource === 'upload' && !file && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-primary-500', 'bg-primary-500/5')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-primary-500', 'bg-primary-500/5')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-primary-500', 'bg-primary-500/5')
                      const droppedFile = e.dataTransfer.files[0]
                      if (droppedFile && droppedFile.type.startsWith('image/')) {
                        setFile(droppedFile)
                      }
                    }}
                    className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-neutral-900/50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-300 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500">
                      PNG, JPG, or WEBP (max 10MB)
                    </p>
                  </div>
                )}

                {imageSource === 'upload' && file && (
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-neutral-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {imageSource === 'ai' && (
                  <AIImageGenerator
                    type="vision_board"
                    onImageGenerated={(url) => setAiGeneratedImageUrl(url)}
                    title={formData.name}
                    description={formData.description}
                    visionText={
                      formData.name && formData.description
                        ? `${formData.name}. ${formData.description}`
                        : formData.description || formData.name || ''
                    }
                  />
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Status
                </label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((status) => (
                    <label
                      key={status.value}
                      className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={formData.status === status.value}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-200">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Life Categories */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Life Category (Select all that apply)
                  {isIntensiveMode && categoriesNeeded.length > 0 && (
                    <Badge variant="warning" className="ml-3">
                      {categoriesNeeded.length} {categoriesNeeded.length === 1 ? 'category' : 'categories'} needed
                    </Badge>
                  )}
                </label>
                {isIntensiveMode && categoriesNeeded.length > 0 && (
                  <p className="text-sm text-neutral-400 mb-3">
                    ✨ Intensive: Add at least one image for each life area. Still need: <strong className="text-primary-500">{categoriesNeeded.join(', ')}</strong>
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LIFE_CATEGORIES.map((category) => {
                    const isNeeded = isIntensiveMode && categoriesNeeded.includes(category)
                    return (
                      <label
                        key={category}
                        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                          isNeeded 
                            ? 'bg-primary-500/10 border-2 border-primary-500 hover:bg-primary-500/20' 
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 rounded focus:ring-primary-500"
                        />
                        <span className={`text-sm ${isNeeded ? 'text-primary-500 font-semibold' : 'text-neutral-200'}`}>
                          {category}
                          {isNeeded && ' ⭐'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Add to Vision Board'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Container>
    </>
  )
}
