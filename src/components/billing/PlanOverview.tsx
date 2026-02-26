'use client'

import { useState } from 'react'
import { Card, Badge, Button, Spinner } from '@/lib/design-system/components'
import { CreditCard, Calendar, Coins, HardDrive, AlertTriangle, RotateCcw, ArrowUpRight } from 'lucide-react'
import { formatPrice, formatTokensShort, formatStorage } from '@/lib/billing/config'
import { toast } from 'sonner'

type SubscriptionData = {
  id: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  tier: {
    id: string
    name: string
    description: string | null
    tierType: string
    priceMonthly: number
    priceYearly: number | null
    billingInterval: string
    monthlyTokenGrant: number
    annualTokenGrant: number
    storageQuotaGb: number
    features: string[]
    planCategory: string
    isHouseholdPlan: boolean
  } | null
}

type UpcomingInvoice = {
  amountDue: number
  currency: string
  nextPaymentAttempt: string | null
}

type Props = {
  subscription: SubscriptionData | null
  upcomingInvoice: UpcomingInvoice | null
  onCancel: () => void
  onResume: () => void
  onRefresh: () => void
  isCanceling: boolean
  isResuming: boolean
}

function formatDate(iso: string | null): string {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatusBadge(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return <Badge variant="warning">Canceling</Badge>
  switch (status) {
    case 'active':
    case 'trialing':
      return <Badge variant="success">Active</Badge>
    case 'past_due': return <Badge variant="warning">Past Due</Badge>
    default: return <Badge>{status}</Badge>
  }
}

export default function PlanOverview({
  subscription,
  upcomingInvoice,
  onCancel,
  onResume,
  onRefresh,
  isCanceling,
  isResuming,
}: Props) {
  const [upgradeState, setUpgradeState] = useState<'idle' | 'previewing' | 'confirming' | 'upgrading'>('idle')
  const [annualTierCache, setAnnualTierCache] = useState<{ id: string; price: number } | null>(null)
  const [prorationPreview, setProrationPreview] = useState<{
    immediateAmount: number
    lines: Array<{ description: string; amount: number }>
  } | null>(null)

  if (!subscription || !subscription.tier) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-bold text-white">Vision Pro Membership</h3>
        </div>
        <p className="text-neutral-400 text-center py-6">No active membership</p>
        <Button variant="primary" className="w-full" onClick={() => window.location.href = '/#pricing'}>
          View Plans
        </Button>
      </Card>
    )
  }

  const { tier } = subscription
  const isTrialing = subscription.status === 'trialing'
  const is28Day = tier.billingInterval !== 'year'
  const tokenGrant = tier.billingInterval === 'year' ? tier.annualTokenGrant : tier.monthlyTokenGrant
  const price = tier.billingInterval === 'year' ? (tier.priceYearly || tier.priceMonthly) : tier.priceMonthly
  const intervalLabel = tier.billingInterval === 'year' ? '/year' : '/28 days'

  const fetchAnnualTier = async () => {
    if (annualTierCache) return annualTierCache
    const tiersRes = await fetch('/api/admin/membership-tiers')
    const tiersData = await tiersRes.json()
    const found = (tiersData.tiers || []).find(
      (t: any) => t.is_active && t.tier_type === (tier.isHouseholdPlan ? 'vision_pro_household_annual' : 'vision_pro_annual')
    )
    if (!found) return null
    const cached = { id: found.id, price: found.price_yearly || found.price_monthly }
    setAnnualTierCache(cached)
    return cached
  }

  const annualPrice = annualTierCache?.price ?? 99900

  const handleUpgradeClick = async () => {
    setUpgradeState('previewing')
    try {
      const annualTier = await fetchAnnualTier()
      if (!annualTier) {
        toast.error('Annual plan not found')
        setUpgradeState('idle')
        return
      }

      const previewRes = await fetch(`/api/billing/change-plan?targetTierId=${annualTier.id}`)
      const previewData = await previewRes.json()

      if (previewRes.ok) {
        setProrationPreview({
          immediateAmount: previewData.immediateAmount || 0,
          lines: previewData.lines || [],
        })
        setUpgradeState('confirming')
      } else {
        toast.error(previewData.error || 'Unable to preview upgrade')
        setUpgradeState('idle')
      }
    } catch {
      toast.error('Failed to load upgrade details')
      setUpgradeState('idle')
    }
  }

  const handleUpgradeConfirm = async () => {
    setUpgradeState('upgrading')
    try {
      const annualTier = await fetchAnnualTier()
      if (!annualTier) {
        toast.error('Annual plan not found')
        setUpgradeState('idle')
        return
      }

      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTierId: annualTier.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upgrade')
      }

      toast.success('Upgraded to Annual plan')
      setUpgradeState('idle')
      setProrationPreview(null)
      setAnnualTierCache(null)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
      setUpgradeState('idle')
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-[#39FF14]" />
          <h3 className="text-lg font-bold text-white">Vision Pro Membership</h3>
        </div>
        {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
      </div>

      <div className="mb-6">
        <div className="text-2xl font-bold text-white mb-1">{tier.name}</div>
        <div className="text-sm text-neutral-400">
          {formatPrice(price)}{intervalLabel}
          {tier.isHouseholdPlan && ' (Household)'}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-neutral-900 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            {isTrialing ? 'First Billing' : 'Period'}
          </div>
          <div className="text-sm font-medium text-white">
            {isTrialing
              ? formatDate(subscription.currentPeriodEnd)
              : `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`
            }
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Coins className="w-3.5 h-3.5" />
            VIVA Tokens
          </div>
          <div className="text-sm font-medium text-[#39FF14]">
            {formatTokensShort(tokenGrant)}
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <HardDrive className="w-3.5 h-3.5" />
            Storage
          </div>
          <div className="text-sm font-medium text-white">
            {formatStorage(tier.storageQuotaGb)}
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            {isTrialing ? 'First Charge' : 'Next Charge'}
          </div>
          <div className="text-sm font-medium text-white">
            {upcomingInvoice
              ? formatPrice(upcomingInvoice.amountDue)
              : formatPrice(price)}
          </div>
        </div>
      </div>

      {subscription.cancelAtPeriodEnd && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">
              Membership ending {formatDate(subscription.currentPeriodEnd)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              You&apos;ll retain access until the end of your billing period.
            </p>
          </div>
        </div>
      )}

      {is28Day && !subscription.cancelAtPeriodEnd && (
        <div className="mb-6">
          {upgradeState === 'idle' && (
            <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Switch to Annual</p>
                <p className="text-xs text-neutral-400">
                  {formatPrice(annualPrice)}/year
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={handleUpgradeClick}>
                Upgrade to Annual
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {upgradeState === 'previewing' && (
            <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl p-4 flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-neutral-400">Calculating upgrade cost...</span>
            </div>
          )}

          {upgradeState === 'confirming' && prorationPreview && (
            <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-2">Upgrade Summary</p>
              {prorationPreview.lines.map((line, i) => (
                <div key={i} className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span className="truncate mr-4">{line.description}</span>
                  <span className={line.amount < 0 ? 'text-green-400' : ''}>
                    {line.amount < 0 ? '-' : ''}{formatPrice(Math.abs(line.amount))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium text-white mt-2 pt-2 border-t border-neutral-800">
                <span>Due today</span>
                <span>
                  {prorationPreview.immediateAmount > 0
                    ? formatPrice(prorationPreview.immediateAmount)
                    : 'Credit applied'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Then {formatPrice(annualPrice)}/year going forward.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setUpgradeState('idle'); setProrationPreview(null) }}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" className="flex-1" onClick={handleUpgradeConfirm}>
                  Confirm Upgrade
                </Button>
              </div>
            </div>
          )}

          {upgradeState === 'upgrading' && (
            <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl p-4 flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-neutral-400">Upgrading your plan...</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {subscription.cancelAtPeriodEnd ? (
          <Button
            variant="primary"
            className="flex-1"
            onClick={onResume}
            disabled={isResuming}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isResuming ? 'Resuming...' : 'Resume Membership'}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="flex-1 text-red-400 hover:text-red-300"
            onClick={onCancel}
            disabled={isCanceling}
          >
            {isCanceling ? 'Canceling...' : 'Cancel Membership'}
          </Button>
        )}
      </div>
    </Card>
  )
}
