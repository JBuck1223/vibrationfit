// Vision Board Export Page - PDF preview with options (layout aligned with life-vision print)
// Path: /src/app/vision-board/export/page.tsx

'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Download, Loader2, FileText, Eye, Filter, Image, FileImage, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react'
import { Button, Spinner, CategoryGrid, Toggle } from '@/lib/design-system'
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

function previewAspectRatio(outputFormat: 'pdf' | 'image', paperSize: string, imageRatio: string): string {
  if (outputFormat === 'image') {
    const [w, h] = imageRatio.split(':').map(Number)
    if (w && h) return `${w} / ${h}`
    return '16 / 9'
  }
  switch (paperSize) {
    case 'letter-portrait':
      return '8.5 / 11'
    case 'a4-landscape':
      return '297 / 210'
    case 'a4-portrait':
      return '210 / 297'
    case 'letter-landscape':
    default:
      return '11 / 8.5'
  }
}

function ExportPageContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isIntensivePath = pathname?.startsWith('/intensive') ?? false

  const [outputFormat, setOutputFormat] = useState<'pdf' | 'image'>('pdf')
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

  const [colors, setColors] = useState({
    primary: '#000000',
    accent: '#9CA3AF',
    text: '#1F1F1F',
    background: '#FFFFFF',
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    async function fetchItemCount() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) return

        const { data: items } = await supabase
          .from('vision_board_items')
          .select('id, categories, status')
          .eq('user_id', user.id)

        if (items) {
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

  const colorQuery = useMemo(() => {
    return {
      primary: colors.primary.replace('#', ''),
      accent: colors.accent.replace('#', ''),
      text: colors.text.replace('#', ''),
      bg: colors.background.replace('#', ''),
    }
  }, [colors])

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
      primary: colorQuery.primary,
      accent: colorQuery.accent,
      text: colorQuery.text,
      bg: colorQuery.bg,
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
  }, [outputFormat, paperSize, imageRatio, columns, showDescriptions, showCategories, groupByStatus, showHeader, showItemNames, roundedCorners, showBadges, selectedCategories, selectedStatuses, colorQuery])

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
      primary: colorQuery.primary,
      accent: colorQuery.accent,
      text: colorQuery.text,
      bg: colorQuery.bg,
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
        const message = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || `Failed to generate ${outputFormat.toUpperCase()}`
        throw new Error(message)
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

  const itemsPerPage = useMemo(() => {
    const rows = outputFormat === 'pdf'
      ? (paperSize.includes('landscape') ? 2 : 3)
      : (imageRatio === '9:16' ? 4 : imageRatio === '1:1' ? 3 : 2)
    return columns * rows
  }, [outputFormat, paperSize, imageRatio, columns])

  const estimatedPages = Math.ceil(itemCount / itemsPerPage) || 1

  const updateColor = (key: keyof typeof colors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }))
  }

  const colorPresets = {
    default: {
      primary: '#000000',
      accent: '#9CA3AF',
      text: '#1F1F1F',
      background: '#FFFFFF',
    },
    purple: {
      primary: '#601B9F',
      accent: '#9CA3AF',
      text: '#1F1F1F',
      background: '#FFFFFF',
    },
    cyan: {
      primary: '#06B6D4',
      accent: '#9CA3AF',
      text: '#1F1F1F',
      background: '#FFFFFF',
    },
    forestGreen: {
      primary: '#00CC44',
      accent: '#9CA3AF',
      text: '#1F1F1F',
      background: '#FFFFFF',
    },
  }

  const applyPreset = (preset: keyof typeof colorPresets) => {
    setColors(colorPresets[preset])
  }

  const presetEntries: { key: keyof typeof colorPresets; label: string }[] = [
    { key: 'default', label: 'B&W' },
    { key: 'purple', label: 'Purple' },
    { key: 'cyan', label: 'Cyan' },
    { key: 'forestGreen', label: 'Green' },
  ]

  const colorFields: { key: keyof typeof colors; label: string }[] = [
    { key: 'primary', label: 'Title' },
    { key: 'accent', label: 'Lines' },
    { key: 'text', label: 'Text' },
    { key: 'background', label: 'BG' },
  ]

  const aspectStyle = previewAspectRatio(outputFormat, paperSize, imageRatio)

  return (
    <div className="flex flex-col">
      <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-4 md:p-5 mb-6 space-y-4">
        {/* Top bar: back, format toggle, download */}
        <div className="relative flex items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={isIntensivePath ? '/intensive/vision-board' : '/vision-board'} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>

          <div className="absolute left-1/2 -translate-x-1/2">
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

          <Button
            onClick={handleDownload}
            variant="primary"
            size="sm"
            className="flex items-center gap-2 shrink-0"
            disabled={isGenerating || itemCount === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download {outputFormat.toUpperCase()}</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-[11px] text-neutral-500 text-center">
          {itemCount} item{itemCount !== 1 ? 's' : ''} · ~{estimatedPages} {outputFormat === 'pdf' ? 'page' : 'image'}{estimatedPages !== 1 ? 's' : ''}
        </p>

        {/* Options grid: desktop = 3 cols (Paper+Display | Colors | Filters), mobile = stacked */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Paper + Display */}
          <div className="space-y-4 md:bg-neutral-900/50 md:border md:border-neutral-800 md:rounded-2xl md:p-4">
            {/* Paper/Ratio */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-700" />
                <h3 className="text-[11px] font-semibold text-white flex items-center gap-2 uppercase tracking-wide">
                  {outputFormat === 'pdf' ? (
                    <><FileText className="w-3.5 h-3.5 text-primary-500" /> Paper</>
                  ) : (
                    <><Image className="w-3.5 h-3.5 text-primary-500" /> Ratio</>
                  )}
                </h3>
                <div className="h-px flex-1 bg-neutral-700" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(outputFormat === 'pdf' ? PAPER_SIZES : IMAGE_RATIOS).map(opt => {
                  const isActive = outputFormat === 'pdf' ? paperSize === opt.value : imageRatio === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => outputFormat === 'pdf' ? setPaperSize(opt.value) : setImageRatio(opt.value)}
                      className={`px-3 py-2 rounded-xl text-left text-xs transition-all ${
                        isActive
                          ? 'bg-primary-500/20 border border-primary-500 text-white'
                          : 'bg-neutral-800/60 border border-neutral-700 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-[10px] opacity-70">{opt.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Display */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-700" />
                <h3 className="text-[11px] font-semibold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Eye className="w-3.5 h-3.5 text-primary-500" /> Display
                </h3>
                <div className="h-px flex-1 bg-neutral-700" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-neutral-500 mb-1.5 uppercase">Columns</div>
                  <div className="flex gap-1.5">
                    {COLUMN_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColumns(opt.value)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                  {[
                    { key: 'showHeader', label: 'Title', checked: showHeader, onChange: setShowHeader, disabled: false },
                    { key: 'showItemNames', label: 'Names', checked: showItemNames, onChange: setShowItemNames, disabled: false },
                    { key: 'showDescriptions', label: 'Desc', checked: showDescriptions, onChange: setShowDescriptions, disabled: !showItemNames },
                    { key: 'showCategories', label: 'Categories', checked: showCategories, onChange: setShowCategories, disabled: !showItemNames },
                    { key: 'roundedCorners', label: 'Rounded', checked: roundedCorners, onChange: setRoundedCorners, disabled: false },
                    { key: 'showBadges', label: 'Badges', checked: showBadges, onChange: setShowBadges, disabled: false },
                  ].map(({ key, label, checked, onChange, disabled }) => (
                    <label key={key} className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-40' : ''}`}>
                      <button
                        type="button"
                        onClick={() => !disabled && onChange(!checked)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-[#39FF14] border-[#39FF14]'
                            : 'bg-neutral-800 border-neutral-600'
                        }`}
                        disabled={disabled}
                      >
                        {checked && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                      <span className={`text-[11px] ${disabled ? 'text-neutral-600' : 'text-neutral-300'}`}>{label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer col-span-3">
                    <button
                      type="button"
                      onClick={() => setGroupByStatus(!groupByStatus)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        groupByStatus
                          ? 'bg-[#39FF14] border-[#39FF14]'
                          : 'bg-neutral-800 border-neutral-600'
                      }`}
                    >
                      {groupByStatus && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className="text-[11px] text-neutral-300">Group by status</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Colors */}
          <div className="space-y-3 md:bg-neutral-900/50 md:border md:border-neutral-800 md:rounded-2xl md:p-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-700" />
              <h3 className="text-[11px] font-semibold text-white flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Colors
              </h3>
              <div className="h-px flex-1 bg-neutral-700" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 mb-1.5 uppercase text-center">Presets</div>
              <div className="flex items-center justify-center gap-2">
                {presetEntries.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    title={label}
                    className="group"
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-neutral-600 group-hover:border-neutral-400 transition-colors"
                      style={{ backgroundColor: colorPresets[key].primary }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 mb-1.5 uppercase text-center">Custom</div>
              <div className="flex items-end justify-center gap-4">
                {colorFields.map(({ key, label }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <label className="cursor-pointer" title={label}>
                      <input
                        type="color"
                        value={colors[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-8 h-8 rounded-full cursor-pointer border-2 border-neutral-600 hover:border-neutral-400 bg-transparent p-0 transition-colors [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                      />
                    </label>
                    <span className="text-[9px] text-neutral-500">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setColors({ primary: '#000000', accent: '#9CA3AF', text: '#1F1F1F', background: '#FFFFFF' })}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
                  title="Reset colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Filters (always open) */}
          <div className="space-y-3 md:bg-neutral-900/50 md:border md:border-neutral-800 md:rounded-2xl md:p-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-700" />
              <h3 className="text-[11px] font-semibold text-white flex items-center gap-2 uppercase tracking-wide">
                <Filter className="w-3.5 h-3.5 text-primary-500" /> Filters
              </h3>
              <div className="h-px flex-1 bg-neutral-700" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-neutral-500 mb-1.5 uppercase text-center">Status</div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => toggleStatus(status.value)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
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
              <div>
                <div className="text-[10px] text-neutral-500 mb-1.5 uppercase text-center">Categories</div>
                <CategoryGrid
                  categories={VISION_CATEGORIES.filter(cat => cat.key !== 'forward' && cat.key !== 'conclusion')}
                  selectedCategories={selectedCategories.includes('all') ? VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion').map(c => c.key) : selectedCategories}
                  onCategoryClick={toggleCategory}
                  lifeVisionCategoryStrip
                  desktopColumnCount={4}
                />
                <button
                  type="button"
                  onClick={() => setSelectedCategories(['all'])}
                  className="mt-1.5 text-[11px] text-primary-500 hover:text-primary-400 w-full text-center"
                >
                  Select All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-4xl lg:px-8">
          {loading ? (
            <div
              className="flex items-center justify-center w-full bg-neutral-900 rounded-lg border border-neutral-800 md:min-h-[400px]"
              style={{ aspectRatio: aspectStyle }}
            >
              <Spinner size="lg" />
            </div>
          ) : itemCount === 0 ? (
            <div
              className="flex items-center justify-center w-full bg-neutral-100 rounded-lg border border-neutral-200 md:min-h-[400px]"
              style={{ aspectRatio: aspectStyle }}
            >
              <div className="text-center text-neutral-500">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items match your filters</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-hidden rounded-lg shadow-2xl" style={{ aspectRatio: aspectStyle }}>
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  className="border-0 bg-white absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50 md:relative md:w-full md:h-full md:scale-100"
                  title="Preview"
                />
              </div>
              <p className="text-[10px] text-neutral-500 text-center mt-2">
                Preview is approximate. Download for final output.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VisionBoardExportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    }>
      <ExportPageContent />
    </Suspense>
  )
}
