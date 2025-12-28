"use client"

import React, { useState } from 'react'
import { Button, Card, Container, Stack, Badge, PageHero, Spinner } from '@/lib/design-system/components'
import { Music, Zap, CheckCircle, AlertCircle, Upload, Database, Download, Sparkles, Brain, Waves, Play } from 'lucide-react'

interface GenerationJob {
  id: string
  type: 'solfeggio' | 'binaural' | 'noise'
  status: 'idle' | 'generating' | 'uploading' | 'inserting' | 'complete' | 'error'
  progress: number
  totalFiles: number
  completedFiles: number
  currentFile?: string
  error?: string
  startTime?: number
  endTime?: number
}

const SOLFEGGIO_INFO = [
  { hz: 174, name: 'Pain Relief', color: 'bg-red-500/20 text-red-400' },
  { hz: 285, name: 'Tissue Healing', color: 'bg-orange-500/20 text-orange-400' },
  { hz: 396, name: 'Liberation', color: 'bg-yellow-500/20 text-yellow-400' },
  { hz: 417, name: 'Change', color: 'bg-green-500/20 text-green-400' },
  { hz: 432, name: 'Natural Tuning', color: 'bg-emerald-500/20 text-emerald-400' },
  { hz: 528, name: 'DNA Repair', color: 'bg-teal-500/20 text-teal-400' },
  { hz: 639, name: 'Connection', color: 'bg-blue-500/20 text-blue-400' },
  { hz: 741, name: 'Awakening', color: 'bg-indigo-500/20 text-indigo-400' },
  { hz: 852, name: 'Spiritual Order', color: 'bg-purple-500/20 text-purple-400' },
  { hz: 963, name: 'Divine Connection', color: 'bg-pink-500/20 text-pink-400' },
  { hz: 1024, name: 'Cosmic Unity', color: 'bg-violet-500/20 text-violet-400' }
]

const BRAINWAVE_STATES = [
  { name: 'Delta', hz: 2, range: '0.5-4 Hz', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Theta', hz: 6, range: '4-8 Hz', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Alpha', hz: 10, range: '8-13 Hz', color: 'bg-green-500/20 text-green-400' },
  { name: 'Beta', hz: 15, range: '13-18 Hz', color: 'bg-yellow-500/20 text-yellow-400' }
]

const JOURNEYS = [
  { name: 'Sleep Journey', duration: '7 min', description: 'Gentle progression into deep sleep' },
  { name: 'Meditation Journey', duration: '7 min', description: 'Deep meditation progression' },
  { name: 'Focus Journey', duration: '7 min', description: 'Peak concentration flow state' },
  { name: 'Healing Journey', duration: '7 min', description: 'Complete healing activation' }
]

export default function AudioGeneratorPage() {
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [ffmpegStatus, setFfmpegStatus] = useState<any>(null)
  const [testingFFmpeg, setTestingFFmpeg] = useState(false)
  
  // Solfeggio selections
  const [selectedSolfeggio, setSelectedSolfeggio] = useState<number[]>([528, 639, 741]) // Default: DNA, Connection, Awakening
  const [selectedBrainwaves, setSelectedBrainwaves] = useState<string[]>(['Theta', 'Alpha']) // Default: Meditation, Focus (MUST match BRAINWAVE_STATES.name)
  
  const testFFmpeg = async () => {
    setTestingFFmpeg(true)
    try {
      const response = await fetch('/api/audio/test-ffmpeg')
      const data = await response.json()
      setFfmpegStatus(data)
    } catch (error: any) {
      setFfmpegStatus({ success: false, message: 'Failed to test FFmpeg', error: error.message })
    } finally {
      setTestingFFmpeg(false)
    }
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }
  
  const toggleSolfeggio = (hz: number) => {
    setSelectedSolfeggio(prev =>
      prev.includes(hz) ? prev.filter(f => f !== hz) : [...prev, hz]
    )
  }
  
  const toggleBrainwave = (name: string) => {
    setSelectedBrainwaves(prev =>
      prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]
    )
  }
  
  const selectAllSolfeggio = () => {
    setSelectedSolfeggio(SOLFEGGIO_INFO.map(s => s.hz))
  }
  
  const selectNoneSolfeggio = () => {
    setSelectedSolfeggio([])
  }
  
  const selectAllBrainwaves = () => {
    setSelectedBrainwaves(BRAINWAVE_STATES.map(b => b.name))
  }
  
  const selectNoneBrainwaves = () => {
    setSelectedBrainwaves([])
  }
  
  const getTotalFiles = () => {
    // Pure Solfeggio (no brainwave) + Solfeggio×Brainwave combinations
    const pureSolfeggio = selectedSolfeggio.length
    const combinations = selectedSolfeggio.length * selectedBrainwaves.length
    return pureSolfeggio + combinations
  }

  const startGeneration = async (type: 'solfeggio' | 'binaural' | 'noise') => {
    const totalFiles = type === 'solfeggio' ? getTotalFiles() : type === 'noise' ? 3 : 6
    
    if (type === 'solfeggio' && selectedSolfeggio.length === 0) {
      alert('Please select at least one Solfeggio frequency')
      return
    }
    
    const newJob: GenerationJob = {
      id: Date.now().toString(),
      type,
      status: 'generating',
      progress: 0,
      totalFiles,
      completedFiles: 0,
      startTime: Date.now()
    }
    
    setJob(newJob)
    setLogs([])
    addLog(`Starting generation...`)
    addLog(`Pure Solfeggio: ${selectedSolfeggio.length} tracks`)
    if (selectedBrainwaves.length > 0) {
      addLog(`Solfeggio + Binaural: ${selectedSolfeggio.length} × ${selectedBrainwaves.length} = ${selectedSolfeggio.length * selectedBrainwaves.length} tracks`)
    }
    
    try {
      // Call API to start generation
      const response = await fetch('/api/audio/generate-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type,
          selectedSolfeggio,
          selectedBrainwaves
        })
      })
      
      if (!response.ok) {
        throw new Error('Generation failed')
      }
      
      // Stream progress updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                console.log('[Generator]', data) // Debug log
                
                if (data.type === 'progress') {
                  setJob(prev => prev ? {
                    ...prev,
                    progress: data.progress,
                    completedFiles: data.completed,
                    currentFile: data.currentFile
                  } : null)
                  addLog(data.message)
                } else if (data.type === 'status') {
                  setJob(prev => prev ? { ...prev, status: data.status } : null)
                  addLog(data.message)
                } else if (data.type === 'complete') {
                  setJob(prev => prev ? {
                    ...prev,
                    status: 'complete',
                    progress: 100,
                    completedFiles: totalFiles,
                    endTime: Date.now()
                  } : null)
                  addLog('Generation complete!')
                  addLog(`Generated ${totalFiles} files`)
                  addLog('All tracks uploaded to S3 and added to database!')
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (parseError) {
                console.error('Error parsing SSE:', parseError)
              }
            }
          }
        }
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`)
      setJob(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message
      } : null)
    }
  }

  const getStatusIcon = (status: GenerationJob['status']) => {
    switch (status) {
      case 'generating': return <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
      case 'uploading': return <Upload className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'inserting': return <Database className="w-5 h-5 text-green-500 animate-pulse" />
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <Music className="w-5 h-5 text-neutral-400" />
    }
  }

  const getStatusText = (status: GenerationJob['status']) => {
    switch (status) {
      case 'generating': return 'Generating tracks...'
      case 'uploading': return 'Uploading to S3...'
      case 'inserting': return 'Adding to database...'
      case 'complete': return 'Complete!'
      case 'error': return 'Error'
      default: return 'Ready'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN TOOLS"
          title="Audio Track Generator"
          subtitle="Generate healing frequency tracks with one click"
        />

        {/* FFmpeg Status Check */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">System Check</h3>
              <p className="text-sm text-neutral-400">Verify FFmpeg is available on server</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={testFFmpeg}
              disabled={testingFFmpeg}
            >
              {testingFFmpeg ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Testing...
                </>
              ) : (
                'Test FFmpeg'
              )}
            </Button>
          </div>
          
          {ffmpegStatus && (
            <div className={`p-4 rounded-lg border ${
              ffmpegStatus.success 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {ffmpegStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${ffmpegStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                    {ffmpegStatus.message}
                  </p>
                  {ffmpegStatus.version && (
                    <p className="text-sm text-neutral-300 mt-1">{ffmpegStatus.version}</p>
                  )}
                  {ffmpegStatus.error && (
                    <p className="text-sm text-red-300 mt-1 font-mono">{ffmpegStatus.error}</p>
                  )}
                  {ffmpegStatus.help && (
                    <p className="text-sm text-neutral-400 mt-2">{ffmpegStatus.help}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Current Job Status */}
        {job && (
          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4 mb-4">
              {getStatusIcon(job.status)}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{getStatusText(job.status)}</h3>
                <p className="text-sm text-neutral-400">
                  {job.completedFiles} / {job.totalFiles} files
                  {job.currentFile && ` · ${job.currentFile}`}
                </p>
              </div>
              {job.startTime && job.status !== 'complete' && (
                <div className="text-sm text-neutral-400">
                  {formatDuration(Date.now() - job.startTime)}
                </div>
              )}
              {job.endTime && job.startTime && (
                <Badge variant="success">
                  Completed in {formatDuration(job.endTime - job.startTime)}
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden mb-4">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${job.progress}%` }}
              />
            </div>

            {/* Logs */}
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-neutral-700 max-h-64 overflow-y-auto">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="text-neutral-300">{log}</div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Generation Options */}
        <Card variant="elevated" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Solfeggio Frequency Generator</h3>
                <p className="text-sm text-neutral-400">Pure tones & binaural combinations · {getTotalFiles()} files</p>
              </div>
            </div>

            <div className="space-y-6 mb-6">
              {/* Solfeggio Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <p className="text-sm font-medium text-white">Solfeggio Frequencies ({selectedSolfeggio.length}/11)</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllSolfeggio}
                      className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
                    >
                      All
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      onClick={selectNoneSolfeggio}
                      className="text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SOLFEGGIO_INFO.map((freq) => (
                    <button
                      key={freq.hz}
                      onClick={() => toggleSolfeggio(freq.hz)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedSolfeggio.includes(freq.hz)
                          ? freq.color + ' border-2 border-current'
                          : 'bg-neutral-800 text-neutral-500 border-2 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      {freq.hz} Hz
                    </button>
                  ))}
                </div>
              </div>

              {/* Brainwave Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <p className="text-sm font-medium text-white">Brainwave States ({selectedBrainwaves.length}/4)</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllBrainwaves}
                      className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
                    >
                      All
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      onClick={selectNoneBrainwaves}
                      className="text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BRAINWAVE_STATES.map((state) => (
                    <button
                      key={state.name}
                      onClick={() => toggleBrainwave(state.name)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        selectedBrainwaves.includes(state.name)
                          ? state.color + ' border-2 border-current'
                          : 'bg-neutral-800 text-neutral-500 border-2 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-semibold">{state.name} ({state.hz} Hz)</div>
                      <div className="text-xs opacity-75">{state.range}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className={`p-3 rounded-lg border ${
                selectedSolfeggio.length === 0
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-neutral-900/60 border-neutral-700'
              }`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Total tracks to generate:</span>
                  <span className="text-white font-semibold text-lg">{getTotalFiles()}</span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {selectedSolfeggio.length} pure Solfeggio
                  {selectedBrainwaves.length > 0 && ` + ${selectedSolfeggio.length} × ${selectedBrainwaves.length} = ${selectedSolfeggio.length * selectedBrainwaves.length} with binaural`}
                </div>
                {selectedSolfeggio.length === 0 && (
                  <div className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Select at least one Solfeggio frequency
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => startGeneration('solfeggio')}
              disabled={job?.status === 'generating' || job?.status === 'uploading' || job?.status === 'inserting' || getTotalFiles() === 0}
              title={getTotalFiles() === 0 ? 'Select frequencies and brainwave states to generate tracks' : undefined}
            >
              {job?.type === 'solfeggio' && job.status !== 'complete' && job.status !== 'error' ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : getTotalFiles() === 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Select Tracks to Generate
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate {getTotalFiles()} Track{getTotalFiles() !== 1 ? 's' : ''}
                </>
              )}
            </Button>
        </Card>

        {/* Noise Generator */}
        <Card variant="elevated" className="p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Waves className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">Ambient Sound Generator</h3>
              <p className="text-sm text-neutral-400">White, Pink, Brown Noise, Rain & Ocean Waves · 5 files</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium text-white">What Gets Generated:</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">White Noise</span>
                  <Badge variant="neutral">Focus & Masking</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Pink Noise</span>
                  <Badge variant="neutral">Sleep & Relaxation</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Brown Noise</span>
                  <Badge variant="neutral">Deep Focus</Badge>
                </div>
              </div>
            </div>

            <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-700">
              <p className="text-xs text-neutral-400">
                Noise tracks are broadband sounds perfect for masking distractions, improving focus, and aiding sleep. Each is 5 minutes long and can be looped.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => startGeneration('noise')}
            disabled={job?.status === 'generating' || job?.status === 'uploading' || job?.status === 'inserting'}
          >
            {job?.type === 'noise' && job.status !== 'complete' && job.status !== 'error' ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate 5 Ambient Tracks
              </>
            )}
          </Button>
        </Card>

        {/* Info Card */}
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
          <div className="space-y-3 text-sm text-neutral-400">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-500 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-white">Generation</p>
                <p>FFmpeg generates audio files with precise frequencies using binaural beat technology</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-500 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-white">Upload to S3</p>
                <p>Files are automatically uploaded to your S3 bucket with proper caching and CDN configuration</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-500 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-white">Database Insertion</p>
                <p>Track metadata is automatically added to the audio_background_tracks table</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-500 font-semibold">4</span>
              </div>
              <div>
                <p className="font-medium text-white">Ready to Use</p>
                <p>Tracks immediately appear in the audio mixer and are available for users to mix</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">⚙️ System Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-white mb-2">Server Requirements:</p>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>FFmpeg installed on server</li>
                <li>Node.js 18+ runtime</li>
                <li>100MB+ free disk space</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-white mb-2">AWS Requirements:</p>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>S3 bucket access</li>
                <li>CloudFront CDN configured</li>
                <li>Public read permissions</li>
              </ul>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

