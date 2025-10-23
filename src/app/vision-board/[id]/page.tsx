'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Input, Button, Textarea, Icon } from '@/lib/design-system'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, Circle, XCircle, ArrowLeft, Trash2, Upload, Sparkles, Filter } from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import Link from 'next/link'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'actualized', label: 'Actualized' },
  { value: 'inactive', label: 'Inactive' },
]

// CategoryCard component (copied from main form)
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

interface VisionBoardItem {
  id: string
  name: string
  description: string
  image_url: string
  status: string
  categories: string[]
  created_at: string
  updated_at: string
  actualized_at: string | null
}

export default function VisionBoardItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [item, setItem] = useState<VisionBoardItem | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    categories: [] as string[]
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageSource, setImageSource] = useState<'upload' | 'ai'>('upload')
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchItem()
  }, [params])

  const fetchItem = async () => {
    try {
      const resolvedParams = await params
      const { data, error } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error

      setItem(data)
      setFormData({
        name: data.name,
        description: data.description || '',
        status: data.status,
        categories: data.categories || []
      })
    } catch (error) {
      console.error('Error fetching item:', error)
      alert('Failed to load vision board item')
      router.push('/vision-board')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (categoryLabel: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryLabel)
        ? prev.categories.filter(c => c !== categoryLabel)
        : [...prev.categories, categoryLabel]
    }))
  }

  const handleSave = async () => {
    if (!item) return
    
    setSaving(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to edit vision board item')
        return
      }

      const resolvedParams = await params
      let imageUrl = item.image_url

      // Handle new image (uploaded file or AI-generated)
      if (file || aiGeneratedImageUrl) {
        // Delete old image if it exists
        if (item.image_url) {
          try {
            // Extract S3 key from CDN URL more safely
            const url = new URL(item.image_url)
            const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            console.log('Replacing old S3 file:', oldPath)
            await deleteUserFile(oldPath)
          } catch (error) {
            console.warn('Failed to delete old image file:', error)
            // Continue with replacement even if old image deletion fails
          }
        }

        if (file) {
          // Upload new file
          try {
            const uploadResult = await uploadUserFile('visionBoard', file, user.id)
            imageUrl = uploadResult.url
          } catch (error) {
            alert(`Upload failed: ${error}`)
            return
          }
        } else if (aiGeneratedImageUrl) {
          // Use AI-generated image URL
          imageUrl = aiGeneratedImageUrl
        }
      }

      // Update vision board item
      const { error } = await supabase
        .from('vision_board_items')
        .update({
          name: formData.name,
          description: formData.description,
          image_url: imageUrl,
          status: formData.status,
          categories: formData.categories,
          actualized_at: formData.status === 'actualized' && item.status !== 'actualized' 
            ? new Date().toISOString() 
            : item.actualized_at
        })
        .eq('id', resolvedParams.id)

      if (error) throw error

      // Update user stats if status changed
      if (formData.status !== item.status) {
        await supabase.rpc('increment_vision_board_stats', { 
          p_user_id: user.id,
          p_status: formData.status 
        })
      }

      setIsEditing(false)
      fetchItem() // Refresh data
    } catch (error) {
      console.error('Error updating vision board item:', error)
      alert('Failed to update vision board item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    
    setDeleting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to delete vision board item')
        return
      }

      const resolvedParams = await params

      // Delete image file if it exists
      if (item.image_url) {
        try {
          // Extract S3 key from CDN URL more safely
          const url = new URL(item.image_url)
          const imagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
          console.log('Deleting S3 file:', imagePath)
          await deleteUserFile(imagePath)
        } catch (error) {
          console.warn('Failed to delete image file:', error)
          // Continue with database deletion even if image deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', resolvedParams.id)

      if (error) throw error

      // Update user stats (decrement counts)
      // Note: This RPC function needs to be created in Supabase
      try {
        await supabase.rpc('decrement_vision_board_stats', { 
          p_user_id: user.id,
          p_status: item.status 
        })
      } catch (rpcError) {
        console.warn('RPC function decrement_vision_board_stats not found:', rpcError)
        // Continue with deletion even if stats update fails
      }

      // Redirect to vision board
      router.push('/vision-board')
    } catch (error) {
      console.error('Error deleting vision board item:', error)
      alert('Failed to delete vision board item')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <div className="bg-green-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-semibold">Active</span>
        </div>
      )
    }

    if (status === 'actualized') {
      return (
        <div className="bg-purple-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Actualized</span>
        </div>
      )
    }

    if (status === 'inactive') {
      return (
        <div className="bg-gray-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <XCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Inactive</span>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <Card className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Item not found</h2>
        <p className="text-neutral-400 mb-6">This vision board item doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/vision-board">Back to Vision Board</Link>
        </Button>
      </Card>
    )
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {getStatusBadge(item.status)}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing ? 'Edit Creation' : item.name}
          </h1>
          <p className="text-neutral-400">
            {isEditing ? 'Update your vision board item' : 'View and manage your creation'}
          </p>
        </div>

        <Card>
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
              {/* Name */}
              <div>
                <Input
                  label="Creation Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="What do you want to create?"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this creation."
                  rows={4}
                />
              </div>

              {/* Image Section */}
              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Update your vision image
                </p>
                
                {/* Upload/Generate Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (imageSource === 'upload') {
                        fileInputRef.current?.click()
                      } else {
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

                {/* Show current image */}
                {item.image_url && (
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <img
                        src={item.image_url}
                        alt="Current Image"
                        className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-medium text-white">Current Image</p>
                        <p className="text-xs text-neutral-400">Will be replaced when you upload/generate new image</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show drag-drop zone or selected file */}
                {imageSource === 'upload' && !file && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-600 rounded-xl p-8 text-center cursor-pointer hover:border-neutral-500 transition-colors"
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
                <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                  {VISION_CATEGORIES.map((category) => (
                    <CategoryCard
                      key={category.key}
                      category={category}
                      selected={formData.categories.includes(category.label)}
                      onClick={() => handleCategoryToggle(category.label)}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="submit"
                  size="lg"
                  loading={saving}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Image */}
              {item.image_url && (
                <div>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-auto object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Image failed to load:', item.image_url)
                      console.error('Error details:', e)
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', item.image_url)
                    }}
                  />
                  <div className="mt-2 text-xs text-neutral-500">
                    <p>Testing image URL: {item.image_url}</p>
                    <a 
                      href={item.image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Open image in new tab
                    </a>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">{item.name}</h2>
                  {item.description && (
                    <p className="text-neutral-300">{item.description}</p>
                  )}
                </div>

                {/* Categories */}
                {item.categories && item.categories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-200 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.categories.map((category: string, index: number) => (
                        <span
                          key={index}
                          className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  {item.updated_at !== item.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Updated {new Date(item.updated_at).toLocaleDateString()}
                    </div>
                  )}
                  {item.actualized_at && (
                    <div className="flex items-center gap-2 text-warning-500">
                      <CheckCircle className="w-4 h-4" />
                      Actualized {new Date(item.actualized_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Item
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => router.push('/vision-board')}
                >
                  Back to Vision Board
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Creation</h3>
                <p className="text-neutral-300 mb-6">
                  Are you sure you want to delete "{item?.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    loading={deleting}
                    disabled={deleting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
    </>
  )
}
