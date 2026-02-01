'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Input, Button, Badge, CategoryCard, PageHero, Container, Stack, Modal } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Upload, CheckCircle, XCircle, Filter, ImageIcon } from 'lucide-react'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import { colors } from '@/lib/design-system/tokens'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'actualized', label: 'Actualized' },
  { value: 'inactive', label: 'Inactive' },
] as const

export default function NewVisionBoardItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensiveUrlParam = searchParams.get('intensive') === 'true'
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [existingItems, setExistingItems] = useState<any[]>([])
  const [categoriesNeeded, setCategoriesNeeded] = useState<string[]>(LIFE_CATEGORY_KEYS)
  const [isUserInIntensive, setIsUserInIntensive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [actualizedFile, setActualizedFile] = useState<File | null>(null)
  const [actualizedAiGeneratedImageUrl, setActualizedAiGeneratedImageUrl] = useState<string | null>(null)
  const [actualizedImageSource, setActualizedImageSource] = useState<'upload' | 'ai' | null>(null)
  const [showImageReminderModal, setShowImageReminderModal] = useState(false)
  const [imageReminderMessage, setImageReminderMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    actualization_story: '',
    status: 'active',
    categories: [] as string[]
  })
  

  // Check if user is in intensive mode and load existing vision board items
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user has an active intensive checklist
        const { data: checklist } = await supabase
          .from('intensive_checklist')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .maybeSingle()

        const inIntensive = !!checklist || isIntensiveUrlParam
        setIsUserInIntensive(inIntensive)

        // Load existing items if user is in intensive mode
        if (inIntensive) {
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
            const needed = LIFE_CATEGORY_KEYS.filter(cat => !coveredCategories.has(cat))
            setCategoriesNeeded(needed)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [isIntensiveUrlParam])

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
          const uploadResult = await uploadUserFile('visionBoardUploaded', file, user.id)
          imageUrl = uploadResult.url
        } catch (error) {
          alert('Upload failed. Please try again or contact support if the issue persists.')
          return
        }
      } else if (!imageUrl) {
        // No image provided - show modal
        if (imageSource === 'ai') {
          setImageReminderMessage('Please click the "Generate Image" button before saving.')
        } else if (imageSource === 'upload') {
          setImageReminderMessage('Please select an image file before saving.')
        } else {
          setImageReminderMessage('Please either upload an image or generate one before saving.')
        }
        setShowImageReminderModal(true)
        setLoading(false)
        return
      }

      // Get actualized image URL if status is actualized
      let actualizedImageUrl = ''
      if (formData.status === 'actualized') {
        if (actualizedImageSource === 'ai' && actualizedAiGeneratedImageUrl) {
          actualizedImageUrl = actualizedAiGeneratedImageUrl
        } else if (actualizedImageSource === 'upload' && actualizedFile) {
          try {
            const uploadResult = await uploadUserFile('visionBoardUploaded', actualizedFile, user.id)
            actualizedImageUrl = uploadResult.url
          } catch (error) {
            alert('Upload failed. Please try again or contact support if the issue persists.')
            return
          }
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
          actualized_image_url: formData.status === 'actualized' && actualizedImageUrl ? actualizedImageUrl : null,
          actualization_story: formData.status === 'actualized' ? formData.actualization_story : null,
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
      if (isUserInIntensive) {
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
          const allCategoriesCovered = LIFE_CATEGORY_KEYS.every(cat => coveredCategories.has(cat))

          if (allCategoriesCovered) {
            const { markIntensiveStep } = await import('@/lib/intensive/checklist')
            await markIntensiveStep('vision_board_completed')
            // Redirect to dashboard to show progress with completion toast
            router.push('/intensive/dashboard?completed=vision_board')
            return
          } else {
            // Show which categories still need items
            const remaining = LIFE_CATEGORY_KEYS.filter(cat => !coveredCategories.has(cat))
            // Convert keys to labels for display
            const remainingLabels = remaining.map(key => {
              const cat = VISION_CATEGORIES.find(c => c.key === key)
              return cat ? cat.label : key
            })
            alert(`Great! ${remaining.length} more ${remaining.length === 1 ? 'category' : 'categories'} to go: ${remainingLabels.join(', ')}`)
            router.push('/vision-board/new')
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
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Add to Vision Board"
          subtitle="Create a visual representation of your vision."
        />

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
              <RecordingTextarea
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe this creation. Click the microphone icon to record audio."
                rows={4}
                storageFolder="visionBoard"
                recordingPurpose="quick"
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
                      setImageSource('upload')
                      setAiGeneratedImageUrl(null)
                    }}
                    className="w-full sm:flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSource('ai')
                      setFile(null)
                    }}
                    style={
                      imageSource === 'ai'
                        ? {
                            backgroundColor: colors.semantic.premium,
                            borderColor: colors.semantic.premium,
                          }
                        : {
                            borderColor: colors.semantic.premium,
                            color: colors.semantic.premium,
                          }
                    }
                    className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                      imageSource === 'ai'
                        ? 'text-white hover:opacity-90'
                        : 'bg-transparent hover:bg-[#BF00FF]/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with VIVA
                  </button>
                </div>

                {/* Enhanced FileUpload Component */}
                {imageSource === 'upload' && (
                  <FileUpload
                    dragDrop
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    multiple={false}
                    maxFiles={1}
                    maxSize={10}
                    value={file ? [file] : []}
                    onChange={(files) => setFile(files[0] || null)}
                    onUpload={(files) => setFile(files[0] || null)}
                    dragDropText="Click to upload or drag and drop"
                    dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                    previewSize="lg"
                  />
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
                              <span className="ml-2 text-green-400">• Auto-Selected</span>
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

              {/* Actualized Image - Only show when status is actualized */}
              {formData.status === 'actualized' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-3">
                    Evidence of Actualization (Optional)
                  </label>
                  
                  {/* Toggle Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Button
                      type="button"
                      variant={actualizedImageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActualizedImageSource('upload')
                        setActualizedAiGeneratedImageUrl(null)
                      }}
                      className="w-full sm:flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Evidence
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setActualizedImageSource('ai')
                        setActualizedFile(null)
                      }}
                      style={
                        actualizedImageSource === 'ai'
                          ? {
                              backgroundColor: colors.semantic.premium,
                              borderColor: colors.semantic.premium,
                            }
                          : {
                              borderColor: colors.semantic.premium,
                              color: colors.semantic.premium,
                            }
                      }
                      className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                        actualizedImageSource === 'ai'
                          ? 'text-white hover:opacity-90'
                          : 'bg-transparent hover:bg-[#BF00FF]/10'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with VIVA
                    </button>
                  </div>

                  {/* Enhanced FileUpload Component for Actualized Image */}
                  {actualizedImageSource === 'upload' && (
                    <FileUpload
                      dragDrop
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      value={actualizedFile ? [actualizedFile] : []}
                      onChange={(files) => setActualizedFile(files[0] || null)}
                      onUpload={(files) => setActualizedFile(files[0] || null)}
                      dragDropText="Click to upload or drag and drop"
                      dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                      previewSize="lg"
                    />
                  )}

                  {actualizedImageSource === 'ai' && (
                    <>
                      <AIImageGenerator
                        type="vision_board"
                        onImageGenerated={(url) => setActualizedAiGeneratedImageUrl(url)}
                        title={`Actualized: ${formData.name}`}
                        description={`Evidence of actualization: ${formData.description}`}
                        visionText={
                          formData.name && formData.description
                            ? `Actualized: ${formData.name}. Evidence: ${formData.description}`
                            : `Actualized: ${formData.description || formData.name || ''}`
                        }
                      />
                      
                      {actualizedAiGeneratedImageUrl && (
                        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <img
                              src={actualizedAiGeneratedImageUrl}
                              alt="AI Generated Evidence Preview"
                              className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                            />
                            <div className="flex-1 text-center sm:text-left">
                              <p className="text-sm font-medium text-white">AI Generated Evidence</p>
                              <p className="text-xs text-neutral-400">
                                Generated with VIVA
                                <span className="ml-2 text-green-400">• Auto-Selected</span>
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActualizedAiGeneratedImageUrl(null)}
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
              )}

              {/* Actualization Story - Only show when status is actualized */}
              {formData.status === 'actualized' && (
                <RecordingTextarea
                  label="Actualization Story"
                  value={formData.actualization_story}
                  onChange={(value) => setFormData({ ...formData, actualization_story: value })}
                  placeholder="Tell the story of how this vision was actualized. Click the microphone icon to record audio."
                  rows={6}
                  storageFolder="visionBoard"
                  recordingPurpose="quick"
                />
              )}

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
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        status: status.value,
                        actualization_story: status.value === 'actualized' ? formData.actualization_story : ''
                      })}
                      className={`px-2 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 flex-1 ${
                        formData.status === status.value
                          ? status.value === 'active' 
                            ? 'bg-green-600 text-white shadow-lg'
                            : status.value === 'actualized'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-600 text-white shadow-lg'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {status.value === 'active' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                      {status.value === 'actualized' && <CheckCircle className="w-3 h-3 text-white" />}
                      {status.value === 'inactive' && <XCircle className="w-3 h-3 text-white" />}
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

                {isUserInIntensive && categoriesNeeded.length > 0 && (
                  <p className="text-sm text-neutral-400 mb-3 text-center">
                    ✨ Intensive: Add at least one image for each life area. Still need: <strong className="text-primary-500">{categoriesNeeded.join(', ')}</strong>
                  </p>
                )}
                <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                  {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                    const isNeeded = isUserInIntensive && categoriesNeeded.includes(category.key)
                    const isSelected = formData.categories.includes(category.key)
                    return (
                      <CategoryCard 
                        key={category.key} 
                        category={category} 
                        selected={isSelected} 
                        onClick={() => handleCategoryToggle(category.key)}
                        variant="outlined"
                        selectionStyle="border"
                        iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                        selectedIconColor="#39FF14"
                        className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : isNeeded ? 'ring-2 ring-primary-500 bg-primary-500/10 !bg-transparent !border-[#333]' : '!bg-transparent !border-[#333]'}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-row gap-2 sm:gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={loading}
                  disabled={loading}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  {loading ? 'Creating...' : 'Add to Vision Board'}
                </Button>
              </div>
            </form>
          </Card>
      </Stack>

      {/* Image Reminder Modal */}
      <Modal
        isOpen={showImageReminderModal}
        onClose={() => setShowImageReminderModal(false)}
        title="No Image Attached"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <ImageIcon className="w-16 h-16 text-primary-500" />
          </div>
          <p className="text-neutral-300 text-center">
            {imageReminderMessage}
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowImageReminderModal(false)}
              variant="primary"
            >
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
