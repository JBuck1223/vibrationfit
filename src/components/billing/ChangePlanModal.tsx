'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Spinner } from '@/lib/design-system/components'
import { X, Check, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/billing/config'
import { toast } from 'sonner'

type Tier = {
  id: string
  name: string
  description: string | null
  tier_type: string
  price_monthly: number
  price_yearly: number | null
  billing_interval: string
  plan_category: string
  features: string[]
  is_active: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  currentTierId: string | null
  onPlanChanged: () => void
}

export default function ChangePlanModal({ isOpen, onClose, currentTierId, onPlanChanged }: Props) {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [prorationPreview, setProrationPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/admin/membership-tiers')
      .then(res => res.json())
      .then(data => {
        const available = (data.tiers || []).filter(
          (t: Tier) => t.is_active && t.plan_category === 'subscription'
        )
        setTiers(available)
      })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [isOpen])

  useEffect(() => {
    if (!selectedTierId || selectedTierId === currentTierId) {
      setProrationPreview(null)
      return
    }

    setPreviewLoading(true)
    fetch(`/api/billing/change-plan?targetTierId=${selectedTierId}`)
      .then(res => res.json())
      .then(data => setProrationPreview(data))
      .catch(() => setProrationPreview(null))
      .finally(() => setPreviewLoading(false))
  }, [selectedTierId, currentTierId])

  const handleConfirm = async () => {
    if (!selectedTierId) return
    setChanging(true)
    try {
      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTierId: selectedTierId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to change plan')
      }

      toast.success('Plan changed successfully')
      onPlanChanged()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setChanging(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Change Plan</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-3 mb-6">
            {tiers.map(tier => {
              const isCurrent = tier.id === currentTierId
              const isSelected = tier.id === selectedTierId
              const price = tier.billing_interval === 'year'
                ? (tier.price_yearly || tier.price_monthly)
                : tier.price_monthly
              const intervalLabel = tier.billing_interval === 'year' ? '/year' : '/28 days'

              return (
                <button
                  key={tier.id}
                  onClick={() => !isCurrent && setSelectedTierId(tier.id)}
                  disabled={isCurrent}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-[#39FF14] bg-[#39FF14]/5'
                      : isCurrent
                        ? 'border-neutral-700 bg-neutral-900 opacity-60'
                        : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{tier.name}</span>
                    <div className="flex items-center gap-2">
                      {isCurrent && <Badge>Current</Badge>}
                      <span className="text-sm font-medium text-white">
                        {formatPrice(price)}{intervalLabel}
                      </span>
                    </div>
                  </div>
                  {tier.description && (
                    <p className="text-xs text-neutral-400">{tier.description}</p>
                  )}
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-[#39FF14]">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Proration preview */}
        {selectedTierId && selectedTierId !== currentTierId && (
          <div className="bg-neutral-900 rounded-xl p-4 mb-4">
            {previewLoading ? (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-neutral-400">
                <Spinner size="sm" /> Calculating cost...
              </div>
            ) : prorationPreview ? (
              <div>
                <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wide">
                  Proration Summary
                </div>
                {prorationPreview.lines?.map((line: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-neutral-300 mb-1">
                    <span className="truncate mr-4">{line.description}</span>
                    <span className={line.amount < 0 ? 'text-green-400' : ''}>
                      {line.amount < 0 ? '-' : ''}{formatPrice(Math.abs(line.amount))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium text-white mt-2 pt-2 border-t border-neutral-800">
                  <span>Due now</span>
                  <span>
                    {prorationPreview.immediateAmount > 0
                      ? formatPrice(prorationPreview.immediateAmount)
                      : 'Credit applied'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-400 text-center py-2">
                Unable to preview proration
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!selectedTierId || selectedTierId === currentTierId || changing}
            onClick={handleConfirm}
          >
            {changing ? 'Switching...' : (
              <>Switch Plan <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
