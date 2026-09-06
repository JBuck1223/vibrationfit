'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Card, Container, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { RefreshCw, Zap } from 'lucide-react'

interface AdminActivation {
  id: string
  user_id: string
  status: string
  category: string | null
  desired_emotional_state: string | null
  vision_statement: string | null
  asset_status: Record<string, { state?: string }>
  inspired_next_step: string | null
  ready_at: string | null
  entered_at: string | null
  created_at: string
  email: string | null
  name: string | null
}

interface Stats {
  total: number
  ready: number
  entered: number
  inProgress: number
  last7Days: number
}

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  entered: 'success',
  ready: 'info',
  generating: 'warning',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function assetSummary(assetStatus: Record<string, { state?: string }> | null): string {
  const entries = Object.entries(assetStatus ?? {})
  if (entries.length === 0) return '—'
  const ready = entries.filter(([, v]) => v?.state === 'ready').length
  const failed = entries.filter(([, v]) => v?.state === 'failed').length
  return `${ready}/${entries.length} ready${failed > 0 ? ` · ${failed} failed` : ''}`
}

export default function AdminActivationsPage() {
  const [activations, setActivations] = useState<AdminActivation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/activations')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load activations')
      setActivations(data.activations)
      setStats(data.stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activations')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AdminWrapper>
      <Container size="xl" className="py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-400">
            <Zap className="h-4 w-4 text-[#39FF14]" />
            <span className="text-sm">
              Free Activation funnel — every lead who started the experience
            </span>
          </div>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {stats ? (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Last 7 Days', value: stats.last7Days },
              { label: 'In Progress', value: stats.inProgress },
              { label: 'Ready', value: stats.ready },
              { label: 'Entered', value: stats.entered },
            ].map((stat) => (
              <Card key={stat.label} className="p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                  {stat.label}
                </p>
              </Card>
            ))}
          </div>
        ) : null}

        {error ? (
          <Card className="border-red-500/30 p-6 text-center text-red-400">{error}</Card>
        ) : loading && activations.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner variant="primary" size="lg" />
          </div>
        ) : activations.length === 0 ? (
          <Card className="p-10 text-center text-neutral-400">
            No Activations yet. They&rsquo;ll appear here as leads start the free experience.
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Assets</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Ready</th>
                  <th className="px-4 py-3">Entered</th>
                  <th className="px-4 py-3">Next Step</th>
                </tr>
              </thead>
              <tbody>
                {activations.map((activation) => (
                  <tr
                    key={activation.id}
                    className="border-b border-white/5 align-top transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {activation.name || activation.email || activation.user_id.slice(0, 8)}
                      </p>
                      {activation.name && activation.email ? (
                        <p className="text-xs text-neutral-500">{activation.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[activation.status] ?? 'neutral'}>
                        {activation.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-300">
                      {activation.category ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {assetSummary(activation.asset_status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                      {formatDate(activation.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                      {formatDate(activation.ready_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                      {formatDate(activation.entered_at)}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-neutral-400">
                      {activation.inspired_next_step ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Container>
    </AdminWrapper>
  )
}
