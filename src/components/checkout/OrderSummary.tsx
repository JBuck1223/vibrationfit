'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/lib/design-system/components'
import { Check, Tag, ShieldCheck } from 'lucide-react'
import type { CheckoutProduct } from '@/lib/checkout/products'

interface OrderSummaryProps {
  product: CheckoutProduct
  promoCode: string
  onPromoCodeChange: (code: string) => void
  promoDiscount: { label: string; amountOff: number } | null
  onValidatePromo: () => void
  validatingPromo: boolean
}

function formatDollars(cents: number): string {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

export default function OrderSummary({
  product,
  promoCode,
  onPromoCodeChange,
  promoDiscount,
  onValidatePromo,
  validatingPromo,
}: OrderSummaryProps) {
  const subtotal = product.amount
  const discount = promoDiscount?.amountOff ?? 0
  const total = Math.max(0, subtotal - discount)

  return (
    <Card className="p-6 md:p-8 sticky top-6">
      <h2 className="text-xl font-bold text-white mb-1">{product.name}</h2>
      <p className="text-sm text-neutral-400 mb-6">{product.description}</p>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {product.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
            <span className="text-neutral-300">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-[#333] pt-4 space-y-3">
        {/* Promo code */}
        <div className="flex gap-2">
          <Input
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value)}
            className="!py-2 !text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onValidatePromo}
            disabled={!promoCode.trim() || validatingPromo}
            className="flex-shrink-0"
          >
            {validatingPromo ? '...' : 'Apply'}
          </Button>
        </div>

        {/* Line items */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-300">
            <span>Subtotal</span>
            <span>{formatDollars(subtotal)}</span>
          </div>

          {promoDiscount && (
            <div className="flex justify-between text-[#39FF14]">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {promoDiscount.label}
              </span>
              <span>-{formatDollars(discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-[#333]">
            <span>Total</span>
            <span>{formatDollars(total)}</span>
          </div>

          {product.mode === 'subscription' && (
            <p className="text-xs text-neutral-500">
              Billed as installment payments. See terms for details.
            </p>
          )}
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-6 pt-4 border-t border-[#333] flex items-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>Secured by Stripe. Your payment info never touches our servers.</span>
      </div>
    </Card>
  )
}
