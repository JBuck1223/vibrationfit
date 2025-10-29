'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { PageLayout, Card, Button, Badge, Stack, Icon, DeleteConfirmationDialog, ActionButtons } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, XCircle, Filter, Grid3X3, X, ChevronLeft, ChevronRight, Eye, List, Grid, CheckSquare, Square } from 'lucide-react'
import { useDeleteItem } from '@/hooks/useDeleteItem'

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

// CategoryCard component from design system
const CategoryCard = ({ category, selected = false, onClick }: any) => {
  const IconComponent = category.icon
  return (
    <Card 
      variant={selected ? 'elevated' : 'default'} 
      hover 
      className={`cursor-pointer aspect-square ${selected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''}`}
      onClick={onClick}
    >
      <Stack align="center" gap="xs" className="text-center px-2 justify-center h-full">
        <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#00FFFF'} />
        <h4 className="text-xs font-medium text-neutral-300">{category.label}</h4>
      </Stack>
    </Card>
  )
}

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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all'])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
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

  const filteredItems = items.filter(item => {
    const categoryMatch = selectedCategories.includes('all') || selectedCategories.length === 0 || 
      (item.categories && item.categories.some((cat: string) => selectedCategories.includes(cat)))
    const statusMatch = selectedStatuses.includes('all') || selectedStatuses.length === 0 || selectedStatuses.includes(item.status)
    return categoryMatch && statusMatch
  })


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





  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <div className="bg-green-600 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
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
        <div className="bg-gray-600 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <XCircle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Inactive</span>
        </div>
      )
    }

    return null
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          {/* Centered Title and Subtext */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">🎯 Vision Board</h1>
            <p className="text-secondary-500">Visualize and track your conscious creations</p>
          </div>

          {/* Full-width Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button asChild className="flex-1">
              <Link href="/vision-board/new">
                <Plus className="w-5 h-5 mr-2" />
                Add Creation
              </Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1">
              <Link href="/vision-board/gallery">
                <Eye className="w-5 h-5 mr-2" />
                Gallery
              </Link>
            </Button>
          </div>
        </div>

          {/* Stats - Responsive Grid */}
          <div id="stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <h3 className="text-neutral-400 text-sm mb-2">Total</h3>
              <p className="text-2xl md:text-3xl font-bold text-primary-500">{totalItems}</p>
            </Card>
            
            <Card className="text-center">
              <h3 className="text-neutral-400 text-sm mb-2">Active</h3>
              <p className="text-2xl md:text-3xl font-bold text-primary-500">{activeItems}</p>
            </Card>
            
            <Card className="text-center">
              <h3 className="text-neutral-400 text-sm mb-2">Actualized</h3>
              <p className="text-2xl md:text-3xl font-bold text-warning-500">{actualizedItems}</p>
            </Card>
            
            <Card className="text-center">
              <h3 className="text-neutral-400 text-sm mb-2">Inactive</h3>
              <p className="text-2xl md:text-3xl font-bold text-neutral-500">{inactiveItems}</p>
            </Card>
          </div>

        {/* Filters */}
        <div id="filters" className="mb-8 space-y-6">
          {/* Category Filter */}
          <div>
            <div 
              className={`cursor-pointer rounded-2xl border-2 transition-all hover:-translate-y-1 w-full mb-4 ${
                selectedCategories.includes('all') || selectedCategories.length === 0 
                  ? 'bg-[#1F1F1F] border-[#39FF14] ring-2 ring-[#39FF14]' 
                  : 'bg-[#1F1F1F] border-[#333] hover:border-[#39FF14]'
              }`}
              onClick={() => setSelectedCategories(['all'])}
            >
              <div className="flex items-center justify-center gap-3 px-4 py-2">
                <Icon icon={Filter} size="sm" color={selectedCategories.includes('all') || selectedCategories.length === 0 ? '#39FF14' : '#00FFFF'} className="opacity-80" />
                <h4 className="text-sm font-medium text-neutral-300">All Categories</h4>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
              {VISION_CATEGORIES.filter(category => category.key !== 'forward' && category.key !== 'conclusion').map((category) => (
                <CategoryCard 
                  key={category.key} 
                  category={category} 
                  selected={selectedCategories.includes(category.key)} 
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
                />
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div 
              className={`cursor-pointer rounded-2xl border-2 transition-all hover:-translate-y-1 w-full mb-4 ${
                selectedStatuses.includes('all') || selectedStatuses.length === 0
                  ? 'bg-[#1F1F1F] border-[#39FF14] ring-2 ring-[#39FF14]' 
                  : 'bg-[#1F1F1F] border-[#333] hover:border-[#39FF14]'
              }`}
              onClick={() => toggleStatus('all')}
            >
              <div className="flex items-center justify-center gap-3 px-4 py-2">
                <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                <h4 className="text-sm font-medium text-neutral-300">All Statuses</h4>
              </div>
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
          </div>
        </div>


        {/* View Toggle - Full Width */}
        <div id="view-toggle" className="w-full mb-6">
          <div className="flex gap-2 w-full">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2 flex-1"
            >
              <Grid className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 flex-1"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>

        {/* Vision Board Content */}
        <div id="content">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading your vision board...</p>
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
                    onClick={() => openLightbox(index)}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
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

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
                        <div className="flex flex-col items-center gap-2 w-full max-w-full">
                          {/* Item Info */}
                          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 w-full max-w-full text-center">
                            <h3 className="text-white text-sm font-semibold mb-1 truncate">{item.name}</h3>
                            <div className="text-neutral-300 text-xs">
                              Created {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          
                          {/* Quick Status Controls */}
                          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 space-y-2 w-full max-w-full">
                            <div className="text-white text-xs font-medium mb-1 text-center">Quick Status</div>
                            <div className="flex gap-1 flex-wrap justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateItemStatus(item.id, 'active')
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-all flex items-center justify-center flex-shrink-0 ${
                                  item.status === 'active'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-neutral-700 text-neutral-300 hover:bg-green-600 hover:text-white'
                                }`}
                              >
                                <span className="hidden sm:inline">Active</span>
                                <span className="sm:hidden">A</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateItemStatus(item.id, 'actualized')
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-all flex items-center justify-center flex-shrink-0 ${
                                  item.status === 'actualized'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-neutral-700 text-neutral-300 hover:bg-purple-500 hover:text-white'
                                }`}
                              >
                                <span className="hidden sm:inline">Actualized</span>
                                <span className="sm:hidden">✓</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateItemStatus(item.id, 'inactive')
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-all flex items-center justify-center flex-shrink-0 ${
                                  item.status === 'inactive'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-neutral-700 text-neutral-300 hover:bg-gray-600 hover:text-white'
                                }`}
                              >
                                <span className="hidden sm:inline">Inactive</span>
                                <span className="sm:hidden">×</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* View Item Details Button */}
                          <Button asChild size="sm" variant="secondary" className="text-xs px-3 py-1">
                            <Link href={`/vision-board/${item.id}`} onClick={(e) => e.stopPropagation()}>
                              <Eye className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </Link>
                          </Button>
                        </div>
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
                      <div className="flex-shrink-0 w-full md:w-40 aspect-[4/3] rounded-lg overflow-hidden bg-neutral-800">
                        {item.image_url ? (
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
                      </div>

                      {/* Item Details - Mobile-first layout */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-3">
                          {/* Title with Status Badge */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base md:text-lg font-semibold text-white truncate">{item.name}</h3>
                              {/* Clickable Status Badge - Next to title */}
                              <button
                                onClick={() => cycleItemStatus(item.id)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                title="Click to cycle status: Active → Actualized → Inactive"
                              >
                                {getStatusBadge(item.status)}
                              </button>
                            </div>
                          {item.description && (
                            <p className="text-sm text-neutral-400 line-clamp-2">{item.description}</p>
                          )}
                          
                          {/* Created Date */}
                          <div className="text-xs text-neutral-500 mt-1">
                            Created {new Date(item.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          </div>

                          {/* Categories - Show all, responsive */}
                          {item.categories && item.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.categories.map((category: string) => (
                                <Badge key={category} variant="secondary" className="text-xs flex-shrink-0">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Right side */}
                      <div className="flex-shrink-0 md:flex-shrink-0 w-full md:w-auto">
                        <Button
                          asChild
                          variant="primary"
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          <Link href={`/vision-board/${item.id}`}>
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
            <p className="text-neutral-400 mb-6">Try adjusting your filters or create your first vision item.</p>
            <Button asChild>
              <Link href="/vision-board/new">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Creation
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
                {filteredItems[lightboxIndex]?.image_url ? (
                  <img
                    src={filteredItems[lightboxIndex].image_url}
                    alt={filteredItems[lightboxIndex].name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-96 h-96 bg-neutral-800 rounded-lg flex items-center justify-center">
                    <Grid3X3 className="w-24 h-24 text-neutral-600" />
                  </div>
                )}
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
                  {filteredItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setLightboxIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === lightboxIndex ? 'border-green-500' : 'border-neutral-600'
                      }`}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                          <Grid3X3 className="w-4 h-4 text-neutral-600" />
                        </div>
                      )}
                    </button>
                  ))}
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
    </>
  )
}
