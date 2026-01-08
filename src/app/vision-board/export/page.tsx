// Vision Board Export Page - PDF Preview with Options
// Path: /src/app/vision-board/export/page.tsx

'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Download, Loader2, FileText, Columns3, Eye, Filter, Image, FileImage, ArrowLeft } from 'lucide-react'
import { Button, Card, Container, Stack, PageHero, Spinner, CategoryCard, Toggle } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import Link from 'next/link'

const PAPER_SIZES = [
  { value: 'letter-landscape', label: 'Letter', desc: 'Landscape' },
  { value: 'letter-portrait', label: 'Letter', desc: 'Portrait' },
  { value: 'a4-landscape', label: 'A4', desc: 'Landscape' },
  { value: 'a4-portrait', label: 'A4', desc: 'Portrait' },
]

const IMAGE_RATIOS = [
  { value: '16:9', label: '16:9', desc: 'Widescreen' },
  { value: '4:3', label: '4:3', desc: 'Standard' },
  { value: '1:1', label: '1:1', desc: 'Square' },
  { value: '9:16', label: '9:16', desc: 'Portrait' },
]

const COLUMN_OPTIONS = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#16A34A' },
  { value: 'actualized', label: 'Actualized', color: '#8B5CF6' },
  { value: 'inactive', label: 'Inactive', color: '#6B7280' },
]

function ExportPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Format toggle
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'image'>('pdf')
  
  // Options state
  const [paperSize, setPaperSize] = useState('letter-landscape')
  const [imageRatio, setImageRatio] = useState('16:9')
  const [columns, setColumns] = useState(4)
  const [showDescriptions, setShowDescriptions] = useState(true)
  const [showCategories, setShowCategories] = useState(true)
  const [groupByStatus, setGroupByStatus] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [showItemNames, setShowItemNames] = useState(true)
  const [roundedCorners, setRoundedCorners] = useState(true)
  const [showBadges, setShowBadges] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active', 'actualized'])
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [showFilters, setShowFilters] = useState(false) // Default to closed
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Initialize from URL params
  useEffect(() => {
    const categoriesParam = searchParams.get('categories')
    const statusesParam = searchParams.get('statuses')
    
    if (categoriesParam && categoriesParam !== 'all') {
      setSelectedCategories(categoriesParam.split(','))
    }
    if (statusesParam && statusesParam !== 'all') {
      setSelectedStatuses(statusesParam.split(','))
    }
  }, [searchParams])

  // Fetch item count for preview
  useEffect(() => {
    async function fetchItemCount() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: items } = await supabase
          .from('vision_board_items')
          .select('id, categories, status')
          .eq('user_id', user.id)

        if (items) {
          // Apply filters to count
          let filtered = items
          
          if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
            filtered = filtered.filter(item => 
              item.categories?.some((cat: string) => selectedCategories.includes(cat))
            )
          }
          
          if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) {
            filtered = filtered.filter(item => 
              selectedStatuses.includes(item.status)
            )
          }
          
          setItemCount(filtered.length)
        }
      } catch (error) {
        console.error('Error fetching item count:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItemCount()
  }, [selectedCategories, selectedStatuses])

  // Build preview URL
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      preview: 'true',
      paperSize: outputFormat === 'pdf' ? paperSize : 'letter-landscape',
      imageRatio,
      columns: columns.toString(),
      showDescriptions: showDescriptions.toString(),
      showCategories: showCategories.toString(),
      groupByStatus: groupByStatus.toString(),
      showHeader: showHeader.toString(),
      showItemNames: showItemNames.toString(),
      roundedCorners: roundedCorners.toString(),
      showBadges: showBadges.toString(),
    })

    if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','))
    } else {
      params.set('categories', 'all')
    }

    if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) {
      params.set('statuses', selectedStatuses.join(','))
    } else {
      params.set('statuses', 'all')
    }

    return `/api/pdf/vision-board?${params.toString()}`
  }, [outputFormat, paperSize, imageRatio, columns, showDescriptions, showCategories, groupByStatus, showHeader, showItemNames, roundedCorners, showBadges, selectedCategories, selectedStatuses])

  // Refresh preview when options change
  useEffect(() => {
    setIframeKey(prev => prev + 1)
  }, [previewUrl])

  const buildDownloadParams = () => {
    const params = new URLSearchParams({
      paperSize: outputFormat === 'pdf' ? paperSize : 'letter-landscape',
      imageRatio,
      columns: columns.toString(),
      showDescriptions: showDescriptions.toString(),
      showCategories: showCategories.toString(),
      groupByStatus: groupByStatus.toString(),
      showHeader: showHeader.toString(),
      showItemNames: showItemNames.toString(),
      roundedCorners: roundedCorners.toString(),
      showBadges: showBadges.toString(),
      format: outputFormat,
    })

    if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','))
    }

    if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) {
      params.set('statuses', selectedStatuses.join(','))
    }

    return params
  }

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const params = buildDownloadParams()

      const response = await fetch(`/api/pdf/vision-board?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to generate ${outputFormat.toUpperCase()}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const contentDisposition = response.headers.get('Content-Disposition')
      const defaultExt = outputFormat === 'pdf' ? 'pdf' : 'png'
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `vision-board.${defaultExt}`
        : `vision-board.${defaultExt}`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCategory = (categoryKey: string) => {
    if (categoryKey === 'all') {
      setSelectedCategories(['all'])
    } else {
      setSelectedCategories(prev => {
        const filtered = prev.filter(c => c !== 'all')
        if (filtered.includes(categoryKey)) {
          const newSelection = filtered.filter(c => c !== categoryKey)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered, categoryKey]
        }
      })
    }
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        const newSelection = prev.filter(s => s !== status)
        return newSelection.length === 0 ? ['all'] : newSelection
      } else {
        const filtered = prev.filter(s => s !== 'all')
        return [...filtered, status]
      }
    })
  }

  // Calculate estimated pages/images
  const itemsPerPage = useMemo(() => {
    const rows = outputFormat === 'pdf' 
      ? (paperSize.includes('landscape') ? 2 : 3)
      : (imageRatio === '9:16' ? 4 : imageRatio === '1:1' ? 3 : 2)
    return columns * rows
  }, [outputFormat, paperSize, imageRatio, columns])

  const estimatedPages = Math.ceil(itemCount / itemsPerPage) || 1

  return (
    <Container size="xl" className="h-[calc(100vh-80px)] flex flex-col">
      <Stack gap="sm" className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <PageHero
          title="Export Vision Board"
          subtitle="Download your vision board as a PDF or image"
        >
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href="/vision-board" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Vision Board
            </Link>
          </Button>
        </PageHero>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Options Sidebar - Fixed width, scrollable */}
          <div className="w-full lg:w-64 space-y-2 flex-shrink-0 lg:overflow-y-auto">
            {/* Format Toggle */}
            <div className="flex justify-center">
              <Toggle
                options={[
                  { value: 'pdf', label: 'PDF' },
                  { value: 'image', label: 'Image' },
                ]}
                value={outputFormat}
                onChange={setOutputFormat}
                size="sm"
              />
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              variant="primary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              disabled={isGenerating || itemCount === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {outputFormat === 'pdf' ? <FileText className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
                  Download {outputFormat.toUpperCase()}
                </>
              )}
            </Button>
            
            <p className="text-[10px] text-neutral-500 text-center">
              {itemCount} item{itemCount !== 1 ? 's' : ''} · ~{estimatedPages} {outputFormat === 'pdf' ? 'page' : 'image'}{estimatedPages !== 1 ? 's' : ''}
            </p>

            {/* PDF: Paper Size / Image: Aspect Ratio */}
            <Card className="p-3">
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
                {outputFormat === 'pdf' ? (
                  <>
                    <FileText className="w-3.5 h-3.5 text-primary-500" />
                    Paper Size
                  </>
                ) : (
                  <>
                    <Image className="w-3.5 h-3.5 text-primary-500" />
                    Aspect Ratio
                  </>
                )}
              </h3>
              
              {outputFormat === 'pdf' ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {PAPER_SIZES.map(size => (
                    <button
                      key={size.value}
                      onClick={() => setPaperSize(size.value)}
                      className={`px-2 py-1.5 rounded-lg text-left text-xs transition-all ${
                        paperSize === size.value
                          ? 'bg-primary-500/20 border border-primary-500 text-white'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-medium">{size.label}</div>
                      <div className="text-[10px] opacity-70">{size.desc}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {IMAGE_RATIOS.map(ratio => (
                    <button
                      key={ratio.value}
                      onClick={() => setImageRatio(ratio.value)}
                      className={`px-2 py-1.5 rounded-lg text-left text-xs transition-all ${
                        imageRatio === ratio.value
                          ? 'bg-primary-500/20 border border-primary-500 text-white'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-medium">{ratio.label}</div>
                      <div className="text-[10px] opacity-70">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Grid & Display Options */}
            <Card className="p-3">
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
                <Eye className="w-3.5 h-3.5 text-primary-500" />
                Display
              </h3>
              
              {/* Columns */}
              <div className="mb-2">
                <div className="text-[10px] text-neutral-500 mb-1 uppercase">Columns</div>
                <div className="flex gap-1">
                  {COLUMN_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setColumns(opt.value)}
                      className={`flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        columns === opt.value
                          ? 'bg-primary-500 text-black'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles - Compact */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-[10px] text-neutral-300">Title</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showItemNames}
                    onChange={(e) => setShowItemNames(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-[10px] text-neutral-300">Names</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDescriptions}
                    onChange={(e) => setShowDescriptions(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                    disabled={!showItemNames}
                  />
                  <span className={`text-[10px] ${showItemNames ? 'text-neutral-300' : 'text-neutral-600'}`}>Desc</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCategories}
                    onChange={(e) => setShowCategories(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                    disabled={!showItemNames}
                  />
                  <span className={`text-[10px] ${showItemNames ? 'text-neutral-300' : 'text-neutral-600'}`}>Categories</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundedCorners}
                    onChange={(e) => setRoundedCorners(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-[10px] text-neutral-300">Rounded</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBadges}
                    onChange={(e) => setShowBadges(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-[10px] text-neutral-300">Badges</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={groupByStatus}
                    onChange={(e) => setGroupByStatus(e.target.checked)}
                    className="w-3 h-3 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-[10px] text-neutral-300">Group by status</span>
                </label>
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between text-xs font-semibold text-white uppercase tracking-wide"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary-500" />
                  Filters
                </span>
                <span className="text-neutral-500 text-lg leading-none">{showFilters ? '−' : '+'}</span>
              </button>
              
              {showFilters && (
                <div className="mt-2 space-y-2">
                  {/* Status Filter */}
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1 uppercase">Status</div>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map(status => (
                        <button
                          key={status.value}
                          onClick={() => toggleStatus(status.value)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                            selectedStatuses.includes(status.value) || selectedStatuses.includes('all')
                              ? 'text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                          style={{
                            backgroundColor: (selectedStatuses.includes(status.value) || selectedStatuses.includes('all'))
                              ? status.color
                              : undefined
                          }}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1 uppercase">Categories</div>
                    <div className="grid grid-cols-4 gap-1">
                      {VISION_CATEGORIES
                        .filter(cat => cat.key !== 'forward' && cat.key !== 'conclusion')
                        .map(category => {
                          const isSelected = selectedCategories.includes(category.key) || selectedCategories.includes('all')
                          return (
                            <CategoryCard
                              key={category.key}
                              category={category}
                              selected={isSelected}
                              onClick={() => toggleCategory(category.key)}
                              variant="outlined"
                              selectionStyle="border"
                              iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                              selectedIconColor="#39FF14"
                              className={`!p-1 ${isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)]' : '!bg-transparent !border-neutral-700'}`}
                            />
                          )
                        })}
                    </div>
                    <button
                      onClick={() => setSelectedCategories(['all'])}
                      className="mt-1 text-[10px] text-primary-500 hover:text-primary-400"
                    >
                      Select All
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Preview Area - Fills all remaining space */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Card className="p-3 bg-neutral-900 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Image className="w-3.5 h-3.5 text-primary-500" />
                  Preview
                </h3>
                <span className="text-[10px] text-neutral-500">
                  Scroll to see all
                </span>
              </div>
              
              {/* Preview Container - Expands to fill */}
              <div className="flex-1 bg-white rounded-lg overflow-auto min-h-0">
                {loading ? (
                  <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-neutral-100">
                    <Spinner size="lg" />
                  </div>
                ) : itemCount === 0 ? (
                  <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-neutral-100">
                    <div className="text-center text-neutral-500">
                      <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No items match your filters</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    key={iframeKey}
                    src={previewUrl}
                    className="w-full h-full border-0 min-h-[400px]"
                    title="Preview"
                  />
                )}
              </div>
              
              <p className="text-[10px] text-neutral-500 text-center mt-1 flex-shrink-0">
                Preview is approximate. Download for final output.
              </p>
            </Card>
          </div>
        </div>
      </Stack>
    </Container>
  )
}

export default function VisionBoardExportPage() {
  return (
    <Suspense fallback={
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Container>
    }>
      <ExportPageContent />
    </Suspense>
  )
}
