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
  DollarSign,
  User,
  Tag,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OrderAccount {
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone: string | null
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
      // Refresh to show updated status
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

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
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
                  Orders & Email Status
                </h1>
                <p className="text-neutral-400 mt-1">
                  Monitor purchase emails and resend if needed
                </p>
              </div>
              <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-neutral-400 mt-1">Total Orders</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.paid}</div>
              <div className="text-xs text-neutral-400 mt-1">Paid</div>
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

                      {/* Resend button */}
                      <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
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
                        {resendResults[order.id] && (
                          <span className={`text-xs ${
                            resendResults[order.id].startsWith('Error') ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {resendResults[order.id]}
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
