'use client'

import { Card, Badge, Button } from '@/lib/design-system/components'
import { CreditCard, Calendar, Coins, HardDrive, AlertTriangle, RotateCcw } from 'lucide-react'
import { formatPrice, formatTokensShort, formatStorage } from '@/lib/billing/config'

type SubscriptionData = {
  id: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  tier: {
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
  onChangePlan: () => void
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
    case 'active': return <Badge variant="success">Active</Badge>
    case 'trialing': return <Badge variant="info">Trial</Badge>
    case 'past_due': return <Badge variant="warning">Past Due</Badge>
    default: return <Badge>{status}</Badge>
  }
}

export default function PlanOverview({
  subscription,
  upcomingInvoice,
  onCancel,
  onResume,
  onChangePlan,
  isCanceling,
  isResuming,
}: Props) {
  if (!subscription || !subscription.tier) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-bold text-white">Current Plan</h3>
        </div>
        <p className="text-neutral-400 text-center py-6">No active subscription</p>
        <Button variant="primary" className="w-full" onClick={() => window.location.href = '/#pricing'}>
          View Plans
        </Button>
      </Card>
    )
  }

  const { tier } = subscription
  const tokenGrant = tier.billingInterval === 'year' ? tier.annualTokenGrant : tier.monthlyTokenGrant
  const price = tier.billingInterval === 'year' ? (tier.priceYearly || tier.priceMonthly) : tier.priceMonthly
  const intervalLabel = tier.billingInterval === 'year' ? '/year' : '/28 days'

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-[#39FF14]" />
          <h3 className="text-lg font-bold text-white">Current Plan</h3>
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
            Period
          </div>
          <div className="text-sm font-medium text-white">
            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
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
            Next Charge
          </div>
          <div className="text-sm font-medium text-white">
            {upcomingInvoice
              ? formatPrice(upcomingInvoice.amountDue)
              : 'N/A'}
          </div>
        </div>
      </div>

      {subscription.cancelAtPeriodEnd && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">
              Subscription ending {formatDate(subscription.currentPeriodEnd)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              You&apos;ll retain access until the end of your billing period.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" className="flex-1" onClick={onChangePlan}>
          Change Plan
        </Button>
        {subscription.cancelAtPeriodEnd ? (
          <Button
            variant="primary"
            className="flex-1"
            onClick={onResume}
            disabled={isResuming}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isResuming ? 'Resuming...' : 'Resume Subscription'}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="flex-1 text-red-400 hover:text-red-300"
            onClick={onCancel}
            disabled={isCanceling}
          >
            {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
          </Button>
        )}
      </div>
    </Card>
  )
}
