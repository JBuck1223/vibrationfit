'use client'

// Admin billing controls for a DB-driven (PayPal) subscription: edit the
// renewal amount and date, pause/resume, charge now, and view payment history.

import { useState, useEffect, useCallback } from 'react'
import { Button, Badge, Spinner } from '@/lib/design-system/components'
import { ChevronDown, ChevronUp, Zap, Pause, Play, Save, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

type SubDetail = {
  id: string
  status: string
  amount_cents: number | null
  billing_interval_days: number | null
  next_billing_at: string | null
  failure_count: number | null
  payment_methods: { brand: string | null; last4: string | null; status: string } | null
}

type HistoryRow = {
  id: string
  amount: number
  status: string
  description: string | null
  provider: string | null
  paid_at: string | null
  created_at: string
}

type AddonRow = {
  id: string
  addon_type: string
  quantity: number
  unit_amount_cents: number
  status: string
}

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

export default function SubscriptionBillingControls({
  subscriptionId,
  onChanged,
}: {
  subscriptionId: string
  onChanged?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<SubDetail | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [addons, setAddons] = useState<AddonRow[]>([])

  const [amountInput, setAmountInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [charging, setCharging] = useState(false)
  const [chargeConfirm, setChargeConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDetail(data.subscription)
      setHistory(data.history || [])
      setAddons(data.addons || [])
      setAmountInput(((data.subscription?.amount_cents || 0) / 100).toFixed(2))
      setDateInput(toDateInputValue(data.subscription?.next_billing_at))
    } catch (err: any) {
      toast.error(err.message || 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }, [subscriptionId])

  useEffect(() => {
    if (open && !detail) load()
  }, [open, detail, load])

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }

  const handleSave = async () => {
    const cents = Math.round(parseFloat(amountInput) * 100)
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      await patch({
        action: 'update',
        amountCents: cents,
        nextBillingAt: dateInput ? new Date(`${dateInput}T12:00:00Z`).toISOString() : null,
      })
      toast.success('Billing schedule updated')
      await load()
      onChanged?.()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handlePauseResume = async () => {
    const paused = !detail?.next_billing_at
    setSaving(true)
    try {
      const data = await patch({ action: paused ? 'resume' : 'pause' })
      toast.success(data.message || 'Done')
      await load()
      onChanged?.()
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChargeNow = async () => {
    setCharging(true)
    try {
      const data = await patch({ action: 'charge_now' })
      toast.success(data.message || 'Charged')
      setChargeConfirm(false)
      await load()
      onChanged?.()
    } catch (err: any) {
      toast.error(err.message || 'Charge failed')
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-[#00FFFF] hover:text-white transition-colors"
      >
        <CreditCard className="w-3.5 h-3.5" />
        Billing controls
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-neutral-900/80 rounded-xl border border-neutral-700/50 space-y-3">
          {loading && !detail ? (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          ) : detail ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span>
                  Card: {detail.payment_methods
                    ? `${detail.payment_methods.brand || 'Card'} •••• ${detail.payment_methods.last4 || '????'}`
                    : 'None on file'}
                </span>
                {(detail.failure_count || 0) > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 text-xs">
                    {detail.failure_count} failed attempt{detail.failure_count === 1 ? '' : 's'}
                  </Badge>
                )}
                {!detail.next_billing_at && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Billing paused</Badge>
                )}
                {addons.filter(a => a.status === 'active').map(a => (
                  <Badge key={a.id} className="bg-neutral-700/50 text-neutral-300 text-xs">
                    {a.quantity}× {a.addon_type} ({fmt(a.unit_amount_cents)}/cycle)
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label className="text-[11px] text-neutral-500 uppercase tracking-wide block mb-1">Renewal amount (USD)</label>
                  <input
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 uppercase tracking-wide block mb-1">Next billing date</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="text-xs">
                  <Save className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handlePauseResume} disabled={saving} className="text-xs">
                  {detail.next_billing_at
                    ? <><Pause className="w-3.5 h-3.5 mr-1" /> Pause billing</>
                    : <><Play className="w-3.5 h-3.5 mr-1" /> Resume billing</>}
                </Button>
                {chargeConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-300">
                      Charge {fmt(detail.amount_cents || 0)} now?
                    </span>
                    <Button size="sm" variant="danger" onClick={handleChargeNow} disabled={charging} loading={charging} className="text-xs">
                      Confirm charge
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setChargeConfirm(false)} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setChargeConfirm(true)}
                    disabled={!detail.amount_cents || !detail.payment_methods}
                    className="text-xs text-[#FFB000] hover:bg-[#FFB000]/10"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1" /> Charge now
                  </Button>
                )}
              </div>

              {history.length > 0 && (
                <div>
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wide mb-1.5">Payment history</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {history.map(h => (
                      <div key={h.id} className="flex items-center justify-between text-xs bg-neutral-950/60 rounded-lg px-2.5 py-1.5">
                        <div className="min-w-0 flex-1">
                          <span className="text-neutral-300">{h.description || 'Payment'}</span>
                          <span className="text-neutral-600 ml-2">
                            {new Date(h.paid_at || h.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={h.status === 'succeeded' ? 'text-[#39FF14]' : 'text-red-400'}>
                            {fmt(h.amount)}
                          </span>
                          {h.status !== 'succeeded' && (
                            <Badge className="bg-red-500/20 text-red-400 text-[10px]">{h.status}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-neutral-500">Failed to load.</p>
          )}
        </div>
      )}
    </div>
  )
}
