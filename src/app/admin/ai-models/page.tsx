'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Container, Card, Button, Badge, Input, Textarea, Stack, PageHero } from '@/lib/design-system/components'
import { AI_MODELS, type AIModelConfig } from '@/lib/ai/config'
import { API_ROUTES_REGISTRY, type APIRouteConfig } from '@/lib/ai/api-routes-registry'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ExternalLink, Target, Code, Settings, CheckCircle, AlertCircle } from 'lucide-react'

interface ModelPricing {
  id: string
  model_name: string
  provider: string
  model_family: string | null
  input_price_per_1m: number
  output_price_per_1m: number
  price_per_unit: number | null
  unit_type: string | null
  is_active: boolean
  effective_date: string
  notes: string | null
  // New capability fields
  supports_temperature?: boolean
  supports_json_mode?: boolean
  supports_streaming?: boolean
  is_reasoning_model?: boolean
  max_tokens_param?: string
  token_multiplier?: number
  context_window?: number
  capabilities_notes?: string
}

interface AITool {
  id: string
  tool_key: string
  tool_name: string
  description: string | null
  model_name: string
  temperature: number
  max_tokens: number
  system_prompt: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

function AIModelsAdminContent() {
  const [activeTab, setActiveTab] = useState<'routes' | 'pricing' | 'tools'>('tools')
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
  
  // AI Tools management
  const [tools, setTools] = useState<AITool[]>([])
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null)
  const [editTool, setEditTool] = useState<Partial<AITool>>({})

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

  // Fetch pricing data (needed for tools tab too)
  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchPricing()
    } else if (activeTab === 'tools') {
      fetchTools()
      fetchPricing() // Need pricing for model info in tools tab
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
      input_price_per_1m: model.input_price_per_1m,
      output_price_per_1m: model.output_price_per_1m,
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

  // Fetch AI tools
  const fetchTools = async () => {
    try {
      const res = await fetch('/api/admin/ai-tools')
      if (res.ok) {
        const data = await res.json()
        setTools(data.tools || [])
      } else {
        const data = await res.json()
        console.error('Error fetching tools:', data)
        alert(`Failed to load tools: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching tools:', error)
      alert('Failed to load tools')
    }
  }

  const handleEditTool = (tool: AITool) => {
    setSelectedTool(tool)
    setEditTool({
      model_name: tool.model_name,
      temperature: tool.temperature,
      max_tokens: tool.max_tokens,
      system_prompt: tool.system_prompt,
      is_active: tool.is_active
    })
  }

  const handleSaveTool = async () => {
    if (!selectedTool) return

    try {
      const res = await fetch('/api/admin/ai-tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_key: selectedTool.tool_key,
          ...editTool
        })
      })

      if (res.ok) {
        await fetchTools()
        setSelectedTool(null)
        setEditTool({})
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving tool:', error)
      alert('Failed to save tool')
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
      <Stack gap="lg">
        <PageHero 
          title="AI Models & Configuration" 
          subtitle="Configure AI models, pricing, and tool settings" 
        />

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 mb-6 border-b border-neutral-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tools')}
          className={`pb-3 md:pb-4 px-3 md:px-4 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${
            activeTab === 'tools'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          AI Tools
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`pb-3 md:pb-4 px-3 md:px-4 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Model Pricing & Capabilities
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`pb-3 md:pb-4 px-3 md:px-4 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${
            activeTab === 'routes'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Legacy Routes (Deprecated)
        </button>
      </div>

      {/* AI Tools Tab */}
      {activeTab === 'tools' && (
        <>
          {/* Stats Overview */}
          {tools.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-500 mb-1">{tools.length}</div>
                  <div className="text-sm text-neutral-400">Total AI Tools</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-500 mb-1">
                    {tools.filter(t => t.is_active).length}
                  </div>
                  <div className="text-sm text-neutral-400">Active Tools</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-500 mb-1">
                    {tools.filter(t => !t.model_name.includes('whisper') && !t.model_name.includes('tts') && !t.model_name.includes('dall-e')).length}
                  </div>
                  <div className="text-sm text-neutral-400">Chat Tools</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-500 mb-1">
                    {tools.filter(t => t.model_name.includes('whisper') || t.model_name.includes('tts')).length}
                  </div>
                  <div className="text-sm text-neutral-400">Audio Tools</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FFB701] mb-1">
                    {tools.filter(t => t.model_name.includes('dall-e')).length}
                  </div>
                  <div className="text-sm text-neutral-400">Image Tools</div>
                </div>
              </Card>
            </div>
          )}

          {tools.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-neutral-400 mb-4">
                {pricing.length === 0 ? 'Loading...' : 'No AI tools found in database'}
              </p>
              {pricing.length > 0 && (
                <Button onClick={fetchTools} variant="primary">
                  Refresh
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {tools.map((tool) => {
              const modelInfo = pricing.find(p => p.model_name === tool.model_name)
              
              // Map tools to their API endpoints and usage
              const toolUsage: Record<string, { endpoint: string; filePath: string; usedBy: string[] }> = {
                'life_vision_category_summary': {
                  endpoint: '/api/viva/category-summary',
                  filePath: 'src/app/api/viva/category-summary/route.ts',
                  usedBy: ['/life-vision/new/category/[key]', 'Step 1: Clarity']
                },
                'blueprint_generation': {
                  endpoint: '/api/viva/blueprint',
                  filePath: 'src/app/api/viva/blueprint/route.ts',
                  usedBy: ['/life-vision/new/category/[key]/blueprint', 'Step 3: Blueprint']
                },
                'vision_refinement': {
                  endpoint: '/api/viva/refine-category',
                  filePath: 'src/app/api/viva/refine-category/route.ts',
                  usedBy: ['/life-vision/[id]/refine', 'Vision Refinement']
                },
                'master_vision_assembly': {
                  endpoint: '/api/viva/master-vision',
                  filePath: 'src/app/api/viva/master-vision/route.ts',
                  usedBy: ['/life-vision/new/assembly', 'Step 5: Assembly']
                },
                'prompt_suggestions': {
                  endpoint: '/api/viva/prompt-suggestions',
                  filePath: 'src/app/api/viva/prompt-suggestions/route.ts',
                  usedBy: ['/life-vision/new/category/[key]', 'Personalized Prompts']
                },
                'scene_generation': {
                  endpoint: '/api/viva/scene-generation',
                  filePath: 'src/app/api/viva/scene-generation/route.ts',
                  usedBy: ['/scenes/builder', 'Visualization Scenes']
                },
                'final_assembly': {
                  endpoint: '/api/viva/final-assembly',
                  filePath: 'src/app/api/viva/final-assembly/route.ts',
                  usedBy: ['/life-vision/new/final', 'Step 6: Final Assembly']
                },
                'merge_clarity': {
                  endpoint: '/api/viva/merge-clarity',
                  filePath: 'src/app/api/viva/merge-clarity/route.ts',
                  usedBy: ['/life-vision/new/category/[key]', 'Contrast Flip']
                },
                'north_star_reflection': {
                  endpoint: '/api/vibration/dashboard/category',
                  filePath: 'src/app/api/vibration/dashboard/category/route.ts',
                  usedBy: ['/dashboard/north-star', 'North Star Dashboard']
                },
                'voice_analyzer': {
                  endpoint: '/api/voice-profile/analyze',
                  filePath: 'src/app/api/voice-profile/analyze/route.ts',
                  usedBy: ['/voice-profile', 'Voice Profile Analysis']
                },
                'vibrational_analyzer': {
                  endpoint: '/api/vibration/analyze',
                  filePath: 'src/app/api/vibration/analyze/route.ts',
                  usedBy: ['/life-vision/new', 'Emotional State Analysis']
                },
                'audio_transcription': {
                  endpoint: '/api/transcribe',
                  filePath: 'src/app/api/transcribe/route.ts',
                  usedBy: ['/life-vision/new/category/[key]', '/voice-profile', 'Audio Recording Transcription']
                },
                'audio_generation': {
                  endpoint: '/api/audio/generate',
                  filePath: 'src/app/api/audio/generate/route.ts',
                  usedBy: ['/life-vision/[id]', 'Vision Audio Generation']
                },
                'audio_generation_hd': {
                  endpoint: '/api/audio/generate',
                  filePath: 'src/app/api/audio/generate/route.ts',
                  usedBy: ['/life-vision/[id]', 'High-Quality Vision Audio']
                },
                'image_generation_dalle3': {
                  endpoint: '/api/images/generate',
                  filePath: 'src/app/api/images/generate/route.ts',
                  usedBy: ['/vision-board', 'Vision Board Image Generation']
                },
                'image_generation_dalle2': {
                  endpoint: '/api/images/generate',
                  filePath: 'src/app/api/images/generate/route.ts',
                  usedBy: ['/vision-board', 'Vision Board Image Generation (Legacy)']
                }
              }
              
              const usage = toolUsage[tool.tool_key]
              
              return (
                <Card key={tool.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-semibold text-white">{tool.tool_name}</h3>
                        <Badge variant={tool.is_active ? 'success' : 'warning'}>
                          {tool.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="info" className="text-xs font-mono">
                          {tool.tool_key}
                        </Badge>
                        {/* Tool Type Badge */}
                        {tool.model_name.includes('whisper') && (
                          <Badge variant="accent" className="text-xs">Audio → Text</Badge>
                        )}
                        {tool.model_name.includes('tts') && (
                          <Badge variant="accent" className="text-xs">Text → Audio</Badge>
                        )}
                        {tool.model_name.includes('dall-e') && (
                          <Badge variant="accent" className="text-xs">Text → Image</Badge>
                        )}
                        {!tool.model_name.includes('whisper') && !tool.model_name.includes('tts') && !tool.model_name.includes('dall-e') && (
                          <Badge variant="neutral" className="text-xs">Chat Completion</Badge>
                        )}
                      </div>
                      
                      {tool.description && (
                        <p className="text-sm text-neutral-400 mb-3">{tool.description}</p>
                      )}

                      {/* Configuration Grid */}
                      <div className="mt-4 pt-4 border-t border-neutral-700">
                        <h4 className="text-sm font-medium text-neutral-300 mb-3">Configuration</h4>
                        {(tool.model_name.includes('whisper') || tool.model_name.includes('tts') || tool.model_name.includes('dall-e')) && (
                          <div className="mb-3 p-2 bg-neutral-800 rounded text-xs text-neutral-400">
                            Note: Temperature and max tokens don't apply to {tool.model_name.includes('whisper') ? 'audio transcription' : tool.model_name.includes('tts') ? 'text-to-speech' : 'image generation'} models
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-neutral-400 text-sm">Model</span>
                            <div className="text-white font-mono">{tool.model_name}</div>
                            {modelInfo?.is_reasoning_model && (
                              <Badge variant="accent" className="text-xs mt-1">Reasoning Model</Badge>
                            )}
                          </div>

                          <div>
                            <span className="text-neutral-400 text-sm">Temperature</span>
                            <div className="text-white">{tool.temperature || 'N/A'}</div>
                            {modelInfo && !modelInfo.supports_temperature && tool.temperature > 0 && (
                              <div className="text-xs text-yellow-500 mt-1">Model doesn't support custom temp</div>
                            )}
                          </div>

                          <div>
                            <span className="text-neutral-400 text-sm">Max Tokens</span>
                            <div className="text-white">{tool.max_tokens || 'N/A'}</div>
                            {modelInfo?.token_multiplier && modelInfo.token_multiplier > 1 && (
                              <div className="text-xs text-accent-400 mt-1">×{modelInfo.token_multiplier} (reasoning)</div>
                            )}
                          </div>

                          <div>
                            <span className="text-neutral-400 text-sm">Last Updated</span>
                            <div className="text-white text-sm">
                              {new Date(tool.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Model Capabilities & Pricing */}
                        {modelInfo && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {modelInfo.supports_json_mode && (
                              <Badge variant="success" className="text-xs">JSON Mode</Badge>
                            )}
                            {modelInfo.supports_streaming && (
                              <Badge variant="success" className="text-xs">Streaming</Badge>
                            )}
                            {modelInfo.context_window && (
                              <Badge variant="neutral" className="text-xs">
                                Context: {modelInfo.context_window.toLocaleString()} tokens
                              </Badge>
                            )}
                            {modelInfo.price_per_unit && modelInfo.unit_type && (
                              <Badge variant="info" className="text-xs">
                                ${modelInfo.price_per_unit.toFixed(3)} per {modelInfo.unit_type}
                              </Badge>
                            )}
                            {modelInfo.input_price_per_1m > 0 && (
                              <Badge variant="info" className="text-xs">
                                ${modelInfo.input_price_per_1m.toFixed(2)} / 1M tokens
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Usage Details */}
                      {usage && (
                        <div className="mt-4 pt-4 border-t border-neutral-700">
                          <h4 className="text-sm font-medium text-neutral-300 mb-3">Usage & Integration</h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Code className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-neutral-400 mb-1">API Endpoint</div>
                                <code className="text-sm text-primary-400 font-mono">{usage.endpoint}</code>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-neutral-400 mb-1">File Path</div>
                                <code className="text-xs text-neutral-300 font-mono break-all">{usage.filePath}</code>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <ExternalLink className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-xs text-neutral-400 mb-2">Used By</div>
                                <div className="flex flex-wrap gap-2">
                                  {usage.usedBy.map((page, idx) => (
                                    <Badge key={idx} variant="info" className="text-xs">
                                      {page}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {tool.system_prompt && (
                        <div className="mt-4 pt-4 border-t border-neutral-700">
                          <span className="text-neutral-400 text-sm">System Prompt:</span>
                          <div className="mt-2 p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300 max-h-32 overflow-y-auto">
                            {tool.system_prompt}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTool(tool)}
                      className="ml-4"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
            </div>
          )}

          {/* Tool Edit Modal */}
          {selectedTool && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Edit {selectedTool.tool_name}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        Tool Key (Read-only)
                      </label>
                      <div className="p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300 font-mono">
                        {selectedTool.tool_key}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        Model
                      </label>
                      <select
                        value={editTool.model_name || selectedTool.model_name}
                        onChange={(e) => setEditTool(prev => ({ ...prev, model_name: e.target.value }))}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                      >
                        {pricing.map(model => (
                          <option key={model.model_name} value={model.model_name}>
                            {model.model_name}
                            {model.is_reasoning_model ? ' (Reasoning)' : ''}
                            {!model.is_active ? ' (Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

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
                          value={editTool.temperature ?? selectedTool.temperature}
                          onChange={(e) => setEditTool(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          Note: Some models (like o1) don't support custom temperature
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Max Tokens
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="50000"
                          value={editTool.max_tokens ?? selectedTool.max_tokens}
                          onChange={(e) => setEditTool(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          Base limit (multiplied automatically for reasoning models)
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        System Prompt
                      </label>
                      <Textarea
                        value={editTool.system_prompt ?? selectedTool.system_prompt ?? ''}
                        onChange={(e) => setEditTool(prev => ({ ...prev, system_prompt: e.target.value }))}
                        rows={8}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white font-mono text-sm"
                        placeholder="System prompt for this tool..."
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={editTool.is_active ?? selectedTool.is_active}
                        onChange={(e) => setEditTool(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <label htmlFor="is_active" className="text-sm text-neutral-200">
                        Tool is active (disable to prevent use)
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => { setSelectedTool(null); setEditTool({}) }}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveTool}>
                      Save Tool Configuration
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {activeTab === 'routes' && (
        <>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <span className="text-xs md:text-sm font-medium text-neutral-300 whitespace-nowrap">Filter by Category:</span>
          <div className="flex flex-wrap gap-2">
            {(['all', 'text', 'audio', 'image', 'admin'] as const).map(cat => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterCategory(cat)}
                className="text-xs md:text-sm"
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({cat === 'all' ? API_ROUTES_REGISTRY.length : routesByCategory[cat].length})
              </Button>
            ))}
          </div>
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
            <Card key={route.routePath} className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex-1 w-full lg:w-auto">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                    <h3 className="text-base md:text-lg lg:text-xl font-semibold text-white">{route.routeName}</h3>
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
                  <p className="text-xs md:text-sm text-neutral-400 mb-2">{route.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1 break-all">
                      <Code className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{route.routePath}</span>
                    </span>
                    <span className="flex items-center gap-1 break-all">
                      <Target className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{route.filePath}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
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
        </>
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
                          ${model.input_price_per_1m.toFixed(2)}
                        </div>
                        <div className="text-neutral-500 text-xs">per 1M tokens</div>
                      </div>

                      <div>
                        <span className="text-neutral-400 text-sm">Output Price</span>
                        <div className="text-white font-mono text-lg">
                          ${model.output_price_per_1m.toFixed(2)}
                        </div>
                        <div className="text-neutral-500 text-xs">per 1M tokens</div>
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

                    {/* Model Capabilities */}
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <h4 className="text-sm font-medium text-neutral-300 mb-3">Model Capabilities</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                          {model.supports_temperature ? (
                            <CheckCircle className="w-4 h-4 text-primary-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-neutral-600" />
                          )}
                          <span className="text-sm text-neutral-400">Custom Temperature</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {model.supports_json_mode ? (
                            <CheckCircle className="w-4 h-4 text-primary-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-neutral-600" />
                          )}
                          <span className="text-sm text-neutral-400">JSON Mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {model.supports_streaming ? (
                            <CheckCircle className="w-4 h-4 text-primary-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-neutral-600" />
                          )}
                          <span className="text-sm text-neutral-400">Streaming</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {model.is_reasoning_model ? (
                            <Badge variant="accent" className="text-xs">Reasoning Model</Badge>
                          ) : (
                            <span className="text-sm text-neutral-600">Standard Model</span>
                          )}
                        </div>
                      </div>
                      {model.token_multiplier && model.token_multiplier > 1 && (
                        <div className="mt-2 text-sm text-accent-400">
                          Token Multiplier: ×{model.token_multiplier} (for reasoning overhead)
                        </div>
                      )}
                      {model.context_window && (
                        <div className="mt-2 text-sm text-neutral-400">
                          Context Window: {model.context_window.toLocaleString()} tokens
                        </div>
                      )}
                      {model.capabilities_notes && (
                        <div className="mt-2 p-2 bg-neutral-900 rounded text-xs text-neutral-400">
                          {model.capabilities_notes}
                        </div>
                      )}
                    </div>
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
                          Input Price (per 1M tokens)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editPricing.input_price_per_1m ?? selectedPricing.input_price_per_1m}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, input_price_per_1m: parseFloat(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Output Price (per 1M tokens)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editPricing.output_price_per_1m ?? selectedPricing.output_price_per_1m}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, output_price_per_1m: parseFloat(e.target.value) }))}
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

                    {/* Model Capabilities */}
                    <div className="border-t border-neutral-700 pt-4">
                      <h4 className="text-sm font-medium text-neutral-200 mb-3">Model Capabilities</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="supports_temperature"
                            checked={editPricing.supports_temperature ?? selectedPricing.supports_temperature ?? true}
                            onChange={(e) => setEditPricing(prev => ({ ...prev, supports_temperature: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <label htmlFor="supports_temperature" className="text-sm text-neutral-200">
                            Supports Custom Temperature
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="supports_json_mode"
                            checked={editPricing.supports_json_mode ?? selectedPricing.supports_json_mode ?? true}
                            onChange={(e) => setEditPricing(prev => ({ ...prev, supports_json_mode: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <label htmlFor="supports_json_mode" className="text-sm text-neutral-200">
                            Supports JSON Mode
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="supports_streaming"
                            checked={editPricing.supports_streaming ?? selectedPricing.supports_streaming ?? true}
                            onChange={(e) => setEditPricing(prev => ({ ...prev, supports_streaming: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <label htmlFor="supports_streaming" className="text-sm text-neutral-200">
                            Supports Streaming
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="is_reasoning_model"
                            checked={editPricing.is_reasoning_model ?? selectedPricing.is_reasoning_model ?? false}
                            onChange={(e) => setEditPricing(prev => ({ ...prev, is_reasoning_model: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <label htmlFor="is_reasoning_model" className="text-sm text-neutral-200">
                            Is Reasoning Model (o1, etc.)
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-200 mb-2">
                            Token Multiplier
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={editPricing.token_multiplier ?? selectedPricing.token_multiplier ?? 1}
                            onChange={(e) => setEditPricing(prev => ({ ...prev, token_multiplier: parseInt(e.target.value) }))}
                          />
                          <p className="text-xs text-neutral-500 mt-1">
                            Reasoning models typically need 10x (for thinking tokens)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-200 mb-2">
                            Context Window
                          </label>
                          <Input
                            type="number"
                            min="1000"
                            max="1000000"
                            step="1000"
                            value={editPricing.context_window ?? selectedPricing.context_window ?? 128000}
                            onChange={(e) => setEditPricing(prev => ({ ...prev, context_window: parseInt(e.target.value) }))}
                          />
                          <p className="text-xs text-neutral-500 mt-1">
                            Maximum context size in tokens
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Max Tokens Parameter Name
                        </label>
                        <select
                          value={editPricing.max_tokens_param ?? selectedPricing.max_tokens_param ?? 'max_completion_tokens'}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, max_tokens_param: e.target.value }))}
                          className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                        >
                          <option value="max_tokens">max_tokens (legacy)</option>
                          <option value="max_completion_tokens">max_completion_tokens (current)</option>
                        </select>
                        <p className="text-xs text-neutral-500 mt-1">
                          OpenAI parameter name for token limits
                        </p>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-200 mb-2">
                          Capabilities Notes
                        </label>
                        <Textarea
                          value={editPricing.capabilities_notes ?? selectedPricing.capabilities_notes ?? ''}
                          onChange={(e) => setEditPricing(prev => ({ ...prev, capabilities_notes: e.target.value }))}
                          rows={2}
                          placeholder="Optional notes about model capabilities"
                        />
                      </div>
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
      </Stack>
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
