'use client'

import { useState } from 'react'
import { Card, Button } from '@/lib/design-system/components'
import { CreditCard, Trash2, Star, Plus } from 'lucide-react'
import { toast } from 'sonner'

type PaymentMethod = {
  id: string
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
  isDefault: boolean
}

type Props = {
  paymentMethods: PaymentMethod[]
  onRefresh: () => void
  onAddCard: () => void
}

function brandIcon(brand: string | null) {
  const b = brand?.toLowerCase()
  if (b === 'visa') return 'Visa'
  if (b === 'mastercard') return 'MC'
  if (b === 'amex') return 'Amex'
  if (b === 'discover') return 'Disc'
  return brand || 'Card'
}

export default function PaymentMethodsList({ paymentMethods, onRefresh, onAddCard }: Props) {
  const [actionId, setActionId] = useState<string | null>(null)

  const handleSetDefault = async (pmId: string) => {
    setActionId(pmId)
    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_default', paymentMethodId: pmId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to set default')
      }
      toast.success('Default payment method updated')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionId(null)
    }
  }

  const handleRemove = async (pmId: string) => {
    if (!confirm('Remove this payment method?')) return
    setActionId(pmId)
    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove')
      }
      toast.success('Payment method removed')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <Card variant="outlined" className="p-4 md:p-5 border-neutral-800 bg-neutral-900/30">
      <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg md:text-xl font-semibold text-white leading-snug text-center sm:text-left">Payment methods</h3>
        <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto shrink-0" onClick={onAddCard}>
          <Plus className="w-4 h-4 mr-1.5 shrink-0" />
          Add card
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-6">No saved payment methods</p>
      ) : (
        <div className="space-y-2">
          {paymentMethods.map(pm => (
            <div
              key={pm.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-neutral-950/80 rounded-xl p-3 sm:p-4 border border-neutral-800/80"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800 shrink-0">
                  <CreditCard className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-white">
                      {brandIcon(pm.brand)} ****{pm.last4}
                    </span>
                    {pm.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#39FF14] font-medium">
                        <Star className="w-3 h-3 fill-current shrink-0" /> Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Expires {pm.expMonth}/{pm.expYear}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end sm:shrink-0">
                {!pm.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center sm:min-w-0"
                    onClick={() => handleSetDefault(pm.id)}
                    disabled={actionId === pm.id}
                  >
                    Set default
                  </Button>
                )}
                {!pm.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center sm:w-auto text-red-400 hover:text-red-300 min-h-[44px] sm:min-h-0"
                    onClick={() => handleRemove(pm.id)}
                    disabled={actionId === pm.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2 sm:mr-0 shrink-0" />
                    <span className="sm:hidden">Remove</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
