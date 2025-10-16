'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/lib/design-system/components'
import { Badge } from '@/lib/design-system/components'
import { Button } from '@/lib/design-system/components'
import { Spinner } from '@/lib/design-system/components'
import { Activity, Brain, DollarSign, Zap } from 'lucide-react'

interface TokenSummary {
  total_tokens: number
  actions_count: number
  model_breakdown: Record<string, { tokens: number; count: number }>
  daily_usage: Record<string, { tokens: number; count: number }>
}

export default function AITokenUsage() {
  const [summary, setSummary] = useState<TokenSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchTokenUsage()
  }, [days])

  const fetchTokenUsage = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tokens/my-usage?days=${days}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch token usage')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Removed cost formatting from end-user view

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <Card variant="elevated">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Token Usage</h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
            <span className="ml-3 text-neutral-400">Loading usage data...</span>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="elevated">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Token Usage</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-red-400 mb-3">Failed to load usage data</p>
            <Button variant="ghost" onClick={fetchTokenUsage}>
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!summary || summary.actions_count === 0) {
    return (
      <Card variant="elevated">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Token Usage</h3>
          </div>
          <div className="text-center py-4">
            <div className="text-neutral-400 mb-2">No AI usage data found</div>
            <p className="text-sm text-neutral-500">
              Start using AI features like assessment scoring to see your usage here
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Token Usage</h3>
          </div>
          
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-[#1F1F1F] border border-[#333] text-white rounded-lg px-3 py-1 text-sm"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="p-3 bg-primary-500/20 rounded-lg inline-flex mb-2">
              <Zap className="w-5 h-5 text-primary-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatNumber(summary.total_tokens)}
            </div>
            <div className="text-xs text-neutral-400">Total Tokens</div>
          </div>
          
          {/* Cost removed from user-facing component */}
          
          <div className="text-center">
            <div className="p-3 bg-purple-500/20 rounded-lg inline-flex mb-2">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatNumber(summary.actions_count)}
            </div>
            <div className="text-xs text-neutral-400">AI Actions</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-yellow-500/20 rounded-lg inline-flex mb-2">
              <Brain className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {summary.actions_count}
            </div>
            <div className="text-xs text-neutral-400">Total Actions</div>
          </div>
        </div>

        {/* Feature Breakdown */}
        {Object.keys(summary.model_breakdown).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-300 mb-3">Usage by VIVA Feature</h4>
            {Object.entries(summary.model_breakdown)
              .sort(([,a], [,b]) => b.tokens - a.tokens)
              .slice(0, 3) // Show top 3 features
              .map(([model, data]) => {
                // Map technical model names to user-friendly VIVA feature names
                const getFeatureName = (modelName: string) => {
                  const featureMap: Record<string, string> = {
                    'gpt-4': 'VIVA Intelligence',
                    'gpt-4-turbo': 'VIVA Intelligence',
                    'gpt-5': 'VIVA Intelligence',
                    'dall-e-3': 'VIVA Image Generation',
                    'tts-1': 'VIVA Audio Generation',
                    'whisper-1': 'VIVA Transcription',
                    'admin': 'Admin Tools'
                  }
                  return featureMap[modelName] || 'VIVA Feature'
                }
                
                return (
                  <div key={model} className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="info" className="text-xs">{getFeatureName(model)}</Badge>
                      <span className="text-xs text-neutral-400">
                        {formatNumber(data.count)} actions
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {formatNumber(data.tokens)} tokens
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </Card>
  )
}
