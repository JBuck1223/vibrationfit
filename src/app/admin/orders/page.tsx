'use client'

import { useEffect, useState, useCallback } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  ShoppingBag,
  Mail,
  MailCheck,
  MailX,
  MailWarning,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Clock,
  User,
  Tag,
  Undo2,
  XCircle,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  Ban,
  CloudDownload,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OrderAccount {
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone: string | null
}

interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  status: string
  cancel_at_period_end: boolean
  current_period_end: string
  membership_tiers: {
    name: string
    tier_type: string
  }
}

interface Order {
  id: string
  user_id: string
  total_amount: number
  currency: string
  status: string
  paid_at: string | null
  promo_code: string | null
  referral_source: string | null
  campaign_name: string | null
  metadata: Record<string, any>
  created_at: string
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  user_accounts: OrderAccount
  subscriptions: Subscription[]
}

interface ScheduledMsg {
  id: string
  status: string
  subject: string | null
  scheduledFor: string
  sentAt: string | null
  error: string | null
  createdAt: string
}

interface SentMsg {
  id: string
  status: string
  subject: string | null
  sentAt: string | null
  error: string | null
}

interface EmailStatus {
  scheduled: ScheduledMsg[]
  sent: SentMsg[]
}

function formatCurrency(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getEmailVerdict(status: EmailStatus | undefined): {
  label: string
  color: 'green' | 'red' | 'yellow' | 'gray'
  icon: typeof MailCheck
} {
  if (!status) return { label: 'Unknown', color: 'gray', icon: Mail }

  const hasSent = status.scheduled.some(m => m.status === 'sent') || status.sent.length > 0
  const hasFailed = status.scheduled.some(m => m.status === 'failed')
  const hasPending = status.scheduled.some(m => m.status === 'pending' || m.status === 'processing')
  const hasAny = status.scheduled.length > 0

  if (hasSent) return { label: 'Sent', color: 'green', icon: MailCheck }
  if (hasFailed) return { label: 'Failed', color: 'red', icon: MailX }
  if (hasPending) return { label: 'Pending', color: 'yellow', icon: MailWarning }
  if (!hasAny) return { label: 'No emails', color: 'red', icon: MailX }
  return { label: 'Unknown', color: 'gray', icon: Mail }
}

const statusBadgeColor: Record<string, string> = {
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  canceled: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  refunded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const emailBadgeColor: Record<string, string> = {
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  gray: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [emailStatuses, setEmailStatuses] = useState<Record<string, EmailStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)
  const [resendResults, setResendResults] = useState<Record<string, string>>({})

  // Refund state
  const [refunding, setRefunding] = useState<string | null>(null)
  const [refundConfirm, setRefundConfirm] = useState<string | null>(null)
  const [refundResults, setRefundResults] = useState<Record<string, { success: boolean; message: string }>>({})

  // Cancel subscription state
  const [canceling, setCanceling] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState<{ subId: string; orderId: string } | null>(null)
  const [cancelImmediate, setCancelImmediate] = useState(false)
  const [cancelResults, setCancelResults] = useState<Record<string, { success: boolean; message: string }>>({})

  // Cancel ALL subscriptions state
  const [cancelAllConfirm, setCancelAllConfirm] = useState<string | null>(null)
  const [cancelingAll, setCancelingAll] = useState<string | null>(null)

  // Sync from Stripe state
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; message: string }>>({})

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/orders?limit=50')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.orders || [])
      setEmailStatuses(data.emailStatuses || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function handleResend(orderId: string) {
    setResending(orderId)
    setResendResults(prev => ({ ...prev, [orderId]: '' }))
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Resend failed')
      setResendResults(prev => ({ ...prev, [orderId]: data.message }))
      setTimeout(fetchOrders, 2000)
    } catch (err) {
      setResendResults(prev => ({
        ...prev,
        [orderId]: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }))
    } finally {
      setResending(null)
    }
  }

  async function handleRefund(orderId: string) {
    setRefunding(orderId)
    setRefundResults(prev => ({ ...prev, [orderId]: { success: false, message: '' } }))
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Refund failed')
      setRefundResults(prev => ({
        ...prev,
        [orderId]: { success: true, message: `${data.type} refund of ${formatCurrency(data.amount)} processed` },
      }))
      setRefundConfirm(null)
      setTimeout(fetchOrders, 2000)
    } catch (err) {
      setRefundResults(prev => ({
        ...prev,
        [orderId]: { success: false, message: err instanceof Error ? err.message : 'Unknown error' },
      }))
    } finally {
      setRefunding(null)
    }
  }

  async function handleCancelSubscription(subscriptionId: string, orderId: string) {
    setCanceling(subscriptionId)
    setCancelResults(prev => ({ ...prev, [orderId]: { success: false, message: '' } }))
    try {
      const res = await fetch('/api/admin/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, immediate: cancelImmediate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancel failed')
      setCancelResults(prev => ({
        ...prev,
        [orderId]: {
          success: true,
          message: `Subscription ${data.cancelType === 'immediate' ? 'canceled immediately' : 'set to cancel at period end'}`,
        },
      }))
      setCancelConfirm(null)
      setCancelImmediate(false)
      setTimeout(fetchOrders, 2000)
    } catch (err) {
      setCancelResults(prev => ({
        ...prev,
        [orderId]: { success: false, message: err instanceof Error ? err.message : 'Unknown error' },
      }))
    } finally {
      setCanceling(null)
    }
  }

  async function handleCancelAll(userId: string, orderId: string) {
    setCancelingAll(userId)
    setCancelResults(prev => ({ ...prev, [orderId]: { success: false, message: '' } }))
    try {
      const res = await fetch('/api/admin/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, immediate: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancel failed')
      const clearedMsg = data.membershipTierCleared ? ' Membership tier cleared.' : ''
      setCancelResults(prev => ({
        ...prev,
        [orderId]: {
          success: true,
          message: `${data.canceled} subscription(s) canceled immediately.${clearedMsg}`,
        },
      }))
      setCancelAllConfirm(null)
      setTimeout(fetchOrders, 2000)
    } catch (err) {
      setCancelResults(prev => ({
        ...prev,
        [orderId]: { success: false, message: err instanceof Error ? err.message : 'Unknown error' },
      }))
    } finally {
      setCancelingAll(null)
    }
  }

  async function handleSyncFromStripe(userId: string, orderId: string) {
    setSyncing(orderId)
    setSyncResults(prev => ({ ...prev, [orderId]: { success: false, message: '' } }))
    try {
      const res = await fetch('/api/admin/sync-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      const msg = data.synced > 0
        ? `Synced ${data.synced} subscription(s) from Stripe (${data.total} total in Stripe)`
        : `No new subscriptions to sync (${data.total} in Stripe, all already tracked)`
      setSyncResults(prev => ({
        ...prev,
        [orderId]: { success: true, message: msg },
      }))
      if (data.synced > 0) {
        setTimeout(fetchOrders, 1500)
      }
    } catch (err) {
      setSyncResults(prev => ({
        ...prev,
        [orderId]: { success: false, message: err instanceof Error ? err.message : 'Unknown error' },
      }))
    } finally {
      setSyncing(null)
    }
  }

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
    emailsSent: Object.values(emailStatuses).filter(s => getEmailVerdict(s).color === 'green').length,
    emailsMissing: Object.values(emailStatuses).filter(s => getEmailVerdict(s).color === 'red').length,
  }

  return (
    <AdminWrapper>
      <Container size="xl" className="py-8">
        <Stack gap="lg">
          {/* Header */}
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ShoppingBag className="w-7 h-7 text-primary-500" />
                  Orders & Billing Management
                </h1>
                <p className="text-neutral-400 mt-1">
                  Manage orders, process refunds, and cancel subscriptions
                </p>
              </div>
              <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-neutral-400 mt-1">Total Orders</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.paid}</div>
              <div className="text-xs text-neutral-400 mt-1">Paid</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.refunded}</div>
              <div className="text-xs text-neutral-400 mt-1">Refunded</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.emailsSent}</div>
              <div className="text-xs text-neutral-400 mt-1">Emails Sent</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.emailsMissing}</div>
              <div className="text-xs text-neutral-400 mt-1">Emails Missing</div>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <Card className="p-4 border-red-500/30 bg-red-500/10">
              <p className="text-red-400 text-sm">{error}</p>
            </Card>
          )}

          {/* Loading */}
          {loading && orders.length === 0 && (
            <div className="flex justify-center py-12">
              <Spinner variant="primary" size="lg" />
            </div>
          )}

          {/* Order list */}
          {!loading && orders.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-neutral-400">No orders found</p>
            </Card>
          )}

          <div className="space-y-3">
            {orders.map(order => {
              const account = order.user_accounts as OrderAccount
              const emailStatus = emailStatuses[order.id]
              const verdict = getEmailVerdict(emailStatus)
              const VerdictIcon = verdict.icon
              const isExpanded = expandedOrder === order.id
              const productKey = order.metadata?.product_key || order.metadata?.source || '—'
              const subs = order.subscriptions || []

              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Main row */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-neutral-800/50 transition-colors"
                  >
                    {/* Email verdict */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      verdict.color === 'green' ? 'bg-green-500/20' :
                      verdict.color === 'red' ? 'bg-red-500/20' :
                      verdict.color === 'yellow' ? 'bg-yellow-500/20' :
                      'bg-neutral-500/20'
                    }`}>
                      <VerdictIcon className={`w-5 h-5 ${
                        verdict.color === 'green' ? 'text-green-400' :
                        verdict.color === 'red' ? 'text-red-400' :
                        verdict.color === 'yellow' ? 'text-yellow-400' :
                        'text-neutral-400'
                      }`} />
                    </div>

                    {/* Customer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                          {account?.full_name || account?.email || 'Unknown'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadgeColor[order.status] || statusBadgeColor.pending}`}>
                          {order.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${emailBadgeColor[verdict.color]}`}>
                          {verdict.label}
                        </span>
                        {subs.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {subs.length} sub{subs.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {account?.email || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Amount + product */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-white font-medium">
                        {formatCurrency(order.total_amount, order.currency)}
                      </div>
                      <div className="text-xs text-neutral-500">{productKey}</div>
                    </div>

                    {/* Expand toggle */}
                    <div className="flex-shrink-0 text-neutral-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 p-4 bg-neutral-900/50 space-y-4">
                      {/* Order details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-neutral-500 text-xs block mb-1">Order ID</span>
                          <span className="text-neutral-300 font-mono text-xs break-all">{order.id}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 text-xs block mb-1">User ID</span>
                          <span className="text-neutral-300 font-mono text-xs break-all">{order.user_id}</span>
                        </div>
                        {order.promo_code && (
                          <div>
                            <span className="text-neutral-500 text-xs flex items-center gap-1 mb-1">
                              <Tag className="w-3 h-3" /> Promo
                            </span>
                            <span className="text-neutral-300">{order.promo_code}</span>
                          </div>
                        )}
                        {account?.phone && (
                          <div>
                            <span className="text-neutral-500 text-xs flex items-center gap-1 mb-1">
                              <User className="w-3 h-3" /> Phone
                            </span>
                            <span className="text-neutral-300">{account.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Sync from Stripe (when no subscriptions found) */}
                      {subs.length === 0 && (
                        <div className="bg-neutral-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-neutral-400">
                              No subscriptions tracked in database for this user.
                            </div>
                            <Button
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleSyncFromStripe(order.user_id, order.id)}
                              disabled={syncing === order.id}
                            >
                              {syncing === order.id ? (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <CloudDownload className="w-3 h-3 mr-1" />
                                  Sync from Stripe
                                </>
                              )}
                            </Button>
                          </div>
                          {syncResults[order.id]?.message && (
                            <p className={`text-xs mt-2 ${syncResults[order.id].success ? 'text-green-400' : 'text-red-400'}`}>
                              {syncResults[order.id].success && <CheckCircle className="w-3 h-3 inline mr-1" />}
                              {syncResults[order.id].message}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Active Subscriptions */}
                      {subs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                            Active Subscriptions
                          </h4>
                          <div className="space-y-2">
                            {subs.map(sub => (
                              <div key={sub.id} className="bg-neutral-800 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-purple-400" />
                                    <span className="text-neutral-200 text-sm font-medium">
                                      {sub.membership_tiers?.name || sub.membership_tiers?.tier_type || 'Subscription'}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                      sub.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                      sub.status === 'trialing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                      {sub.status}
                                    </span>
                                    {sub.cancel_at_period_end && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        cancels at period end
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    Period ends: {formatDate(sub.current_period_end)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {cancelConfirm?.subId === sub.id ? (
                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1 text-xs text-neutral-400 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={cancelImmediate}
                                          onChange={e => setCancelImmediate(e.target.checked)}
                                          className="rounded border-neutral-600"
                                        />
                                        Immediate
                                      </label>
                                      <Button
                                        variant="danger"
                                        className="text-xs"
                                        onClick={() => handleCancelSubscription(sub.id, order.id)}
                                        disabled={canceling === sub.id}
                                      >
                                        {canceling === sub.id ? (
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : (
                                          'Confirm Cancel'
                                        )}
                                      </Button>
                                      <button
                                        onClick={() => { setCancelConfirm(null); setCancelImmediate(false) }}
                                        className="text-xs text-neutral-500 hover:text-neutral-300"
                                      >
                                        Back
                                      </button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => setCancelConfirm({ subId: sub.id, orderId: order.id })}
                                      disabled={sub.cancel_at_period_end}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      {sub.cancel_at_period_end ? 'Pending Cancel' : 'Cancel Sub'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Cancel All button */}
                          {subs.filter(s => !s.cancel_at_period_end).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-neutral-700">
                              {cancelAllConfirm === order.user_id ? (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-xs text-red-400">
                                    <AlertTriangle className="w-3 h-3" />
                                    Cancel all {subs.length} subscription(s) immediately? This also removes their membership tier and storage add-ons.
                                  </div>
                                  <Button
                                    variant="danger"
                                    className="text-xs whitespace-nowrap"
                                    onClick={() => handleCancelAll(order.user_id, order.id)}
                                    disabled={cancelingAll === order.user_id}
                                  >
                                    {cancelingAll === order.user_id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Ban className="w-3 h-3 mr-1" />
                                        Confirm Cancel All
                                      </>
                                    )}
                                  </Button>
                                  <button
                                    onClick={() => setCancelAllConfirm(null)}
                                    className="text-xs text-neutral-500 hover:text-neutral-300"
                                  >
                                    Back
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  onClick={() => setCancelAllConfirm(order.user_id)}
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  Cancel All Subscriptions
                                </Button>
                              )}
                            </div>
                          )}
                          {cancelResults[order.id] && (
                            <p className={`text-xs mt-2 ${cancelResults[order.id].success ? 'text-green-400' : 'text-red-400'}`}>
                              {cancelResults[order.id].success && <CheckCircle className="w-3 h-3 inline mr-1" />}
                              {cancelResults[order.id].message}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Scheduled messages */}
                      <div>
                        <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                          Scheduled Messages
                        </h4>
                        {emailStatus?.scheduled && emailStatus.scheduled.length > 0 ? (
                          <div className="space-y-2">
                            {emailStatus.scheduled.map(msg => (
                              <div key={msg.id} className="bg-neutral-800 rounded-lg p-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-300">{msg.subject || '(no subject)'}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    msg.status === 'sent' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    msg.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    msg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
                                  }`}>
                                    {msg.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                                  <span>Scheduled: {formatDate(msg.scheduledFor)}</span>
                                  {msg.sentAt && <span>Sent: {formatDate(msg.sentAt)}</span>}
                                </div>
                                {msg.error && (
                                  <p className="text-xs text-red-400 mt-1">Error: {msg.error}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 italic">
                            No scheduled messages found for this order
                          </p>
                        )}
                      </div>

                      {/* Send log */}
                      {emailStatus?.sent && emailStatus.sent.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                            Send Log
                          </h4>
                          <div className="space-y-2">
                            {emailStatus.sent.map(msg => (
                              <div key={msg.id} className="bg-neutral-800 rounded-lg p-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-300">{msg.subject || '(no subject)'}</span>
                                  <span className="text-xs text-green-400">{msg.status}</span>
                                </div>
                                {msg.sentAt && (
                                  <span className="text-xs text-neutral-500">
                                    {formatDate(msg.sentAt)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-800">
                        {/* Resend emails */}
                        <Button
                          variant={verdict.color === 'red' ? 'primary' : 'outline'}
                          onClick={() => handleResend(order.id)}
                          disabled={resending === order.id}
                          className="text-sm"
                        >
                          {resending === order.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Resend Purchase Emails
                            </>
                          )}
                        </Button>

                        {/* Refund button */}
                        {order.status === 'paid' && order.total_amount > 0 && (
                          <>
                            {refundConfirm === order.id ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-yellow-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  Refund {formatCurrency(order.total_amount, order.currency)}?
                                </div>
                                <Button
                                  variant="danger"
                                  className="text-sm"
                                  onClick={() => handleRefund(order.id)}
                                  disabled={refunding === order.id}
                                >
                                  {refunding === order.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Confirm Refund'
                                  )}
                                </Button>
                                <button
                                  onClick={() => setRefundConfirm(null)}
                                  className="text-xs text-neutral-500 hover:text-neutral-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => setRefundConfirm(order.id)}
                                className="text-sm"
                              >
                                <Undo2 className="w-4 h-4 mr-2" />
                                Refund
                              </Button>
                            )}
                          </>
                        )}

                        {order.status === 'refunded' && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                            <CheckCircle className="w-3 h-3" />
                            Refunded
                          </span>
                        )}

                        {/* Results */}
                        {resendResults[order.id] && (
                          <span className={`text-xs ${
                            resendResults[order.id].startsWith('Error') ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {resendResults[order.id]}
                          </span>
                        )}
                        {refundResults[order.id]?.message && (
                          <span className={`text-xs ${refundResults[order.id].success ? 'text-green-400' : 'text-red-400'}`}>
                            {refundResults[order.id].success && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {refundResults[order.id].message}
                          </span>
                        )}
                      </div>

                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
