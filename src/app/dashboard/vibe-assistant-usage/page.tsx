'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target, 
  Zap, 
  BarChart3, 
  Calendar, 
  RefreshCw,
  Crown,
  Star,
  ArrowUpRight,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { 
  PageLayout, 
  Container, 
  Card, 
  Button, 
  Badge, 
  ProgressBar, 
  Spinner
} from '@/lib/design-system'
import { 
  checkVibeAssistantAllowance,
  formatTokens,
  getMembershipTierColor,
  getMembershipTierBgColor,
  MEMBERSHIP_TIERS,
  TONALITY_OPTIONS,
  EMOTIONAL_INTENSITY
} from '@/lib/vibe-assistant/allowance-client'

interface VibeAssistantAllowance {
  tokensRemaining: number
  tokensUsed: number
  monthlyLimit: number
  costLimit: number
  resetDate: string
  tierName: string
}

interface UsageLog {
  id: string
  category: string
  operation_type: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  refinement_percentage: number
  tonality: string
  emotional_intensity: string
  processing_time_ms: number
  success: boolean
  error_message?: string
  created_at: string
}

interface MonthlyStats {
  tokensUsed: number
  costUsd: number
  operationsCount: number
  mostUsedCategory: string
  averageProcessingTime: number
}

export default function VibeAssistantUsageDashboard() {
  const router = useRouter()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [allowance, setAllowance] = useState<VibeAssistantAllowance | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageLog[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load allowance info
        const allowanceData = await checkVibeAssistantAllowance()
        setAllowance(allowanceData)
        
        // Load usage history (mock data for now - will implement API later)
        const historyData: UsageLog[] = [
          {
            id: '1',
            category: 'forward',
            operation_type: 'refine_vision',
            input_tokens: 150,
            output_tokens: 200,
            total_tokens: 350,
            cost_usd: 0.005,
            refinement_percentage: 75,
            tonality: 'balanced',
            emotional_intensity: 'moderate',
            processing_time_ms: 1250,
            success: true,
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ]
        setUsageHistory(historyData)
        
        // Load monthly stats (mock data for now)
        const statsData: MonthlyStats = {
          tokensUsed: 1250,
          costUsd: 0.018,
          operationsCount: 4,
          mostUsedCategory: 'forward',
          averageProcessingTime: 1150
        }
        setMonthlyStats(statsData)
        
      } catch (err) {
        console.error('Error loading usage data:', err)
        setError('Failed to load usage data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Calculate usage percentage
  const usagePercentage = allowance ? (allowance.tokensUsed / allowance.monthlyLimit) * 100 : 0
  
  // Get usage status
  const getUsageStatus = () => {
    if (!allowance) return 'unknown'
    if (usagePercentage >= 90) return 'critical'
    if (usagePercentage >= 75) return 'warning'
    return 'good'
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'good': return 'text-green-400'
      default: return 'text-neutral-400'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <XCircle className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'good': return <CheckCircle className="w-5 h-5" />
      default: return <Info className="w-5 h-5" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      forward: '✨',
      fun: '🎉',
      travel: '✈️',
      home: '🏡',
      family: '👨‍👩‍👧‍👦',
      romance: '💕',
      health: '💪',
      money: '💰',
      business: '💼',
      social: '👥',
      possessions: '📦',
      giving: '🎁',
      spirituality: '🌟',
      conclusion: '✅'
    }
    return icons[category] || '📝'
  }

  // Get operation type label
  const getOperationLabel = (operationType: string) => {
    switch (operationType) {
      case 'refine_vision': return 'Vision Refinement'
      case 'generate_guidance': return 'Guidance Generation'
      case 'analyze_alignment': return 'Alignment Analysis'
      default: return operationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  if (loading) {
    return (
      <>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <Spinner variant="primary" size="lg" />
          </div>
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Sparkles className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Usage Error</h2>
              <p className="text-neutral-400 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <Container size="xl" className="py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl font-bold text-white">VIVA Assistant Usage</h1>
                <Badge variant="premium" className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  AI Powered
                </Badge>
              </div>
              <p className="text-neutral-400">
                Track your AI-powered vision refinement usage and costs
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Usage Overview */}
        {allowance && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Usage Progress */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  Monthly Usage
                </h3>
                <Badge 
                  className={`${getMembershipTierBgColor(allowance.tierName)} ${getMembershipTierColor(allowance.tierName)}`}
                >
                  {allowance.tierName}
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Tokens Used</span>
                  <span className="text-sm font-medium text-white">
                    {formatTokens(allowance.tokensUsed)} / {formatTokens(allowance.monthlyLimit)}
                  </span>
                </div>
                <ProgressBar 
                  value={usagePercentage}
                  variant={usagePercentage >= 90 ? 'warning' : 'primary'}
                  showLabel={false}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Remaining</span>
                  <span className={`text-sm font-medium ${getStatusColor(getUsageStatus())}`}>
                    {formatTokens(allowance.tokensRemaining)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Reset Date</span>
                  <span className="text-sm text-white">
                    {new Date(allowance.resetDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Cost Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Cost Overview
                </h3>
                <div className="flex items-center gap-1 text-green-400">
                  {getStatusIcon(getUsageStatus())}
                </div>
              </div>
              <div className="space-y-4">
                {/* Cost hidden for end users */}
                {monthlyStats && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Operations</span>
                    <span className="text-sm text-white">
                      {monthlyStats.operationsCount} refinements
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-700">
                  <p className="text-xs text-neutral-500">
                    GPT-5 pricing: $0.015 per 1K tokens
                  </p>
                </div>
              </div>
            </Card>

            {/* Performance Stats */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Performance
                </h3>
                <div className="flex items-center gap-1 text-blue-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-4">
                {monthlyStats ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Avg. Processing</span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(monthlyStats.averageProcessingTime)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Most Used Category</span>
                      <span className="text-sm text-white flex items-center gap-1">
                        {getCategoryIcon(monthlyStats.mostUsedCategory)}
                        {monthlyStats.mostUsedCategory}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Success Rate</span>
                      <span className="text-sm font-medium text-green-400">
                        {usageHistory.length > 0 
                          ? Math.round((usageHistory.filter(log => log.success).length / usageHistory.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-neutral-400">No usage data available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Upgrade Prompt */}
        {allowance && usagePercentage >= 75 && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Upgrade Your VIVA Assistant Experience
                  </h3>
                  <p className="text-neutral-400">
                    You're using {Math.round(usagePercentage)}% of your monthly allowance. 
                    Upgrade to unlock unlimited refinements and premium features.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="accent" className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Upgrade Now
                </Button>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Usage History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Recent Activity
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">
                Last {usageHistory.length} operations
              </span>
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {usageHistory.length > 0 ? (
            <div className="space-y-3">
              {usageHistory.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-lg">{getCategoryIcon(log.category)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {getOperationLabel(log.operation_type)}
                        </span>
                        <Badge variant="neutral" className="text-xs">
                          {log.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>{formatDate(log.created_at)}</span>
                        <span>{log.refinement_percentage}% refinement</span>
                        <span>{log.tonality} tone</span>
                        <span>{log.emotional_intensity} intensity</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {formatTokens(log.total_tokens)} tokens
                      </div>
                      <div className="text-neutral-400">
                        ${(log.cost_usd || 0).toFixed(4)}
                      </div>
                    </div>
                    <div className="text-neutral-400">
                      {log.processing_time_ms}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Usage History</h3>
              <p className="text-neutral-400 mb-6">
                Start refining your vision with the VIVA Assistant to see your usage here.
              </p>
              <Button asChild>
                <Link href="/life-vision">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Refining
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Educational Content */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-500" />
            Understanding VIVA Assistant Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Operation Types</h4>
              <div className="space-y-2 text-sm text-neutral-400">
                <div className="flex justify-between">
                  <span>Vision Refinement</span>
                  <span>~500-2000 tokens</span>
                </div>
                <div className="flex justify-between">
                  <span>Guidance Generation</span>
                  <span>~300-1500 tokens</span>
                </div>
                <div className="flex justify-between">
                  <span>Alignment Analysis</span>
                  <span>~400-1200 tokens</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Membership Tiers</h4>
              <div className="space-y-2 text-sm text-neutral-400">
                <div className="flex justify-between">
                  <span>Free</span>
                  <span>100 tokens/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Growth</span>
                  <span>500 tokens/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Alignment</span>
                  <span>2,000 tokens/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Actualization</span>
                  <span>10,000 tokens/month</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </>
  )
}
