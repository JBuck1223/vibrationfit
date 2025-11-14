// /src/app/dashboard/tokens/page.tsx
// Token usage history and balance management - Shows transactions, usage, and accurate balance

'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge } from '@/lib/design-system/components'
import { Zap, TrendingUp, Activity, Plus, ArrowRight, History } from 'lucide-react'
import Link from 'next/link'

interface TokenTransaction {
  id: string
  type?: 'transaction' | 'usage'
  action_type: string
  tokens_used: number
  tokens_remaining?: number
  openai_model?: string | null
  created_at: string
  metadata: any
  source?: string
  amount_paid_cents?: number
  token_pack_id?: string
  cost_estimate?: number
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

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string; icon?: string }> = {
  // AI Usage
  chat_conversation: { label: 'VIVA Conversation', color: 'text-secondary-500' },
  vision_refinement: { label: 'Vision Refinement', color: 'text-primary-500' },
  blueprint_generation: { label: 'Blueprint Generation', color: 'text-accent-500' },
  audio_generation: { label: 'Audio Generation', color: 'text-energy-500' },
  assessment_scoring: { label: 'Assessment Scoring', color: 'text-neutral-400' },
  image_generation: { label: 'Image Generation', color: 'text-accent-400' },
  vision_generation: { label: 'Vision Generation', color: 'text-primary-500' },
  life_vision_category_summary: { label: 'Category Summary', color: 'text-primary-500' },
  life_vision_master_assembly: { label: 'Master Assembly', color: 'text-primary-500' },
  prompt_suggestions: { label: 'Prompt Suggestions', color: 'text-secondary-500' },
  transcription: { label: 'Audio Transcription', color: 'text-energy-500' },
  frequency_flip: { label: 'Frequency Flip', color: 'text-secondary-500' },
  
  // Transactions
  admin_grant: { label: 'Admin Grant', color: 'text-primary-500' },
  subscription_grant: { label: 'Subscription Grant', color: 'text-primary-500' },
  trial_grant: { label: 'Trial Grant', color: 'text-primary-500' },
  token_pack_purchase: { label: 'Token Pack Purchase', color: 'text-energy-500' },
  admin_deduct: { label: 'Admin Deduction', color: 'text-red-500' },
}

export default function TokensPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [transactionsOnly, setTransactionsOnly] = useState<TokenTransaction[]>([])
  const [usageOnly, setUsageOnly] = useState<TokenTransaction[]>([])
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'transactions' | 'usage'>('all')

  useEffect(() => {
    fetchTokenData()
  }, [])

  const fetchTokenData = async () => {
    try {
      const response = await fetch('/api/tokens')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch token data')
      }

      const data = await response.json()
      
      setBalance(data.balance)
      setTransactions(data.transactions || [])
      setTransactionsOnly(data.transactionsOnly || [])
      setUsageOnly(data.usageOnly || [])
      setStats({
        totalUsed: data.totalUsed,
        totalGranted: data.totalGranted,
        actionBreakdown: data.actionBreakdown || {},
      })

    } catch (error) {
      console.error('Error fetching token data:', error)
      // Set loading to false even on error so UI can show error state
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const balancePercentage = stats?.totalGranted > 0 
    ? Math.min(100, (balance / stats.totalGranted) * 100)
    : 0

  // Filter transactions based on active tab
  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : activeTab === 'transactions'
    ? transactions.filter(tx => tx.type === 'transaction' || ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct'].includes(tx.action_type))
    : transactions.filter(tx => tx.type === 'usage' || !['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct'].includes(tx.action_type))

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4">Token Usage</h1>
        <p className="text-sm md:text-base text-neutral-400">
          Track your creation tokens: transactions, usage, and balance
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-neutral-400 mt-4">Loading your token data...</p>
        </div>
      ) : (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Current Balance */}
            <Card className="p-4 md:p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                  Current Balance
                </h3>
                <Zap className="w-5 h-5 text-energy-500" />
              </div>
              <div className="mb-4">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                  {formatTokens(balance, true)}
                </div>
                <div className="text-sm text-neutral-500">
                  {formatTokens(balance)} tokens
                </div>
              </div>
              
              {/* Progress Bar */}
              {stats?.totalGranted > 0 && (
                <>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                      style={{ width: `${balancePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    {balancePercentage.toFixed(0)}% of total allocation
                  </p>
                </>
              )}
            </Card>

            {/* Total Used */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                  Tokens Used
                </h3>
                <Activity className="w-5 h-5 text-secondary-500" />
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                {formatTokens(stats?.totalUsed || 0, true)}
              </div>
              <div className="text-sm text-neutral-500">
                Lifetime usage
              </div>
            </Card>

            {/* Total Granted */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                  Total Granted
                </h3>
                <TrendingUp className="w-5 h-5 text-accent-500" />
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                {formatTokens(stats?.totalGranted || 0, true)}
              </div>
              <div className="text-sm text-neutral-500">
                Lifetime allocation
              </div>
            </Card>

          </div>

          {/* Usage Breakdown */}
          {stats?.actionBreakdown && Object.keys(stats.actionBreakdown).length > 0 && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Usage by Feature</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.actionBreakdown).map(([action, data]: [string, any]) => (
                  <div
                    key={action}
                    className="p-4 bg-neutral-900 rounded-xl border border-neutral-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${ACTION_TYPE_LABELS[action]?.color || 'text-white'}`}>
                        {ACTION_TYPE_LABELS[action]?.label || action.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="info" className="text-xs">
                        {data.count}x
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatTokens(data.tokens, true)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      ${data.cost.toFixed(2)} cost
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Add Tokens CTA */}
          {balance < 1_000_000 && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8 bg-gradient-to-br from-energy-500/10 to-accent-500/10 border-2 border-energy-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">Running Low on Tokens?</h3>
                  <p className="text-neutral-300 mb-4">
                    Add more creation tokens to keep transforming without limits
                  </p>
                </div>
                <Button asChild variant="primary" size="sm">
                  <Link href="/dashboard/add-tokens">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Tokens
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          {/* Transaction History with Tabs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Activity History</h2>
              <Badge variant="info">{filteredTransactions.length} items</Badge>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-neutral-700">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                Transactions ({transactionsOnly.length})
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'usage'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                Usage ({usageOnly.length})
              </button>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400">No activity yet</p>
                <p className="text-sm text-neutral-500 mt-2">
                  {activeTab === 'transactions' 
                    ? 'No transactions yet. Purchase tokens or receive grants to see them here.'
                    : activeTab === 'usage'
                    ? 'No AI usage yet. Start creating to see your usage here!'
                    : 'Start creating to see your token activity here!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => {
                  const isGrant = ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase'].includes(tx.action_type)
                  const isDeduction = tx.action_type === 'admin_deduct'
                  const isUsage = !isGrant && !isDeduction
                  
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        isGrant 
                          ? 'bg-primary-500/5 border-primary-500/20 hover:border-primary-500/40'
                          : isDeduction
                          ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-semibold ${ACTION_TYPE_LABELS[tx.action_type]?.color || 'text-white'}`}>
                            {ACTION_TYPE_LABELS[tx.action_type]?.label || tx.action_type.replace(/_/g, ' ')}
                          </span>
                          {tx.openai_model && (
                            <Badge variant="neutral" className="text-xs">
                              {tx.openai_model}
                            </Badge>
                          )}
                          {tx.token_pack_id && (
                            <Badge variant="accent" className="text-xs">
                              {tx.token_pack_id}
                            </Badge>
                          )}
                          {tx.type && (
                            <Badge variant={tx.type === 'transaction' ? 'info' : 'neutral'} className="text-xs">
                              {tx.type}
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
                        {tx.amount_paid_cents && (
                          <div className="text-xs text-neutral-500 mt-1">
                            Paid: ${(tx.amount_paid_cents / 100).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          isGrant 
                            ? 'text-green-400' 
                            : isDeduction
                            ? 'text-red-400'
                            : 'text-red-400'
                        }`}>
                          {isGrant ? '+' : ''}{formatTokens(Math.abs(tx.tokens_used), true)}
                        </div>
                        {tx.tokens_remaining !== undefined && tx.tokens_remaining > 0 && (
                          <div className="text-xs text-neutral-500">
                            {formatTokens(tx.tokens_remaining, true)} remaining
                          </div>
                        )}
                        {tx.cost_estimate && tx.cost_estimate > 0 && (
                          <div className="text-xs text-neutral-500">
                            ${(tx.cost_estimate / 100).toFixed(4)} cost
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </Container>
  )
}
