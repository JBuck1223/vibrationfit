'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { 
  ArrowLeft, Brain, Calendar, Filter,
  Target, Sparkles, FileText, FileEdit, Book, Palette, Merge,
  MessageSquare, Lightbulb, BarChart3, Mic, Star, RefreshCw,
  Music, Image, Video, Mic2, Pin, Plus, Minus, Gift, Zap, CreditCard, Cpu
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Icon component mapping
const ICON_COMPONENTS: Record<string, any> = {
  'Target': Target,
  'Sparkles': Sparkles,
  'FileText': FileText,
  'FileEdit': FileEdit,
  'Book': Book,
  'Palette': Palette,
  'Merge': Merge,
  'MessageSquare': MessageSquare,
  'Lightbulb': Lightbulb,
  'BarChart3': BarChart3,
  'Mic': Mic,
  'Star': Star,
  'RefreshCw': RefreshCw,
  'Music': Music,
  'Image': Image,
  'Video': Video,
  'Mic2': Mic2,
  'Pin': Pin,
  'Plus': Plus,
  'Minus': Minus,
  'Gift': Gift,
  'Zap': Zap,
  'CreditCard': CreditCard,
  'Cpu': Cpu,
}

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
      // Life Vision Generation
      'vision_generation': 'Vision Generation',
      'vision_refinement': 'Vision Refinement',
      'blueprint_generation': 'Blueprint Generation',
      'life_vision_category_summary': 'Category Summary',
      'life_vision_master_assembly': 'Master Vision Assembly',
      'final_assembly': 'Final Assembly',
      'merge_clarity': 'Merge Clarity Statements',
      
      // VIVA Chat & Prompts
      'chat_conversation': 'VIVA Chat',
      'prompt_suggestions': 'Prompt Suggestions',
      
      // Analysis & Insights
      'vibrational_analysis': 'Vibrational Analysis',
      'voice_profile_analysis': 'Voice Profile Analysis',
      'north_star_reflection': 'North Star Reflection',
      'frequency_flip': 'Frequency Flip',
      
      // Media Generation
      'audio_generation': 'Audio Generation',
      'image_generation': 'Image Generation',
      'viva_scene_generation': 'Scene Generation',
      'transcription': 'Audio Transcription',
      'vision_board_ideas': 'Vision Board Ideas',
      
      // Admin Actions
      'admin_grant': 'Admin Token Grant',
      'admin_deduct': 'Admin Token Deduction',
      'subscription_grant': 'Subscription Grant',
      'trial_grant': 'Trial Grant',
      'token_pack_purchase': 'Token Pack Purchase',
      
      // Legacy
      'assessment_scoring': 'Assessment Scoring',
    }
    return labels[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getActionIcon = (actionType: string): string => {
    const icons: Record<string, string> = {
      // Life Vision Generation
      'vision_generation': 'Target',
      'vision_refinement': 'Sparkles',
      'blueprint_generation': 'FileText',
      'life_vision_category_summary': 'FileEdit',
      'life_vision_master_assembly': 'Book',
      'final_assembly': 'Palette',
      'merge_clarity': 'Merge',
      
      // VIVA Chat & Prompts
      'chat_conversation': 'MessageSquare',
      'prompt_suggestions': 'Lightbulb',
      
      // Analysis & Insights
      'vibrational_analysis': 'BarChart3',
      'voice_profile_analysis': 'Mic',
      'north_star_reflection': 'Star',
      'frequency_flip': 'RefreshCw',
      
      // Media Generation
      'audio_generation': 'Music',
      'image_generation': 'Image',
      'viva_scene_generation': 'Video',
      'transcription': 'Mic2',
      'vision_board_ideas': 'Pin',
      
      // Admin Actions
      'admin_grant': 'Plus',
      'admin_deduct': 'Minus',
      'subscription_grant': 'Gift',
      'trial_grant': 'Zap',
      'token_pack_purchase': 'CreditCard',
      
      // Legacy
      'assessment_scoring': 'BarChart3',
    }
    return icons[actionType] || 'Cpu'
  }

  const uniqueActionTypes = Array.from(new Set(usage.map(r => r.action_type)))

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner variant="primary" size="lg" />
        <span className="ml-3 text-neutral-400">Loading token history...</span>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <div className="text-red-400 mb-4">⚠️ Error loading token history</div>
          <p className="text-neutral-300 mb-6">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchTokenHistory}>
            Try Again
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Token Usage History"
          subtitle="Track where your AI tokens are being used"
        >
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Back
          </Button>
        </PageHero>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
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
          <Card className="p-4 md:p-6 lg:p-8 text-center">
            <Brain className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Token Usage Found</h3>
            <p className="text-neutral-400">
              Start using AI features to see your token usage history here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {usage.map((record) => {
              const IconComponent = ICON_COMPONENTS[getActionIcon(record.action_type)] || Cpu
              return (
              <Card key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary-500" />
                    </div>
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
            )})}
          </div>
        )}
      </Stack>
    </Container>
  )
}
