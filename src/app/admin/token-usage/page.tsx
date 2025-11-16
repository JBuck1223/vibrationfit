'use client'

import { useState, useEffect } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Container, Card, Badge, Button, Spinner } from '@/lib/design-system/components'

interface TokenSummary {
  total_tokens: number
  total_cost: number
  actions_count: number
  model_breakdown: Record<string, { tokens: number; cost: number; count: number }>
  daily_usage: Record<string, { tokens: number; cost: number; count: number }>
}

interface UserUsage {
  user_id: string
  user_email: string
  total_tokens: number
  total_cost: number
  actions_count: number
  last_activity: string
}

interface ReconciliationData {
  pending_count: number
  matched_count: number
  discrepancy_count: number
  not_applicable_count: number
  total_estimated_cost: number
  total_actual_cost: number
  average_accuracy: number
  recent_requests: Array<{
    id: string
    action_type: string
    model_used: string
    openai_request_id: string | null
    estimated_cost_usd: number
    actual_cost_usd: number | null
    reconciliation_status: string
    created_at: string
  }>
}

export default function AdminTokenUsagePage() {
  const [summary, setSummary] = useState<TokenSummary | null>(null)
  const [userUsage, setUserUsage] = useState<UserUsage[]>([])
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'users' | 'reconciliation'>('summary')
  const [days, setDays] = useState(30)

  const fetchData = async (type: 'summary' | 'users' | 'reconciliation') => {
    try {
      setLoading(true)
      setError(null)

      const apiType = type === 'users' ? 'by-user' : type
      const response = await fetch(`/api/admin/token-usage?type=${apiType}&days=${days}`, {
        credentials: 'include' // Include cookies for authentication
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to access admin features')
        } else if (response.status === 403) {
          throw new Error('Admin access required')
        } else {
          throw new Error(`Failed to fetch ${type} data (${response.status})`)
        }
      }

      const data = await response.json()
      
      if (type === 'summary') {
        setSummary(data.summary)
      } else if (type === 'users') {
        setUserUsage(data.user_usage)
      } else if (type === 'reconciliation') {
        setReconciliationData(data.reconciliation)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab, days])

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Token Usage Analytics</h1>
            <p className="text-xs md:text-sm lg:text-base text-neutral-400">Track AI token consumption and costs across the platform</p>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-[#1F1F1F] border border-[#333] text-white rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1F1F1F] p-1 rounded-lg mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-primary-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Overall Summary
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-primary-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            By User
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base whitespace-nowrap ${
              activeTab === 'reconciliation'
                ? 'bg-primary-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🔍 Reconciliation
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-neutral-400">Loading token usage data...</span>
          </div>
        ) : error ? (
          <Card variant="outlined" className="p-4 md:p-6 text-center">
            <div className="text-red-400 mb-4">⚠️ Error loading data</div>
            <p className="text-neutral-300 mb-4">{error}</p>
            <Button 
              variant="primary" 
              onClick={() => fetchData(activeTab)}
            >
              Try Again
            </Button>
          </Card>
        ) : activeTab === 'summary' && summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Total Tokens */}
            <Card variant="elevated" className="p-4 md:p-6">
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-white">Total Tokens</h3>
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm">🔢</span>
                  </div>
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-500 mb-1">
                  {formatNumber(summary.total_tokens)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {formatNumber(summary.actions_count)} actions
                </div>
              </div>
            </Card>

            {/* Total Cost */}
            <Card variant="elevated" className="p-4 md:p-6">
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-white">Total Cost</h3>
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm">💰</span>
                  </div>
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-green-500 mb-1">
                  {formatCurrency(summary.total_cost)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {formatCurrency(summary.total_cost / days)} avg/day
                </div>
              </div>
            </Card>

            {/* Actions Count */}
            <Card variant="elevated" className="p-4 md:p-6">
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-white">Total Actions</h3>
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm">⚡</span>
                  </div>
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-500 mb-1">
                  {formatNumber(summary.actions_count)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  {Math.round(summary.actions_count / days)} avg/day
                </div>
              </div>
            </Card>

            {/* Average Cost per Action */}
            <Card variant="elevated" className="p-4 md:p-6">
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-white">Avg Cost/Action</h3>
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm">📊</span>
                  </div>
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-500 mb-1">
                  {formatCurrency(summary.actions_count > 0 ? summary.total_cost / summary.actions_count : 0)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  per AI action
                </div>
              </div>
            </Card>
          </div>
        ) : activeTab === 'users' && userUsage.length > 0 ? (
          <Card variant="elevated" className="p-4 md:p-6">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">Top Users by Token Usage</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Tokens</th>
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Cost</th>
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Actions</th>
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userUsage.map((user) => (
                      <tr key={user.user_id} className="border-b border-[#333]/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.user_email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.user_email}</div>
                              <div className="text-neutral-400 text-sm">{user.user_id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {formatNumber(user.total_tokens)}
                        </td>
                        <td className="py-3 px-4 text-green-400 font-medium">
                          {formatCurrency(user.total_cost)}
                        </td>
                        <td className="py-3 px-4 text-purple-400 font-medium">
                          {formatNumber(user.actions_count)}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {formatDate(user.last_activity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ) : activeTab === 'users' ? (
          <Card variant="outlined" className="p-4 md:p-6 text-center">
            <div className="text-neutral-400 mb-4">📊 No user data available</div>
            <p className="text-neutral-300">No token usage data found for the selected period.</p>
          </Card>
        ) : activeTab === 'reconciliation' && reconciliationData ? (
          <div className="space-y-6">
            {/* Reconciliation Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card variant="elevated" className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-white">Pending</h3>
                  <Badge variant="warning">⏳</Badge>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-yellow-500 mb-1">
                  {formatNumber(reconciliationData.pending_count)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  Awaiting reconciliation
                </div>
              </Card>

              <Card variant="elevated" className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-white">Matched</h3>
                  <Badge variant="success">✓</Badge>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-green-500 mb-1">
                  {formatNumber(reconciliationData.matched_count)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  Costs verified
                </div>
              </Card>

              <Card variant="elevated" className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-white">Discrepancies</h3>
                  <Badge variant="error">!</Badge>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-red-500 mb-1">
                  {formatNumber(reconciliationData.discrepancy_count)}
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  Cost mismatches
                </div>
              </Card>

              <Card variant="elevated" className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-white">Accuracy</h3>
                  <span className="text-primary-500">%</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary-500 mb-1">
                  {reconciliationData.average_accuracy.toFixed(1)}%
                </div>
                <div className="text-xs md:text-sm text-neutral-400">
                  Cost estimate accuracy
                </div>
              </Card>
            </div>

            {/* Recent Requests with OpenAI IDs */}
            <Card variant="elevated" className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">
                Recent Requests with OpenAI Tracking
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">Action</th>
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">Model</th>
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">OpenAI Request ID</th>
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">Estimated</th>
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">Actual</th>
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-neutral-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationData.recent_requests.map((req) => (
                      <tr key={req.id} className="border-b border-[#333]/50 hover:bg-[#1F1F1F]/50">
                        <td className="py-3 px-2">
                          <Badge variant="info" className="text-xs">{req.action_type}</Badge>
                        </td>
                        <td className="py-3 px-2 text-neutral-300 text-xs">
                          {req.model_used}
                        </td>
                        <td className="py-3 px-2">
                          {req.openai_request_id ? (
                            <code className="text-xs bg-[#1F1F1F] px-2 py-1 rounded text-primary-400">
                              {req.openai_request_id.substring(0, 20)}...
                            </code>
                          ) : (
                            <span className="text-neutral-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-green-400 font-medium text-xs">
                          ${req.estimated_cost_usd.toFixed(4)}
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {req.actual_cost_usd !== null ? (
                            <span className="text-green-500 font-medium">
                              ${req.actual_cost_usd.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {req.reconciliation_status === 'pending' && (
                            <Badge variant="warning" className="text-xs">Pending</Badge>
                          )}
                          {req.reconciliation_status === 'matched' && (
                            <Badge variant="success" className="text-xs">Matched</Badge>
                          )}
                          {req.reconciliation_status === 'discrepancy' && (
                            <Badge variant="error" className="text-xs">Discrepancy</Badge>
                          )}
                          {req.reconciliation_status === 'not_applicable' && (
                            <Badge variant="info" className="text-xs">N/A</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-neutral-400 text-xs">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {reconciliationData.recent_requests.length === 0 && (
                <div className="text-center py-8 text-neutral-400">
                  No reconciliation data available for the selected period
                </div>
              )}
            </Card>

            {/* Cost Comparison */}
            {reconciliationData.total_actual_cost > 0 && (
              <Card variant="elevated" className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">
                  Cost Comparison
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-neutral-400 text-sm mb-2">Estimated Total</div>
                    <div className="text-2xl font-bold text-green-400">
                      ${reconciliationData.total_estimated_cost.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-neutral-400 text-sm mb-2">Actual Total (OpenAI)</div>
                    <div className="text-2xl font-bold text-green-500">
                      ${reconciliationData.total_actual_cost.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-neutral-400 text-sm mb-2">Difference</div>
                    <div className={`text-2xl font-bold ${
                      reconciliationData.total_actual_cost > reconciliationData.total_estimated_cost
                        ? 'text-red-400'
                        : 'text-green-500'
                    }`}>
                      {reconciliationData.total_actual_cost > reconciliationData.total_estimated_cost ? '+' : ''}
                      ${(reconciliationData.total_actual_cost - reconciliationData.total_estimated_cost).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : null}

        {/* Model Breakdown (if summary available) */}
        {activeTab === 'summary' && summary && Object.keys(summary.model_breakdown).length > 0 && (
          <Card variant="elevated" className="p-4 md:p-6">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">Usage by Model</h3>
              
              <div className="space-y-4">
                {Object.entries(summary.model_breakdown)
                  .sort(([,a], [,b]) => b.cost - a.cost)
                  .map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="info">{model}</Badge>
                        <div className="text-sm text-neutral-400">
                          {formatNumber(data.count)} actions
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-white font-medium">{formatNumber(data.tokens)} tokens</div>
                          <div className="text-neutral-400 text-sm">
                            {data.count > 0 ? Math.round(data.tokens / data.count) : 0} avg/action
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">{formatCurrency(data.cost)}</div>
                          <div className="text-neutral-400 text-sm">
                            {data.count > 0 ? formatCurrency(data.cost / data.count) : '$0.00'} avg/action
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        )}
        </div>
      </Container>
    </AdminWrapper>
  )
}
