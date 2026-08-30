'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Container, Card, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { DollarSign, Users, Scale, TrendingDown, RefreshCw } from 'lucide-react'

// ============================================================================
// Types (mirror /api/admin/billing responses)
// ============================================================================

interface UserCostRow {
  user_id: string | null
  email: string
  name: string | null
  tier_name: string | null
  tier_price_monthly_cents: number
  revenue_cents_for_range: number
  margin_cents: number
  total_cost_cents: number
  actual_cost_cents: number
  estimated_cost_cents: number
  billable_cost_cents: number
  background_cost_cents: number
  actions_count: number
  by_provider: Record<string, number>
  by_action: Record<string, number>
  last_activity: string
}

interface PerUserResponse {
  users: UserCostRow[]
  totals: {
    total_cost_cents: number
    total_revenue_cents: number
    total_actions: number
    users_count: number
  }
  revenue_source: string
  stripe_unmapped_cents: number | null
  stripe_error: string | null
  days: number
}

interface ProviderRow {
  provider: string
  kind: 'ai' | 'infrastructure'
  attributed_cents: number
  billed_cents: number
  unattributed_cents: number | null
  lifetime_billed_cents: number | null
  attributed_by_day: Record<string, number>
  billed_by_day: Record<string, number>
  last_synced: string | null
}

interface ProvidersResponse {
  providers: ProviderRow[]
  reconciliation: {
    pending: number
    matched: number
    discrepancy: number
    not_applicable: number
  }
  days: number
}

type Tab = 'users' | 'providers' | 'profitability'

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  vercel_gateway: 'Vercel Gateway',
  mureka: 'Mureka',
  fal: 'fal.ai',
  elevenlabs: 'ElevenLabs',
  google: 'Google',
  vercel_infra: 'Vercel (hosting)',
  aws: 'AWS',
  supabase: 'Supabase',
  unknown: 'Unknown',
}

function toDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [startDate, setStartDate] = useState(() =>
    toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  )
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()))

  const [perUser, setPerUser] = useState<PerUserResponse | null>(null)
  const [providers, setProviders] = useState<ProvidersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const range = `start=${startDate}&end=${endDate}`
      const [userRes, providerRes] = await Promise.all([
        fetch(`/api/admin/billing?type=per-user&${range}`, { credentials: 'include' }),
        fetch(`/api/admin/billing?type=providers&${range}`, { credentials: 'include' }),
      ])

      if (!userRes.ok || !providerRes.ok) {
        const failed = !userRes.ok ? userRes : providerRes
        if (failed.status === 401) throw new Error('Please log in to access admin features')
        if (failed.status === 403) throw new Error('Admin access required')
        const body = await failed.json().catch(() => ({}))
        throw new Error(body.details || body.error || `Request failed (${failed.status})`)
      }

      setPerUser(await userRes.json())
      setProviders(await providerRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const setPreset = (days: number) => {
    setEndDate(toDateInput(new Date()))
    setStartDate(toDateInput(new Date(Date.now() - days * 24 * 60 * 60 * 1000)))
  }

  const runSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/admin/billing/sync', { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.details || body.error || `Sync failed (${res.status})`)
      }
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const fmtPrecise = (cents: number) =>
    cents !== 0 && Math.abs(cents) < 1 ? `$${(cents / 100).toFixed(4)}` : fmt(cents)

  const tabClass = (tab: Tab) =>
    `px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base whitespace-nowrap ${
      activeTab === tab ? 'bg-primary-500 text-black' : 'text-neutral-400 hover:text-white'
    }`

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          {/* Date range controls */}
          <Card variant="outlined" className="!p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-400">From</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#1F1F1F] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white"
                />
                <label className="text-sm text-neutral-400">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={toDateInput(new Date())}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#1F1F1F] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white"
                />
              </div>
              <div className="flex gap-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setPreset(d)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[#1F1F1F] text-neutral-300 hover:text-white hover:bg-[#2A2A2A] transition-colors"
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <button
                onClick={runSync}
                disabled={syncing}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[#1F1F1F] text-neutral-300 hover:text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing providers...' : 'Sync provider billing'}
              </button>
            </div>
          </Card>

          {/* Summary cards */}
          {perUser && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card variant="outlined" className="!p-5">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{fmt(perUser.totals.total_cost_cents)}</div>
                    <div className="text-sm text-neutral-400">Total spend</div>
                  </div>
                </div>
              </Card>
              <Card variant="outlined" className="!p-5">
                <div className="flex items-center gap-3">
                  <Scale className="w-8 h-8 text-secondary-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{fmt(perUser.totals.total_revenue_cents)}</div>
                    <div className="text-sm text-neutral-400">
                      {perUser.revenue_source === 'tier_prorated' ? 'Revenue (prorated est.)' : 'Revenue (real charges)'}
                    </div>
                  </div>
                </div>
              </Card>
              <Card variant="outlined" className="!p-5">
                <div className="flex items-center gap-3">
                  <TrendingDown
                    className={`w-8 h-8 ${
                      perUser.totals.total_revenue_cents - perUser.totals.total_cost_cents >= 0
                        ? 'text-primary-500'
                        : 'text-red-500'
                    }`}
                  />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {fmt(perUser.totals.total_revenue_cents - perUser.totals.total_cost_cents)}
                    </div>
                    <div className="text-sm text-neutral-400">Margin</div>
                  </div>
                </div>
              </Card>
              <Card variant="outlined" className="!p-5">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-accent-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{perUser.totals.users_count}</div>
                    <div className="text-sm text-neutral-400">Active members</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-[#1F1F1F] p-1 rounded-lg overflow-x-auto">
            <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
              Per-Member Costs
            </button>
            <button onClick={() => setActiveTab('providers')} className={tabClass('providers')}>
              Provider Truth
            </button>
            <button onClick={() => setActiveTab('profitability')} className={tabClass('profitability')}>
              Profitability
            </button>
          </div>

          {error && (
            <Card variant="outlined" className="!p-4 border-red-500/50">
              <p className="text-red-400 text-sm">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* ============ Per-member costs ============ */}
              {activeTab === 'users' && perUser && (
                <Card variant="outlined" className="!p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#333] text-left text-neutral-400">
                        <th className="px-4 py-3 font-medium">Member</th>
                        <th className="px-4 py-3 font-medium">Tier</th>
                        <th className="px-4 py-3 font-medium text-right">Total cost</th>
                        <th className="px-4 py-3 font-medium text-right">Member usage</th>
                        <th className="px-4 py-3 font-medium text-right">Background</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                        <th className="px-4 py-3 font-medium">Top providers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perUser.users.map((u) => (
                        <tr key={u.user_id || 'system'} className="border-b border-[#222] hover:bg-[#1A1A1A]">
                          <td className="px-4 py-3">
                            <div className="text-white">{u.name || u.email}</div>
                            {u.name && <div className="text-xs text-neutral-500">{u.email}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {u.tier_name ? (
                              <Badge variant="secondary">{u.tier_name}</Badge>
                            ) : u.user_id ? (
                              <span className="text-neutral-500">—</span>
                            ) : (
                              <Badge variant="warning">System</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium">
                            {fmtPrecise(u.total_cost_cents)}
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-300">{fmtPrecise(u.billable_cost_cents)}</td>
                          <td className="px-4 py-3 text-right text-neutral-500">{fmtPrecise(u.background_cost_cents)}</td>
                          <td className="px-4 py-3 text-right text-neutral-300">{u.actions_count.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(u.by_provider)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([provider, cents]) => (
                                  <span
                                    key={provider}
                                    className="text-xs px-2 py-0.5 rounded-full bg-[#1F1F1F] text-neutral-400"
                                  >
                                    {PROVIDER_LABELS[provider] || provider} {fmtPrecise(cents)}
                                  </span>
                                ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {perUser.users.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                            No usage in this date range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              )}

              {/* ============ Provider truth ============ */}
              {activeTab === 'providers' && providers && (
                <Stack gap="md">
                  <Card variant="outlined" className="!p-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-neutral-400">Gateway reconciliation:</span>
                      <Badge variant="success">{providers.reconciliation.matched} matched</Badge>
                      <Badge variant="warning">{providers.reconciliation.pending} pending</Badge>
                      {providers.reconciliation.discrepancy > 0 && (
                        <Badge variant="error">{providers.reconciliation.discrepancy} discrepancies</Badge>
                      )}
                    </div>
                  </Card>

                  <Card variant="outlined" className="!p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#333] text-left text-neutral-400">
                          <th className="px-4 py-3 font-medium">Provider</th>
                          <th className="px-4 py-3 font-medium text-right">Attributed (ledger)</th>
                          <th className="px-4 py-3 font-medium text-right">Billed (provider)</th>
                          <th className="px-4 py-3 font-medium text-right">Unattributed gap</th>
                          <th className="px-4 py-3 font-medium text-right">Lifetime billed</th>
                          <th className="px-4 py-3 font-medium">Last synced</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.providers.map((p) => (
                          <tr key={p.provider} className="border-b border-[#222] hover:bg-[#1A1A1A]">
                            <td className="px-4 py-3 text-white">
                              {PROVIDER_LABELS[p.provider] || p.provider}
                              {p.kind === 'infrastructure' && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#1F1F1F] text-neutral-500">
                                  Infra
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-white">
                              {p.kind === 'infrastructure' ? (
                                <span className="text-neutral-600">—</span>
                              ) : (
                                fmtPrecise(p.attributed_cents)
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-300">
                              {p.last_synced ? fmtPrecise(p.billed_cents) : <span className="text-neutral-600">not synced</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {p.unattributed_cents === null ? (
                                <span className="text-neutral-600">—</span>
                              ) : (
                                <span className={p.unattributed_cents > 100 ? 'text-red-400' : 'text-neutral-300'}>
                                  {fmtPrecise(p.unattributed_cents)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-300">
                              {p.lifetime_billed_cents === null ? (
                                <span className="text-neutral-600">—</span>
                              ) : (
                                fmtPrecise(p.lifetime_billed_cents)
                              )}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                              {p.last_synced ? new Date(p.last_synced).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))}
                        {providers.providers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                              No provider data in this date range
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>

                  <p className="text-xs text-neutral-500">
                    Attributed = per-request costs in the token_usage ledger (reconciled actuals where available,
                    estimates otherwise). Billed = what the provider&apos;s billing API reports for days inside the
                    selected range. Mureka and the Gateway only expose a running total (no per-day history), so
                    their daily Billed numbers accrue from the first sync onward — Lifetime billed shows the full
                    amount ever spent with that provider. OpenAI, Vercel hosting, and AWS support historical daily
                    costs; run &quot;Sync provider billing&quot; to backfill. Infra rows are platform costs with no
                    per-member attribution. Supabase has no billing API — set SUPABASE_MONTHLY_COST_USD to include
                    it as a prorated daily amount.
                  </p>
                </Stack>
              )}

              {/* ============ Profitability ============ */}
              {activeTab === 'profitability' && perUser && (
                <Stack gap="md">
                  <Card variant="outlined" className="!p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#333] text-left text-neutral-400">
                          <th className="px-4 py-3 font-medium">Member</th>
                          <th className="px-4 py-3 font-medium">Tier</th>
                          <th className="px-4 py-3 font-medium text-right">
                            Revenue {perUser.revenue_source === 'tier_prorated' ? '(est.)' : '(real)'}
                          </th>
                          <th className="px-4 py-3 font-medium text-right">Cost</th>
                          <th className="px-4 py-3 font-medium text-right">Margin</th>
                          <th className="px-4 py-3 font-medium text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perUser.users
                          .filter((u) => u.user_id)
                          .slice()
                          .sort((a, b) => a.margin_cents - b.margin_cents)
                          .map((u) => {
                            const marginPct =
                              u.revenue_cents_for_range > 0
                                ? (u.margin_cents / u.revenue_cents_for_range) * 100
                                : null
                            return (
                              <tr key={u.user_id} className="border-b border-[#222] hover:bg-[#1A1A1A]">
                                <td className="px-4 py-3">
                                  <div className="text-white">{u.name || u.email}</div>
                                  {u.name && <div className="text-xs text-neutral-500">{u.email}</div>}
                                </td>
                                <td className="px-4 py-3">
                                  {u.tier_name ? (
                                    <Badge variant="secondary">{u.tier_name}</Badge>
                                  ) : (
                                    <span className="text-neutral-500">Free / none</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-neutral-300">
                                  {fmt(u.revenue_cents_for_range)}
                                </td>
                                <td className="px-4 py-3 text-right text-neutral-300">{fmtPrecise(u.total_cost_cents)}</td>
                                <td
                                  className={`px-4 py-3 text-right font-medium ${
                                    u.margin_cents >= 0 ? 'text-primary-500' : 'text-red-400'
                                  }`}
                                >
                                  {fmt(u.margin_cents)}
                                </td>
                                <td className="px-4 py-3 text-right text-neutral-300">
                                  {marginPct === null ? '—' : `${marginPct.toFixed(0)}%`}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </Card>
                  <p className="text-xs text-neutral-500">
                    {perUser.revenue_source === 'tier_prorated'
                      ? 'Charge history is unavailable, so revenue is estimated from the membership tier price prorated to the range.'
                      : `Revenue is real charges (net of refunds) paid during the selected range — source: ${perUser.revenue_source}.`}
                    {' '}Sorted worst margin first — members at the top are the closest to (or past) unprofitable.
                    {perUser.stripe_unmapped_cents != null && perUser.stripe_unmapped_cents > 0 && (
                      <> {`$${(perUser.stripe_unmapped_cents / 100).toFixed(2)} in Stripe charges could not be matched to a member account.`}</>
                    )}
                  </p>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
