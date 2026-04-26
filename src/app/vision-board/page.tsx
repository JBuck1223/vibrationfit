'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { Card, Button, Badge, CategoryCard, DeleteConfirmationDialog, ActionButtons, Icon, Container, Stack, FullBleed, Spinner, Input, Textarea, FileUpload, ImageLightbox, type ImageLightboxImage } from '@/lib/design-system'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { SavedRecordings } from '@/components/SavedRecordings'
import { useAreaStats } from '@/hooks/useAreaStats'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, XCircle, Filter, Grid3X3, X, ChevronLeft, ChevronRight, Eye, List, Grid, Lightbulb, Download, Edit3, Save, ChevronUp, Trash2, Upload, Sparkles, CheckSquare, Square, ListChecks, Flame, Shield, ChevronDown } from 'lucide-react'
import { useDeleteItem } from '@/hooks/useDeleteItem'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider'
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

function VisionBoardPracticeStatsRow({
  practiceStats,
  statsExpanded,
  setStatsExpanded,
  freezeOpen,
  setFreezeOpen,
  freezeRef,
  activeItems,
  actualizedItems,
  totalItems,
}: {
  practiceStats: ReturnType<typeof useAreaStats>['stats']
  statsExpanded: boolean
  setStatsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  freezeOpen: boolean
  setFreezeOpen: React.Dispatch<React.SetStateAction<boolean>>
  freezeRef: React.RefObject<HTMLDivElement | null>
  activeItems: number
  actualizedItems: number
  totalItems: number
}) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] leading-none">
      <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
        <Flame className={`w-3 h-3 ${(practiceStats?.currentStreak ?? 0) >= 1 ? 'text-orange-400' : 'text-orange-400/40'}`} />
        {practiceStats?.currentStreak ?? 0}
        <span className="text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
        <span className="relative ml-0.5" ref={freezeRef}>
          <button
            type="button"
            onClick={() => setFreezeOpen(prev => !prev)}
            className="inline-flex items-center"
            aria-label="Streak freeze info"
          >
            <Shield className={`w-3 h-3 ${
              practiceStats?.streakFreezeUsedThisWeek
                ? 'text-blue-500/40'
                : practiceStats?.streakFreezeAvailable
                  ? 'text-blue-400'
                  : 'text-blue-400/40'
            }`} />
          </button>
          <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[400] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <p className="text-sm font-semibold text-blue-400 mb-1">
              Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : practiceStats?.streakFreezeAvailable ? 'Available' : 'Not available yet'})</span>
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {practiceStats?.streakFreezeUsedThisWeek
                ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day does not wipe out your progress.'}
            </p>
          </div>
        </span>
      </span>
      <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
        {actualizedItems.toLocaleString()} <span className="text-neutral-500 ml-1">actualized</span>
      </span>
      <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
        {practiceStats?.countLast7 ?? 0}<span className="text-neutral-500 ml-1">/7 week</span>
      </span>
      {statsExpanded && (
        <>
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
            {practiceStats?.countLast30 ?? 0}<span className="text-neutral-500 ml-1">/30 month</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
            {activeItems.toLocaleString()} <span className="text-neutral-500 ml-1">active</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
            {totalItems.toLocaleString()} <span className="text-neutral-500 ml-1">total items</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-white font-medium">
            {(practiceStats?.countAllTime ?? 0).toLocaleString()} <span className="text-neutral-500 ml-1">total days</span>
          </span>
        </>
      )}
      <button
        type="button"
        onClick={() => setStatsExpanded(prev => !prev)}
        className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-neutral-400 hover:text-neutral-300 transition-colors"
        aria-expanded={statsExpanded}
      >
        {statsExpanded ? 'Less' : 'More'}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

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
  const [showEditVisionFileDrop, setShowEditVisionFileDrop] = useState(false)
  const [showEditEvidenceFileDrop, setShowEditEvidenceFileDrop] = useState(false)
  const [editAudioRecordings, setEditAudioRecordings] = useState<unknown[]>([])
  const [editImagePreview, setEditImagePreview] = useState<{
    open: boolean
    images: ImageLightboxImage[]
    index: number
  }>({ open: false, images: [], index: 0 })

  const editVisionFileUrl = useMemo(
    () => (editFile ? URL.createObjectURL(editFile) : null),
    [editFile]
  )
  const editEvidenceFileUrl = useMemo(
    () => (editActualizedFile ? URL.createObjectURL(editActualizedFile) : null),
    [editActualizedFile]
  )
  useEffect(() => {
    return () => { if (editVisionFileUrl) URL.revokeObjectURL(editVisionFileUrl) }
  }, [editVisionFileUrl])
  useEffect(() => {
    return () => { if (editEvidenceFileUrl) URL.revokeObjectURL(editEvidenceFileUrl) }
  }, [editEvidenceFileUrl])

  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) {
        setFreezeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [freezeOpen])

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
      setItems(prevItems => prevItems.filter(i => i.id !== itemToDelete?.id))
      setDetailModalIndex(null)
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
    setEditAudioRecordings(
      Array.isArray(item.audio_recordings) ? [...item.audio_recordings] : []
    )
    setEditFile(null)
    setEditImageSource('upload')
    setEditAiImageUrl(null)
    setEditActualizedFile(null)
    setEditActualizedImageSource('upload')
    setEditActualizedAiImageUrl(null)
    setShowImageEditor(false)
    setShowActualizedImageEditor(false)
    setShowEditVisionFileDrop(false)
    setShowEditEvidenceFileDrop(false)
  }

  const startEditing = (item: any) => {
    setDetailModalIndex(null)
    const idx = filteredItems.findIndex(i => i.id === item.id)
    if (idx !== -1) {
      setExpandedItemId(null)
      setLightboxOpen(true)
      setLightboxIndex(item.originalIndex !== undefined ? item.originalIndex : idx)
    }
    initEditState(item)
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    setEditFormData(null)
    setEditAudioRecordings([])
    setEditFile(null)
    setEditAiImageUrl(null)
    setEditActualizedFile(null)
    setEditActualizedAiImageUrl(null)
    setShowImageEditor(false)
    setShowActualizedImageEditor(false)
    setShowEditVisionFileDrop(false)
    setShowEditEvidenceFileDrop(false)
    setEditImagePreview({ open: false, images: [], index: 0 })
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
            : currentItem?.actualized_at,
          audio_recordings: editAudioRecordings
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
              audio_recordings: editAudioRecordings,
              updated_at: new Date().toISOString()
            }
          : i
      ))

      setEditingItemId(null)
      setEditFormData(null)
      setEditAudioRecordings([])
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

  const openEditImagePreview = (imageList: { url: string; caption?: string }[], startIndex = 0) => {
    if (!imageList.length) return
    setEditImagePreview({
      open: true,
      images: imageList.map((img) => ({
        url: img.url,
        alt: img.caption,
        caption: img.caption
      })),
      index: startIndex
    })
  }

  const closeEditImagePreview = () => {
    setEditImagePreview({ open: false, images: [], index: 0 })
  }

  const renderInlineEditForm = (item: any, options?: { layout?: 'default' | 'newStyle' }) => {
    if (!editFormData) return null
    const isNewStyle = options?.layout === 'newStyle'

    if (isNewStyle) {
      return (
        <Card
          variant="outlined"
          className="!p-4 !pt-5 sm:!p-5 sm:!pt-6 md:!p-6 lg:!p-8 !bg-[#101010] !border-[#1F1F1F] !rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Stack gap="lg">
            <section className="space-y-3 text-center">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#2A2A2A]" />
                <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Creation name</p>
                <div className="h-px flex-1 bg-[#2A2A2A]" />
              </div>
              <Input
                type="text"
                placeholder="What do you choose to create?"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="!bg-[#1A1A1A] !border-[#282828] !text-base !font-medium !text-center"
              />
            </section>

            <section className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Vision image</p>
              <div className="flex flex-row gap-2 items-center justify-center">
                <Button
                  type="button"
                  variant={editImageSource === 'upload' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setEditImageSource('upload')
                    setEditAiImageUrl(null)
                    setShowEditVisionFileDrop(true)
                  }}
                  className="flex-1 max-w-[180px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={editImageSource === 'ai' ? 'accent' : 'outline-purple'}
                  size="sm"
                  onClick={() => {
                    setEditImageSource('ai')
                    setEditFile(null)
                    setShowEditVisionFileDrop(false)
                  }}
                  className="flex-1 max-w-[180px]"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  VIVA Generate
                </Button>
              </div>
              {item.image_url && !editFile && !editAiImageUrl && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openEditImagePreview([{ url: item.image_url, caption: 'Vision image' }])}
                    className="w-full p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-left hover:border-primary-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <img src={item.image_url} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg" />
                      <p className="text-xs text-neutral-400">Current vision image — tap to preview full screen</p>
                    </div>
                  </button>
                </div>
              )}
              {editImageSource === 'upload' && (showEditVisionFileDrop || editFile) && (
                <FileUpload
                  dragDrop
                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                  multiple={false}
                  maxFiles={1}
                  maxSize={10}
                  value={editFile ? [editFile] : []}
                  onChange={(files) => setEditFile(files[0] || null)}
                  onUpload={(files) => setEditFile(files[0] || null)}
                  dragDropText="Click to upload or drag and drop"
                  dragDropSubtext="PNG, JPG, WEBP, HEIC (max 10MB)"
                  previewSize="lg"
                />
              )}
              {editImageSource === 'ai' && (
                <AIImageGenerator
                  type="vision_board"
                  onImageGenerated={(url) => setEditAiImageUrl(url)}
                  title={editFormData.name}
                  description={editFormData.description}
                  visionText={
                    editFormData.name && editFormData.description
                      ? `${editFormData.name}. ${editFormData.description}`
                      : editFormData.description || editFormData.name || ''
                  }
                />
              )}
              {editAiImageUrl && (
                <button
                  type="button"
                  onClick={() =>
                    openEditImagePreview([{ url: editAiImageUrl, caption: 'New vision (VIVA, unsaved)' }])
                  }
                  className="w-full p-3 rounded-xl border border-primary-500/30 bg-neutral-900/50 hover:border-primary-500/50 transition-colors"
                >
                  <img src={editAiImageUrl} alt="" className="w-full max-h-48 object-contain rounded-lg mx-auto" />
                  <p className="text-xs text-center text-primary-400 mt-2">Tap to preview full screen (save to apply)</p>
                </button>
              )}
              {editVisionFileUrl && (
                <button
                  type="button"
                  onClick={() =>
                    openEditImagePreview([{ url: editVisionFileUrl, caption: 'New vision (file, unsaved)' }])
                  }
                  className="w-full p-3 rounded-xl border border-primary-500/30 bg-neutral-900/50 hover:border-primary-500/50 transition-colors"
                >
                  <img
                    src={editVisionFileUrl}
                    alt=""
                    className="w-full max-h-48 object-contain rounded-lg mx-auto"
                  />
                  <p className="text-xs text-center text-primary-400 mt-2">Tap to preview full screen (save to apply)</p>
                </button>
              )}
            </section>

            <section className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Status</p>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        status: status.value,
                        actualization_story:
                          status.value === 'actualized' ? editFormData.actualization_story : ''
                      })
                    }
                    className={`px-2 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 flex-1 ${
                      editFormData.status === status.value
                        ? status.value === 'active'
                          ? 'bg-green-600 text-white shadow-lg'
                          : status.value === 'actualized'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-600 text-white shadow-lg'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {status.value === 'active' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    {status.value === 'actualized' && <CheckCircle className="w-3 h-3 text-white" />}
                    {status.value === 'inactive' && <XCircle className="w-3 h-3 text-white" />}
                    {status.label}
                  </button>
                ))}
              </div>
            </section>

            <FullBleed>
              <section className="space-y-2">
                <p className="hidden md:block text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                  Tag life categories
                </p>
                <div className="flex items-center justify-between gap-3 md:hidden px-1">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-500">Tag life categories</p>
                  <span className="text-[10px] text-neutral-600">Scroll to see all</span>
                </div>
                <div className="flex items-center justify-center gap-2 pb-1 px-4 md:px-0 max-md:flex-nowrap max-md:overflow-x-auto max-md:justify-start max-md:scrollbar-hide md:flex-wrap">
                  {VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion').map((category) => {
                    const isSelected = editFormData.categories.includes(category.key)
                    const CatIcon = category.icon
                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => handleEditCategoryToggle(category.key)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        {category.label}
                      </button>
                    )
                  })}
                </div>
              </section>
            </FullBleed>

            <section className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Description</p>
              <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
                <RecordingTextarea
                  label=""
                  value={editFormData.description}
                  onChange={(value) => setEditFormData({ ...editFormData, description: value })}
                  placeholder="Describe this creation. Tap the mic to record."
                  rows={4}
                  storageFolder="visionBoard"
                  recordingPurpose="quick"
                  category="vision-board"
                  onAudioSaved={(audioUrl, transcript) => {
                    setEditAudioRecordings((prev) => [
                      ...prev,
                      {
                        url: audioUrl,
                        transcript,
                        type: 'audio' as const,
                        category: 'vision-board',
                        created_at: new Date().toISOString()
                      }
                    ])
                  }}
                />
              </div>
            </section>

            {editFormData.status === 'actualized' && (
              <>
                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Evidence image</p>
                  <div className="flex flex-row gap-2 items-center justify-center">
                    <Button
                      type="button"
                      variant={editActualizedImageSource === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setEditActualizedImageSource('upload')
                        setEditActualizedAiImageUrl(null)
                        setShowEditEvidenceFileDrop(true)
                      }}
                      className="flex-1 max-w-[180px]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant={editActualizedImageSource === 'ai' ? 'accent' : 'outline-purple'}
                      size="sm"
                      onClick={() => {
                        setEditActualizedImageSource('ai')
                        setEditActualizedFile(null)
                        setShowEditEvidenceFileDrop(false)
                      }}
                      className="flex-1 max-w-[180px]"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      VIVA Generate
                    </Button>
                  </div>
                  {item.actualized_image_url && !editActualizedFile && !editActualizedAiImageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        openEditImagePreview([{ url: item.actualized_image_url, caption: 'Current evidence' }])
                      }
                      className="w-full p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-left hover:border-purple-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <img src={item.actualized_image_url} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg" />
                        <p className="text-xs text-neutral-400">Current evidence image — tap to preview full screen</p>
                      </div>
                    </button>
                  )}
                  {editActualizedImageSource === 'upload' && (showEditEvidenceFileDrop || editActualizedFile) && (
                    <FileUpload
                      dragDrop
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      value={editActualizedFile ? [editActualizedFile] : []}
                      onChange={(files) => setEditActualizedFile(files[0] || null)}
                      onUpload={(files) => setEditActualizedFile(files[0] || null)}
                      dragDropText="Click to upload or drag and drop"
                      dragDropSubtext="PNG, JPG, WEBP, HEIC (max 10MB)"
                      previewSize="lg"
                    />
                  )}
                  {editActualizedImageSource === 'ai' && (
                    <AIImageGenerator
                      type="vision_board"
                      onImageGenerated={(url) => setEditActualizedAiImageUrl(url)}
                      title={`Actualized: ${editFormData.name}`}
                      description={`Evidence: ${editFormData.description}`}
                      visionText={`Actualized: ${editFormData.name}. ${editFormData.description}`}
                    />
                  )}
                  {editActualizedAiImageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        openEditImagePreview([{ url: editActualizedAiImageUrl, caption: 'New evidence (VIVA, unsaved)' }])
                      }
                      className="w-full p-3 rounded-xl border border-purple-500/30 bg-neutral-900/50"
                    >
                      <img
                        src={editActualizedAiImageUrl}
                        alt=""
                        className="w-full max-h-48 object-contain rounded-lg mx-auto"
                      />
                      <p className="text-xs text-center text-purple-300 mt-2">Tap to preview (save to apply)</p>
                    </button>
                  )}
                  {editEvidenceFileUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        openEditImagePreview([{ url: editEvidenceFileUrl, caption: 'New evidence (file, unsaved)' }])
                      }
                      className="w-full p-3 rounded-xl border border-purple-500/30 bg-neutral-900/50"
                    >
                      <img
                        src={editEvidenceFileUrl}
                        alt=""
                        className="w-full max-h-48 object-contain rounded-lg mx-auto"
                      />
                      <p className="text-xs text-center text-purple-300 mt-2">Tap to preview (save to apply)</p>
                    </button>
                  )}
                </section>
                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Actualization story</p>
                  <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
                    <RecordingTextarea
                      label=""
                      value={editFormData.actualization_story}
                      onChange={(value) => setEditFormData({ ...editFormData, actualization_story: value })}
                      placeholder="Tell the story of how this was actualized. Tap the mic to record."
                      rows={5}
                      storageFolder="visionBoard"
                      recordingPurpose="quick"
                      category="vision-board-actualization"
                      onAudioSaved={(audioUrl, transcript) => {
                        setEditAudioRecordings((prev) => [
                          ...prev,
                          {
                            url: audioUrl,
                            transcript,
                            type: 'audio' as const,
                            category: 'vision-board-actualization',
                            created_at: new Date().toISOString()
                          }
                        ])
                      }}
                    />
                  </div>
                </section>
              </>
            )}

            {editAudioRecordings.length > 0 && (
              <SavedRecordings
                recordings={editAudioRecordings as any}
                onDelete={(index) => setEditAudioRecordings((prev) => prev.filter((_, i) => i !== index))}
              />
            )}

            <div className="flex flex-row gap-2 sm:gap-3 sm:justify-end pt-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={cancelEditing}
                className="flex-1 sm:flex-none sm:min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleInlineSave(item.id)}
                loading={saving}
                disabled={saving}
                className="flex-1 sm:flex-none sm:min-w-[100px]"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </Stack>
        </Card>
      )
    }

    return (
      <div className="space-y-4 pt-3">
        <div className="space-y-2 pb-1 border-b border-neutral-700/50">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary-500 flex-shrink-0" aria-hidden />
            Edit creation
          </h3>
          <p className="text-xs text-neutral-500">
            Update the fields below, then save. For audio notes and a larger workspace, use the full page editor.
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-center text-xs"
          >
            <Link href={`/vision-board/${item.id}?edit=1`}>
              Open full page editor
            </Link>
          </Button>
        </div>

        <Input
          label="Creation name"
          type="text"
          value={editFormData.name}
          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          placeholder="What do you want to create?"
          className="!text-sm py-2.5"
        />

        <Textarea
          label="Description"
          value={editFormData.description}
          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          rows={3}
          placeholder="Describe this creation..."
          className="!text-sm resize-y min-h-[5rem]"
        />

        {/* Vision Image */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-neutral-400">Vision Image</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowImageEditor((prev) => {
                  const next = !prev
                  if (next) setShowEditVisionFileDrop(!!editFile)
                  return next
                })
              }}
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
                  onClick={() => {
                    setEditImageSource('upload')
                    setEditAiImageUrl(null)
                    setShowEditVisionFileDrop(true)
                  }}
                  className="flex-1"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setEditImageSource('ai')
                    setEditFile(null)
                    setShowEditVisionFileDrop(false)
                  }}
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
                (showEditVisionFileDrop || editFile) ? (
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
                ) : null
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
            <Textarea
              label="Actualization story"
              value={editFormData.actualization_story}
              onChange={(e) => setEditFormData({ ...editFormData, actualization_story: e.target.value })}
              rows={4}
              placeholder="Tell the story of how this vision was actualized..."
              className="!text-sm resize-y min-h-[6rem]"
            />

            {/* Actualized Evidence Image */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-neutral-400">Evidence Image</label>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    setShowActualizedImageEditor((prev) => {
                      const next = !prev
                      if (next) setShowEditEvidenceFileDrop(!!editActualizedFile)
                      return next
                    })
                  }}
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
                      onClick={() => {
                        setEditActualizedImageSource('upload')
                        setEditActualizedAiImageUrl(null)
                        setShowEditEvidenceFileDrop(true)
                      }}
                      className="flex-1"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditActualizedImageSource('ai')
                        setEditActualizedFile(null)
                        setShowEditEvidenceFileDrop(false)
                      }}
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
                    (showEditEvidenceFileDrop || editActualizedFile) ? (
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
                    ) : null
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-0.5">
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
            const CategoryIcon = categoryInfo?.icon
            return (
              <span
                key={categoryKey}
                className="inline-flex items-center gap-1.5 text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full"
              >
                {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />}
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

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="danger"
          size="sm"
          className="text-xs w-full justify-center"
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteItem(item.id)
          }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="text-xs w-full justify-center"
          onClick={(e) => {
            e.stopPropagation()
            startEditing(item)
          }}
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
          Edit
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
    <Container size="xl" className="pt-1 pb-6 overflow-x-hidden">
      <Stack gap="lg">
        <VisionBoardPracticeStatsRow
          practiceStats={practiceStats}
          statsExpanded={statsExpanded}
          setStatsExpanded={setStatsExpanded}
          freezeOpen={freezeOpen}
          setFreezeOpen={setFreezeOpen}
          freezeRef={freezeRef}
          activeItems={activeItems}
          actualizedItems={actualizedItems}
          totalItems={totalItems}
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
              aria-label={bulkMode ? 'Cancel selection mode' : 'Select items'}
            >
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">{bulkMode ? 'Cancel' : 'Select'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              aria-label="Filter items"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
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
              className="flex items-center gap-2"
              aria-label="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
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
        <div id="content" className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              /* Grid View - Masonry with Clean/Detail modes */
              <div className="flex gap-4 md:gap-6 w-full">
                {columnizedItems.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex-1 min-w-0 flex flex-col gap-4 md:gap-6">
                    {column.map((item) => {
                      const isExpanded = expandedItemId === item.id
                      const isEditing = editingItemId === item.id
                      const isOpen =
                        (isExpanded || isEditing) && !(lightboxOpen && editingItemId === item.id)

                      if (boardMode === 'clean') {
                        const isSelected = selectedItemIds.has(item.id)
                        return (
                          <div
                            key={item.id}
                            className={`rounded-2xl overflow-hidden bg-neutral-800 border-2 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 relative max-w-full ${
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
                            {(item.status === 'actualized' && item.actualized_image_url && item.image_url) ? (
                              <BeforeAfterSlider
                                beforeSrc={item.image_url}
                                afterSrc={item.actualized_image_url}
                              />
                            ) : (item.status === 'actualized' && item.actualized_image_url) ? (
                              <img src={item.actualized_image_url} alt={item.name} className="w-full max-w-full h-auto object-cover block" loading="lazy" />
                            ) : item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full max-w-full h-auto object-cover block" loading="lazy" />
                            ) : (
                              <div className="w-full h-48 bg-neutral-900 flex items-center justify-center">
                                <Grid3X3 className="w-12 h-12 text-neutral-600" />
                              </div>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div key={item.id} className={`rounded-2xl overflow-hidden bg-neutral-800 border-2 shadow-lg transition-all duration-300 max-w-full ${
                          bulkMode && selectedItemIds.has(item.id) ? 'border-[#39FF14] ring-2 ring-[#39FF14]/30' : 'border-[#333]'
                        }`}>
                          {/* Image - tap for lightbox or select */}
                          <div
                            className="relative cursor-pointer overflow-hidden"
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
                            {(item.status === 'actualized' && item.actualized_image_url && item.image_url) ? (
                              <BeforeAfterSlider
                                beforeSrc={item.image_url}
                                afterSrc={item.actualized_image_url}
                              />
                            ) : (item.status === 'actualized' && item.actualized_image_url) ? (
                              <img src={item.actualized_image_url} alt={item.name} className="w-full max-w-full h-auto object-cover block" loading="lazy" />
                            ) : item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full max-w-full h-auto object-cover block" loading="lazy" />
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
                            className={`px-3 py-2.5 flex items-center gap-2 min-w-0 ${bulkMode ? 'cursor-pointer' : ''}`}
                            onClick={() => bulkMode && toggleItemSelection(item.id)}
                          >
                            <span className="flex-1 text-sm font-semibold text-white truncate">{item.name}</span>
                            {!bulkMode && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleExpand(item.id)
                                  }}
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
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isEditing) cancelEditing()
                                    else startEditing(item)
                                  }}
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
                                  {renderInlineEditForm(item, { layout: 'newStyle' })}
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
                  const isOpen =
                    (isExpanded || isEditing) && !(lightboxOpen && editingItemId === item.id)

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
                        <div className={`flex-1 min-w-0 overflow-hidden ${bulkMode ? 'cursor-pointer' : ''}`} onClick={() => bulkMode && toggleItemSelection(item.id)}>
                          {/* Title row with action icons */}
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="flex-1 min-w-0 text-xl font-semibold text-white break-words">{item.name}</h3>
                            {!bulkMode && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleExpand(item.id)
                                  }}
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
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isEditing) cancelEditing()
                                    else startEditing(item)
                                  }}
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
                            <p className="text-neutral-300 mb-3 break-words">{item.description}</p>
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
                                    const CategoryIcon = categoryInfo?.icon
                                    return (
                                      <span
                                        key={categoryKey}
                                        className="inline-flex items-center gap-1.5 text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                                      >
                                        {CategoryIcon && (
                                          <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                        )}
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
                              {renderInlineEditForm(item, { layout: 'newStyle' })}
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

                {(currentItem.status === 'actualized' && currentItem.image_url && currentItem.actualized_image_url) ? (
                  <div className="max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <BeforeAfterSlider
                      beforeSrc={currentItem.image_url}
                      afterSrc={currentItem.actualized_image_url}
                      fill
                      className="max-w-[95vw] max-h-[95vh]"
                    />
                  </div>
                ) : imageUrl ? (
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
              className="fixed inset-0 bg-black/95 z-50 flex items-start md:items-center justify-center px-3 pt-14 pb-6 md:p-4 overflow-y-auto"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="fixed top-3 right-3 z-30 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative flex items-center gap-2 md:gap-4 w-full max-w-[700px] md:max-w-none justify-center">
                {filteredItems.length > 1 && editingItemId !== currentItem.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage() }}
                    className="hidden md:flex flex-shrink-0 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

              {editingItemId === currentItem.id && editFormData ? (
                <div
                  className="relative w-full max-w-2xl md:max-w-3xl max-h-[96vh] overflow-y-auto px-3 pb-2 sm:px-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderInlineEditForm(currentItem, { layout: 'newStyle' })}
                </div>
              ) : (
                <div
                  className="relative w-full md:w-auto md:min-w-[500px] md:max-w-[700px] max-h-full md:max-h-[96vh] bg-neutral-900 rounded-2xl overflow-y-auto shadow-2xl border border-neutral-700/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full">
                    {(currentItem.status === 'actualized' && currentItem.image_url && currentItem.actualized_image_url) ? (
                      <BeforeAfterSlider
                        beforeSrc={currentItem.image_url}
                        afterSrc={currentItem.actualized_image_url}
                      />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt={currentItem.name} className="w-full h-auto object-cover block" />
                    ) : (
                      <div className="w-full h-64 bg-neutral-800 flex items-center justify-center">
                        <Grid3X3 className="w-16 h-16 text-neutral-600" />
                      </div>
                    )}
                    {filteredItems.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage() }}
                          className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 rounded-full text-white/70"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage() }}
                          className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 rounded-full text-white/70"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Details - swipe here on mobile to navigate */}
                  <div
                    className="px-4 py-4 space-y-3"
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                    onTouchEnd={(e) => {
                      if (touchStartX.current === null || filteredItems.length <= 1) return
                      const delta = e.changedTouches[0].clientX - touchStartX.current
                      if (Math.abs(delta) > 50) { delta < 0 ? nextImage() : prevImage() }
                      touchStartX.current = null
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{currentItem.name}</h3>
                      {getStatusBadge(currentItem.status)}
                    </div>

                    {currentItem.description && (
                      <p className="text-sm text-neutral-300 leading-relaxed">{currentItem.description}</p>
                    )}

                    {currentItem.status === 'actualized' && currentItem.actualization_story && (
                      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <h4 className="text-xs font-semibold text-purple-400 mb-2">Actualization Story</h4>
                        <p className="text-sm text-neutral-200 whitespace-pre-wrap">{currentItem.actualization_story}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {currentItem.categories && currentItem.categories.length > 0 && currentItem.categories.map((categoryKey: string) => {
                        const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                        const CategoryIcon = categoryInfo?.icon
                        return (
                          <span
                            key={categoryKey}
                            className="inline-flex items-center gap-1.5 text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full"
                          >
                            {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />}
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

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs w-full justify-center"
                        onClick={(e) => {
                          e.stopPropagation()
                          initiateDelete(currentItem)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs w-full justify-center"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(currentItem)
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  {filteredItems.length > 1 && (
                    <div className="px-4 py-3 border-t border-neutral-800 flex items-center gap-3">
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
                </div>
              )}

                {filteredItems.length > 1 && editingItemId !== currentItem.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage() }}
                    className="hidden md:flex flex-shrink-0 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
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
              className="fixed inset-0 bg-black/90 z-50 flex items-start md:items-center justify-center px-3 pt-14 pb-6 md:p-4 overflow-y-auto"
              onClick={closeDetailModal}
            >
              <button
                onClick={closeDetailModal}
                className="fixed top-3 right-3 z-30 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative flex items-center gap-2 md:gap-4 w-full max-w-[700px] md:max-w-none justify-center">
                {filteredItems.length > 1 && editingItemId !== item.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailModalIndex((detailModalIndex - 1 + filteredItems.length) % filteredItems.length) }}
                    className="hidden md:flex flex-shrink-0 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

              <div
                className="relative w-full md:w-auto md:min-w-[500px] md:max-w-[700px] max-h-full md:max-h-[96vh] bg-neutral-900 rounded-2xl overflow-y-auto shadow-2xl border border-neutral-700/50"
                onClick={(e) => e.stopPropagation()}
              >
                {editingItemId === item.id && editFormData ? (
                  <div className="px-6 py-5">
                    {renderInlineEditForm(item, { layout: 'newStyle' })}
                  </div>
                ) : (
                  <>
                    <div className="relative w-full">
                      {(item.status === 'actualized' && item.image_url && item.actualized_image_url) ? (
                        <BeforeAfterSlider
                          beforeSrc={item.image_url}
                          afterSrc={item.actualized_image_url}
                        />
                      ) : displayImageUrl ? (
                        <img src={displayImageUrl} alt={item.name} className="w-full h-auto object-cover block" />
                      ) : (
                        <div className="w-full h-48 bg-neutral-800 flex items-center justify-center">
                          <Grid3X3 className="w-16 h-16 text-neutral-600" />
                        </div>
                      )}
                      {filteredItems.length > 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailModalIndex((detailModalIndex - 1 + filteredItems.length) % filteredItems.length) }}
                            className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 rounded-full text-white/70"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailModalIndex((detailModalIndex + 1) % filteredItems.length) }}
                            className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 rounded-full text-white/70"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Details - swipe here on mobile to navigate */}
                    <div
                      className="px-4 py-4 space-y-3"
                      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                      onTouchEnd={(e) => {
                        if (touchStartX.current === null || filteredItems.length <= 1) return
                        const delta = e.changedTouches[0].clientX - touchStartX.current
                        if (Math.abs(delta) > 50) {
                          delta < 0
                            ? setDetailModalIndex((detailModalIndex + 1) % filteredItems.length)
                            : setDetailModalIndex((detailModalIndex - 1 + filteredItems.length) % filteredItems.length)
                        }
                        touchStartX.current = null
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg md:text-xl font-bold text-white">{item.name}</h2>
                        {getStatusBadge(item.status)}
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

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                        {item.categories && item.categories.length > 0 && item.categories.map((categoryKey: string) => {
                          const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                          const CategoryIcon = categoryInfo?.icon
                          return (
                            <span
                              key={categoryKey}
                              className="inline-flex items-center gap-1.5 text-xs bg-primary-500/20 text-primary-500 px-2.5 py-1 rounded-full"
                            >
                              {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />}
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

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-full justify-center"
                          onClick={(e) => {
                            e.stopPropagation()
                            initiateDelete(item)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Delete
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center"
                          onClick={(e) => {
                            e.stopPropagation()
                            initEditState(item)
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

                {filteredItems.length > 1 && editingItemId !== item.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailModalIndex((detailModalIndex + 1) % filteredItems.length) }}
                    className="hidden md:flex flex-shrink-0 p-2.5 bg-neutral-800/80 backdrop-blur-sm rounded-full text-white hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
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

        <ImageLightbox
          images={editImagePreview.images}
          currentIndex={editImagePreview.index}
          isOpen={editImagePreview.open}
          onClose={closeEditImagePreview}
          onNavigate={(i) => setEditImagePreview((p) => ({ ...p, index: i }))}
          showCopyButton={false}
          showThumbnails={editImagePreview.images.length > 1}
        />
      </Stack>
    </Container>
  )
}
