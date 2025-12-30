'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import { Button, IconList } from '@/lib/design-system/components'
import { Scissors, Save, Play, Pause, Trash2, Info, Loader2, X, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'

interface AudioEditorProps {
  audioBlob: Blob
  onSave: (editedBlob: Blob) => void
  onCancel: () => void
}

export function AudioEditor({ audioBlob, onSave, onCancel }: AudioEditorProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsPluginRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob>(audioBlob)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(50) // Start at 50 pixels per second
  const [showInstructions, setShowInstructions] = useState(false)

  // Keyboard shortcuts - Delete/Backspace to cut selected region
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegion && !isProcessing) {
        e.preventDefault() // Prevent browser back navigation on Backspace
        deleteSelectedRegion()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRegion, isProcessing])

  useEffect(() => {
    if (!waveformRef.current) return

    let audioUrl: string | null = null
    let wavesurfer: WaveSurfer | null = null
    let regions: RegionsPlugin | null = null
    let isCleanedUp = false
    let isLoading = true
    const abortController = new AbortController()

    // Event handler references for cleanup
    const onReady = () => {
      isLoading = false
      if (!isCleanedUp && wavesurfer) {
        setDuration(wavesurfer.getDuration())
      }
    }
    
    const onPlay = () => !isCleanedUp && setIsPlaying(true)
    const onPause = () => !isCleanedUp && setIsPlaying(false)
    const onFinish = () => !isCleanedUp && setIsPlaying(false)
    
    const onRegionClicked = (region: any, e: MouseEvent) => {
      if (isCleanedUp) return
      e.stopPropagation()
      setSelectedRegion(region)
      region.play()
    }

    const onRegionUpdated = (region: any) => {
      if (isCleanedUp) return
      setSelectedRegion(region)
    }
    
    const onLoadError = (err: Error) => {
      isLoading = false
      if (!isCleanedUp) {
        console.error('Failed to load audio:', err)
      }
    }

    try {
      // Initialize WaveSurfer
      wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#199D67',
        progressColor: '#5EC49A',
        cursorColor: '#FFB701',
        height: 128,
        normalize: true,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        minPxPerSec: 50, // Start at 50 pixels per second
        fillParent: true, // Allow waveform to fill and expand parent
        autoScroll: true, // Auto-scroll on playback to keep cursor visible
        autoCenter: true, // Keep cursor centered when scrolling
      })

      // Initialize Regions Plugin
      regions = wavesurfer.registerPlugin(RegionsPlugin.create())
      
      wavesurferRef.current = wavesurfer
      regionsPluginRef.current = regions

      // Load audio blob (use current audio blob which updates after cuts)
      audioUrl = URL.createObjectURL(currentAudioBlob)
      
      // Attach event listeners BEFORE loading
      wavesurfer.on('ready', onReady)
      wavesurfer.on('play', onPlay)
      wavesurfer.on('pause', onPause)
      wavesurfer.on('finish', onFinish)
      wavesurfer.on('error', onLoadError)
      
      regions.on('region-clicked', onRegionClicked)
      regions.on('region-updated', onRegionUpdated)
      
      // Load audio with error handling
      wavesurfer.load(audioUrl).catch((err: any) => {
        // Ignore abort errors - these are expected when component unmounts
        if (err?.name !== 'AbortError' && !err?.message?.includes('aborted') && !isCleanedUp) {
          console.error('Failed to load audio:', err)
        }
      })
    } catch (err) {
      console.error('Failed to initialize audio editor:', err)
      isLoading = false
    }

    // Cleanup
    return () => {
      isCleanedUp = true
      
      // Abort any pending fetch requests
      abortController.abort()
      
      // Unsubscribe from all events BEFORE destroying
      if (wavesurfer) {
        try {
          wavesurfer.un('ready', onReady)
          wavesurfer.un('play', onPlay)
          wavesurfer.un('pause', onPause)
          wavesurfer.un('finish', onFinish)
          wavesurfer.un('error', onLoadError)
        } catch (err) {
          // Event unsubscribe might fail - that's ok
        }
      }
      
      if (regions) {
        try {
          regions.un('region-clicked', onRegionClicked)
          regions.un('region-updated', onRegionUpdated)
        } catch (err) {
          // Event unsubscribe might fail - that's ok
        }
      }
      
      // Destroy immediately since we've aborted fetches
      if (wavesurfer) {
        // Stop any playing audio first
        try {
          if (wavesurfer.isPlaying()) {
            wavesurfer.pause()
          }
        } catch (err) {
          // Ignore pause errors
        }
        
        // Destroy with a short delay to let abort complete
        setTimeout(() => {
          try {
            wavesurfer.destroy()
          } catch (err) {
            // All errors during cleanup are suppressed
          }
        }, 0)
      }
      
      if (audioUrl) {
        try {
          URL.revokeObjectURL(audioUrl)
        } catch (err) {
          // Suppress error
        }
      }
    }
  }, [currentAudioBlob])

  const togglePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause()
  }, [])

  // Spacebar to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to spacebar when not typing in an input/textarea
      if (e.code === 'Space' && e.target instanceof HTMLElement && 
          !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault() // Prevent page scroll
        togglePlayPause()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayPause])

  const addRegionToCut = () => {
    if (!regionsPluginRef.current || !wavesurferRef.current) return
    
    const duration = wavesurferRef.current.getDuration()
    const currentTime = wavesurferRef.current.getCurrentTime()
    
    // Create a 2-second region starting from current time (or middle if paused)
    const start = currentTime > 0 ? currentTime : duration * 0.4
    const end = Math.min(start + 2, duration)
    
    const region = regionsPluginRef.current.addRegion({
      start,
      end,
      color: 'rgba(208, 55, 57, 0.3)', // Red with transparency
      drag: true,
      resize: true,
    })
    
    setSelectedRegion(region)
  }

  const deleteSelectedRegion = async () => {
    console.log('🗑️ Delete button clicked, selectedRegion:', selectedRegion)
    if (!selectedRegion || !wavesurferRef.current || !regionsPluginRef.current) {
      console.log('❌ No selected region to remove')
      return
    }

    setIsProcessing(true)

    try {
      const audioContext = new AudioContext()

      // Decode original audio
      const arrayBuffer = await currentAudioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Get the region to cut
      const regionStart = selectedRegion.start
      const regionEnd = selectedRegion.end

      // Calculate segments to keep (everything except this region)
      const segments: { start: number; end: number }[] = []
      
      if (regionStart > 0) {
        segments.push({ start: 0, end: regionStart })
      }
      
      if (regionEnd < audioBuffer.duration) {
        segments.push({ start: regionEnd, end: audioBuffer.duration })
      }

      // If no segments (entire audio is cut), show error
      if (segments.length === 0) {
        alert('Cannot delete: This would remove the entire recording.')
        setIsProcessing(false)
        return
      }

      // Calculate total duration of kept segments
      const totalDuration = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0)

      // Create new audio buffer for trimmed audio
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        Math.floor(totalDuration * audioBuffer.sampleRate),
        audioBuffer.sampleRate
      )

      // Copy audio data from segments
      let offset = 0
      segments.forEach(segment => {
        const startSample = Math.floor(segment.start * audioBuffer.sampleRate)
        const endSample = Math.floor(segment.end * audioBuffer.sampleRate)
        const length = endSample - startSample

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const inputData = audioBuffer.getChannelData(channel)
          const outputData = trimmedBuffer.getChannelData(channel)

          for (let i = 0; i < length; i++) {
            outputData[offset + i] = inputData[startSample + i]
          }
        }

        offset += length
      })

      // Convert AudioBuffer to Blob
      const trimmedBlob = await audioBufferToBlob(trimmedBuffer)

      // Save current playhead position before updating
      const savedPlayheadPosition = wavesurferRef.current?.getCurrentTime() || 0

      // Update the current audio blob with the trimmed version
      setCurrentAudioBlob(trimmedBlob)
      setHasUnsavedChanges(true)

      // Remove ALL regions since we've applied this cut
      regionsPluginRef.current.clearRegions()
      setSelectedRegion(null)

      setIsProcessing(false)

      // Wait for waveform to reload, then restore playhead position
      setTimeout(() => {
        if (wavesurferRef.current && savedPlayheadPosition > 0) {
          const newDuration = wavesurferRef.current.getDuration()
          // Keep position if it's still within the new duration
          if (savedPlayheadPosition < newDuration) {
            wavesurferRef.current.seekTo(savedPlayheadPosition / newDuration)
          }
        }
      }, 200)

      console.log(`✅ Audio section cut successfully! New duration: ${Math.floor(totalDuration)}s`)

    } catch (error) {
      console.error('Error cutting audio:', error)
      alert('Failed to cut audio section. Please try again.')
      setIsProcessing(false)
    }
  }

  const clearAllRegions = () => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions()
      setSelectedRegion(null)
    }
  }

  const exportEditedAudio = async () => {
    if (!wavesurferRef.current || !regionsPluginRef.current) return
    
    setIsProcessing(true)
    
    try {
      const regions = regionsPluginRef.current.getRegions()
      
      // If no regions, save original
      if (regions.length === 0) {
        onSave(audioBlob)
        return
      }
      
      const audioContext = new AudioContext()
      
      // Decode original audio
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Sort regions by start time
      const sortedRegions = Array.from(regions).sort((a: any, b: any) => a.start - b.start)
      
      // Calculate segments to keep (everything except red regions)
      const segments: { start: number; end: number }[] = []
      let currentTime = 0
      
      sortedRegions.forEach((region: any) => {
        if (currentTime < region.start) {
          segments.push({ start: currentTime, end: region.start })
        }
        currentTime = region.end
      })
      
      // Add final segment if there's audio after last region
      if (currentTime < audioBuffer.duration) {
        segments.push({ start: currentTime, end: audioBuffer.duration })
      }
      
      // If no segments (entire audio is cut), show error
      if (segments.length === 0) {
        alert('Cannot save: You have marked the entire recording for removal.')
        setIsProcessing(false)
        return
      }
      
      // Calculate total duration of kept segments
      const totalDuration = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0)
      
      // Create new audio buffer for trimmed audio
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        Math.floor(totalDuration * audioBuffer.sampleRate),
        audioBuffer.sampleRate
      )
      
      // Copy audio data from segments
      let offset = 0
      segments.forEach(segment => {
        const startSample = Math.floor(segment.start * audioBuffer.sampleRate)
        const endSample = Math.floor(segment.end * audioBuffer.sampleRate)
        const length = endSample - startSample
        
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const inputData = audioBuffer.getChannelData(channel)
          const outputData = trimmedBuffer.getChannelData(channel)
          
          for (let i = 0; i < length; i++) {
            outputData[offset + i] = inputData[startSample + i]
          }
        }
        
        offset += length
      })
      
      // Convert AudioBuffer to Blob
      const trimmedBlob = await audioBufferToBlob(trimmedBuffer)
      
      // Save current playhead position before updating
      const savedPlayheadPosition = wavesurferRef.current?.getCurrentTime() || 0
      
      // Update the current audio blob with the trimmed version
      // useEffect will automatically reload waveform when currentAudioBlob changes
      setCurrentAudioBlob(trimmedBlob)
      setHasUnsavedChanges(true)
      
      // Clear all regions since they've been applied
      regionsPluginRef.current?.clearRegions()
      setSelectedRegion(null)
      
      setIsProcessing(false)
      
      // Wait for waveform to reload, then restore playhead position
      setTimeout(() => {
        if (wavesurferRef.current && savedPlayheadPosition > 0) {
          const newDuration = wavesurferRef.current.getDuration()
          // Keep position if it's still within the new duration
          if (savedPlayheadPosition < newDuration) {
            wavesurferRef.current.seekTo(savedPlayheadPosition / newDuration)
          }
        }
      }, 200)
      
      console.log(`✅ Audio cut successfully! New duration: ${Math.floor(totalDuration)}s`)
      
    } catch (error) {
      console.error('Error exporting audio:', error)
      alert('Failed to export edited audio. Please try again.')
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleZoomIn = () => {
    if (!wavesurferRef.current) return
    
    // Increase pixels per second to zoom in (show more detail)
    const newZoom = Math.min(zoomLevel * 1.5, 1000) // Max 1000 pixels per second
    setZoomLevel(newZoom)
    wavesurferRef.current.zoom(newZoom)
  }

  const handleZoomOut = () => {
    if (!wavesurferRef.current) return
    
    // Decrease pixels per second to zoom out (show more audio)
    // Calculate minimum based on fitting entire audio in container
    const containerWidth = waveformRef.current?.parentElement?.clientWidth || 800
    const minPxPerSec = Math.max(1, containerWidth / Math.max(duration, 1))
    
    const newZoom = Math.max(zoomLevel / 1.5, minPxPerSec)
    setZoomLevel(newZoom)
    wavesurferRef.current.zoom(newZoom)
  }

  const handleFitToView = () => {
    if (!wavesurferRef.current || !waveformRef.current) return
    
    // Fit entire waveform to container width
    const containerWidth = waveformRef.current.parentElement?.clientWidth || 800
    const newZoom = Math.max(1, containerWidth / Math.max(duration, 1))
    setZoomLevel(newZoom)
    wavesurferRef.current.zoom(newZoom)
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1F1F1F] rounded-2xl p-6 border-2 border-[#333]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Edit Your Recording</h3>
          <span className="text-sm text-neutral-400">
            Duration: {formatTime(duration)}
          </span>
        </div>
        
        {/* Waveform - Container with horizontal scroll */}
        <div className="mb-4 rounded-lg overflow-x-auto overflow-y-hidden bg-black/50 border border-[#333]">
          <div 
            ref={waveformRef}
          />
        </div>
        
        {/* Instructions - Collapsible */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/70 transition-colors text-left"
          >
            <span className="text-sm font-semibold text-white">How to edit</span>
            {showInstructions ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>
          
          {showInstructions && (
            <div className="px-4 pb-4">
              <IconList
                items={[
                  'Mark sections: Click "Mark Section to Cut" to add a red region',
                  'Adjust markers: Drag the edges of red regions to select what to remove',
                  'Preview: Click a region to select and preview that section',
                  'Delete: Click the red X button or press Delete/Backspace on your keyboard',
                  'Multiple cuts: Add more regions to cut multiple sections',
                  'Zoom: Use zoom controls to see fine details or get an overview'
                ]}
                bulletColor="text-primary-500"
                textColor="text-neutral-300"
                spacing="tight"
              />
              <p className="text-[#FFB701] text-sm mt-3 font-medium">
                💡 Red regions show what will be REMOVED. Everything else is kept.
              </p>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Left side - Editing tools */}
          <div className="flex items-center gap-4">
            {/* Play/Pause Button - Circular like countdown timer */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-black rounded-sm" />
                  <div className="w-1 h-4 bg-black rounded-sm" />
                </div>
              ) : (
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              )}
            </button>
            
            {/* Divider */}
            <div className="w-px h-8 bg-neutral-700" />
            
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all duration-300 hover:scale-110 border border-neutral-700"
              title="Zoom Out"
              disabled={duration > 0 && zoomLevel <= Math.max(1, (waveformRef.current?.parentElement?.clientWidth || 800) / duration)}
            >
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            
            <button
              type="button"
              onClick={handleFitToView}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all duration-300 hover:scale-110 border border-neutral-700"
              title="Fit to View"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all duration-300 hover:scale-110 border border-neutral-700"
              title="Zoom In"
              disabled={zoomLevel >= 1000}
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            
            {/* Divider */}
            <div className="w-px h-8 bg-neutral-700" />
            
            {/* Mark Section to Cut - Circular secondary button */}
            <button
              type="button"
              onClick={addRegionToCut}
              className="w-12 h-12 rounded-full bg-secondary-500 hover:bg-secondary-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="Mark Section to Cut"
            >
              <Scissors className="w-5 h-5 text-black" />
            </button>
            
            {/* Delete Selected Region - Circular red button */}
            {selectedRegion && (
              <button
                type="button"
                onClick={deleteSelectedRegion}
                disabled={isProcessing}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cut This Section"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <X className="w-5 h-5 text-white" />
                )}
              </button>
            )}
            
            {/* Clear All - Text button */}
            {regionsPluginRef.current?.getRegions().length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllRegions}
                className="px-3 h-10 text-xs"
                title="Clear All Markers"
              >
                Clear All
              </Button>
            )}
          </div>
          
          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 h-10 text-sm"
            >
              Cancel
            </Button>
            
            {regionsPluginRef.current?.getRegions().length > 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={exportEditedAudio}
                disabled={isProcessing}
                className="px-4 h-10 text-sm gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cutting...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    Cut Sections
                  </>
                )}
              </Button>
            ) : hasUnsavedChanges ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSave(currentAudioBlob)}
                disabled={isProcessing}
                className="px-4 h-10 text-sm gap-2"
              >
                <Save className="w-4 h-4" />
                Save & Close
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave(audioBlob)}
                disabled={isProcessing}
                className="px-4 h-10 text-sm gap-2"
              >
                <Save className="w-4 h-4" />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert AudioBuffer to Blob (WAV format)
async function audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length * numberOfChannels * 2
  const buffer = new ArrayBuffer(44 + length)
  const view = new DataView(buffer)
  const sampleRate = audioBuffer.sampleRate
  
  // Write WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * 2, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, length, true)
  
  // Write audio data
  const channels = []
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i))
  }
  
  let offset = 44
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

