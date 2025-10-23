'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLayout, Card, Input, Button, Textarea, Badge } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, CheckCircle, XCircle, Filter } from 'lucide-react'
import { Icon } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

// CategoryCard component from design system
const CategoryCard = ({ category, selected = false, onClick, className = '' }: any) => {
  const IconComponent = category.icon
  return (
    <Card 
      variant={selected ? 'elevated' : 'default'} 
      hover 
      className={`cursor-pointer aspect-square transition-all duration-300 ${selected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-1 p-1 justify-center h-full">
        <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#00FFFF'} />
        <span className="text-[10px] font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
          {category.label}
        </span>
      </div>
    </Card>
  )
}

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
        <div className="pb-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Add to Vision Board
            </h1>
            <p className="text-neutral-400">
              Create a visual representation of your vision.
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <Input
                label="Creation Name"
                type="text"
                placeholder="What do you want to create?"
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
                placeholder="Describe this creation."
              />

              {/* Image Source Toggle */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Vision Image (Optional)
                </label>
                
                {/* Toggle Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
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
                    className="w-full sm:flex-1"
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
                    className="w-full sm:flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with VIVA
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
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
                      PNG, JPG, WEBP, or HEIC (max 10MB)
                    </p>
                  </div>
                )}

                {imageSource === 'upload' && file && (
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Show image preview for supported formats, custom icon for HEIC */}
                      {file.type === 'image/heic' || file.type === 'image/heif' ? (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                          <div className="text-white text-center">
                            <div className="text-2xl font-bold">HEIC</div>
                            <div className="text-xs opacity-80">Apple</div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                        />
                      )}
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-medium text-white break-words">{file.name}</p>
                        <p className="text-xs text-neutral-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {(file.type === 'image/heic' || file.type === 'image/heif') && (
                            <span className="ml-2 text-purple-400">• HEIC Format</span>
                          )}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="w-full sm:w-auto"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {imageSource === 'ai' && (
                  <>
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
                    
                    {/* Show AI-generated image preview */}
                    {aiGeneratedImageUrl && (
                      <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <img
                            src={aiGeneratedImageUrl}
                            alt="AI Generated Preview"
                            className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                          />
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-medium text-white">AI Generated Image</p>
                            <p className="text-xs text-neutral-400">
                              Generated with VIVA
                              <span className="ml-2 text-purple-400">• AI Created</span>
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiGeneratedImageUrl(null)}
                            className="w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Select the status for your vision item
                </p>
                {/* Status Buttons - Single Line, Equal Width */}
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFormData({ ...formData, status: status.value })}
                      className={`px-2 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center flex-1 ${
                        formData.status === status.value
                          ? status.value === 'active' 
                            ? 'bg-green-600 text-white shadow-lg'
                            : status.value === 'actualized'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-600 text-white shadow-lg'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Life Categories */}
              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Select categories for your vision item
                </p>

                {isIntensiveMode && categoriesNeeded.length > 0 && (
                  <p className="text-sm text-neutral-400 mb-3 text-center">
                    ✨ Intensive: Add at least one image for each life area. Still need: <strong className="text-primary-500">{categoriesNeeded.join(', ')}</strong>
                  </p>
                )}
                <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                  {VISION_CATEGORIES.map((category) => {
                    const isNeeded = isIntensiveMode && categoriesNeeded.includes(category.label)
                    return (
                      <CategoryCard 
                        key={category.key} 
                        category={category} 
                        selected={formData.categories.includes(category.label)} 
                        onClick={() => handleCategoryToggle(category.label)}
                        className={isNeeded ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Creating...' : 'Add to Vision Board'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
    </>
  )
}
