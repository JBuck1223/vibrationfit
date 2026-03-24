'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { Card, Button, Badge, CategoryCard, DeleteConfirmationDialog, ActionButtons, Icon, PracticeCard, PageHero, Container, Stack, Spinner, Input, FileUpload } from '@/lib/design-system'
import { useAreaStats } from '@/hooks/useAreaStats'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, XCircle, Filter, Grid3X3, X, ChevronLeft, ChevronRight, Eye, List, Grid, Lightbulb, Download, Edit3, Save, ChevronUp, Trash2, BookOpen, Upload, Sparkles, CheckSquare, Square, ListChecks, Image as ImageIcon } from 'lucide-react'
import { useDeleteItem } from '@/hooks/useDeleteItem'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { colors } from '@/lib/design-system/tokens'

// Hook to get responsive column count
function useColumnCount() {
  const [columnCount, setColumnCount] = useState(1)
  
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth
      if (width >= 1280) setColumnCount(4) // xl
      else if (width >= 1024) setColumnCount(3) // lg
      else if (width >= 640) setColumnCount(2) // sm
      else setColumnCount(1)
    }
    
    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])
  
  return columnCount
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'primary' },
  { value: 'actualized', label: 'Actualized', color: 'warning' },
  { value: 'inactive', label: 'Inactive', color: 'neutral' },
]

export default function VisionBoardPage() {
  const router = useRouter()
  const { stats: practiceStats } = useAreaStats('vision-board')
  const columnCount = useColumnCount()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active', 'actualized'])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string
    description: string
    status: string
    categories: string[]
    actualization_story: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [boardMode, setBoardMode] = useState<'clean' | 'detail'>('detail')
  const [detailModalIndex, setDetailModalIndex] = useState<number | null>(null)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editImageSource, setEditImageSource] = useState<'upload' | 'ai'>('upload')
  const [editAiImageUrl, setEditAiImageUrl] = useState<string | null>(null)
  const [editActualizedFile, setEditActualizedFile] = useState<File | null>(null)
  const [editActualizedImageSource, setEditActualizedImageSource] = useState<'upload' | 'ai'>('upload')
  const [editActualizedAiImageUrl, setEditActualizedAiImageUrl] = useState<string | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showActualizedImageEditor, setShowActualizedImageEditor] = useState(false)

  // Bulk selection mode
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkStatusChanging, setBulkStatusChanging] = useState(false)
  
  // Use standardized delete functionality
  const {
    showDeleteConfirm,
    deleting,
    itemToDelete,
    initiateDelete,
    confirmDelete,
    cancelDelete
  } = useDeleteItem({
    onSuccess: () => {
      // Update local state to remove deleted item
      setItems(prevItems => prevItems.filter(i => i.id !== itemToDelete?.id))
    },
    onError: (error) => {
      alert(`Failed to delete vision board item: ${error.message}`)
    },
    itemType: 'Creation'
  })

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    const recordActivation = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('area_activations').insert({
        user_id: user.id,
        area: 'vision_board',
      })
    }
    recordActivation()
  }, [])

  const fetchItems = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: itemsData } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items
    .filter(item => {
      // Show all if 'all' is selected, show none if empty array, otherwise filter by selected categories
      const categoryMatch = selectedCategories.includes('all') || 
        (selectedCategories.length > 0 && item.categories && item.categories.some((cat: string) => selectedCategories.includes(cat)))
      const statusMatch = selectedStatuses.includes('all') || selectedStatuses.includes(item.status)
      return categoryMatch && statusMatch
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Distribute items horizontally across columns (row-first, then down)
  // This creates Pinterest-style masonry that fills across the top first
  const columnizedItems = useMemo(() => {
    const columns: any[][] = Array.from({ length: columnCount }, () => [])
    filteredItems.forEach((item, index) => {
      // Round-robin distribution: item 0 -> col 0, item 1 -> col 1, etc.
      const columnIndex = index % columnCount
      columns[columnIndex].push({ ...item, originalIndex: index })
    })
    return columns
  }, [filteredItems, columnCount])


  const totalItems = items?.length || 0
  const actualizedItems = items?.filter(item => item.status === 'actualized').length || 0
  const activeItems = items?.filter(item => item.status === 'active').length || 0
  const inactiveItems = items?.filter(item => item.status === 'inactive').length || 0

  const toggleStatus = (status: string) => {
    if (status === 'all') {
      setSelectedStatuses(['all'])
    } else {
      if (selectedStatuses.includes(status)) {
        // Remove status from selection
        const newSelection = selectedStatuses.filter(s => s !== status)
        // If no statuses left, select 'all'
        setSelectedStatuses(newSelection.length === 0 ? ['all'] : newSelection)
      } else {
        // Add status to selection (remove 'all' if it exists)
        const filtered = selectedStatuses.filter(s => s !== 'all')
        setSelectedStatuses([...filtered, status])
      }
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    if (editingItemId) cancelEditing()
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredItems.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, filteredItems.length])

  useEffect(() => {
    if (detailModalIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailModalIndex(null)
      else if (e.key === 'ArrowLeft') setDetailModalIndex(prev => prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null)
      else if (e.key === 'ArrowRight') setDetailModalIndex(prev => prev !== null ? (prev + 1) % filteredItems.length : null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [detailModalIndex, filteredItems.length])

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('vision_board_items')
        .update({
          status: newStatus,
          actualized_at: newStatus === 'actualized' ? new Date().toISOString() : null
        })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                status: newStatus,
                actualized_at: newStatus === 'actualized' ? new Date().toISOString() : item.actualized_at
              }
            : item
        )
      )

      // Update user stats
      await supabase.rpc('increment_vision_board_stats', { 
        p_user_id: user.id,
        p_status: newStatus 
      })
    } catch (error) {
      console.error('Error updating item status:', error)
    }
  }

  const cycleItemStatus = async (itemId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentItem = items.find(item => item.id === itemId)
      if (!currentItem) return

      // Cycle through statuses: active -> actualized -> inactive -> active
      const statusCycle = ['active', 'actualized', 'inactive']
      const currentIndex = statusCycle.indexOf(currentItem.status)
      const nextIndex = (currentIndex + 1) % statusCycle.length
      const newStatus = statusCycle[nextIndex]

      const { error } = await supabase
        .from('vision_board_items')
        .update({
          status: newStatus,
          actualized_at: newStatus === 'actualized' ? new Date().toISOString() : null
        })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                status: newStatus,
                actualized_at: newStatus === 'actualized' ? new Date().toISOString() : item.actualized_at
              }
            : item
        )
      )

      // Update user stats
      await supabase.rpc('increment_vision_board_stats', { 
        p_user_id: user.id,
        p_status: newStatus 
      })
    } catch (error) {
      console.error('Error updating item status:', error)
    }
  }

  const handleDeleteItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      initiateDelete(item)
    }
  }

  const toggleBulkMode = () => {
    if (bulkMode) {
      setBulkMode(false)
      setSelectedItemIds(new Set())
    } else {
      setBulkMode(true)
      setExpandedItemId(null)
      cancelEditing()
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedItemIds(new Set(filteredItems.map(i => i.id)))
  }

  const deselectAll = () => {
    setSelectedItemIds(new Set())
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedItemIds.size === 0) return
    setBulkStatusChanging(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ids = Array.from(selectedItemIds)
      const { error } = await supabase
        .from('vision_board_items')
        .update({
          status: newStatus,
          actualized_at: newStatus === 'actualized' ? new Date().toISOString() : null
        })
        .in('id', ids)

      if (error) throw error

      setItems(prevItems =>
        prevItems.map(item =>
          selectedItemIds.has(item.id)
            ? {
                ...item,
                status: newStatus,
                actualized_at: newStatus === 'actualized' ? new Date().toISOString() : item.actualized_at
              }
            : item
        )
      )

      for (const id of ids) {
        await supabase.rpc('increment_vision_board_stats', {
          p_user_id: user.id,
          p_status: newStatus
        })
      }

      setSelectedItemIds(new Set())
    } catch (error) {
      console.error('Error bulk updating status:', error)
    } finally {
      setBulkStatusChanging(false)
    }
  }

  const bulkDeleteItems = async () => {
    if (selectedItemIds.size === 0) return
    setBulkDeleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const itemsToDelete = items.filter(i => selectedItemIds.has(i.id))

      for (const item of itemsToDelete) {
        if (item.image_url) {
          try {
            const url = new URL(item.image_url)
            const imagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(imagePath)
          } catch (e) { console.warn('Failed to delete image:', e) }
        }
        if (item.actualized_image_url) {
          try {
            const url = new URL(item.actualized_image_url)
            const imagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(imagePath)
          } catch (e) { console.warn('Failed to delete actualized image:', e) }
        }
      }

      const ids = Array.from(selectedItemIds)
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .in('id', ids)

      if (error) throw error

      for (const item of itemsToDelete) {
        try {
          await supabase.rpc('decrement_vision_board_stats', {
            p_user_id: user.id,
            p_status: item.status
          })
        } catch (e) { console.warn('Stats decrement failed:', e) }
      }

      setItems(prev => prev.filter(i => !selectedItemIds.has(i.id)))
      setSelectedItemIds(new Set())
      setShowBulkDeleteConfirm(false)
    } catch (error) {
      console.error('Error bulk deleting items:', error)
      alert('Failed to delete some items. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleExpand = (itemId: string) => {
    if (editingItemId === itemId) return
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      if (expandedItemId === itemId) {
        setExpandedItemId(null)
      }
      const idx = filteredItems.findIndex(i => i.id === itemId)
      if (idx !== -1) {
        setDetailModalIndex(idx)
        return
      }
    }
    setExpandedItemId(prev => prev === itemId ? null : itemId)
  }

  const closeDetailModal = () => {
    setDetailModalIndex(null)
    if (editingItemId) cancelEditing()
  }

  const initEditState = (item: any) => {
    setEditingItemId(item.id)
    setEditFormData({
      name: item.name,
      description: item.description || '',
      status: item.status,
      categories: item.categories || [],
      actualization_story: item.actualization_story || ''
    })
    setEditFile(null)
    setEditImageSource('upload')
    setEditAiImageUrl(null)
    setEditActualizedFile(null)
    setEditActualizedImageSource('upload')
    setEditActualizedAiImageUrl(null)
    setShowImageEditor(false)
    setShowActualizedImageEditor(false)
  }

  const startEditing = (item: any) => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
    if (isDesktop) {
      const idx = filteredItems.findIndex(i => i.id === item.id)
      if (idx !== -1) {
        setExpandedItemId(null)
        setLightboxOpen(true)
        setLightboxIndex(item.originalIndex !== undefined ? item.originalIndex : idx)
      }
    } else {
      setExpandedItemId(item.id)
    }
    initEditState(item)
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    setEditFormData(null)
    setEditFile(null)
    setEditAiImageUrl(null)
    setEditActualizedFile(null)
    setEditActualizedAiImageUrl(null)
    setShowImageEditor(false)
    setShowActualizedImageEditor(false)
  }

  const handleEditCategoryToggle = (categoryKey: string) => {
    if (!editFormData) return
    setEditFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        categories: prev.categories.includes(categoryKey)
          ? prev.categories.filter(c => c !== categoryKey)
          : [...prev.categories, categoryKey]
      }
    })
  }

  const handleInlineSave = async (itemId: string) => {
    if (!editFormData) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentItem = items.find(i => i.id === itemId)
      let imageUrl = currentItem?.image_url

      if (editFile || editAiImageUrl) {
        if (currentItem?.image_url) {
          try {
            const url = new URL(currentItem.image_url)
            const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(oldPath)
          } catch (e) { console.warn('Failed to delete old image:', e) }
        }
        if (editFile) {
          const result = await uploadUserFile('visionBoardUploaded', editFile, user.id)
          imageUrl = result.url
        } else if (editAiImageUrl) {
          imageUrl = editAiImageUrl
        }
      }

      let actualizedImageUrl = currentItem?.actualized_image_url
      if (editFormData.status === 'actualized') {
        if (editActualizedFile || editActualizedAiImageUrl) {
          if (currentItem?.actualized_image_url) {
            try {
              const url = new URL(currentItem.actualized_image_url)
              const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
              await deleteUserFile(oldPath)
            } catch (e) { console.warn('Failed to delete old actualized image:', e) }
          }
          if (editActualizedFile) {
            const result = await uploadUserFile('visionBoardUploaded', editActualizedFile, user.id)
            actualizedImageUrl = result.url
          } else if (editActualizedAiImageUrl) {
            actualizedImageUrl = editActualizedAiImageUrl
          }
        }
      } else {
        if (currentItem?.actualized_image_url) {
          try {
            const url = new URL(currentItem.actualized_image_url)
            const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(oldPath)
          } catch (e) { console.warn('Failed to delete actualized image:', e) }
        }
        actualizedImageUrl = null
      }

      const { error } = await supabase
        .from('vision_board_items')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          image_url: imageUrl,
          actualized_image_url: actualizedImageUrl,
          status: editFormData.status,
          categories: editFormData.categories,
          actualization_story: editFormData.status === 'actualized' ? editFormData.actualization_story : null,
          actualized_at: editFormData.status === 'actualized' && currentItem?.status !== 'actualized'
            ? new Date().toISOString()
            : currentItem?.actualized_at
        })
        .eq('id', itemId)

      if (error) throw error

      if (currentItem && editFormData.status !== currentItem.status) {
        await supabase.rpc('increment_vision_board_stats', {
          p_user_id: user.id,
          p_status: editFormData.status
        })
      }

      setItems(prev => prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              name: editFormData.name,
              description: editFormData.description,
              image_url: imageUrl,
              actualized_image_url: actualizedImageUrl,
              status: editFormData.status,
              categories: editFormData.categories,
              actualization_story: editFormData.status === 'actualized' ? editFormData.actualization_story : null,
              actualized_at: editFormData.status === 'actualized' && i.status !== 'actualized'
                ? new Date().toISOString()
                : i.actualized_at,
              updated_at: new Date().toISOString()
            }
          : i
      ))

      setEditingItemId(null)
      setEditFormData(null)
      setEditFile(null)
      setEditAiImageUrl(null)
      setEditActualizedFile(null)
      setEditActualizedAiImageUrl(null)
      setShowImageEditor(false)
      setShowActualizedImageEditor(false)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const renderInlineEditForm = (item: any) => {
    if (!editFormData) return null
    return (
      <div className="space-y-4 pt-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Creation Name</label>
          <input
            type="text"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] transition-colors"
            placeholder="What do you want to create?"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
          <textarea
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] transition-colors resize-none"
            rows={3}
            placeholder="Describe this creation..."
          />
        </div>

        {/* Vision Image */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-neutral-400">Vision Image</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImageEditor(!showImageEditor)}
            >
              {showImageEditor ? 'Hide' : (item.image_url ? 'Change Image' : 'Add Image')}
            </Button>
          </div>
          {item.image_url && !showImageEditor && !editFile && !editAiImageUrl && (
            <div className="flex items-center gap-3 p-2 bg-neutral-900 rounded-lg border border-neutral-700">
              <img src={item.image_url} alt="Current" className="w-14 h-14 object-cover rounded-lg" />
              <span className="text-xs text-neutral-400">Current image</span>
            </div>
          )}
          {(editFile || editAiImageUrl) && !showImageEditor && (
            <div className="flex items-center gap-3 p-2 bg-neutral-900 rounded-lg border border-[#39FF14]/30">
              <div className="w-14 h-14 bg-[#39FF14]/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#39FF14]" />
              </div>
              <span className="text-xs text-[#39FF14]">New image ready</span>
              <button type="button" onClick={() => { setEditFile(null); setEditAiImageUrl(null) }} className="ml-auto text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {showImageEditor && (
            <div className="space-y-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editImageSource === 'upload' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setEditImageSource('upload'); setEditAiImageUrl(null) }}
                  className="flex-1"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload
                </Button>
                <button
                  type="button"
                  onClick={() => { setEditImageSource('ai'); setEditFile(null) }}
                  style={editImageSource === 'ai'
                    ? { backgroundColor: colors.semantic.premium, borderColor: colors.semantic.premium }
                    : { borderColor: colors.semantic.premium, color: colors.semantic.premium }
                  }
                  className={`flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-2 px-4 text-xs font-medium border-2 ${
                    editImageSource === 'ai' ? 'text-white hover:opacity-90' : 'bg-transparent hover:bg-[#BF00FF]/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  VIVA
                </button>
              </div>
              {editImageSource === 'upload' ? (
                <FileUpload
                  dragDrop
                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                  multiple={false}
                  maxFiles={1}
                  maxSize={10}
                  value={editFile ? [editFile] : []}
                  onChange={(files) => setEditFile(files[0] || null)}
                  onUpload={(files) => setEditFile(files[0] || null)}
                  dragDropText="Click or drag to upload"
                  dragDropSubtext="PNG, JPG, WEBP, HEIC (max 10MB)"
                  previewSize="md"
                />
              ) : (
                <AIImageGenerator
                  type="vision_board"
                  onImageGenerated={(url) => { setEditAiImageUrl(url); setShowImageEditor(false) }}
                  title={editFormData.name}
                  description={editFormData.description}
                  visionText={editFormData.name && editFormData.description
                    ? `${editFormData.name}. ${editFormData.description}`
                    : editFormData.description || editFormData.name || ''}
                />
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-2">Status</label>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => setEditFormData({ ...editFormData, status: status.value })}
                className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 flex-1 ${
                  editFormData.status === status.value
                    ? status.value === 'active'
                      ? 'bg-green-600 text-white shadow-lg'
                      : status.value === 'actualized'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-600 text-white shadow-lg'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {status.value === 'active' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                {status.value === 'actualized' && <CheckCircle className="w-3 h-3" />}
                {status.value === 'inactive' && <XCircle className="w-3 h-3" />}
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actualization Story + Evidence Image */}
        {editFormData.status === 'actualized' && (
          <>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Actualization Story</label>
              <textarea
                value={editFormData.actualization_story}
                onChange={(e) => setEditFormData({ ...editFormData, actualization_story: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14] transition-colors resize-none"
                rows={4}
                placeholder="Tell the story of how this vision was actualized..."
              />
            </div>

            {/* Actualized Evidence Image */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-neutral-400">Evidence Image</label>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => setShowActualizedImageEditor(!showActualizedImageEditor)}
                >
                  {showActualizedImageEditor ? 'Hide' : (item.actualized_image_url ? 'Change Evidence' : 'Add Evidence')}
                </Button>
              </div>
              {item.actualized_image_url && !showActualizedImageEditor && !editActualizedFile && !editActualizedAiImageUrl && (
                <div className="flex items-center gap-3 p-2 bg-neutral-900 rounded-lg border border-neutral-700">
                  <img src={item.actualized_image_url} alt="Evidence" className="w-14 h-14 object-cover rounded-lg" />
                  <span className="text-xs text-neutral-400">Current evidence</span>
                </div>
              )}
              {(editActualizedFile || editActualizedAiImageUrl) && !showActualizedImageEditor && (
                <div className="flex items-center gap-3 p-2 bg-neutral-900 rounded-lg border border-purple-500/30">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs text-purple-400">New evidence ready</span>
                  <button type="button" onClick={() => { setEditActualizedFile(null); setEditActualizedAiImageUrl(null) }} className="ml-auto text-neutral-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {showActualizedImageEditor && (
                <div className="space-y-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-700">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={editActualizedImageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => { setEditActualizedImageSource('upload'); setEditActualizedAiImageUrl(null) }}
                      className="flex-1"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setEditActualizedImageSource('ai'); setEditActualizedFile(null) }}
                      style={editActualizedImageSource === 'ai'
                        ? { backgroundColor: colors.semantic.premium, borderColor: colors.semantic.premium }
                        : { borderColor: colors.semantic.premium, color: colors.semantic.premium }
                      }
                      className={`flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-2 px-4 text-xs font-medium border-2 ${
                        editActualizedImageSource === 'ai' ? 'text-white hover:opacity-90' : 'bg-transparent hover:bg-[#BF00FF]/10'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      VIVA
                    </button>
                  </div>
                  {editActualizedImageSource === 'upload' ? (
                    <FileUpload
                      dragDrop
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      value={editActualizedFile ? [editActualizedFile] : []}
                      onChange={(files) => setEditActualizedFile(files[0] || null)}
                      onUpload={(files) => setEditActualizedFile(files[0] || null)}
                      dragDropText="Click or drag to upload"
                      dragDropSubtext="PNG, JPG, WEBP, HEIC (max 10MB)"
                      previewSize="md"
                    />
                  ) : (
                    <AIImageGenerator
                      type="vision_board"
                      onImageGenerated={(url) => { setEditActualizedAiImageUrl(url); setShowActualizedImageEditor(false) }}
                      title={`Actualized: ${editFormData.name}`}
                      description={`Evidence: ${editFormData.description}`}
                      visionText={`Actualized: ${editFormData.name}. ${editFormData.description}`}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-2">Categories</label>
          <div className="grid grid-cols-5 md:grid-cols-12 gap-2">
            {VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion').map((category) => {
              const isSelected = editFormData.categories.includes(category.key)
              return (
                <CategoryCard
                  key={category.key}
                  category={category}
                  selected={isSelected}
                  onClick={() => handleEditCategoryToggle(category.key)}
                  variant="outlined"
                  selectionStyle="border"
                  iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                  selectedIconColor="#39FF14"
                  className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)]' : '!bg-transparent !border-[#333]'}
                />
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={cancelEditing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleInlineSave(item.id)}
            loading={saving}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  const renderViewDetails = (item: any, showDescription: boolean = true) => (
    <div className="space-y-3 pt-3">
      {showDescription && item.description && (
        <p className="text-sm text-neutral-300">{item.description}</p>
      )}

      {item.status === 'actualized' && item.actualization_story && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <h4 className="text-xs font-semibold text-purple-400 mb-1">Actualization Story</h4>
          <p className="text-sm text-neutral-200 whitespace-pre-wrap">{item.actualization_story}</p>
        </div>
      )}

      {item.categories && item.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.categories.map((categoryKey: string) => {
            const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
            return (
              <span key={categoryKey} className="text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full">
                {categoryInfo ? categoryInfo.label : categoryKey}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
        {item.actualized_at && (
          <span className="text-purple-400">Actualized: {new Date(item.actualized_at).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          <Link href={`/vision-board/${item.id}/story`}>
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Stories
          </Link>
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="text-xs"
          onClick={() => handleDeleteItem(item.id)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  )


  const getStatusBadge = (status: string, isListView: boolean = false) => {
    if (status === 'active') {
      return (
        <div className={`bg-green-600 rounded-full flex items-center gap-1 md:gap-2 shadow-lg ${
          isListView 
            ? 'px-3 py-1.5 md:px-2 md:py-1' 
            : 'px-3 py-1.5 md:px-4 md:py-2'
        }`}>
          <div className={`bg-white rounded-full animate-pulse ${
            isListView ? 'w-1.5 h-1.5 md:w-1.5 md:h-1.5' : 'w-1.5 h-1.5 md:w-2 md:h-2'
          }`}></div>
          <span className={`text-white font-semibold ${
            isListView ? 'text-xs md:text-xs' : 'text-xs md:text-sm'
          }`}>Active</span>
        </div>
      )
    }

    if (status === 'actualized') {
      return (
        <div className={`bg-purple-500 rounded-full flex items-center gap-1 md:gap-2 shadow-lg ${
          isListView 
            ? 'px-3 py-1.5 md:px-2 md:py-1' 
            : 'px-3 py-1.5 md:px-4 md:py-2'
        }`}>
          <CheckCircle className={`text-white ${
            isListView ? 'w-3 h-3 md:w-3 md:h-3' : 'w-3 h-3 md:w-4 md:h-4'
          }`} />
          <span className={`text-white font-semibold ${
            isListView ? 'text-xs md:text-xs' : 'text-xs md:text-sm'
          }`}>Actualized</span>
        </div>
      )
    }

    if (status === 'inactive') {
      return (
        <div className={`bg-gray-600 rounded-full flex items-center gap-1 md:gap-2 shadow-lg ${
          isListView 
            ? 'px-3 py-1.5 md:px-2 md:py-1' 
            : 'px-3 py-1.5 md:px-4 md:py-2'
        }`}>
          <XCircle className={`text-white ${
            isListView ? 'w-3 h-3 md:w-3 md:h-3' : 'w-3 h-3 md:w-4 md:h-4'
          }`} />
          <span className={`text-white font-semibold ${
            isListView ? 'text-xs md:text-xs' : 'text-xs md:text-sm'
          }`}>Inactive</span>
        </div>
      )
    }

    return null
  }

  const getActiveFilterCount = () => {
    let count = 0
    // Count if category filter is active (not 'all' and has selections)
    if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
      count += 1
    }
    // Count if status filter is active (not 'all' and has selections)
    if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) {
      count += 1
    }
    return count
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Vision Board"
          subtitle="Visualize and track your conscious creations"
        >
          <div className="grid grid-cols-3 gap-2 md:gap-3 max-w-lg mx-auto">
            <Button
              onClick={() => router.push('/vision-board/ideas')}
              variant="primary"
              size="sm"
              className="w-full flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>VIVA Ideas</span>
            </Button>
            <Button
              onClick={() => router.push('/vision-board/new')}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add New</span>
            </Button>
            <Button
              onClick={() => {
                const params = new URLSearchParams()
                if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
                  params.set('categories', selectedCategories.join(','))
                }
                if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) {
                  params.set('statuses', selectedStatuses.join(','))
                }
                router.push(`/vision-board/export${params.toString() ? '?' + params.toString() : ''}`)
              }}
              variant="secondary"
              size="sm"
              className="w-full flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>PDF</span>
            </Button>
          </div>
        </PageHero>

        {/* Practice Stats */}
        <PracticeCard
          title="Vision Board"
          icon={ImageIcon}
          theme="green"
          inline
          hideCta
          todayCompleted={practiceStats?.todayCompleted ?? false}
          currentStreak={practiceStats?.currentStreak ?? 0}
          countLast7={practiceStats?.countLast7 ?? 0}
          countLast30={practiceStats?.countLast30 ?? 0}
          countAllTime={practiceStats?.countAllTime ?? 0}
          streakFreezeAvailable={practiceStats?.streakFreezeAvailable ?? false}
          streakFreezeUsedThisWeek={practiceStats?.streakFreezeUsedThisWeek ?? false}
          ctaHref="/vision-board"
          ctaLabel="Open Vision Board"
          ctaDoneLabel="View Vision Board"
        />

        {/* Filter Toggle Button and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => router.push('/vision-board/new')}
              className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#39FF14]/30 transition-all duration-200"
              aria-label="Add Creation"
            >
              <Plus className="w-6 h-6 text-[#39FF14]" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={bulkMode ? 'danger' : 'ghost'}
              size="sm"
              onClick={toggleBulkMode}
              className="flex items-center gap-2"
            >
              <ListChecks className="w-4 h-4" />
              <span>{bulkMode ? 'Cancel' : 'Select'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-1">
              {/* Board Mode Toggle */}
              <button
                onClick={() => { setBoardMode('clean'); setExpandedItemId(null); cancelEditing() }}
                className={`p-2.5 rounded-full transition-all ${
                  boardMode === 'clean'
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="Clean view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBoardMode('detail')}
                className={`p-2.5 rounded-full transition-all ${
                  boardMode === 'detail'
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="Detail view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div id="filters" className="space-y-6 animate-in slide-in-from-top duration-300">
          {/* Category Filter */}
          <Card variant="elevated" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Categories</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (selectedCategories.includes('all')) {
                    // Deselect all - set to empty array
                    setSelectedCategories([])
                  } else {
                    // Select all
                    setSelectedCategories(['all'])
                  }
                }}
              >
                {selectedCategories.includes('all') ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
              {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => {
                const isSelected = selectedCategories.includes(category.key) || selectedCategories.includes('all')
                return (
                  <CategoryCard 
                    key={category.key} 
                    category={category} 
                    selected={isSelected} 
                    onClick={() => {
                      if (selectedCategories.includes(category.key)) {
                        // Remove category from selection
                        setSelectedCategories(prev => prev.filter(cat => cat !== category.key))
                      } else {
                        // Add category to selection (remove 'all' if it exists)
                        setSelectedCategories(prev => {
                          const filtered = prev.filter(cat => cat !== 'all')
                          return [...filtered, category.key]
                        })
                      }
                    }}
                    variant="outlined"
                    selectionStyle="border"
                    iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                    selectedIconColor="#39FF14"
                    className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                  />
                )
              })}
            </div>
          </Card>

          {/* Status Filter */}
          <Card variant="elevated" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Status</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const allSelected = selectedStatuses.includes('active') && 
                                     selectedStatuses.includes('actualized') && 
                                     selectedStatuses.includes('inactive')
                  if (allSelected) {
                    // Deselect all
                    setSelectedStatuses([])
                  } else {
                    // Select all three statuses
                    setSelectedStatuses(['active', 'actualized', 'inactive'])
                  }
                }}
              >
                {selectedStatuses.includes('active') && 
                 selectedStatuses.includes('actualized') && 
                 selectedStatuses.includes('inactive') 
                  ? 'Deselect All' 
                  : 'Select All'}
              </Button>
            </div>
            
            {/* Status Buttons - Single Line, Equal Width */}
            <div className="flex gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 flex-1 ${
                      selectedStatuses.includes(status.value)
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
          </Card>
          </div>
        )}

        {/* Vision Board Content */}
        <div id="content">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              /* Grid View - Masonry with Clean/Detail modes */
              <div className="flex gap-4 md:gap-6">
                {columnizedItems.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex-1 flex flex-col gap-4 md:gap-6">
                    {column.map((item) => {
                      const isExpanded = expandedItemId === item.id
                      const isEditing = editingItemId === item.id
                      const isOpen = isExpanded || isEditing

                      if (boardMode === 'clean') {
                        const isSelected = selectedItemIds.has(item.id)
                        return (
                          <div
                            key={item.id}
                            className={`rounded-2xl overflow-hidden bg-neutral-800 border-2 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 relative ${
                              bulkMode && isSelected ? 'border-[#39FF14] ring-2 ring-[#39FF14]/30' : 'border-[#333]'
                            }`}
                            onClick={() => bulkMode ? toggleItemSelection(item.id) : openLightbox(item.originalIndex)}
                          >
                            {bulkMode && (
                              <div className="absolute top-3 left-3 z-10">
                                {isSelected ? (
                                  <CheckSquare className="w-6 h-6 text-[#39FF14] drop-shadow-lg" />
                                ) : (
                                  <Square className="w-6 h-6 text-white/60 drop-shadow-lg" />
                                )}
                              </div>
                            )}
                            {(item.status === 'actualized' && item.actualized_image_url) ? (
                              <img src={item.actualized_image_url} alt={item.name} className="w-full h-auto object-cover" loading="lazy" />
                            ) : item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-auto object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-48 bg-neutral-900 flex items-center justify-center">
                                <Grid3X3 className="w-12 h-12 text-neutral-600" />
                              </div>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div key={item.id} className={`rounded-2xl overflow-hidden bg-neutral-800 border-2 shadow-lg transition-all duration-300 ${
                          bulkMode && selectedItemIds.has(item.id) ? 'border-[#39FF14] ring-2 ring-[#39FF14]/30' : 'border-[#333]'
                        }`}>
                          {/* Image - tap for lightbox or select */}
                          <div
                            className="relative cursor-pointer"
                            onClick={() => bulkMode ? toggleItemSelection(item.id) : openLightbox(item.originalIndex)}
                          >
                            {bulkMode && (
                              <div className="absolute top-3 left-3 z-10">
                                {selectedItemIds.has(item.id) ? (
                                  <CheckSquare className="w-6 h-6 text-[#39FF14] drop-shadow-lg" />
                                ) : (
                                  <Square className="w-6 h-6 text-white/60 drop-shadow-lg" />
                                )}
                              </div>
                            )}
                            {(item.status === 'actualized' && item.actualized_image_url) ? (
                              <img src={item.actualized_image_url} alt={item.name} className="w-full h-auto object-cover" loading="lazy" />
                            ) : item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-auto object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-48 bg-neutral-900 flex items-center justify-center">
                                <Grid3X3 className="w-12 h-12 text-neutral-600" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              {getStatusBadge(item.status)}
                            </div>
                          </div>

                          {/* Name + Action Icons Bar */}
                          <div
                            className={`px-3 py-2.5 flex items-center gap-2 ${bulkMode ? 'cursor-pointer' : ''}`}
                            onClick={() => bulkMode && toggleItemSelection(item.id)}
                          >
                            <span className="flex-1 text-sm font-semibold text-white truncate">{item.name}</span>
                            {!bulkMode && (
                              <>
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isExpanded && !isEditing
                                      ? 'bg-[#39FF14]/20 text-[#39FF14]'
                                      : 'hover:bg-neutral-700 text-neutral-400 hover:text-white'
                                  }`}
                                  aria-label={isExpanded ? 'Collapse details' : 'View details'}
                                >
                                  {isExpanded && !isEditing ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => isEditing ? cancelEditing() : startEditing(item)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isEditing
                                      ? 'bg-[#39FF14]/20 text-[#39FF14]'
                                      : 'hover:bg-neutral-700 text-neutral-400 hover:text-white'
                                  }`}
                                  aria-label={isEditing ? 'Cancel editing' : 'Edit'}
                                >
                                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Expandable Section */}
                          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}>
                            <div className="overflow-hidden min-h-0">
                              {isEditing && editFormData ? (
                                <div className="px-4 pb-4 border-t border-neutral-700/50">
                                  {renderInlineEditForm(item)}
                                </div>
                              ) : isExpanded ? (
                                <div className="px-4 pb-4 border-t border-neutral-700/50">
                                  {renderViewDetails(item)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : (
              /* List View - Mobile-First with inline expand/edit */
              <div className="space-y-3 md:space-y-4">
                {filteredItems.map((item) => {
                  const isExpanded = expandedItemId === item.id
                  const isEditing = editingItemId === item.id
                  const isOpen = isExpanded || isEditing

                  return (
                    <Card key={item.id} className={`transition-all duration-200 ${
                      bulkMode && selectedItemIds.has(item.id)
                        ? '!border-[#39FF14] ring-2 ring-[#39FF14]/30'
                        : 'hover:border-primary-500'
                    }`}>
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4">

                        {/* Bulk checkbox + Image */}
                        <div
                          className={`relative flex-shrink-0 w-full md:w-40 aspect-[4/3] rounded-lg overflow-hidden bg-neutral-800 ${bulkMode ? 'cursor-pointer' : ''}`}
                          onClick={() => bulkMode && toggleItemSelection(item.id)}
                        >
                          {bulkMode && (
                            <div className="absolute top-2 left-2 z-10">
                              {selectedItemIds.has(item.id) ? (
                                <CheckSquare className="w-6 h-6 text-[#39FF14] drop-shadow-lg" />
                              ) : (
                                <Square className="w-6 h-6 text-white/60 drop-shadow-lg" />
                              )}
                            </div>
                          )}
                          {(item.status === 'actualized' && item.actualized_image_url) ? (
                            <img
                              src={item.actualized_image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Grid3X3 className="w-8 h-8 md:w-6 md:h-6 text-neutral-600" />
                            </div>
                          )}

                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                cycleItemStatus(item.id)
                              }}
                              className="cursor-pointer"
                              title="Click to cycle status"
                            >
                              {getStatusBadge(item.status, true)}
                            </button>
                          </div>
                        </div>

                        {/* Item Details */}
                        <div className={`flex-1 min-w-0 ${bulkMode ? 'cursor-pointer' : ''}`} onClick={() => bulkMode && toggleItemSelection(item.id)}>
                          {/* Title row with action icons */}
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="flex-1 text-xl font-semibold text-white">{item.name}</h3>
                            {!bulkMode && (
                              <>
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                                    isExpanded && !isEditing
                                      ? 'bg-[#39FF14]/20 text-[#39FF14]'
                                      : 'hover:bg-neutral-700 text-neutral-400 hover:text-white'
                                  }`}
                                  aria-label={isExpanded ? 'Collapse' : 'Details'}
                                >
                                  {isExpanded && !isEditing
                                    ? <ChevronUp className="w-4 h-4" />
                                    : <Eye className="w-4 h-4" />
                                  }
                                </button>
                                <button
                                  onClick={() => isEditing ? cancelEditing() : startEditing(item)}
                                  className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                                    isEditing
                                      ? 'bg-[#39FF14]/20 text-[#39FF14]'
                                      : 'hover:bg-neutral-700 text-neutral-400 hover:text-white'
                                  }`}
                                  aria-label={isEditing ? 'Cancel' : 'Edit'}
                                >
                                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                          </div>

                          {!isEditing && item.description && (
                            <p className="text-neutral-300 mb-3">{item.description}</p>
                          )}

                          {!isEditing && (
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-white">Created:</span>
                                <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                              {item.categories && item.categories.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.categories.map((categoryKey: string) => {
                                    const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                                    return (
                                      <span key={categoryKey} className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full">
                                        {categoryInfo ? categoryInfo.label : categoryKey}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Section */}
                      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}>
                        <div className="overflow-hidden min-h-0">
                          {isEditing && editFormData ? (
                            <div className="pt-2 border-t border-neutral-700/50 mt-3">
                              {renderInlineEditForm(item)}
                            </div>
                          ) : isExpanded ? (
                            <div className="border-t border-neutral-700/50 mt-3">
                              {renderViewDetails(item, false)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Grid3X3 className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
            <p className="text-neutral-400 mb-6">Try adjusting your filters or adding a creation.</p>
            <Button asChild>
              <Link href="/vision-board/new">
                <Plus className="w-5 h-5 mr-2" />
                Add Creation
              </Link>
            </Button>
          </div>
        )}


        {/* Lightbox Modal */}
        {lightboxOpen && filteredItems.length > 0 && (() => {
          const currentItem = filteredItems[lightboxIndex]
          const imageUrl = (currentItem?.status === 'actualized' && currentItem?.actualized_image_url)
            ? currentItem.actualized_image_url
            : currentItem?.image_url

          if (boardMode === 'clean') {
            return (
              <div
                className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                onClick={closeLightbox}
              >
                <button
                  onClick={closeLightbox}
                  className="absolute top-3 right-3 z-20 p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {filteredItems.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-7 h-7" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-7 h-7" />
                    </button>
                  </>
                )}

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={currentItem.name}
                    className="max-w-[95vw] max-h-[95vh] object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <Grid3X3 className="w-16 h-16 text-neutral-700" />
                  </div>
                )}

                {filteredItems.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30">
                    {lightboxIndex + 1} / {filteredItems.length}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-3"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-3 right-3 md:top-5 md:right-5 z-20 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {filteredItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage() }}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage() }}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </>
              )}

              <div
                className={`relative w-[94vw] max-w-[1600px] h-[96vh] flex bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/50 ${
                  editingItemId === currentItem.id ? 'flex-row' : 'flex-col'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {editingItemId === currentItem.id && editFormData ? (
                  <>
                    {/* Edit mode: image left, form right */}
                    <div className="flex-1 min-w-0 flex items-center justify-center bg-black/50">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={currentItem.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center">
                          <Grid3X3 className="w-16 h-16 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="w-[420px] flex-shrink-0 border-l border-neutral-800 overflow-y-auto px-5 py-5">
                      {renderInlineEditForm(currentItem)}
                    </div>
                  </>
                ) : (
                  <>
                    {/* View mode: image top, details bottom */}
                    <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black/50">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={currentItem.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center">
                          <Grid3X3 className="w-16 h-16 text-neutral-600" />
                        </div>
                      )}
                      {currentItem.status === 'actualized' && currentItem.actualized_image_url && (
                        <div className="absolute bottom-2 left-3 text-xs text-purple-400 bg-black/60 px-2 py-1 rounded-full">
                          Evidence of actualization
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 overflow-y-auto max-h-[25vh] px-5 py-4 border-t border-neutral-800">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white truncate">{currentItem.name}</h3>
                            {getStatusBadge(currentItem.status)}
                          </div>
                          {currentItem.description && (
                            <p className="text-sm text-neutral-300 mb-3 line-clamp-3">{currentItem.description}</p>
                          )}
                          {currentItem.status === 'actualized' && currentItem.actualization_story && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-3">
                              <h4 className="text-xs font-semibold text-purple-400 mb-1">Actualization Story</h4>
                              <p className="text-sm text-neutral-200 whitespace-pre-wrap line-clamp-4">{currentItem.actualization_story}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {currentItem.categories && currentItem.categories.length > 0 && currentItem.categories.map((categoryKey: string) => {
                              const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                              return (
                                <span key={categoryKey} className="text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full">
                                  {categoryInfo ? categoryInfo.label : categoryKey}
                                </span>
                              )
                            })}
                            <span className="text-xs text-neutral-500">
                              Created {new Date(currentItem.created_at).toLocaleDateString()}
                            </span>
                            {currentItem.actualized_at && (
                              <span className="text-xs text-purple-400">
                                Actualized {new Date(currentItem.actualized_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            <Link href={`/vision-board/${currentItem.id}/story`}>
                              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                              Stories
                            </Link>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => startEditing(currentItem)}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>

                    {filteredItems.length > 1 && (
                      <div className="flex-shrink-0 px-4 py-3 border-t border-neutral-800 flex items-center gap-3">
                        <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none">
                          {filteredItems.map((thumbItem, index) => {
                            const thumbUrl = (thumbItem.status === 'actualized' && thumbItem.actualized_image_url)
                              ? thumbItem.actualized_image_url
                              : thumbItem.image_url
                            return (
                              <button
                                key={index}
                                onClick={() => setLightboxIndex(index)}
                                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                  index === lightboxIndex
                                    ? 'border-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.3)]'
                                    : 'border-neutral-700 hover:border-neutral-500'
                                }`}
                              >
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                    <Grid3X3 className="w-3 h-3 text-neutral-600" />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <span className="text-xs text-neutral-500 flex-shrink-0">
                          {lightboxIndex + 1} / {filteredItems.length}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* Desktop Detail Modal */}
        {detailModalIndex !== null && (() => {
          const item = filteredItems[detailModalIndex]
          if (!item) return null
          const displayImageUrl = (item.status === 'actualized' && item.actualized_image_url)
            ? item.actualized_image_url
            : item.image_url

          return (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
              onClick={closeDetailModal}
            >
              {/* Close */}
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 z-20 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {filteredItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailModalIndex((detailModalIndex - 1 + filteredItems.length) % filteredItems.length) }}
                    className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailModalIndex((detailModalIndex + 1) % filteredItems.length) }}
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div
                className="relative h-[96vh] flex flex-col bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/50"
                style={{ width: 'calc(100vw - 120px)', maxWidth: '1600px' }}
                onClick={(e) => e.stopPropagation()}
              >
                {editingItemId === item.id && editFormData ? (
                  <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
                    {renderInlineEditForm(item)}
                  </div>
                ) : (
                  <>
                    <div className="relative flex-1 min-h-0 bg-black/30 flex items-center justify-center">
                      {displayImageUrl ? (
                        <img
                          src={displayImageUrl}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center">
                          <Grid3X3 className="w-16 h-16 text-neutral-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 overflow-y-auto max-h-[30vh] px-6 py-5 space-y-4 border-t border-neutral-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-white truncate">{item.name}</h2>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/vision-board/${item.id}/story`}>
                              <BookOpen className="w-4 h-4 mr-1.5" />
                              Stories
                            </Link>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => initEditState(item)}
                          >
                            <Edit3 className="w-4 h-4 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => { closeDetailModal(); handleDeleteItem(item.id) }}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-neutral-300 leading-relaxed">{item.description}</p>
                      )}

                      {item.status === 'actualized' && item.actualization_story && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                          <h3 className="text-sm font-semibold text-purple-400 mb-2">Actualization Story</h3>
                          <p className="text-sm text-neutral-200 whitespace-pre-wrap">{item.actualization_story}</p>
                        </div>
                      )}

                      {item.status === 'actualized' && item.image_url && item.actualized_image_url && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-neutral-500 mb-1.5">Original Vision</p>
                            <img src={item.image_url} alt="Vision" className="w-full h-28 object-cover rounded-lg border border-neutral-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-purple-400 mb-1.5">Evidence</p>
                            <img src={item.actualized_image_url} alt="Evidence" className="w-full h-28 object-cover rounded-lg border border-purple-500/30" />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {item.categories && item.categories.length > 0 && item.categories.map((categoryKey: string) => {
                          const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                          return (
                            <span key={categoryKey} className="text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full">
                              {categoryInfo ? categoryInfo.label : categoryKey}
                            </span>
                          )
                        })}
                        <span className="text-xs text-neutral-500">
                          Created {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {item.actualized_at && (
                          <span className="text-xs text-purple-400">
                            Actualized {new Date(item.actualized_at).toLocaleDateString()}
                          </span>
                        )}
                        {filteredItems.length > 1 && (
                          <span className="text-xs text-neutral-600 ml-auto">
                            {detailModalIndex + 1} of {filteredItems.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        </div>

        {/* Floating Bulk Action Bar */}
        {bulkMode && (
          <div className="fixed bottom-6 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#1A1A1A] border-2 border-[#333] rounded-2xl shadow-2xl shadow-black/60 px-4 sm:px-5 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-sm font-medium text-neutral-300 whitespace-nowrap">
                  {selectedItemIds.size} selected
                </span>

                <div className="w-px h-6 bg-neutral-700" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectedItemIds.size === filteredItems.length ? deselectAll : selectAllFiltered}
                  className="whitespace-nowrap"
                >
                  {selectedItemIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                </Button>

                <div className="w-px h-6 bg-neutral-700" />

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={selectedItemIds.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={bulkDeleteItems}
          title={`Delete ${selectedItemIds.size} Creation${selectedItemIds.size === 1 ? '' : 's'}`}
          message={`Are you sure you want to permanently delete ${selectedItemIds.size} creation${selectedItemIds.size === 1 ? '' : 's'}? All associated images will also be removed. This action cannot be undone.`}
          isLoading={bulkDeleting}
          loadingText={`Deleting ${selectedItemIds.size} item${selectedItemIds.size === 1 ? '' : 's'}...`}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName={itemToDelete?.name || ''}
          itemType="Creation"
          isLoading={deleting}
          loadingText="Deleting..."
        />
      </Stack>
    </Container>
  )
}
