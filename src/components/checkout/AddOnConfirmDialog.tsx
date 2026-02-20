'use client'

import { useState } from 'react'
import { Modal, Button } from '@/lib/design-system/components'
import { Minus, Plus, Loader2, CreditCard, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice, formatTokensShort } from '@/lib/billing/config'
import { ADDON_PRICING } from '@/lib/checkout/products'

type AddonMode = 'subscription' | 'onetime'

interface AddOnConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: AddonMode
  addonType: 'tokens' | 'storage'
  unitLabel: string
  unitPriceCents: number
  intervalLabel?: string
  maxQuantity?: number
  packKey?: string
  productKey?: string
  onSuccess?: () => void
}

export default function AddOnConfirmDialog({
  isOpen,
  onClose,
  mode,
  addonType,
  unitLabel,
  unitPriceCents,
  intervalLabel,
  maxQuantity = 10,
  packKey,
  productKey,
  onSuccess,
}: AddOnConfirmDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const total = unitPriceCents * quantity

  const grantDescription = addonType === 'tokens'
    ? `${formatTokensShort(ADDON_PRICING.TOKEN_GRANT_PER_UNIT * quantity)} VIVA tokens`
    : `${ADDON_PRICING.STORAGE_GRANT_PER_UNIT * quantity}GB storage`

  async function handleConfirm() {
    setLoading(true)
    try {
      if (mode === 'subscription') {
        const res = await fetch('/api/checkout/add-to-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonType, quantity }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update subscription')
        toast.success(`${grantDescription} added to your subscription`)
      } else {
        const res = await fetch('/api/checkout/charge-saved-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productKey: productKey || 'tokens', packKey, quantity }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Payment failed')
        toast.success(`${grantDescription} purchased and added to your balance`)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Purchase" size="sm">
      <div className="space-y-6">
        {/* Quantity selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl bg-[#333] text-white flex items-center justify-center hover:bg-[#404040] transition-colors disabled:opacity-30"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-white w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="w-10 h-10 rounded-xl bg-[#333] text-white flex items-center justify-center hover:bg-[#404040] transition-colors disabled:opacity-30"
              disabled={quantity >= maxQuantity}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            {unitLabel} per unit
          </p>
        </div>

        {/* Summary */}
        <div className="bg-[#2A2A2A] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-neutral-300">
            <span>{grantDescription}</span>
            <span>{formatPrice(total)}</span>
          </div>

          {mode === 'subscription' && intervalLabel && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Repeat className="w-3 h-3" />
              <span>Added to your Vision Pro billing ({intervalLabel})</span>
            </div>
          )}

          {mode === 'onetime' && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <CreditCard className="w-3 h-3" />
              <span>One-time charge to your card on file</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing
              </span>
            ) : (
              `Pay ${formatPrice(total)}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
