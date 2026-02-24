'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/lib/design-system/components'
import { Check, Tag, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import type { CheckoutProduct } from '@/lib/checkout/products'
import {
  TOKEN_GRANTS,
  STORAGE_QUOTAS,
  formatTokensShort,
} from '@/lib/billing/config'

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

function getDay56UpcomingLabel(
  continuity: 'annual' | '28day',
  planType: 'solo' | 'household',
): string {
  if (continuity === '28day') {
    const price = planType === 'solo' ? 99 : 149
    return `Vision Pro 28‑Day membership: $${price}, then $${price} every 28 days`
  }
  const price = planType === 'solo' ? 999 : 1499
  return `Vision Pro Annual membership: $${price}, then renews annually`
}

/** Short money story for mobile collapsed header: "Today: $499 • Day 56: $99 every 28 days" */
function getMoneyStoryLine(
  todayCents: number,
  continuity: 'annual' | '28day',
  planType: 'solo' | 'household',
): string {
  const today = formatDollars(todayCents)
  if (continuity === '28day') {
    const day56 = planType === 'solo' ? '$99 every 28 days' : '$149 every 28 days'
    return `Today: ${today} • Day 56: ${day56}`
  }
  const day56 = planType === 'solo' ? '$999 per year' : '$1,499 per year'
  return `Today: ${today} • Day 56: ${day56}`
}

export default function OrderSummary({
  product,
  promoCode,
  onPromoCodeChange,
  promoDiscount,
  onValidatePromo,
  validatingPromo,
}: OrderSummaryProps) {
  const paymentPlan = (product.metadata?.intensive_payment_plan as 'full' | '2pay' | '3pay') || 'full'
  // For 2-pay/3-pay, product.amount is the per-installment amount; full total = amount * numPayments
  const fullPrice =
    paymentPlan === 'full'
      ? product.amount
      : paymentPlan === '2pay'
        ? product.amount * 2
        : product.amount * 3
  const subtotal = fullPrice
  const discount = promoDiscount?.amountOff ?? 0
  const total = Math.max(0, subtotal - discount)

  const isIntensive =
    product.metadata?.purchase_type === 'intensive' ||
    product.key?.startsWith('intensive-')
  const continuity = (product.metadata?.continuity_plan as 'annual' | '28day') || '28day'
  const planType = (product.metadata?.plan_type as 'solo' | 'household') || 'solo'

  const paymentPlanLabel =
    paymentPlan === 'full' ? 'One-time payment' : paymentPlan === '2pay' ? '2 payments' : '3 payments'
  const planTypeLabel = planType === 'solo' ? 'Solo' : 'Household'

  const intensiveTokens = planType === 'solo' ? TOKEN_GRANTS.INTENSIVE_TRIAL : TOKEN_GRANTS.HOUSEHOLD_INTENSIVE
  // Intensive trial storage during 8 weeks (config TRIAL); membership storage differs after Day 56
  const intensiveStorageGb = STORAGE_QUOTAS.TRIAL

  const membershipTokenGrant =
    continuity === 'annual'
      ? planType === 'solo'
        ? TOKEN_GRANTS.ANNUAL
        : TOKEN_GRANTS.HOUSEHOLD_ANNUAL
      : planType === 'solo'
        ? TOKEN_GRANTS.MONTHLY_28DAY
        : TOKEN_GRANTS.HOUSEHOLD_28DAY
  const membershipStorageGb =
    continuity === 'annual'
      ? planType === 'solo'
        ? STORAGE_QUOTAS.ANNUAL
        : STORAGE_QUOTAS.HOUSEHOLD_ANNUAL
      : planType === 'solo'
        ? STORAGE_QUOTAS.MONTHLY_28DAY
        : STORAGE_QUOTAS.HOUSEHOLD_28DAY
  const membershipTokenLabel =
    continuity === 'annual'
      ? `${formatTokensShort(membershipTokenGrant)} VIVA tokens per year`
      : `${formatTokensShort(membershipTokenGrant)} VIVA tokens per 28 days`

  const todayChargeAmount =
    paymentPlan === 'full' ? total : (paymentPlan === '2pay' ? Math.round(total / 2) : Math.round(total / 3))
  const intensiveTotalAmount = total

  const moneyStoryLine = isIntensive
    ? getMoneyStoryLine(todayChargeAmount, continuity, planType)
    : null
  const [mobileSummaryExpanded, setMobileSummaryExpanded] = useState(false)

  return (
    <Card className="p-6 md:p-8 sticky top-6">
      {isIntensive && moneyStoryLine && (
        <div className="md:hidden -mx-6 -mt-6 px-6 pt-6 pb-0 mb-1">
          <button
            type="button"
            onClick={() => setMobileSummaryExpanded(!mobileSummaryExpanded)}
            className="w-full flex items-center justify-between gap-2 text-left"
            aria-expanded={mobileSummaryExpanded}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Summary</span>
              <span className="text-sm text-neutral-300">{moneyStoryLine}</span>
            </div>
            {mobileSummaryExpanded ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-neutral-500" />
            )}
          </button>
        </div>
      )}

      <div className={isIntensive ? `${mobileSummaryExpanded ? 'block border-t border-[#333] pt-4 md:border-t-0 md:pt-0' : 'hidden'} md:block` : undefined}>
      {isIntensive ? (
        <>
          <h2 className="text-xl font-bold text-white mb-1">Order + Renewal Summary</h2>
          <p className="text-lg font-semibold text-neutral-200 mb-1">Vision Activation Intensive</p>
          <p className="text-sm text-neutral-400 mb-6">
            {planTypeLabel} – {paymentPlanLabel}
          </p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">Full Activation Intensive experience</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">{formatTokensShort(intensiveTokens)} VIVA tokens included</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">{intensiveStorageGb} GB Storage included</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">
                Vision Pro access for 8 weeks (no membership billing during this period)
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">
                Life Vision Builder (12 Categories), Vision Board, Vision Audio, Immersion Tracks, journal
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">Vibe Tribe community access</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">Alignment Gym (weekly live group coaching sessions)</span>
            </li>
          </ul>

          <div className="border-t border-[#333] pt-4 mb-4">
            <p className="text-sm font-semibold text-white mb-2 leading-snug">Today&apos;s charge</p>
            <p className="text-sm text-neutral-300 mb-1 leading-snug">Vision Activation Intensive – {planTypeLabel}</p>
            {paymentPlan === 'full' ? (
              <p className="text-lg font-bold text-white leading-snug mb-2 py-0.5">{formatDollars(intensiveTotalAmount)}</p>
            ) : (
              <div className="space-y-0.5 mb-2">
                <p className="text-lg font-bold text-white leading-snug py-0.5">
                  1 of {paymentPlan === '2pay' ? '2' : '3'} payments: {formatDollars(todayChargeAmount)} today
                </p>
                <p className="text-sm text-neutral-500">Total Intensive investment: {formatDollars(intensiveTotalAmount)}</p>
              </div>
            )}
            <p className="text-xs text-neutral-500 mb-4">
              Includes 8 weeks of Vision Pro (no membership charges during this period)
            </p>

            <p className="text-sm font-semibold text-white mb-2">Upcoming charges</p>
            <p className="text-sm text-neutral-300 mb-1">
              <strong>Day 56:</strong> {getDay56UpcomingLabel(continuity, planType)}
            </p>
            <p className="text-xs text-neutral-500">
              Change to Annual or cancel anytime before Day 56 in‑app. Covered by 16‑week Membership Guarantee.
            </p>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-white mb-1">{product.name}</h2>
          <p className="text-sm text-neutral-400 mb-6">{product.description}</p>

          <ul className="space-y-3 mb-6">
            {product.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
                <span className="text-neutral-300">{feature}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="border-t border-[#333] pt-4 space-y-3">
        {/* Promo code */}
        <div className="flex justify-center">
          <div className="flex gap-2 w-full items-center">
            <Input
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value)}
              className="!py-2 !text-sm flex-1 min-w-0 h-10"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onValidatePromo}
              disabled={!promoCode.trim() || validatingPromo}
              className="flex-shrink-0 h-10"
            >
              {validatingPromo ? '...' : 'Apply'}
            </Button>
          </div>
        </div>

        {/* Line items - only for non-intensive */}
        {!isIntensive && (
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
        )}
      </div>

      {/* Trust signals */}
      <div className="mt-6 pt-4 border-t border-[#333] flex items-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>Secured by Stripe. Your payment info never touches our servers.</span>
      </div>
      </div>
    </Card>
  )
}
