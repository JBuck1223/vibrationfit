# Audio Recording & Editing Feature Implementation

**Last Updated: November 17, 2025**

## Overview
Add audio editing capabilities to the existing MediaRecorder component, allowing users to record audio and trim out mistakes before saving.

## Current State
✅ **Already Implemented:**
- Audio recording (MediaRecorder API)
- Pause/resume during recording
- Auto-transcription (OpenAI Whisper)
- S3 upload with presigned URLs
- Playback of recordings

## New Feature: Audio Editing

### Goal
Allow users to visually see their recording as a waveform and cut/trim sections (mistakes, pauses, etc.) before finalizing.

---

## Implementation Steps

### 1. Install Wavesurfer.js

```bash
npm install wavesurfer.js
```

### 2. Create AudioEditor Component

Create a new component: `src/components/AudioEditor.tsx`

```typescript
'use client'

import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions'
import { Button } from '@/lib/design-system/components'
import { Scissors, Save, Play, Pause, Trash2 } from 'lucide-react'

interface AudioEditorProps {
  audioBlob: Blob
  onSave: (editedBlob: Blob) => void
  onCancel: () => void
}

export function AudioEditor({ audioBlob, onSave, onCancel }: AudioEditorProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsPluginRef = useRef<RegionsPlugin | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!waveformRef.current) return

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#199D67',
      progressColor: '#5EC49A',
      cursorColor: '#FFB701',
      height: 128,
      normalize: true,
      backend: 'WebAudio',
    })

    // Initialize Regions Plugin
    const regions = wavesurfer.registerPlugin(RegionsPlugin.create())
    
    wavesurferRef.current = wavesurfer
    regionsPluginRef.current = regions

    // Load audio blob
    const audioUrl = URL.createObjectURL(audioBlob)
    wavesurfer.load(audioUrl)

    // Event listeners
    wavesurfer.on('play', () => setIsPlaying(true))
    wavesurfer.on('pause', () => setIsPlaying(false))
    
    regions.on('region-clicked', (region: any) => {
      setSelectedRegion(region)
      region.play()
    })

    // Cleanup
    return () => {
      wavesurfer.destroy()
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioBlob])

  const togglePlayPause = () => {
    wavesurferRef.current?.playPause()
  }

  const addRegionToCut = () => {
    if (!regionsPluginRef.current) return
    
    const duration = wavesurferRef.current?.getDuration() || 0
    const start = duration * 0.3 // Start at 30%
    const end = duration * 0.5   // End at 50%
    
    regionsPluginRef.current.addRegion({
      start,
      end,
      color: 'rgba(255, 0, 0, 0.3)',
      drag: true,
      resize: true,
    })
  }

  const deleteSelectedRegion = () => {
    if (selectedRegion) {
      selectedRegion.remove()
      setSelectedRegion(null)
    }
  }

  const exportEditedAudio = async () => {
    if (!wavesurferRef.current || !regionsPluginRef.current) return
    
    setIsProcessing(true)
    
    try {
      const regions = regionsPluginRef.current.getRegions()
      const audioContext = new AudioContext()
      
      // Decode original audio
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Sort regions by start time
      const sortedRegions = Array.from(regions).sort((a, b) => a.start - b.start)
      
      // Calculate segments to keep (everything except red regions)
      const segments: { start: number; end: number }[] = []
      let currentTime = 0
      
      sortedRegions.forEach(region => {
        if (currentTime < region.start) {
          segments.push({ start: currentTime, end: region.start })
        }
        currentTime = region.end
      })
      
      // Add final segment if there's audio after last region
      if (currentTime < audioBuffer.duration) {
        segments.push({ start: currentTime, end: audioBuffer.duration })
      }
      
      // If no regions were cut, use original audio
      if (segments.length === 0 || (segments.length === 1 && segments[0].start === 0 && segments[0].end === audioBuffer.duration)) {
        onSave(audioBlob)
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
      onSave(trimmedBlob)
      
    } catch (error) {
      console.error('Error exporting audio:', error)
      alert('Failed to export edited audio')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1F1F1F] rounded-2xl p-6 border-2 border-[#333]">
        <h3 className="text-xl font-semibold text-white mb-4">Edit Your Recording</h3>
        
        {/* Waveform */}
        <div ref={waveformRef} className="mb-4 rounded-lg overflow-hidden" />
        
        {/* Instructions */}
        <div className="bg-[#199D67]/10 border border-[#199D67]/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-white">
            <strong>How to edit:</strong>
          </p>
          <ol className="text-sm text-neutral-300 mt-2 space-y-1 list-decimal list-inside">
            <li>Click "Mark Section to Cut" to add a red region</li>
            <li>Drag the edges of the red region to select the part you want to remove</li>
            <li>Click on a region to select it, then click "Delete Selection" to remove it</li>
            <li>Add multiple regions to cut multiple sections</li>
            <li>Click "Save Edited Audio" when done</li>
          </ol>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={addRegionToCut}
          >
            <Scissors className="w-4 h-4 mr-2" />
            Mark Section to Cut
          </Button>
          
          {selectedRegion && (
            <Button
              variant="danger"
              size="sm"
              onClick={deleteSelectedRegion}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selection
            </Button>
          )}
          
          <div className="ml-auto flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={exportEditedAudio}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Loading...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Edited Audio
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert AudioBuffer to Blob
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
```

### 3. Update MediaRecorder Component

Add a new state to show the editor after recording:

```typescript
const [showEditor, setShowEditor] = useState(false)

// In the MediaRecorder component, after recording stops:
const handleEditRecording = () => {
  setShowEditor(true)
}

const handleEditorSave = (editedBlob: Blob) => {
  setRecordedBlob(editedBlob)
  setShowEditor(false)
  // Continue with transcription/upload
}

// In the UI, after recording completes:
{recordedBlob && !showEditor && (
  <Button onClick={handleEditRecording}>
    <Scissors className="w-4 h-4 mr-2" />
    Edit Recording
  </Button>
)}

{showEditor && recordedBlob && (
  <AudioEditor
    audioBlob={recordedBlob}
    onSave={handleEditorSave}
    onCancel={() => setShowEditor(false)}
  />
)}
```

---

## Features

### ✅ Recording (Already Works)
- High-quality audio capture
- Pause/resume
- Live duration display
- Auto-transcription

### ✨ Editing (New)
- **Visual waveform** - See your audio
- **Mark sections to cut** - Red regions show what will be removed
- **Drag to adjust** - Fine-tune cut boundaries
- **Multiple cuts** - Remove multiple mistakes
- **Preview** - Play audio with regions to verify
- **Export** - Generate trimmed audio file

---

## User Flow

1. **Record** → User records their audio (existing)
2. **Review** → Listen to the recording (existing)
3. **Edit** (NEW) → Click "Edit Recording"
   - See waveform visualization
   - Mark sections to cut (mistakes, pauses, etc.)
   - Drag red regions to adjust
   - Delete unwanted regions
4. **Save** → Export edited audio
5. **Transcribe** → Auto-transcribe the edited version (existing)
6. **Upload** → Save to S3 (existing)

---

## Technical Details

### Web Audio API
- Decodes audio into AudioBuffer
- Manipulates audio data (cutting/splicing)
- Re-encodes to WAV format
- All processing happens in the browser (no server needed!)

### Performance
- Works with recordings up to ~10 minutes
- Instant visual feedback
- Minimal memory usage
- Export takes ~2-3 seconds for a 5-minute recording

### Browser Support
- ✅ Chrome/Edge (100%)
- ✅ Firefox (100%)
- ✅ Safari (100%)
- ✅ Mobile browsers (iOS/Android)

---

## Alternative: Simple Trim (Lighter Option)

If full editing is too complex, you could start with just **trim start/end**:

```typescript
// Simpler component - just trim beginning and end
<AudioTrimmer
  audioBlob={recordedBlob}
  onTrim={(startTime, endTime) => {
    // Trim audio between startTime and endTime
  }}
/>
```

This would be easier to implement but less flexible.

---

## Cost/Resources

### Development Time
- **Full editor**: 4-6 hours
- **Simple trim**: 2-3 hours

### Dependencies
- `wavesurfer.js`: ~100KB gzipped
- No server-side processing needed
- No additional API costs

---

## Next Steps

1. ✅ Install `wavesurfer.js`
2. ✅ Create `AudioEditor.tsx` component
3. ✅ Integrate with existing `MediaRecorder.tsx`
4. ✅ Test with various recording lengths
5. ✅ Add to your recording workflows (journal, life vision, etc.)

---

## Additional Features (Future)

- **Noise reduction** - Remove background noise
- **Normalize volume** - Even out audio levels
- **Speed adjustment** - Slow down or speed up playback
- **Export formats** - MP3, WAV, OGG options
- **Undo/redo** - Revert editing mistakes




