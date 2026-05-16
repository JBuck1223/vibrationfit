'use client'

import { useState } from 'react'
import { Card, Button } from '@/lib/design-system/components'
import { Coins, HardDrive, Trash2, Plus } from 'lucide-react'
import { formatPrice } from '@/lib/billing/config'
import { toast } from 'sonner'

type Addon = {
  id: string
  priceId: string
  addonType: string
  quantity: number
  unitAmount: number
  currency: string
  interval: string | null
  intervalCount: number | null
}

type Props = {
  addons: Addon[]
  onRemoved: () => void
}

function intervalLabel(interval: string | null): string {
  if (interval === 'year') return '/year'
  return '/28 days'
}

export default function AddOnsList({ addons, onRemoved }: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (addon: Addon) => {
    if (!confirm(`Remove this ${addon.addonType} add-on? You'll receive a prorated credit.`)) return

    setRemovingId(addon.id)
    try {
      const res = await fetch('/api/billing/addons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionItemId: addon.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove add-on')
      }

      toast.success('Add-on removed')
      onRemoved()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove add-on')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Card variant="outlined" className="p-4 md:p-5 border-neutral-800 bg-neutral-900/30">
      <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg md:text-xl font-semibold text-white leading-snug text-center sm:text-left">Active add-ons</h3>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center sm:w-auto shrink-0"
          onClick={() => { window.location.href = '/dashboard/add-tokens' }}
        >
          <Plus className="w-4 h-4 mr-1.5 shrink-0" />
          Add
        </Button>
      </div>

      {addons.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-6">No active add-ons</p>
      ) : (
        <div className="space-y-2">
          {addons.map(addon => {
            const Icon = addon.addonType === 'tokens' ? Coins : HardDrive
            const total = addon.unitAmount * addon.quantity
            return (
              <div
                key={addon.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-neutral-950/80 rounded-xl p-3 sm:p-4 border border-neutral-800/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800 shrink-0">
                    <Icon className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white capitalize">
                      {addon.addonType} x{addon.quantity}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatPrice(total)}{intervalLabel(addon.interval)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center sm:w-auto text-red-400 hover:text-red-300 min-h-[44px] sm:min-h-0"
                  onClick={() => handleRemove(addon)}
                  disabled={removingId === addon.id}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span className="ml-2 sm:hidden">Remove</span>
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
