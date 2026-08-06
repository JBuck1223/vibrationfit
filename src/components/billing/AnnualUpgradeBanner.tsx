'use client'

/**
 * Annual Upgrade Banner (Days 21-25 of first 28-day Vision Pro cycle)
 *
 * Dismissible dashboard banner offering the founders' annual prepaid upgrade.
 * Clicking opens a confirm modal that calls /api/billing/change-plan with the
 * annual tier. Switching price while trialing keeps the Day 28 charge date,
 * so the year is billed on the date the first 28 days end.
 *
 * Eligibility (28-day tier + day 21-25 window) is computed server-side on the
 * dashboard page; this component only handles dismissal and the confirm flow.
 */

import { useState, useEffect } from 'react'
import { Card, Button, Modal, Spinner } from '@/lib/design-system/components'
import { Crown, Check, X } from 'lucide-react'
import { toast } from 'sonner'

const DISMISS_KEY = 'annual-upgrade-banner-dismissed'

type Props = {
  planType: 'solo' | 'household'
  /** ISO date the first 28 days end (trial end = annual charge date) */
  trialEnd: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return 'the end of your first 28 days'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AnnualUpgradeBanner({ planType, trialEnd }: Props) {
  const [dismissed, setDismissed] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const isHousehold = planType === 'household'
  const annualPrice = isHousehold ? '$1,490' : '$999'
  const continuityPrice = isHousehold ? '$149' : '$99'

  const handleConfirm = async () => {
    setUpgrading(true)
    try {
      const tiersRes = await fetch('/api/billing/tiers')
      const tiersData = await tiersRes.json()
      const tiers: Array<{ id: string; tier_type: string; is_household_plan?: boolean }> = tiersData.tiers || []
      const targetTierType = isHousehold ? 'vision_pro_household_annual' : 'vision_pro_annual'
      let target = tiers.find(t => t.tier_type === targetTierType)
      if (!target && isHousehold) {
        target = tiers.find(t => t.tier_type === 'vision_pro_annual' && t.is_household_plan === true)
      }
      if (!target) {
        throw new Error('Annual plan not found')
      }

      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTierId: target.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upgrade')
      }

      setUpgraded(true)
      toast.success('Upgraded to annual Vision Pro')
      localStorage.setItem(DISMISS_KEY, 'true')
      setTimeout(() => {
        setShowModal(false)
        setDismissed(true)
      }, 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upgrade')
    } finally {
      setUpgrading(false)
    }
  }

  if (dismissed) return null

  return (
    <>
      <Card className="p-4 md:p-5 border-2 border-[#00FFFF]/30 bg-[#00FFFF]/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <Crown className="w-5 h-5 text-[#00FFFF] shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-neutral-200 leading-relaxed">
              Ready to make this your new normal? Upgrade to an annual Vision Pro membership
              and save vs paying every 28 days.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center sm:w-auto"
              onClick={() => setShowModal(true)}
            >
              Upgrade to annual
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => !upgrading && setShowModal(false)}
        title="Lock in your year of Vision"
        size="md"
      >
        {upgraded ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border-2 border-[#39FF14] flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-[#39FF14]" />
            </div>
            <p className="text-white font-medium mb-1">You&apos;re locked in for the year.</p>
            <p className="text-sm text-neutral-400">
              Your card will be charged {annualPrice} on {formatDate(trialEnd)}. Your next renewal is 12 months later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              You&apos;re nearing the end of your first 28 days with Vision Pro after your
              72-Hour Vision Activation Intensive.
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              If you want to keep this level of clarity and momentum all year, you can upgrade
              to an annual membership and save compared to staying on 28-day billing.
            </p>

            <div className="rounded-xl p-4 bg-black border-2 border-[#39FF14]">
              <p className="text-xs text-[#39FF14] uppercase tracking-wide font-semibold mb-2">For you, that means</p>
              <p className="text-sm text-white font-medium">
                {annualPrice} for 12 months <span className="text-neutral-400 font-normal">(vs {continuityPrice} every 28 days)</span>
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-300 mb-2">Your membership continues as normal. You just:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
                  Pay once for the year
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
                  Don&apos;t renew again for 12 months
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
                  Lock in this rate for the full year
                </li>
              </ul>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Your card will be charged {annualPrice} on {formatDate(trialEnd)} (the date your
              first 28 days end). After that, you won&apos;t be billed every 28 days; your next
              renewal is 12 months later.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center sm:w-auto"
                onClick={() => setShowModal(false)}
                disabled={upgrading}
              >
                Keep my current billing
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center sm:w-auto"
                onClick={handleConfirm}
                disabled={upgrading}
              >
                {upgrading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Upgrading...
                  </span>
                ) : (
                  'Confirm my annual upgrade'
                )}
              </Button>
            </div>

            <p className="text-[11px] text-neutral-600 leading-relaxed border-t border-neutral-800 pt-3">
              This founders&apos; annual upgrade is available until the end of your first 28 days
              with Vision Pro. After that, you&apos;ll remain on 28-day billing unless you change
              your plan.
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
