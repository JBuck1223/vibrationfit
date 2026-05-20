'use client'

import { useState, useRef } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Container, Card, Button, Textarea, Spinner } from '@/lib/design-system/components'
import { Play, RotateCcw, Clock, FileText, Music2 } from 'lucide-react'

interface TestModel {
  id: string
  name: string
  provider: string
  description: string
}

const AVAILABLE_MODELS: TestModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Current baseline' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', description: 'Latest OpenAI' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: 'Top recommendation' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'Anthropic', description: 'Premium tier' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', description: 'Newest, most advanced' },
  { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', description: 'Pro reasoning, flash speed' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Your current winner' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Best price-performance' },
]

const IDEA_PRESETS = [
  'Letting go of who I was to become who I am',
  'Freedom after years of playing small',
  'Missing someone but choosing to keep living',
  'The moment everything changed',
  'Dancing alone in my kitchen at 2am',
  'Driving away from the old life',
  'Teaching my daughter to be brave',
  'Finally choosing myself',
]

interface GenerationResult {
  modelId: string
  text: string
  status: 'idle' | 'streaming' | 'complete' | 'error'
  error?: string
  startTime?: number
  elapsedMs?: number
  wordCount: number
  lineCount: number
}

function SongTesterContent() {
  const [songIdea, setSongIdea] = useState('')
  const [temperature, setTemperature] = useState(0.85)
  const [selectedModels, setSelectedModels] = useState<string[]>(['gemini-2.5-pro'])
  const [results, setResults] = useState<Record<string, GenerationResult>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllersRef = useRef<AbortController[]>([])

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        if (prev.length === 1) return prev
        return prev.filter(id => id !== modelId)
      }
      if (prev.length >= 4) return prev
      return [...prev, modelId]
    })
  }

  const handleGenerate = async () => {
    if (!songIdea.trim() || selectedModels.length === 0) return

    abortControllersRef.current.forEach(ac => ac.abort())
    abortControllersRef.current = []

    setIsGenerating(true)

    const initialResults: Record<string, GenerationResult> = {}
    selectedModels.forEach(modelId => {
      initialResults[modelId] = {
        modelId,
        text: '',
        status: 'streaming',
        startTime: Date.now(),
        wordCount: 0,
        lineCount: 0,
      }
    })
    setResults(initialResults)

    const streamPromises = selectedModels.map(async (modelId) => {
      const controller = new AbortController()
      abortControllersRef.current.push(controller)

      try {
        const response = await fetch('/api/admin/song-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songIdea,
            modelName: modelId,
            temperature,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            fullText += chunk

            setResults(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                text: fullText,
                wordCount: fullText.trim().split(/\s+/).filter(Boolean).length,
                lineCount: fullText.split('\n').filter(l => l.trim()).length,
              },
            }))
          }
        }

        setResults(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            text: fullText,
            status: 'complete',
            elapsedMs: Date.now() - (prev[modelId]?.startTime || Date.now()),
            wordCount: fullText.trim().split(/\s+/).filter(Boolean).length,
            lineCount: fullText.split('\n').filter(l => l.trim()).length,
          },
        }))
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setResults(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            status: 'error',
            error: err.message || 'Generation failed',
            elapsedMs: Date.now() - (prev[modelId]?.startTime || Date.now()),
          },
        }))
      }
    })

    await Promise.allSettled(streamPromises)
    setIsGenerating(false)
  }

  const handleReset = () => {
    abortControllersRef.current.forEach(ac => ac.abort())
    abortControllersRef.current = []
    setResults({})
    setIsGenerating(false)
  }

  const providerColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Anthropic': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'Google': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

  const gridCols = selectedModels.length <= 1 ? 'grid-cols-1'
    : selectedModels.length === 2 ? 'grid-cols-1 lg:grid-cols-2'
    : selectedModels.length === 3 ? 'grid-cols-1 lg:grid-cols-3'
    : 'grid-cols-1 lg:grid-cols-2'

  return (
    <Container size="full" className="py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Song Tester</h1>
        <p className="text-neutral-400">Compare songwriter output across AI models. Uses the singability-first prompt.</p>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-8">
        <div className="space-y-6">
          {/* Song Idea */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Song Idea</label>
            <Textarea
              value={songIdea}
              onChange={e => setSongIdea(e.target.value)}
              placeholder="What's this song about?"
              rows={3}
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {IDEA_PRESETS.map(idea => (
                <button
                  key={idea}
                  onClick={() => setSongIdea(idea)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    songIdea === idea
                      ? 'border-[#39FF14]/50 bg-[#39FF14]/10 text-[#39FF14]'
                      : 'border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Temperature: {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.5}
              max={1.2}
              step={0.05}
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full max-w-xs accent-[#39FF14]"
            />
            <div className="flex justify-between max-w-xs text-xs text-neutral-600 mt-1">
              <span>0.50 (focused)</span>
              <span>1.20 (creative)</span>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">Models (select 1–4)</label>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_MODELS.map(model => {
                const isSelected = selectedModels.includes(model.id)
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-[#39FF14] bg-[#39FF14]/10 text-white'
                        : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                    }`}
                  >
                    <span className="block">{model.name}</span>
                    <span className={`text-xs mt-0.5 block ${isSelected ? 'text-[#39FF14]/70' : 'text-neutral-500'}`}>
                      {model.provider} &middot; {model.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating || !songIdea.trim() || selectedModels.length === 0}
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Songs
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={Object.keys(results).length === 0 && !isGenerating}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Grid */}
      {Object.keys(results).length > 0 && (
        <div className={`grid ${gridCols} gap-6`}>
          {selectedModels.map(modelId => {
            const result = results[modelId]
            const model = AVAILABLE_MODELS.find(m => m.id === modelId)
            if (!result || !model) return null

            return (
              <Card key={modelId} className="p-0 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${providerColor(model.provider)}`}>
                      {model.provider}
                    </span>
                    <span className="text-white font-semibold text-sm">{model.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {result.status === 'streaming' && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                        Writing...
                      </span>
                    )}
                    {result.status === 'complete' && result.elapsedMs && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(result.elapsedMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    {result.wordCount > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {result.wordCount}w / {result.lineCount}L
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 overflow-y-auto max-h-[700px]">
                  {result.status === 'error' ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">{result.error}</p>
                    </div>
                  ) : result.text ? (
                    <pre className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {result.text}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="sm" variant="primary" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                {result.status === 'complete' && (
                  <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{model.id} &middot; temp {temperature}</span>
                      <span>{result.wordCount} words &middot; {result.lineCount} lines &middot; {((result.elapsedMs || 0) / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {Object.keys(results).length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <Music2 className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-300 mb-2">Ready to Test</h3>
            <p className="text-sm text-neutral-500">
              Enter a song idea, pick models, and compare lyrics output side by side.
              Uses the singability-first songwriter prompt.
            </p>
          </div>
        </Card>
      )}
    </Container>
  )
}

export default function SongTesterPage() {
  return (
    <AdminWrapper>
      <SongTesterContent />
    </AdminWrapper>
  )
}
