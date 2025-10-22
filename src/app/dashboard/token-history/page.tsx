'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Spinner } from '@/lib/design-system/components'
import { PageLayout } from '@/lib/design-system/components'
import { ArrowLeft, Activity, Brain, Calendar, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TokenUsageRecord {
  id: string
  action_type: string
  model_used: string
  tokens_used: number
  input_tokens: number
  output_tokens: number
  success: boolean
  error_message?: string
  metadata?: any
  created_at: string
}

export default function TokenHistoryPage() {
  const router = useRouter()
  const [usage, setUsage] = useState<TokenUsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchTokenHistory()
  }, [days, filter])

  const fetchTokenHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        days: days.toString(),
        ...(filter !== 'all' && { action_type: filter })
      })

      const response = await fetch(`/api/tokens/my-usage?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch token history')
      }

      const data = await response.json()
      setUsage(data.usage || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'assessment_scoring': 'VIVA Scoring',
      'vision_generation': 'VIVA Vision Generation',
      'vision_refinement': 'VIVA Vision Refinement',
      'blueprint_generation': 'VIVA Blueprint Generation',
      'chat_conversation': 'VIVA Conversation',
      'audio_generation': 'VIVA Audio Generation',
      'image_generation': 'VIVA Image Generation',
      'admin_grant': 'Admin Grant',
      'admin_deduct': 'Admin Deduction'
    }
    return labels[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      'assessment_scoring': '📊',
      'vision_generation': '🎯',
      'vision_refinement': '✨',
      'blueprint_generation': '📋',
      'chat_conversation': '💬',
      'audio_generation': '🎵',
      'image_generation': '🖼️',
      'admin_grant': '➕',
      'admin_deduct': '➖'
    }
    return icons[actionType] || '🤖'
  }

  const uniqueActionTypes = Array.from(new Set(usage.map(r => r.action_type)))

  if (loading) {
    return (
      <>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <Spinner variant="primary" size="lg" />
            <span className="ml-3 text-neutral-400">Loading token history...</span>
          </div>
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Container size="xl" className="py-8">
          <div className="text-center py-16">
            <div className="text-red-400 mb-4">⚠️ Error loading token history</div>
            <p className="text-neutral-300 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchTokenHistory}>
              Try Again
            </Button>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Token Usage History</h1>
            <p className="text-neutral-400">Track where your AI tokens are being used</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Actions</option>
              {uniqueActionTypes.map(actionType => (
                <option key={actionType} value={actionType}>
                  {getActionLabel(actionType)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Usage List */}
        {usage.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Token Usage Found</h3>
            <p className="text-neutral-400">
              Start using AI features to see your token usage history here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {usage.map((record) => (
              <Card key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getActionIcon(record.action_type)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {getActionLabel(record.action_type)}
                        </span>
                        <Badge variant={record.success ? 'success' : 'error'} className="text-xs">
                          {record.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>{formatDate(record.created_at)}</span>
                        {record.input_tokens > 0 && (
                          <span>Input: {record.input_tokens.toLocaleString()}</span>
                        )}
                        {record.output_tokens > 0 && (
                          <span>Output: {record.output_tokens.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {record.tokens_used.toLocaleString()} tokens
                    </div>
                  </div>
                </div>
                
                {record.error_message && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{record.error_message}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  )
}
