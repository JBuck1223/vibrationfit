// Print Preview Page - Interactive preview with styling options
// Shows actual PDF preview with page breaks and download functionality
// Path: /src/app/life-vision/[id]/print/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, Palette, RefreshCw } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

export default function PrintPreviewPage() {
  const params = useParams()
  const visionId = params.id as string
  const [colors, setColors] = useState({
    primary: '#199D67',
    secondary: '#14B8A6',
    accent: '#8B5CF6',
    text: '#1F1F1F',
    background: '#FFFFFF',
  })
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)

  useEffect(() => {
    // Set iframe URL with color parameters
    const colorParams = new URLSearchParams({
      primary: colors.primary.replace('#', ''),
      secondary: colors.secondary.replace('#', ''),
      accent: colors.accent.replace('#', ''),
      text: colors.text.replace('#', ''),
      bg: colors.background.replace('#', ''),
    })
    setIframeUrl(`/life-vision/${visionId}/print/html?${colorParams.toString()}`)
  }, [visionId, colors])

  const handleDownload = () => {
    // Simple: Open the clean print page in a new tab
    window.open(iframeUrl || '', '_blank')
  }

  const updateColor = (key: keyof typeof colors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen p-0">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-neutral-800 border-b border-neutral-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">PDF Preview & Editor</h1>
            <span className="text-sm text-neutral-400">Vision ID: {visionId}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownload}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Color Picker Sidebar */}
        <div className="w-full md:w-80 bg-neutral-800 border-r border-neutral-700 p-6 overflow-y-auto h-auto md:h-[calc(100vh-73px)]">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold">Color Theme</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Primary Color
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
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => updateColor('secondary', e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer border border-neutral-600"
                />
                <input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => updateColor('secondary', e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white font-mono text-sm"
                  placeholder="#14B8A6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Accent Color
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
                  primary: '#199D67',
                  secondary: '#14B8A6',
                  accent: '#8B5CF6',
                  text: '#1F1F1F',
                  background: '#FFFFFF',
                })}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Default
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-black overflow-auto h-auto md:h-[calc(100vh-73px)]">
          <div className="max-w-4xl mx-auto">
            {/* Preview Instructions */}
            <div className="mb-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-300">
                💡 <strong>Preview Tips:</strong> This shows exactly what your PDF will look like. 
                Use the color picker on the left to customize your theme, then click "Download PDF" to open the print page. From there, press Cmd/Ctrl+P and select "Save as PDF".
              </p>
            </div>
            
            {/* Letter-sized Preview Container */}
            <div className="bg-white shadow-2xl rounded overflow-hidden print-view" style={{ width: '8.5in', minHeight: '11in' }}>
              {iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  className="w-full border-0"
                  style={{ 
                    height: '11in',
                    minHeight: '11in',
                    display: 'block',
                  }}
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-[11in] bg-neutral-100">
                  <div className="text-center text-neutral-500">
                    <p className="text-lg font-medium mb-2">Loading preview...</p>
                    <p className="text-sm">Preparing your PDF preview</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-300">
                💡 <strong>Customize your colors</strong> using the picker on the left, then click "Download PDF" to open the print page. From there, press Cmd/Ctrl+P and select "Save as PDF".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

