// Print Preview Page - Interactive preview with styling options
// Shows actual PDF preview with page breaks and download functionality
// Path: /src/app/life-vision/[id]/print/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, Palette, RefreshCw, Loader2 } from 'lucide-react'
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

      // Fetch PDF from API
      const response = await fetch(apiUrl)

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

  return (
    <div className="min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-neutral-800 border-b border-neutral-700 px-4 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4">
          <h1 className="text-xl lg:text-2xl font-bold text-white">PDF Preview & Editor</h1>
          
          <Button
            onClick={handleDownload}
            variant="primary"
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

      <div className="flex flex-col lg:flex-row">
        {/* Color Picker Sidebar */}
        <div className="w-full lg:w-80 bg-neutral-800 border-r-0 lg:border-r border-b lg:border-b-0 border-neutral-700 p-4 lg:p-6 overflow-y-auto h-auto lg:h-[calc(100vh-73px)]">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-white">Color Theme</h2>
          </div>

          {/* Color Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => applyPreset('default')}
                variant="outline"
                size="sm"
                className="w-full justify-start border-neutral-600 hover:border-primary-500 text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorPresets.default.primary }} />
                  <span>Black & White</span>
                </div>
              </Button>
              <Button
                onClick={() => applyPreset('purple')}
                variant="outline"
                size="sm"
                className="w-full justify-start border-neutral-600 hover:border-primary-500 text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorPresets.purple.primary }} />
                  <span>Purple</span>
                </div>
              </Button>
              <Button
                onClick={() => applyPreset('cyan')}
                variant="outline"
                size="sm"
                className="w-full justify-start border-neutral-600 hover:border-primary-500 text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorPresets.cyan.primary }} />
                  <span>Cyan</span>
                </div>
              </Button>
              <Button
                onClick={() => applyPreset('forestGreen')}
                variant="outline"
                size="sm"
                className="w-full justify-start border-neutral-600 hover:border-primary-500 text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorPresets.forestGreen.primary }} />
                  <span>Forest Green</span>
                </div>
              </Button>
            </div>
          </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Primary Color (Title)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colors.primary}
                        onChange={(e) => updateColor('primary', e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border border-neutral-600"
                      />
                      <input
                        type="text"
                        value={colors.primary}
                        onChange={(e) => updateColor('primary', e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white font-mono text-sm"
                        placeholder="#199D67"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Accent Color (Lines)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colors.accent}
                        onChange={(e) => updateColor('accent', e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border border-neutral-600"
                      />
                      <input
                        type="text"
                        value={colors.accent}
                        onChange={(e) => updateColor('accent', e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white font-mono text-sm"
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colors.text}
                        onChange={(e) => updateColor('text', e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border border-neutral-600"
                      />
                      <input
                        type="text"
                        value={colors.text}
                        onChange={(e) => updateColor('text', e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white font-mono text-sm"
                        placeholder="#1F1F1F"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colors.background}
                        onChange={(e) => updateColor('background', e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer border border-neutral-600"
                      />
                      <input
                        type="text"
                        value={colors.background}
                        onChange={(e) => updateColor('background', e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white font-mono text-sm"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-700">
                    <Button
                      onClick={() => setColors({
                        primary: '#000000',
                        accent: '#9CA3AF',
                        text: '#1F1F1F',
                        background: '#FFFFFF',
                      })}
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2 border-neutral-600 hover:border-primary-500 text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset to Default
                    </Button>
                  </div>
                </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-black overflow-auto h-auto lg:h-[calc(100vh-73px)]">
          <div className="w-full">
            
            {/* Preview Container */}
            <div className="w-full flex justify-center items-start min-h-[600px] py-4 lg:py-8">
              <div className="w-full max-w-4xl px-4 lg:px-8">
                {iframeUrl ? (
                  <iframe
                    src={iframeUrl}
                    className="border-0 bg-white rounded-lg shadow-2xl w-full mx-auto block"
                    style={{ 
                      maxWidth: '100%',
                      width: '100%',
                      aspectRatio: '8.5 / 11',
                      minHeight: '400px',
                    }}
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-96 bg-neutral-100 rounded-lg">
                    <div className="text-center text-neutral-500">
                      <p className="text-lg font-medium mb-2">Loading preview...</p>
                      <p className="text-sm">Preparing your PDF preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

