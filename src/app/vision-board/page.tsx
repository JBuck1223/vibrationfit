'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { Card, Button, Badge, CategoryCard, DeleteConfirmationDialog, ActionButtons, Icon, TrackingMilestoneCard, PageHero, Container, Stack, Spinner } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, XCircle, Filter, Grid3X3, X, ChevronLeft, ChevronRight, Eye, List, Grid, CheckSquare, Square, Lightbulb } from 'lucide-react'
import { useDeleteItem } from '@/hooks/useDeleteItem'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'primary' },
  { value: 'actualized', label: 'Actualized', color: 'warning' },
  { value: 'inactive', label: 'Inactive', color: 'neutral' },
]

export default function VisionBoardPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active', 'actualized'])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
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
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => router.push('/vision-board/ideas')}
              variant="primary"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>Get VIVA Ideas</span>
            </Button>
            <Button
              onClick={() => router.push('/vision-board/new')}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Creation</span>
            </Button>
          </div>
        </PageHero>

        {/* Stats - Responsive Grid */}
        <div id="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <TrackingMilestoneCard
              label="Total"
              value={totalItems}
              theme="primary"
            />
            <TrackingMilestoneCard
              label="Active"
              value={activeItems}
              theme="secondary"
            />
            <TrackingMilestoneCard
              label="Actualized"
              value={actualizedItems}
              theme="accent"
            />
            <TrackingMilestoneCard
              label="Inactive"
              value={inactiveItems}
              theme="neutral"
            />
          </div>

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
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
          <div className="flex-1 flex justify-end">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#39FF14] text-black shadow-lg'
                    : 'bg-[#1F1F1F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
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
              /* Grid View */
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {filteredItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="group cursor-pointer break-inside-avoid mb-6"
                    onClick={() => router.push(`/vision-board/${item.id}`)}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300">
                      {(item.status === 'actualized' && item.actualized_image_url) ? (
                        <img
                          src={item.actualized_image_url}
                          alt={item.name}
                          className="w-full h-auto object-cover transition-transform duration-300 md:group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-auto object-cover transition-transform duration-300 md:group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-64 bg-neutral-800 rounded-lg flex items-center justify-center">
                          <Grid3X3 className="w-12 h-12 text-neutral-600" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Actualized Indicator */}
                      {item.status === 'actualized' && (
                        <div className="absolute top-3 left-3">
                          <div className="bg-purple-500 text-white p-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay - Desktop Only, Just Button */}
                      <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
                        <Button size="sm" variant="secondary" className="text-xs px-4 py-2">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View - Mobile-First Design */
              <div className="space-y-3 md:space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="hover:border-primary-500 transition-all duration-200">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">

                      {/* Image - Consistent 4:3 aspect ratio */}
                      <div className="relative flex-shrink-0 w-full md:w-40 aspect-[4/3] rounded-lg overflow-hidden bg-neutral-800">
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
                        
                        {/* Status Badge - On photo like grid view - Smaller padding for list view due to smaller images */}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cycleItemStatus(item.id)
                            }}
                            className="cursor-pointer"
                            title="Click to cycle status: Active → Actualized → Inactive"
                          >
                            {getStatusBadge(item.status, true)}
                          </button>
                        </div>
                      </div>

                      {/* Item Details - Mobile-first layout */}
                      <div className="flex-1 min-w-0">
                        <div className="space-y-4">
                          {/* Title and Description */}
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">{item.name}</h3>
                            {item.description && (
                              <p className="text-neutral-300">{item.description}</p>
                            )}
                          </div>

                          {/* Created Date and Categories */}
                          <div className="flex flex-wrap items-center gap-4">
                            {/* Created Date */}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-white">Created:</span>
                              <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* Categories */}
                            {item.categories && item.categories.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-medium text-white">Categories:</h3>
                                {item.categories.map((categoryKey: string) => {
                                  const categoryInfo = VISION_CATEGORIES.find(c => c.key === categoryKey)
                                  return (
                                    <span
                                      key={categoryKey}
                                      className="text-sm bg-primary-500/20 text-primary-500 px-3 py-1 rounded-full"
                                    >
                                      {categoryInfo ? categoryInfo.label : categoryKey}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Right side */}
                      <div className="flex-shrink-0 md:flex-shrink-0 w-full md:w-auto flex items-center">
                        <Button
                          asChild
                          variant="primary"
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          <Link href={`/vision-board/${item.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
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


        {/* Lightbox */}
        {lightboxOpen && filteredItems.length > 0 && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons */}
              {filteredItems.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Content */}
              <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center">
                {(() => {
                  const currentItem = filteredItems[lightboxIndex]
                  const imageUrl = (currentItem?.status === 'actualized' && currentItem?.actualized_image_url) 
                    ? currentItem.actualized_image_url 
                    : currentItem?.image_url
                  
                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={currentItem.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-96 h-96 bg-neutral-800 rounded-lg flex items-center justify-center">
                      <Grid3X3 className="w-24 h-24 text-neutral-600" />
                    </div>
                  )
                })()}
              </div>

              {/* Image Counter */}
              {filteredItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {lightboxIndex + 1} of {filteredItems.length}
                </div>
              )}

              {/* Thumbnail Strip */}
              {filteredItems.length > 1 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                  {filteredItems.map((item, index) => {
                    const thumbnailUrl = (item.status === 'actualized' && item.actualized_image_url) 
                      ? item.actualized_image_url 
                      : item.image_url
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setLightboxIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === lightboxIndex ? 'border-green-500' : 'border-neutral-600'
                        }`}
                      >
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                            <Grid3X3 className="w-4 h-4 text-neutral-600" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        </div>

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
