// Print Preview Page - Interactive preview with styling options
// Shows actual PDF preview with page breaks and download functionality
// Path: /src/app/life-vision/[id]/print/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

export default function PrintPreviewPage() {
  const params = useParams()
  const visionId = params.id as string
  const [colors, setColors] = useState({
    primary: '#000000',
    accent: '#9CA3AF',
    text: '#1F1F1F',
    background: '#FFFFFF',
  })
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Build API URL with color parameters for preview
    const colorParams = new URLSearchParams({
      id: visionId,
      preview: 'true',
      primary: colors.primary.replace('#', ''),
      accent: colors.accent.replace('#', ''),
      text: colors.text.replace('#', ''),
      bg: colors.background.replace('#', ''),
      t: Date.now().toString(), // Cache buster
    })
    // Use the API route for both preview and PDF - it generates the same HTML
    setIframeUrl(`/api/pdf/vision?${colorParams.toString()}`)
  }, [visionId, colors])

  const handleDownload = async () => {
    console.log('[Download] Starting PDF download, visionId:', visionId)
    setIsGenerating(true)
    try {
      // Build API URL with color parameters
      const colorParams = new URLSearchParams({
        id: visionId,
        primary: colors.primary.replace('#', ''),
        accent: colors.accent.replace('#', ''),
        text: colors.text.replace('#', ''),
        bg: colors.background.replace('#', ''),
      })

      const apiUrl = `/api/pdf/vision?${colorParams.toString()}`
      console.log('[Download] Fetching from:', apiUrl)

      // Fetch PDF from API
      const response = await fetch(apiUrl)
      console.log('[Download] Response status:', response.status, 'ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Convert response to blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'life-vision.pdf'
        : 'life-vision.pdf'
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up URL
      window.URL.revokeObjectURL(url)

      console.log('PDF downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

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
    green: {
      primary: '#00CC44',
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
    { key: 'background', label: 'Background' },
  ]

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-3 md:p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 mr-1">Theme</span>
            {presetEntries.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                title={label}
                className="group"
              >
                <div
                  className="w-7 h-7 rounded-full border border-neutral-600 group-hover:border-neutral-400 transition-colors"
                  style={{ backgroundColor: colorPresets[key].primary }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-neutral-700 hidden sm:block" />

          {/* Custom Colors */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 mr-1">Custom</span>
            {colorFields.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer" title={label}>
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer border border-neutral-600 hover:border-neutral-400 bg-transparent p-0 transition-colors [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                />
                <span className="text-[11px] text-neutral-500 hidden md:inline">{label}</span>
              </label>
            ))}
          </div>

          <div className="w-px h-6 bg-neutral-700 hidden sm:block" />

          {/* Reset */}
          <button
            type="button"
            onClick={() => setColors({ primary: '#000000', accent: '#9CA3AF', text: '#1F1F1F', background: '#FFFFFF' })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Spacer + Download */}
          <div className="flex-1" />
          <Button
            onClick={handleDownload}
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl px-4 lg:px-8">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="border-0 bg-white rounded-lg shadow-2xl w-full mx-auto block"
              style={{ aspectRatio: '8.5 / 11', minHeight: '400px' }}
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center w-full bg-neutral-900 rounded-lg border border-neutral-800" style={{ aspectRatio: '8.5 / 11' }}>
              <div className="text-center text-neutral-500">
                <p className="text-sm font-medium mb-1">Loading preview...</p>
                <p className="text-xs">Preparing your PDF</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

