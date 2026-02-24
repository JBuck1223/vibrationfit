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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Payment Methods</h3>
        <Button variant="ghost" size="sm" onClick={onAddCard}>
          <Plus className="w-4 h-4 mr-1" />
          Add Card
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-4">No saved payment methods</p>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map(pm => (
            <div
              key={pm.id}
              className="flex items-center justify-between bg-neutral-900 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-neutral-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {brandIcon(pm.brand)} ****{pm.last4}
                    </span>
                    {pm.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#39FF14] font-medium">
                        <Star className="w-3 h-3 fill-current" /> Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400">
                    Expires {pm.expMonth}/{pm.expYear}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!pm.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(pm.id)}
                    disabled={actionId === pm.id}
                  >
                    Set Default
                  </Button>
                )}
                {!pm.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleRemove(pm.id)}
                    disabled={actionId === pm.id}
                  >
                    <Trash2 className="w-4 h-4" />
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
