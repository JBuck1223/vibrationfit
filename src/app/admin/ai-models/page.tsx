'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Container, Card, Button, Badge } from '@/lib/design-system/components'
import { AI_MODELS, getFeaturesUsingModel, type AIModelConfig } from '@/lib/ai/config'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ExternalLink, Target } from 'lucide-react'

function AIModelsAdminContent() {
  const [models, setModels] = useState<typeof AI_MODELS>(AI_MODELS)
  const [overrides, setOverrides] = useState<Array<{ action_type: string; token_value: number }>>([])
  const [newOverride, setNewOverride] = useState<{ action_type: string; token_value: number }>({ action_type: '', token_value: 0 })
  const [selectedFeature, setSelectedFeature] = useState<keyof typeof AI_MODELS | null>(null)
  const [editConfig, setEditConfig] = useState<Partial<AIModelConfig>>({})

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
    'dall-e-2'
  ]

  const handleEditFeature = (feature: keyof typeof AI_MODELS) => {
    setSelectedFeature(feature)
    setEditConfig(models[feature])
  }

  const handleSaveChanges = () => {
    if (!selectedFeature) return
    
    setModels(prev => ({
      ...prev,
      [selectedFeature]: {
        ...prev[selectedFeature],
        ...editConfig
      }
    }))
    
    setSelectedFeature(null)
    setEditConfig({})
  }

  const handleCancelEdit = () => {
    setSelectedFeature(null)
    setEditConfig({})
  }

  const resetToDefaults = () => {
    setModels(AI_MODELS)
    setSelectedFeature(null)
    setEditConfig({})
  }

  const getModelUsageCount = (model: string) => {
    return getFeaturesUsingModel(model).length
  }

  const getTotalCostEstimate = () => {
    // Simple cost estimation based on model types
    const costs: Record<string, number> = {
      'gpt-5': 5,
      'gpt-4o': 3,
      'gpt-4o-mini': 1,
      'gpt-4-turbo': 2,
      'gpt-3.5-turbo': 0.5,
      'dall-e-3': 4,
      'dall-e-2': 2
    }
    
    return Object.values(models).reduce((total, config) => {
      return total + (costs[config.model] || 1)
    }, 0)
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
    <Container size="xl" className="py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI Models Configuration</h1>
          <p className="text-lg text-neutral-400">
            Centralized control of AI models across all VibrationFit features
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">
                {Object.keys(models).length}
              </div>
              <div className="text-sm text-neutral-400">AI Features</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-500 mb-2">
                {new Set(Object.values(models).map(m => m.model)).size}
              </div>
              <div className="text-sm text-neutral-400">Unique Models</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-500 mb-2">
                {getTotalCostEstimate()}
              </div>
              <div className="text-sm text-neutral-400">Cost Index</div>
            </div>
          </Card>
        </div>

        {/* Token Overrides */}
        <Card className="p-6 mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white mb-2">Token Overrides (Non-Tokenized Actions)</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Set custom token values for AI features that don't use traditional tokens (DALL-E, TTS, Whisper). 
              These values are used for user billing while real costs are tracked separately for business intelligence.
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
              <input
                type="number"
                placeholder="Token value"
                className="bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-white w-32"
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

        {/* Model Usage Summary */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Model Usage Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableModels.map(model => {
              const usageCount = getModelUsageCount(model)
              if (usageCount === 0) return null
              
              return (
                <div key={model} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <span className="font-medium text-white">{model}</span>
                  <Badge variant={usageCount > 2 ? 'success' : 'info'}>
                    {usageCount} feature{usageCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Features Configuration */}
        <div className="space-y-6">
          {Object.entries(models).map(([feature, config]) => {
            // Map features to their tool access URLs
            const toolLinks: Record<string, { label: string; href: string }> = {
              'LIFE_VISION_CATEGORY_SUMMARY': { label: 'Life Vision Creation Tool', href: '/life-vision/new' },
              'LIFE_VISION_MASTER_ASSEMBLY': { label: 'Life Vision Creation Tool', href: '/life-vision/new/assembly' },
              'PROMPT_SUGGESTIONS': { label: 'Life Vision Creation Tool', href: '/life-vision/new' },
              'VISION_GENERATION': { label: 'Vision Builder', href: '/vision/build' },
              'VISION_REFINEMENT': { label: 'Vision Builder', href: '/vision/build' },
              'BLUEPRINT_GENERATION': { label: 'Vibe Assistant', href: '/dashboard/vibe-assistant-usage' },
              'CHAT_CONVERSATION': { label: 'Vibe Assistant', href: '/dashboard/vibe-assistant-usage' },
              'AUDIO_GENERATION': { label: 'Audio Mixer', href: '/admin/audio-mixer' },
              'IMAGE_GENERATION': { label: 'Vision Board', href: '/vision-board' },
              'ASSESSMENT_SCORING': { label: 'Assessment', href: '/assessment' },
            }
            
            const toolLink = toolLinks[feature]
            
            return (
            <Card key={feature} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-semibold text-white capitalize">
                      {feature.replace(/_/g, ' ')}
                    </h3>
                    {toolLink && (
                      <Link 
                        href={toolLink.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#00FFFF] hover:text-[#39FF14] hover:bg-[#00FFFF]/10 rounded-lg border border-[#00FFFF]/30 hover:border-[#00FFFF]/50 transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>{toolLink.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400">
                    {config.systemPrompt ? 'With system prompt' : 'Simple prompt'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="info">{config.model}</Badge>
                  <Badge variant="neutral">Temp: {config.temperature}</Badge>
                  {(['IMAGE_GENERATION', 'AUDIO_GENERATION'].includes(feature)) && (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        const actionType = feature === 'IMAGE_GENERATION' ? 'image_generation' : 'audio_generation'
                        const existingOverride = overrides.find(o => o.action_type === actionType)
                        if (existingOverride) {
                          // Edit existing override
                          const newValue = prompt(`Enter token value for ${feature.replace(/_/g, ' ').toLowerCase()}:`, existingOverride.token_value.toString())
                          if (newValue && !isNaN(parseInt(newValue))) {
                            fetch('/api/admin/ai-overrides', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ action_type: actionType, token_value: parseInt(newValue) })
                            }).then(() => {
                              setOverrides(prev => prev.map(x => x.action_type === actionType ? { ...x, token_value: parseInt(newValue) } : x))
                            })
                          }
                        } else {
                          // Create new override
                          const newValue = prompt(`Enter token value for ${feature.replace(/_/g, ' ').toLowerCase()}:`, '25')
                          if (newValue && !isNaN(parseInt(newValue))) {
                            fetch('/api/admin/ai-overrides', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ action_type: actionType, token_value: parseInt(newValue) })
                            }).then(res => res.json()).then(data => {
                              if (data.override) {
                                setOverrides(prev => [...prev.filter(x => x.action_type !== actionType), data.override])
                              }
                            })
                          }
                        }
                      }}
                    >
                      Set Tokens
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => handleEditFeature(feature as keyof typeof AI_MODELS)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Model:</span>
                  <span className="text-white ml-2">{config.model}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Temperature:</span>
                  <span className="text-white ml-2">{config.temperature}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Max Tokens:</span>
                  <span className="text-white ml-2">{config.maxTokens}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Token Override:</span>
                  <span className="text-white ml-2">
                    {(() => {
                      // Map feature names to action types
                      const featureToActionType: Record<string, string> = {
                        'LIFE_VISION_CATEGORY_SUMMARY': 'life_vision_category_summary',
                        'LIFE_VISION_MASTER_ASSEMBLY': 'life_vision_master_assembly',
                        'PROMPT_SUGGESTIONS': 'prompt_suggestions',
                        'ASSESSMENT_SCORING': 'assessment_scoring',
                        'VISION_GENERATION': 'vision_generation',
                        'VISION_REFINEMENT': 'vision_refinement',
                        'BLUEPRINT_GENERATION': 'blueprint_generation',
                        'CHAT_CONVERSATION': 'chat_conversation',
                        'AUDIO_GENERATION': 'audio_generation',
                        'IMAGE_GENERATION': 'image_generation'
                      }
                      
                      const actionType = featureToActionType[feature]
                      const override = overrides.find(o => o.action_type === actionType)
                      
                      if (override) {
                        return `${override.token_value} tokens`
                      } else if (['IMAGE_GENERATION', 'AUDIO_GENERATION'].includes(feature)) {
                        return 'Not set (uses estimation)'
                      } else {
                        return 'Uses native tokens'
                      }
                    })()}
                  </span>
                </div>
              </div>

              {config.systemPrompt && (
                <div className="mt-4">
                  <span className="text-neutral-400 text-sm">System Prompt:</span>
                  <div className="mt-2 p-3 bg-neutral-800 rounded-lg text-sm text-neutral-300">
                    {config.systemPrompt}
                  </div>
                </div>
              )}
            </Card>
            )
          })}
        </div>

        {/* Edit Modal */}
        {selectedFeature && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Edit {selectedFeature.replace(/_/g, ' ')}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-200 mb-2">
                      Model
                    </label>
                    <select
                      value={editConfig.model || models[selectedFeature].model}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                    >
                      {availableModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        Temperature
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={editConfig.temperature ?? models[selectedFeature].temperature}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4000"
                        value={editConfig.maxTokens ?? models[selectedFeature].maxTokens}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-200 mb-2">
                      System Prompt
                    </label>
                    <textarea
                      value={editConfig.systemPrompt ?? models[selectedFeature].systemPrompt ?? ''}
                      onChange={(e) => setEditConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      rows={4}
                      className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                      placeholder="Optional system prompt..."
                    />
                  </div>
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

        {/* Reset Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
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
