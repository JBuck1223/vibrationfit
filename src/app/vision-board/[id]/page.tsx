'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Card, Input, Button, Textarea } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, Circle, XCircle, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

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

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
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

      // Upload new image if provided
      if (file) {
        // Delete old image if it exists
        if (item.image_url) {
          const oldPath = item.image_url.split('/').slice(-3).join('/') // Extract path from URL
          await deleteUserFile(oldPath)
        }

        try {
          const uploadResult = await uploadUserFile('visionBoard', file, user.id)
          imageUrl = uploadResult.url
        } catch (error) {
          alert(`Upload failed: ${error}`)
          return
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
          const imagePath = item.image_url.split('/').slice(-3).join('/') // Extract path from URL
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
      <PageLayout>
        <Container size="md" className="py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (!item) {
    return (
      <PageLayout>
        <Container size="md" className="py-8">
          <Card className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Item not found</h2>
            <p className="text-neutral-400 mb-6">This vision board item doesn't exist or you don't have permission to view it.</p>
            <Button asChild>
              <Link href="/vision-board">Back to Vision Board</Link>
            </Button>
          </Card>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="md" className="py-8">
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
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              {/* Name */}
              <Input
                label="Creation Name"
                type="text"
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
              />

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
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LIFE_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-200">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Vision Image
                </label>
                {item.image_url && (
                  <div className="mb-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-neutral-400 mt-1">Current image</p>
                  </div>
                )}
                <FileUpload
                  accept="image/*"
                  multiple={false}
                  maxFiles={1}
                  maxSize={10}
                  onUpload={(files) => setFile(files[0] || null)}
                  label="Update Image"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  loading={saving}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
      </Container>
    </PageLayout>
  )
}
