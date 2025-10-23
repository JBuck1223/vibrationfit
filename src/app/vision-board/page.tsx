'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageLayout, Card, Button, Badge, Stack, Icon } from '@/lib/design-system'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, XCircle, Filter, Grid3X3, Trash2, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { VisionBoardDeleteButton } from '@/components/VisionBoardDeleteButton'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

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
        <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#00FFFF'} className="opacity-80" />
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [masonryColumns, setMasonryColumns] = useState(4)
  const [masonryHeights, setMasonryHeights] = useState<number[]>([])
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    fetchItems()
  }, [])

  // Handle responsive masonry columns
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width < 768) {
        setMasonryColumns(1)
      } else if (width < 1024) {
        setMasonryColumns(2)
      } else if (width < 1280) {
        setMasonryColumns(3)
      } else {
        setMasonryColumns(4)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
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
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus
    return categoryMatch && statusMatch
  })

  // Calculate masonry positions for horizontal flow
  const calculateMasonryPositions = () => {
    if (filteredItems.length === 0) return []
    
    const positions: { top: number; left: number; width: number }[] = []
    const columnHeights = new Array(masonryColumns).fill(0)
    const gap = 24 // 1.5rem in pixels
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 48 : 1200 // Account for padding
    const itemWidth = (containerWidth - (gap * (masonryColumns - 1))) / masonryColumns

    filteredItems.forEach((item, index) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Calculate position
      const left = shortestColumnIndex * (itemWidth + gap)
      const top = columnHeights[shortestColumnIndex]
      
      positions.push({
        top,
        left,
        width: itemWidth
      })
      
      // Estimate height based on typical image aspect ratios
      const estimatedHeight = 250 // More realistic height estimate
      columnHeights[shortestColumnIndex] += estimatedHeight + gap
    })

    return positions
  }

  const masonryPositions = calculateMasonryPositions()

  // Update container height when positions change
  useEffect(() => {
    if (masonryPositions.length > 0) {
      const maxHeight = Math.max(...masonryPositions.map(p => p.top + 300)) + 300 // Extra padding for footer
      setContainerHeight(maxHeight)
    }
  }, [masonryPositions])

  const totalItems = items?.length || 0
  const actualizedItems = items?.filter(item => item.status === 'actualized').length || 0
  const activeItems = items?.filter(item => item.status === 'active').length || 0
  const inactiveItems = items?.filter(item => item.status === 'inactive').length || 0

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

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge variant="primary" className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Active</span>
        </Badge>
      )
    }

    if (status === 'actualized') {
      return (
        <Badge variant="secondary" className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Actualized</span>
        </Badge>
      )
    }

    if (status === 'inactive') {
      return (
        <Badge variant="neutral" className="flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          <span>Inactive</span>
        </Badge>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        <div className="mb-8 space-y-6">
          {/* Categories Filter */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Categories
            </h3>
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
            <div className="grid grid-cols-4 md:grid-cols-12 gap-3 mt-4">
              {VISION_CATEGORIES.map((category) => (
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
            <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedStatus === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                All Status
              </button>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedStatus === status.value
                      ? 'bg-primary-500 text-white shadow-lg'
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

        {/* Vision Board Masonry Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-neutral-400">Loading your vision board...</div>
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div 
            className="masonry-container relative pb-16"
            style={{
              minHeight: containerHeight > 0 ? containerHeight : 'auto'
            }}
          >
            {filteredItems.map((item, index) => {
              const position = masonryPositions[index]
              if (!position) return null
              
              return (
                <div 
                  key={item.id} 
                  className="group absolute cursor-pointer"
                  onClick={() => openLightbox(index)}
                  style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`
                  }}
                >
                  <div className="relative overflow-hidden rounded-lg bg-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                        onLoad={(e) => {
                          // Update height after image loads for better positioning
                          const img = e.target as HTMLImageElement
                          const aspectRatio = img.naturalHeight / img.naturalWidth
                          const newHeight = position.width * aspectRatio
                          // Could trigger a re-layout here if needed
                        }}
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
                        <Badge variant="secondary" className="p-1">
                          <CheckCircle className="w-4 h-4" />
                        </Badge>
                      </div>
                    )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      {/* Quick Status Controls */}
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
                        <div className="text-white text-xs font-medium mb-2 text-center">Quick Status</div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateItemStatus(item.id, 'active')
                            }}
                            className={`px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                              item.status === 'active'
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-700 text-neutral-300 hover:bg-primary-500 hover:text-white'
                            }`}
                          >
                            <div className="w-2 h-2 bg-current rounded-full"></div>
                            Active
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateItemStatus(item.id, 'actualized')
                            }}
                            className={`px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                              item.status === 'actualized'
                                ? 'bg-secondary-500 text-white'
                                : 'bg-neutral-700 text-neutral-300 hover:bg-secondary-500 hover:text-white'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Actualized
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateItemStatus(item.id, 'inactive')
                            }}
                            className={`px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                              item.status === 'inactive'
                                ? 'bg-neutral-500 text-white'
                                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-500 hover:text-white'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </button>
                        </div>
                      </div>
                      
                      {/* View Item Details Button */}
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/vision-board/${item.id}`} onClick={(e) => e.stopPropagation()}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Item Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-4">No creations yet</h3>
              <p className="text-neutral-400 mb-8">
                Start building your vision board by adding your first creation. 
                Visualize what you want to manifest in your life.
              </p>
              <Button asChild size="lg">
                <Link href="/vision-board/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Creation
                </Link>
              </Button>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

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
              <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center relative">
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
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(filteredItems[lightboxIndex]?.status)}
                </div>
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
    </>
  )
}
