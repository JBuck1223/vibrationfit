'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Container, Card, Button, Badge, Input, Textarea } from '@/lib/design-system/components'
import { AI_MODELS, type AIModelConfig } from '@/lib/ai/config'
import { API_ROUTES_REGISTRY, type APIRouteConfig } from '@/lib/ai/api-routes-registry'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ExternalLink, Target, Code, Settings, CheckCircle, AlertCircle } from 'lucide-react'

interface ModelPricing {
  id: string
  model_name: string
  provider: string
  model_family: string | null
  input_price_per_1k: number
  output_price_per_1k: number
  price_per_unit: number | null
  unit_type: string | null
  is_active: boolean
  effective_date: string
  notes: string | null
}

function AIModelsAdminContent() {
  const [activeTab, setActiveTab] = useState<'routes' | 'pricing'>('routes')
  const [models, setModels] = useState<typeof AI_MODELS>(AI_MODELS)
  const [overrides, setOverrides] = useState<Array<{ action_type: string; token_value: number }>>([])
  const [newOverride, setNewOverride] = useState<{ action_type: string; token_value: number }>({ action_type: '', token_value: 0 })
  const [selectedRoute, setSelectedRoute] = useState<APIRouteConfig | null>(null)
  const [editConfig, setEditConfig] = useState<Partial<AIModelConfig>>({})
  const [filterCategory, setFilterCategory] = useState<'all' | 'text' | 'audio' | 'image' | 'admin'>('all')
  
  // Pricing management
  const [pricing, setPricing] = useState<ModelPricing[]>([])
  const [selectedPricing, setSelectedPricing] = useState<ModelPricing | null>(null)
  const [editPricing, setEditPricing] = useState<Partial<ModelPricing>>({})

  // Available models for selection
  const availableModels = [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'dall-e-3',
    'dall-e-2',
    'whisper-1',
    'tts-1'
  ]

  // Filter routes by category
  const filteredRoutes = filterCategory === 'all' 
    ? API_ROUTES_REGISTRY 
    : API_ROUTES_REGISTRY.filter(route => route.category === filterCategory)

  // Group routes by category
  const routesByCategory = {
    text: API_ROUTES_REGISTRY.filter(r => r.category === 'text'),
    audio: API_ROUTES_REGISTRY.filter(r => r.category === 'audio'),
    image: API_ROUTES_REGISTRY.filter(r => r.category === 'image'),
    admin: API_ROUTES_REGISTRY.filter(r => r.category === 'admin'),
  }

  const handleEditRoute = (route: APIRouteConfig) => {
    setSelectedRoute(route)
    if (route.modelConfig) {
      setEditConfig(route.modelConfig)
    } else {
      // For non-text routes, create a basic config
      setEditConfig({
        model: route.model || '',
        temperature: 0.7,
        maxTokens: 1000,
      })
    }
  }

  const handleSaveChanges = async () => {
    if (!selectedRoute) return
    
    // If it's a text route with modelConfig, update AI_MODELS
    if (selectedRoute.modelConfig && selectedRoute.routePath.startsWith('/api/')) {
      // Find the matching AI_MODELS key
      const modelKey = Object.keys(AI_MODELS).find(key => {
        const config = AI_MODELS[key as keyof typeof AI_MODELS]
        return config.model === selectedRoute.modelConfig?.model
      })
      
      if (modelKey) {
        // Update the model config (this is client-side only - would need API to persist)
        setModels(prev => ({
          ...prev,
          [modelKey]: {
            ...prev[modelKey as keyof typeof AI_MODELS],
            ...editConfig
          }
        }))
      }
    }
    
    // TODO: Save to database via API endpoint
    console.log('Saving config for route:', selectedRoute.routePath, editConfig)
    
    setSelectedRoute(null)
    setEditConfig({})
  }

  const handleCancelEdit = () => {
    setSelectedRoute(null)
    setEditConfig({})
  }

  // Fetch pricing data
  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchPricing()
    }
  }, [activeTab])

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/admin/ai-pricing')
      if (res.ok) {
        const data = await res.json()
        setPricing(data.pricing || [])
      }
    } catch (error) {
      console.error('Error fetching pricing:', error)
    }
  }

  const handleEditPricing = (model: ModelPricing) => {
    setSelectedPricing(model)
    setEditPricing({
      input_price_per_1k: model.input_price_per_1k,
      output_price_per_1k: model.output_price_per_1k,
      price_per_unit: model.price_per_unit,
      notes: model.notes
    })
  }

  const handleSavePricing = async () => {
    if (!selectedPricing) return

    try {
      const res = await fetch('/api/admin/ai-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_name: selectedPricing.model_name,
          ...editPricing
        })
      })

      if (res.ok) {
        await fetchPricing()
        setSelectedPricing(null)
        setEditPricing({})
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving pricing:', error)
      alert('Failed to save pricing')
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/ai-overrides', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setOverrides(data.overrides || [])
        }
      } catch {}
    })()
  }, [])

  return (
    <Container size="xl">
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4">AI API Routes Management</h1>
        <p className="text-sm md:text-base lg:text-lg text-neutral-400">
          Centralized control of ALL AI API calls across VibrationFit - every route, every model, every configuration
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 md:mb-8">
        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary-500 mb-2">
              {API_ROUTES_REGISTRY.length}
            </div>
            <div className="text-sm text-neutral-400">Total API Routes</div>
          </div>
        </Card>
        
        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-500 mb-2">
              {routesByCategory.text.length}
            </div>
            <div className="text-sm text-neutral-400">Text Routes</div>
          </div>
        </Card>
        
        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-500 mb-2">
              {routesByCategory.audio.length + routesByCategory.image.length}
            </div>
            <div className="text-sm text-neutral-400">Media Routes</div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FFB701] mb-2">
              {API_ROUTES_REGISTRY.filter(r => r.hasTokenTracking).length}
            </div>
            <div className="text-sm text-neutral-400">Routes Tracked</div>
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-neutral-300">Filter by Category:</span>
          {(['all', 'text', 'audio', 'image', 'admin'] as const).map(cat => (
            <Button
              key={cat}
              variant={filterCategory === cat ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({cat === 'all' ? API_ROUTES_REGISTRY.length : routesByCategory[cat].length})
            </Button>
          ))}
        </div>
      </Card>

      {/* Token Overrides */}
      <Card className="p-4 md:p-6 mb-6 md:mb-8">
        <div className="mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Token Overrides (Non-Tokenized Actions)</h3>
          <p className="text-sm text-neutral-400 mb-4">
            Set custom token values for AI features that don't use traditional tokens (DALL-E, TTS, Whisper). 
            These values are used for user billing while real costs are tracked separately.
          </p>
        </div>
        
        {overrides.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-neutral-300 mb-3">Current Overrides</h4>
            {overrides.map((o) => (
              <div key={o.action_type} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{o.action_type}</div>
                  <div className="text-xs text-neutral-400">
                    {o.action_type === 'image_generation' && 'DALL-E image generation'}
                    {o.action_type === 'audio_generation' && 'Text-to-speech audio generation'}
                    {o.action_type === 'transcription' && 'Whisper audio transcription'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-neutral-700 border border-neutral-600 rounded px-3 py-2 w-20 text-white text-center"
                    value={o.token_value}
                    onChange={async (e) => {
                      const val = parseInt(e.target.value || '0', 10)
                      await fetch('/api/admin/ai-overrides', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ action_type: o.action_type, token_value: val })
                      })
                      setOverrides(prev => prev.map(x => x.action_type === o.action_type ? { ...x, token_value: val } : x))
                    }}
                  />
                  <span className="text-xs text-neutral-400">tokens</span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    await fetch(`/api/admin/ai-overrides?action_type=${encodeURIComponent(o.action_type)}`, { method: 'DELETE', credentials: 'include' })
                    setOverrides(prev => prev.filter(x => x.action_type !== o.action_type))
                  }}
                >Delete</Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t border-neutral-700 pt-4">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Add New Override</h4>
          <div className="flex items-center gap-3">
            <select
              className="bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-white flex-1"
              value={newOverride.action_type}
              onChange={(e) => setNewOverride({ ...newOverride, action_type: e.target.value })}
            >
              <option value="">Select action type...</option>
              <option value="image_generation">Image Generation (DALL-E)</option>
              <option value="audio_generation">Audio Generation (TTS)</option>
              <option value="transcription">Audio Transcription (Whisper)</option>
            </select>
            <Input
              type="number"
              placeholder="Token value"
              className="w-32"
              value={newOverride.token_value || ''}
              onChange={(e) => setNewOverride({ ...newOverride, token_value: parseInt(e.target.value || '0', 10) })}
            />
            <Button
              onClick={async () => {
                if (!newOverride.action_type) return
                const res = await fetch('/api/admin/ai-overrides', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(newOverride)
                })
                if (res.ok) {
                  const data = await res.json()
                  setOverrides(prev => [...prev.filter(x => x.action_type !== data.override.action_type), data.override])
                  setNewOverride({ action_type: '', token_value: 0 })
                }
              }}
            >Add Override</Button>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            <strong>Recommended values:</strong> Image Generation: 25, Audio Generation: 1, Transcription: 60
          </div>
        </div>
      </Card>

      {/* All API Routes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">All API Routes ({filteredRoutes.length})</h2>
        </div>

        {filteredRoutes.map((route) => {
          const override = overrides.find(o => o.action_type === route.actionType)
          const modelUsed = route.modelConfig?.model || route.model || 'unknown'
          
          return (
            <Card key={route.routePath} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg md:text-xl font-semibold text-white">{route.routeName}</h3>
                    <Badge variant={route.hasTokenTracking ? 'success' : 'warning'}>
                      {route.hasTokenTracking ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Tracked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Not Tracked
                        </span>
                      )}
                    </Badge>
                    <Badge variant="info">{route.category}</Badge>
                    {route.multipleCalls && (
                      <Badge variant="accent">{route.multipleCalls} AI calls</Badge>
                    )}
                    {route.usesOverride && (
                      <Badge variant="neutral">Uses Override</Badge>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 mb-2">{route.description}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {route.routePath}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {route.filePath}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="info">{modelUsed}</Badge>
                  {route.modelConfig && (
                    <>
                      <Badge variant="neutral">Temp: {route.modelConfig.temperature}</Badge>
                      <Badge variant="neutral">Max: {route.modelConfig.maxTokens}</Badge>
                    </>
                  )}
                  {route.usesOverride && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Override:</span>
                      <input
                        type="number"
                        className="bg-neutral-700 border border-neutral-600 rounded px-2 py-1 w-16 text-white text-center text-xs"
                        value={override?.token_value || ''}
                        placeholder="Set"
                        onChange={async (e) => {
                          const val = parseInt(e.target.value || '0', 10)
                          if (override) {
                            await fetch('/api/admin/ai-overrides', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ action_type: route.actionType, token_value: val })
                            })
                            setOverrides(prev => prev.map(x => x.action_type === route.actionType ? { ...x, token_value: val } : x))
                          } else {
                            const res = await fetch('/api/admin/ai-overrides', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ action_type: route.actionType, token_value: val })
                            })
                            if (res.ok) {
                              const data = await res.json()
                              setOverrides(prev => [...prev.filter(x => x.action_type !== route.actionType), data.override])
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRoute(route)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Configuration Details */}
              {route.modelConfig && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-neutral-700">
                  <div>
                    <span className="text-neutral-400">Model:</span>
                    <span className="text-white ml-2">{route.modelConfig.model}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Temperature:</span>
                    <span className="text-white ml-2">{route.modelConfig.temperature}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Max Tokens:</span>
                    <span className="text-white ml-2">{route.modelConfig.maxTokens}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Action Type:</span>
                    <span className="text-white ml-2">{route.actionType}</span>
                  </div>
                </div>
              )}

              {/* Used By Section */}
              {route.usedBy && route.usedBy.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <div className="flex items-start gap-2">
                    <span className="text-neutral-400 text-sm font-medium">Used By:</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        {route.usedBy.map((page, idx) => (
                          <Badge key={idx} variant="info" className="text-xs">
                            {page}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {route.modelConfig?.systemPrompt && (
                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <span className="text-neutral-400 text-sm">System Prompt:</span>
                  <div className="mt-2 p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300">
                    {route.modelConfig.systemPrompt}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Edit Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Edit {selectedRoute.routeName}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Route Path
                  </label>
                  <div className="p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300 font-mono">
                    {selectedRoute.routePath}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Model
                  </label>
                  <select
                    value={editConfig.model || selectedRoute.model || ''}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                  >
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {selectedRoute.category === 'text' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Temperature
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={editConfig.temperature ?? selectedRoute.modelConfig?.temperature ?? 0.7}
                          onChange={(e) => setEditConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Max Tokens
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="4000"
                          value={editConfig.maxTokens ?? selectedRoute.modelConfig?.maxTokens ?? 1000}
                          onChange={(e) => setEditConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        System Prompt
                      </label>
                      <Textarea
                        value={editConfig.systemPrompt ?? selectedRoute.modelConfig?.systemPrompt ?? ''}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        rows={6}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white font-mono text-sm"
                        placeholder="System prompt..."
                      />
                    </div>
                  </>
                )}

                {selectedRoute.usesOverride && (() => {
                  const routeOverride = overrides.find(o => o.action_type === selectedRoute.actionType)
                  return (
                  <div>
                    <label className="block text-sm font-medium text-neutral-200 mb-2">
                      Token Override Value
                    </label>
                    <Input
                      type="number"
                      value={routeOverride?.token_value || ''}
                      placeholder="Set override value"
                      onChange={async (e) => {
                        const val = parseInt(e.target.value || '0', 10)
                        if (routeOverride) {
                          await fetch('/api/admin/ai-overrides', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ action_type: selectedRoute.actionType, token_value: val })
                          })
                            setOverrides(prev => prev.map(x => x.action_type === selectedRoute.actionType ? { ...x, token_value: val } : x))
                        } else {
                          const res = await fetch('/api/admin/ai-overrides', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ action_type: selectedRoute.actionType, token_value: val })
                          })
                          if (res.ok) {
                            const data = await res.json()
                            setOverrides(prev => [...prev.filter(x => x.action_type !== selectedRoute.actionType), data.override])
                          }
                        }
                      }}
                    />
                  </div>
                  )
                })()}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <>
          <div className="grid grid-cols-1 gap-6">
            {pricing.map((model) => (
              <Card key={model.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{model.model_name}</h3>
                      <Badge variant="neutral" className="text-xs">
                        {model.provider}
                      </Badge>
                      {model.model_family && (
                        <Badge variant="info" className="text-xs">
                          {model.model_family}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <span className="text-neutral-400 text-sm">Input Price</span>
                        <div className="text-white font-mono text-lg">
                          ${model.input_price_per_1k.toFixed(6)}
                        </div>
                        <div className="text-neutral-500 text-xs">per 1K tokens</div>
                      </div>

                      <div>
                        <span className="text-neutral-400 text-sm">Output Price</span>
                        <div className="text-white font-mono text-lg">
                          ${model.output_price_per_1k.toFixed(6)}
                        </div>
                        <div className="text-neutral-500 text-xs">per 1K tokens</div>
                      </div>

                      {model.price_per_unit !== null && (
                        <div>
                          <span className="text-neutral-400 text-sm">Unit Price</span>
                          <div className="text-white font-mono text-lg">
                            ${model.price_per_unit.toFixed(6)}
                          </div>
                          <div className="text-neutral-500 text-xs">per {model.unit_type}</div>
                        </div>
                      )}

                      <div>
                        <span className="text-neutral-400 text-sm">Last Updated</span>
                        <div className="text-white text-sm">
                          {new Date(model.effective_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {model.notes && (
                      <div className="mt-4 p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300">
                        {model.notes}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPricing(model)}
                    className="ml-4"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pricing Edit Modal */}
          {selectedPricing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Edit Pricing for {selectedPricing.model_name}
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Input Price (per 1K tokens)
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={editPricing.input_price_per_1k ?? selectedPricing.input_price_per_1k}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, input_price_per_1k: parseFloat(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Output Price (per 1K tokens)
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={editPricing.output_price_per_1k ?? selectedPricing.output_price_per_1k}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, output_price_per_1k: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>

                    {selectedPricing.unit_type && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Unit Price (per {selectedPricing.unit_type})
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={editPricing.price_per_unit ?? selectedPricing.price_per_unit ?? 0}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) }))}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        Notes
                      </label>
                      <Textarea
                        value={editPricing.notes ?? selectedPricing.notes ?? ''}
                        onChange={(e) => setEditPricing(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        placeholder="Optional notes about this pricing"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => { setSelectedPricing(null); setEditPricing({}) }}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSavePricing}>
                      Save Pricing
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </Container>
  )
}

export default function AIModelsAdminPage() {
  return (
    <AdminWrapper>
      <AIModelsAdminContent />
    </AdminWrapper>
  )
}
