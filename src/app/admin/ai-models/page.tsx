'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge } from '@/lib/design-system/components'
import { AI_MODELS, getFeaturesUsingModel, type AIModelConfig } from '@/lib/ai/config'
import { AdminWrapper } from '@/components/AdminWrapper'

function AIModelsAdminContent() {
  const [models, setModels] = useState<typeof AI_MODELS>(AI_MODELS)
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
          {Object.entries(models).map(([feature, config]) => (
            <Card key={feature} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white capitalize">
                    {feature.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {config.systemPrompt ? 'With system prompt' : 'Simple prompt'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="info">{config.model}</Badge>
                  <Badge variant="neutral">Temp: {config.temperature}</Badge>
                  <Button
                    variant="ghost"
                    onClick={() => handleEditFeature(feature as keyof typeof AI_MODELS)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
          ))}
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
