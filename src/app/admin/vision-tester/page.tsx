'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Container, Card, Button, Spinner } from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { Play, RotateCcw, Clock, FileText, ChevronDown } from 'lucide-react'

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13)

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

interface GenerationResult {
  modelId: string
  text: string
  status: 'idle' | 'streaming' | 'complete' | 'error'
  error?: string
  startTime?: number
  elapsedMs?: number
  wordCount: number
}

interface UserOption {
  id: string
  email: string
  name: string
}

function VisionTesterContent() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(LIFE_CATEGORIES[0]?.key || 'fun')
  const [promptType, setPromptType] = useState<'imagination-starter' | 'category-vision'>('imagination-starter')
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o'])
  const [results, setResults] = useState<Record<string, GenerationResult>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllersRef = useRef<AbortController[]>([])

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true)
      try {
        const res = await fetch('/api/admin/users')
        if (!res.ok) {
          console.error('Failed to load users:', res.status)
          return
        }
        const { users: fetchedUsers } = await res.json()

        if (fetchedUsers && fetchedUsers.length > 0) {
          const mapped: UserOption[] = fetchedUsers.map((u: any) => ({
            id: u.id,
            email: u.email || 'unknown',
            name: u.full_name || u.first_name || u.email || 'Unknown',
          }))
          setUsers(mapped)
          setSelectedUserId(mapped[0].id)
        }
      } catch (err) {
        console.error('Failed to load users:', err)
      } finally {
        setLoadingUsers(false)
        setUsersLoaded(true)
      }
    }
    fetchUsers()
  }, [])

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
    if (!selectedUserId || selectedModels.length === 0) return

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
      }
    })
    setResults(initialResults)

    const streamPromises = selectedModels.map(async (modelId) => {
      const controller = new AbortController()
      abortControllersRef.current.push(controller)

      try {
        const response = await fetch('/api/admin/vision-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            categoryKey: selectedCategory,
            modelName: modelId,
            promptType,
            perspective: 'singular',
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
        <h1 className="text-3xl font-bold text-white mb-2">Vision Tester</h1>
        <p className="text-neutral-400">Compare vision output across AI models using real user data</p>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* User Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">User</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              >
                {loadingUsers && (
                  <option value="">Loading users...</option>
                )}
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || 'Unknown'} ({u.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as typeof selectedCategory)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              >
                {LIFE_CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          {/* Prompt Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Prompt Type</label>
            <div className="flex rounded-lg overflow-hidden border border-neutral-700">
              <button
                onClick={() => setPromptType('imagination-starter')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  promptType === 'imagination-starter'
                    ? 'bg-primary-500/20 text-primary-400 border-r border-neutral-700'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white border-r border-neutral-700'
                }`}
              >
                Get Me Started
              </button>
              <button
                onClick={() => setPromptType('category-vision')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  promptType === 'category-vision'
                    ? 'bg-accent-500/20 text-accent-400'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Category Vision
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedUserId || selectedModels.length === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={Object.keys(results).length === 0 && !isGenerating}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">Models (select 1-4)</label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_MODELS.map(model => {
              const isSelected = selectedModels.includes(model.id)
              return (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  <span className="block">{model.name}</span>
                  <span className={`text-xs mt-0.5 block ${isSelected ? 'text-primary-400' : 'text-neutral-500'}`}>
                    {model.provider} &middot; {model.description}
                  </span>
                </button>
              )
            })}
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
                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                        Streaming
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
                        {result.wordCount} words
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 overflow-y-auto max-h-[600px]">
                  {result.status === 'error' ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">{result.error}</p>
                    </div>
                  ) : result.text ? (
                    <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {result.text}
                    </div>
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
                      <span>{model.id}</span>
                      <span>{result.wordCount} words in {((result.elapsedMs || 0) / 1000).toFixed(1)}s</span>
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
            <Play className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-300 mb-2">Ready to Test</h3>
            <p className="text-sm text-neutral-500">
              Select a user, category, and models above, then hit Generate to compare vision outputs side by side.
            </p>
          </div>
        </Card>
      )}
    </Container>
  )
}

export default function VisionTesterPage() {
  return (
    <AdminWrapper>
      <VisionTesterContent />
    </AdminWrapper>
  )
}
