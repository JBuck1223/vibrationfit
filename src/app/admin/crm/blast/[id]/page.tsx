'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  PageHero,
} from '@/lib/design-system/components'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  MailOpen,
  MousePointerClick,
  Ban,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { CRM_SENDERS } from '@/lib/crm/senders'

interface CampaignProgress {
  campaign: {
    id: string
    name: string
    subject: string
    senderId: string
    audienceCount: number
    sentCount: number
    failedCount: number
    status: string
    createdAt: string
    updatedAt: string
  }
  stats: {
    total: number
    delivered: number
    bounced: number
    opened: number
    clicked: number
    failed: number
  }
  pending: number
  recipients: Array<{
    email: string
    status: string
    sentAt: string | null
    deliveredAt: string | null
    openedAt: string | null
    clickedAt: string | null
  }>
}

const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-white hover:bg-[#333] transition-all duration-200'

function statusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-[#00FFFF]/20 text-[#00FFFF]'
    case 'opened': return 'bg-[#BF00FF]/20 text-[#BF00FF]'
    case 'clicked': return 'bg-[#FFFF00]/20 text-[#FFFF00]'
    case 'bounced': return 'bg-[#FF0040]/20 text-[#FF0040]'
    case 'failed': return 'bg-[#FF0040]/20 text-[#FF0040]'
    case 'sent': return 'bg-[#39FF14]/20 text-[#39FF14]'
    default: return 'bg-neutral-700 text-neutral-400'
  }
}

function campaignStatusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    sending: { color: 'bg-[#FFFF00]/20 text-[#FFFF00]', label: 'Sending' },
    sent: { color: 'bg-[#39FF14]/20 text-[#39FF14]', label: 'Complete' },
    cancelled: { color: 'bg-[#FF0040]/20 text-[#FF0040]', label: 'Cancelled' },
    draft: { color: 'bg-neutral-700 text-neutral-400', label: 'Draft' },
  }
  const entry = map[status] || map.draft
  return (
    <Badge className={`${entry.color} text-xs px-2 py-0.5`}>
      {entry.label}
    </Badge>
  )
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<CampaignProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/blast/${id}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load campaign')
      }
      const json: CampaignProgress = await res.json()
      setData(json)
      setError(null)

      const isSending = json.campaign.status === 'sending' || json.pending > 0
      const delay = isSending ? 3000 : 15000
      pollRef.current = setTimeout(fetchData, delay)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [fetchData])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error || !data) {
    return (
      <Container size="xl">
        <div className="text-center py-24 space-y-4">
          <AlertTriangle className="w-12 h-12 text-[#FF0040] mx-auto" />
          <p className="text-neutral-400">{error || 'Campaign not found'}</p>
          <button type="button" onClick={() => router.push('/admin/crm/blast')} className={btnGhost}>
            <ArrowLeft className="w-4 h-4" /> Back to Blast
          </button>
        </div>
      </Container>
    )
  }

  const { campaign, stats, pending, recipients } = data
  const senderLabel = CRM_SENDERS.find((s) => s.id === campaign.senderId)?.label || campaign.senderId
  const isSending = campaign.status === 'sending' || pending > 0
  const progressPct = campaign.audienceCount
    ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.audienceCount) * 100)
    : 0

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Campaign Report"
          subtitle={campaign.subject}
        >
          <button
            type="button"
            onClick={() => router.push('/admin/crm/blast')}
            className={btnGhost}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blast
          </button>
        </PageHero>

        {/* Header card */}
        <Card className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">{campaign.subject}</h2>
                {campaignStatusBadge(campaign.status)}
              </div>
              <p className="text-sm text-neutral-500">
                Sent by {senderLabel} on {new Date(campaign.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold text-white">{campaign.audienceCount}</p>
              <p className="text-xs text-neutral-500">Total Recipients</p>
            </div>
          </div>

          {isSending && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#FFFF00]">
                <Spinner size="sm" />
                <span>Sending in progress... {campaign.sentCount} / {campaign.audienceCount}</span>
              </div>
              <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#39FF14] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Send className="w-5 h-5" />} label="Sent" value={stats.total} color="#39FF14" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Delivered" value={stats.delivered} total={stats.total} color="#00FFFF" />
          <StatCard icon={<MailOpen className="w-5 h-5" />} label="Opened" value={stats.opened} total={stats.total} color="#BF00FF" />
          <StatCard icon={<MousePointerClick className="w-5 h-5" />} label="Clicked" value={stats.clicked} total={stats.total} color="#FFFF00" />
          <StatCard icon={<Ban className="w-5 h-5" />} label="Bounced" value={stats.bounced} total={stats.total} color="#FF0040" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={pending} color="#666" />
        </div>

        {/* Recipient table */}
        <Card className="p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recipients ({recipients.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-[#333]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333] bg-[#1A1A1A]">
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium hidden sm:table-cell">Sent</th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium hidden md:table-cell">Delivered</th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium hidden md:table-cell">Opened</th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium hidden lg:table-cell">Clicked</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, i) => (
                  <tr key={i} className="border-b border-[#333] last:border-0 hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-2.5 px-4 text-white truncate max-w-[260px]">{r.email}</td>
                    <td className="py-2.5 px-4">
                      <Badge className={`${statusColor(r.status)} text-xs px-2 py-0.5`}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 hidden sm:table-cell">
                      {r.sentAt ? new Date(r.sentAt).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 hidden md:table-cell">
                      {r.deliveredAt ? new Date(r.deliveredAt).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 hidden md:table-cell">
                      {r.openedAt ? new Date(r.openedAt).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 hidden lg:table-cell">
                      {r.clickedAt ? new Date(r.clickedAt).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
                {recipients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      {isSending ? 'Messages are being sent...' : 'No emails sent yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

function StatCard({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total?: number
  color: string
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null

  return (
    <Card className="p-4 text-center">
      <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">
        {label}
        {pct !== null && <span className="ml-1">({pct}%)</span>}
      </p>
    </Card>
  )
}
