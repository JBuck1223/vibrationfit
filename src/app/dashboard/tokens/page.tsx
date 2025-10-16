// /src/app/dashboard/tokens/page.tsx
// Token usage history and balance management

'use client'

import { useState, useEffect } from 'react'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system/components'
import { Zap, TrendingUp, Activity, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TokenTransaction {
  id: string
  action_type: string
  tokens_used: number
  tokens_remaining: number
  openai_model: string | null
  created_at: string
  metadata: any
}

// Helper function to format tokens
function formatTokens(tokens: number, abbreviated = false): string {
  if (abbreviated) {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`
    }
    return tokens.toString()
  }
  
  return tokens.toLocaleString()
}

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  chat_conversation: { label: 'VIVA Conversation', color: 'text-secondary-500' },
  vision_refinement: { label: 'VIVA Vision Refinement', color: 'text-primary-500' },
  blueprint_generation: { label: 'VIVA Blueprint Generation', color: 'text-accent-500' },
  audio_generation: { label: 'VIVA Audio Generation', color: 'text-energy-500' },
  assessment_scoring: { label: 'VIVA Scoring', color: 'text-neutral-400' },
  image_generation: { label: 'VIVA Image Generation', color: 'text-accent-400' },
  vision_generation: { label: 'VIVA Vision Generation', color: 'text-primary-500' },
  admin_grant: { label: 'Admin Grant', color: 'text-primary-500' },
  admin_deduct: { label: 'Admin Deduction', color: 'text-red-500' },
}

export default function TokensPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchTokenData()
  }, [])

  const fetchTokenData = async () => {
    try {
      const response = await fetch('/api/tokens')
      
      if (!response.ok) {
        throw new Error('Failed to fetch token data')
      }

      const data = await response.json()
      
      setBalance(data.balance)
      setTransactions(data.transactions)
      setStats({
        totalUsed: data.totalUsed,
        totalGranted: data.totalGranted,
        actionBreakdown: data.actionBreakdown,
      })

    } catch (error) {
      console.error('Error fetching token data:', error)
    } finally {
      setLoading(false)
    }
  }

  const balancePercentage = stats?.totalGranted > 0 
    ? Math.min(100, (balance / stats.totalGranted) * 100)
    : 0

  return (
    <PageLayout>
      <Container size="xl" className="py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Token Usage</h1>
          <p className="text-neutral-400">
            Track your creation tokens and AI usage across all features
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-neutral-400 mt-4">Loading your token data...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Current Balance */}
              <Card className="p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Current Balance
                  </h3>
                  <Zap className="w-5 h-5 text-energy-500" />
                </div>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-white mb-1">
                    {formatTokens(balance, true)}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {formatTokens(balance)} tokens
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                    style={{ width: `${balancePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  {balancePercentage.toFixed(0)}% of total allocation
                </p>
              </Card>

              {/* Total Used */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Tokens Used
                  </h3>
                  <Activity className="w-5 h-5 text-secondary-500" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  {formatTokens(stats?.totalUsed || 0, true)}
                </div>
                <div className="text-sm text-neutral-500">
                  {formatTokens(stats?.totalUsed || 0)} tokens
                </div>
              </Card>

              {/* Total Granted */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Total Granted
                  </h3>
                  <TrendingUp className="w-5 h-5 text-accent-500" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  {formatTokens(stats?.totalGranted || 0, true)}
                </div>
                <div className="text-sm text-neutral-500">
                  Lifetime allocation
                </div>
              </Card>
            </div>

            {/* Usage Breakdown */}
            {stats?.actionBreakdown && Object.keys(stats.actionBreakdown).length > 0 && (
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Usage by Feature</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.actionBreakdown).map(([action, data]: [string, any]) => (
                    <div
                      key={action}
                      className="p-4 bg-neutral-900 rounded-xl border border-neutral-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${ACTION_TYPE_LABELS[action]?.color || 'text-white'}`}>
                          {ACTION_TYPE_LABELS[action]?.label || action}
                        </span>
                        <Badge variant="info" className="text-xs">
                          {data.count}x
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatTokens(data.tokens, true)}
                      </div>
                      <div className="text-xs text-neutral-500">
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Add Tokens CTA */}
            {balance < 1_000_000 && (
              <Card className="p-6 mb-8 bg-gradient-to-br from-energy-500/10 to-accent-500/10 border-2 border-energy-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Running Low on Tokens?</h3>
                    <p className="text-neutral-300 mb-4">
                      Add more creation tokens to keep transforming without limits
                    </p>
                  </div>
                  <Button asChild variant="primary" size="lg">
                    <Link href="/dashboard/add-tokens">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Tokens
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Transaction History */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                <Badge variant="info">{transactions.length} transactions</Badge>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400">No token usage yet</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Start creating to see your token activity here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-semibold ${ACTION_TYPE_LABELS[tx.action_type]?.color || 'text-white'}`}>
                            {ACTION_TYPE_LABELS[tx.action_type]?.label || tx.action_type}
                          </span>
                          {tx.openai_model && (
                            <Badge variant="neutral" className="text-xs">
                              {tx.openai_model}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                        {tx.metadata?.category && (
                          <div className="text-xs text-neutral-600 mt-1">
                            {tx.metadata.category}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className={`font-bold ${tx.tokens_used > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.tokens_used > 0 ? '-' : '+'}{formatTokens(Math.abs(tx.tokens_used), true)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatTokens(tx.tokens_remaining, true)} remaining
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </Container>
    </PageLayout>
  )
}

