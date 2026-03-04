'use client'

import { useState } from 'react'
import { Card, Badge, Button, Spinner } from '@/lib/design-system/components'
import { CreditCard, Calendar, Coins, HardDrive, AlertTriangle, RotateCcw, ArrowUpRight, Users, Check, Crown, Zap, Shield, Tag, X, Loader2 } from 'lucide-react'
import { formatPrice, formatTokensShort, formatStorage, PRICING, TOKEN_GRANTS, STORAGE_QUOTAS } from '@/lib/billing/config'

import { toast } from 'sonner'

const PARTNER_INTENSIVE_PRICE = 20000

type CouponValidation = {
  valid: boolean
  name?: string
  discountAmount?: number
  discountType?: 'percent' | 'fixed'
  discountValue?: number
  error?: string
}

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

type TierInfo = { id: string; price: number }

type ProrationPreview = {
  immediateAmount: number
  lines: Array<{ description: string; amount: number }>
}

type UpgradeFlow = 'annual' | 'household'

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
  const [upgradeState, setUpgradeState] = useState<'idle' | 'previewing' | 'confirming' | 'partner-details' | 'upgrading'>('idle')
  const [activeFlow, setActiveFlow] = useState<UpgradeFlow | null>(null)
  const [tiersCache, setTiersCache] = useState<any[] | null>(null)
  const [prorationPreview, setProrationPreview] = useState<ProrationPreview | null>(null)
  const [targetTier, setTargetTier] = useState<TierInfo | null>(null)
  const [partnerFirst, setPartnerFirst] = useState('')
  const [partnerLast, setPartnerLast] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerError, setPartnerError] = useState('')

  const [includeIntensive, setIncludeIntensive] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

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
  const isSoloPlan = !tier.isHouseholdPlan

  const fetchTiers = async (): Promise<any[]> => {
    if (tiersCache) return tiersCache
    const res = await fetch('/api/billing/tiers')
    const data = await res.json()
    const tiers = data.tiers || []
    setTiersCache(tiers)
    return tiers
  }

  const findTier = async (tierType: string, opts?: { household?: boolean }): Promise<TierInfo | null> => {
    const tiers = await fetchTiers()
    let found = tiers.find((t: any) => t.tier_type === tierType)
    if (!found && opts?.household) {
      const baseTierType = tierType.replace('_household', '')
      found = tiers.find((t: any) => t.tier_type === baseTierType && t.is_household_plan === true)
    }
    if (!found && opts?.household) {
      found = tiers.find((t: any) => t.tier_type === tierType.replace('vision_pro_household_', 'vision_pro_') && t.is_household_plan === true)
    }
    if (!found) return null
    return { id: found.id, price: found.price_yearly || found.price_monthly }
  }

  const getAnnualTierType = () =>
    tier.isHouseholdPlan ? 'vision_pro_household_annual' : 'vision_pro_annual'

  const getHouseholdTierType = () =>
    is28Day ? 'vision_pro_household_28day' : 'vision_pro_household_annual'

  const annualFallbackPrice = tier.isHouseholdPlan ? PRICING.HOUSEHOLD_ANNUAL : PRICING.SOLO_ANNUAL
  const householdFallbackPrice = is28Day ? PRICING.HOUSEHOLD_28DAY : PRICING.HOUSEHOLD_ANNUAL

  const handleUpgradeClick = async (flow: UpgradeFlow) => {
    setActiveFlow(flow)
    setUpgradeState('previewing')
    try {
      const tierType = flow === 'annual' ? getAnnualTierType() : getHouseholdTierType()
      const isHouseholdLookup = flow === 'household' || tier.isHouseholdPlan
      const found = await findTier(tierType, { household: isHouseholdLookup })
      if (!found) {
        toast.error(`${flow === 'annual' ? 'Annual' : 'Household'} plan not found`)
        setUpgradeState('idle')
        setActiveFlow(null)
        return
      }
      setTargetTier(found)

      const previewRes = await fetch(`/api/billing/change-plan?targetTierId=${found.id}`)
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
        setActiveFlow(null)
      }
    } catch {
      toast.error('Failed to load upgrade details')
      setUpgradeState('idle')
      setActiveFlow(null)
    }
  }

  const handleUpgradeConfirm = async () => {
    if (!targetTier || !activeFlow) return

    if (activeFlow === 'household') {
      setPartnerError('')
      if (!partnerFirst.trim() || !partnerLast.trim() || !partnerEmail.trim()) {
        setPartnerError('All fields are required')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(partnerEmail.trim())) {
        setPartnerError('Please enter a valid email address')
        return
      }
    }

    setUpgradeState('upgrading')
    try {
      const payload: Record<string, string> = { targetTierId: targetTier.id }
      if (activeFlow === 'household' && partnerFirst.trim()) {
        payload.partnerFirstName = partnerFirst.trim()
        payload.partnerLastName = partnerLast.trim()
        payload.partnerEmail = partnerEmail.trim().toLowerCase()
      }

      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upgrade')
      }

      const result = await res.json()

      if (activeFlow === 'household' && includeIntensive) {
        try {
          const intensiveRes = await fetch('/api/billing/purchase-intensive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              overrideAmount: PARTNER_INTENSIVE_PRICE,
              promoCode: couponResult?.valid ? couponCode.trim() : undefined,
              partnerFirstName: partnerFirst.trim(),
              partnerLastName: partnerLast.trim(),
              partnerEmail: partnerEmail.trim().toLowerCase(),
            }),
          })
          const intensiveData = await intensiveRes.json()
          if (!intensiveRes.ok) {
            toast.error(`Plan upgraded but intensive purchase failed: ${intensiveData.error}`)
          } else if (intensiveData.waived) {
            toast.success('Intensive included at no charge')
          } else {
            toast.success('Intensive purchased for your partner')
          }
        } catch {
          toast.error('Plan upgraded but intensive purchase failed')
        }
      }

      const successMsg = activeFlow === 'annual'
        ? 'Upgraded to Annual plan'
        : result.partnerInvited
          ? `Upgraded to Household plan. Invitation sent to ${partnerEmail.trim()}`
          : 'Upgraded to Household plan'
      toast.success(successMsg)
      resetUpgradeState()
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
      setUpgradeState('confirming')
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponResult(null)
    try {
      const res = await fetch('/api/billing/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          productKey: 'intensive',
          purchaseAmount: PARTNER_INTENSIVE_PRICE,
        }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, error: 'Failed to validate code' })
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponResult(null)
  }

  const intensiveDiscount = couponResult?.valid ? (couponResult.discountAmount || 0) : 0
  const intensiveFinal = Math.max(0, PARTNER_INTENSIVE_PRICE - intensiveDiscount)

  const resetUpgradeState = () => {
    setUpgradeState('idle')
    setActiveFlow(null)
    setProrationPreview(null)
    setTargetTier(null)
    setTiersCache(null)
    setPartnerFirst('')
    setPartnerLast('')
    setPartnerEmail('')
    setPartnerError('')
    setIncludeIntensive(true)
    setCouponCode('')
    setCouponResult(null)
    setAgreedToTerms(false)
  }

  const renderUpgradeBlock = (
    flow: UpgradeFlow,
    label: string,
    sublabel: string,
    buttonText: string,
    icon: React.ReactNode,
    borderColor: string,
    bgColor: string,
  ) => {
    const isActive = activeFlow === flow

    if (upgradeState === 'idle' || !isActive) {
      if (upgradeState !== 'idle' && !isActive) return null
      return (
        <div className={`${bgColor} border ${borderColor} rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-neutral-400">{sublabel}</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleUpgradeClick(flow)}>
            {buttonText}
            {icon}
          </Button>
        </div>
      )
    }

    if (upgradeState === 'previewing' && isActive) {
      return (
        <div className={`${bgColor} border ${borderColor} rounded-xl p-4 flex items-center justify-center gap-2`}>
          <Spinner size="sm" />
          <span className="text-sm text-neutral-400">Calculating upgrade cost...</span>
        </div>
      )
    }

    if ((upgradeState === 'confirming' || upgradeState === 'partner-details') && isActive && prorationPreview) {
      const forwardPrice = targetTier?.price ?? 0
      const forwardLabel = flow === 'annual' || !is28Day ? '/year' : '/28 days'
      const hasLineItems = prorationPreview.lines.length > 0 && prorationPreview.lines.some(l => l.amount !== 0)
      const duringTrial = isTrialing && prorationPreview.immediateAmount === 0

      const isAnnualUpgrade = flow === 'annual'
      const isHouseholdUpgrade = flow === 'household'

      const upgradeName = isAnnualUpgrade
        ? (tier.isHouseholdPlan ? 'Vision Pro Household Annual' : 'Vision Pro Annual')
        : (is28Day ? 'Vision Pro Household 28-Day' : 'Vision Pro Household Annual')

      const upgradeIcon = isAnnualUpgrade ? Crown : Users
      const UpgradeIcon = upgradeIcon
      const accentColor = isAnnualUpgrade ? '#00FFFF' : '#BF00FF'

      const newTokens = isAnnualUpgrade
        ? (tier.isHouseholdPlan ? TOKEN_GRANTS.HOUSEHOLD_ANNUAL : TOKEN_GRANTS.ANNUAL)
        : (is28Day ? TOKEN_GRANTS.HOUSEHOLD_28DAY : TOKEN_GRANTS.HOUSEHOLD_ANNUAL)
      const newStorage = isAnnualUpgrade
        ? (tier.isHouseholdPlan ? STORAGE_QUOTAS.HOUSEHOLD_ANNUAL : STORAGE_QUOTAS.ANNUAL)
        : (is28Day ? STORAGE_QUOTAS.HOUSEHOLD_28DAY : STORAGE_QUOTAS.HOUSEHOLD_ANNUAL)
      const currentSeats = tier.isHouseholdPlan ? 2 : 1
      const newSeats = isHouseholdUpgrade ? 2 : currentSeats
      const currentBilling = is28Day ? `${formatPrice(price)}/28 days` : `${formatPrice(price)}/year`
      const newBilling = `${formatPrice(forwardPrice)}${forwardLabel}`

      type CompRow = { label: string; current: string; next: string; improved: boolean }
      const comparison: CompRow[] = [
        { label: 'Price', current: currentBilling, next: newBilling, improved: false },
        { label: 'VIVA Tokens', current: formatTokensShort(tokenGrant), next: formatTokensShort(newTokens), improved: newTokens > tokenGrant },
        { label: 'Storage', current: formatStorage(tier.storageQuotaGb), next: formatStorage(newStorage), improved: newStorage > tier.storageQuotaGb },
        { label: 'Seats', current: `${currentSeats}`, next: `${newSeats}`, improved: newSeats > currentSeats },
        { label: 'Billing Cycle', current: is28Day ? '28-Day' : 'Annual', next: (flow === 'annual' || !is28Day) ? 'Annual' : '28-Day', improved: isAnnualUpgrade },
      ]
      if (isAnnualUpgrade) {
        comparison.push(
          { label: 'Support', current: 'Standard', next: 'Priority', improved: true },
          { label: 'Check-ins', current: 'None', next: '4/year', improved: true },
          { label: 'Rate Lock', current: 'None', next: '12 months', improved: true },
        )
      }
      if (isHouseholdUpgrade) {
        comparison.push(
          { label: 'Shared Access', current: 'Solo only', next: 'Partner included', improved: true },
        )
      }

      return (
        <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: `${accentColor}33`, background: `linear-gradient(135deg, ${accentColor}08, transparent)` }}>
          <div className="p-5">
            <div className="text-center mb-5">
              <UpgradeIcon className="w-10 h-10 mx-auto mb-3" style={{ color: accentColor }} />
              <h4 className="text-xl font-bold text-white">{upgradeName}</h4>
            </div>

            <div className="rounded-xl overflow-hidden border border-neutral-700 mb-4">
              <table className="w-full text-sm table-fixed border-collapse">
                <thead>
                  <tr className="bg-neutral-800">
                    <th className="w-1/3 text-left text-xs font-semibold text-neutral-400 px-3 py-2.5 border-b border-r border-neutral-700"></th>
                    <th className="w-1/3 text-center text-xs font-semibold text-neutral-400 px-3 py-2.5 border-b border-r border-neutral-700">Current</th>
                    <th className="w-1/3 text-center text-xs font-semibold px-3 py-2.5 border-b border-neutral-700" style={{ color: accentColor }}>New Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-neutral-900/40' : 'bg-neutral-900/20'}>
                      <td className="px-3 py-2.5 text-xs font-medium text-neutral-300 border-b border-r border-neutral-700/60">{row.label}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-neutral-500 border-b border-r border-neutral-700/60">{row.current}</td>
                      <td className="px-3 py-2.5 text-center text-xs font-medium border-b border-neutral-700/60" style={{ color: row.improved ? accentColor : '#e5e5e5' }}>
                        {row.next}
                        {row.improved && <ArrowUpRight className="w-3 h-3 inline-block ml-0.5 -mt-0.5" style={{ color: accentColor }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: `${accentColor}0D`, border: `1px solid ${accentColor}1A` }}>
              {duringTrial ? (
                <div className="text-center text-sm text-neutral-300">
                  <Shield className="w-4 h-4 inline-block mr-1.5 -mt-0.5" style={{ color: accentColor }} />
                  Your trial continues until <span className="text-white font-medium">{formatDate(subscription.currentPeriodEnd)}</span>. No plan proration today.
                </div>
              ) : (
                <>
                  {hasLineItems && prorationPreview.lines.map((line, i) => (
                    <div key={i} className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span className="truncate mr-4">{line.description}</span>
                      <span className={line.amount < 0 ? 'text-green-400' : ''}>
                        {line.amount < 0 ? '-' : ''}{formatPrice(Math.abs(line.amount))}
                      </span>
                    </div>
                  ))}
                  {!isHouseholdUpgrade && (
                    <div className="flex justify-between text-sm font-medium text-white">
                      <span>Due today</span>
                      <span>
                        {prorationPreview.immediateAmount > 0
                          ? formatPrice(prorationPreview.immediateAmount)
                          : 'No charge'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {isHouseholdUpgrade && (
              <div className="mb-4">
                <div className="text-center mb-3">
                  <Users className="w-5 h-5 text-[#BF00FF] mx-auto mb-1.5" />
                  <h5 className="text-sm font-semibold text-white">Invite Your Household Member</h5>
                  <p className="text-xs text-neutral-400 mt-1">
                    They&apos;ll receive an email to create their own account and join your household.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={partnerFirst}
                      onChange={e => setPartnerFirst(e.target.value)}
                      placeholder="First name"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#BF00FF] transition-colors"
                    />
                    <input
                      type="text"
                      value={partnerLast}
                      onChange={e => setPartnerLast(e.target.value)}
                      placeholder="Last name"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#BF00FF] transition-colors"
                    />
                  </div>
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={e => setPartnerEmail(e.target.value)}
                    placeholder="partner@email.com"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#BF00FF] transition-colors"
                  />
                  {partnerError && (
                    <p className="text-xs text-[#FF0040]">{partnerError}</p>
                  )}
                </div>

                {/* Intensive for Partner */}
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-sm font-semibold text-white">Include Intensive for Partner</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeIntensive(!includeIntensive)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${includeIntensive ? 'bg-[#39FF14]' : 'bg-neutral-700'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${includeIntensive ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>

                  {includeIntensive && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-neutral-300 bg-neutral-900/60 rounded-lg px-3 py-2">
                        <span>Partner Intensive (one-time)</span>
                        <span className="font-medium text-white">{formatPrice(PARTNER_INTENSIVE_PRICE)}</span>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                          <input
                            type="text"
                            value={couponCode}
                            onChange={e => {
                              setCouponCode(e.target.value.toUpperCase())
                              if (couponResult) setCouponResult(null)
                            }}
                            placeholder="Coupon code"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#39FF14] transition-colors"
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          />
                        </div>
                        {couponResult?.valid ? (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <X className="w-3 h-3" />
                          </button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim() || couponLoading}
                          >
                            {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                          </Button>
                        )}
                      </div>
                      {couponResult && !couponResult.valid && (
                        <p className="text-xs text-[#FF0040]">{couponResult.error}</p>
                      )}
                      {couponResult?.valid && (
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                          <Check className="w-3 h-3" />
                          <span>{couponResult.name || 'Coupon applied'}</span>
                          {intensiveDiscount > 0 && (
                            <span className="text-green-300">(-{formatPrice(intensiveDiscount)})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl p-3 mb-4 bg-neutral-900/60 border border-neutral-700/50">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2">Order Summary</div>
              {isHouseholdUpgrade && (
                <>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>Household plan change</span>
                    <span>
                      {duringTrial ? 'No charge' : (
                        prorationPreview.immediateAmount > 0
                          ? formatPrice(prorationPreview.immediateAmount)
                          : 'No charge'
                      )}
                    </span>
                  </div>
                  {includeIntensive && (
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>Partner Intensive (one-time)</span>
                      <span>{intensiveFinal === 0 ? 'Free' : formatPrice(intensiveFinal)}</span>
                    </div>
                  )}
                </>
              )}
              {isAnnualUpgrade && (
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Annual plan change (proration)</span>
                  <span>
                    {duringTrial ? 'No charge' : (
                      prorationPreview.immediateAmount > 0
                        ? formatPrice(prorationPreview.immediateAmount)
                        : 'No charge'
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 mt-1.5 border-t border-neutral-700/60">
                <span>Total due today</span>
                <span>
                  {formatPrice(
                    (duringTrial ? 0 : Math.max(0, prorationPreview.immediateAmount))
                    + (isHouseholdUpgrade && includeIntensive ? intensiveFinal : 0)
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4 border border-neutral-700/40 bg-neutral-800/30">
              <p className="text-xs text-neutral-300 leading-relaxed">
                {isHouseholdUpgrade ? (
                  <>
                    Your plan will change to <span className="text-white font-medium">{upgradeName}</span>.
                    You will be billed <span className="text-white font-medium">{newBilling}</span> starting{' '}
                    <span className="text-white font-medium">{duringTrial ? formatDate(subscription.currentPeriodEnd) : 'your next billing date'}</span>.
                    {includeIntensive && intensiveFinal > 0 && (
                      <> A one-time charge of <span className="text-white font-medium">{formatPrice(intensiveFinal)}</span> for the Partner Intensive will be charged to your payment method on file today.</>
                    )}
                    {includeIntensive && intensiveFinal === 0 && (
                      <> The Partner Intensive is included at no additional charge.</>
                    )}
                  </>
                ) : (
                  <>
                    Your plan will change to <span className="text-white font-medium">{upgradeName}</span>.
                    You will be billed <span className="text-white font-medium">{newBilling}</span> starting{' '}
                    <span className="text-white font-medium">{duringTrial ? formatDate(subscription.currentPeriodEnd) : 'your next billing date'}</span>.
                  </>
                )}
              </p>
              <label className="flex items-start gap-2.5 mt-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-[#39FF14] focus:ring-[#39FF14]/40 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  I understand and agree to the new billing terms above.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={resetUpgradeState}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpgradeConfirm}
                disabled={!agreedToTerms}
              >
                {isHouseholdUpgrade
                  ? (includeIntensive ? 'Upgrade & Purchase Intensive' : 'Upgrade & Send Invite')
                  : 'Confirm Upgrade'}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (upgradeState === 'upgrading' && isActive) {
      return (
        <div className={`${bgColor} border ${borderColor} rounded-xl p-4 flex items-center justify-center gap-2`}>
          <Spinner size="sm" />
          <span className="text-sm text-neutral-400">Upgrading your plan...</span>
        </div>
      )
    }

    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CreditCard className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
          <h3 className="text-lg font-bold text-white">Vision Pro Membership</h3>
          {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
        </div>
        <div className="flex-shrink-0">
          {subscription.cancelAtPeriodEnd ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onResume}
              disabled={isResuming}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {isResuming ? 'Resuming...' : 'Resume'}
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={onCancel}
              disabled={isCanceling}
            >
              {isCanceling ? 'Canceling...' : 'Cancel Membership'}
            </Button>
          )}
        </div>
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

      {!subscription.cancelAtPeriodEnd && (
        <div className="space-y-3 mb-6">
          {is28Day && renderUpgradeBlock(
            'annual',
            'Switch to Annual',
            `${formatPrice(annualFallbackPrice)}/year`,
            'Upgrade to Annual',
            <ArrowUpRight className="w-4 h-4 ml-1" />,
            'border-[#39FF14]/20',
            'bg-[#39FF14]/5',
          )}

          {isSoloPlan && renderUpgradeBlock(
            'household',
            'Switch to Household',
            'Proration + $200 partner intensive \u00b7 2 members',
            'Upgrade to Household',
            <Users className="w-4 h-4 ml-1" />,
            'border-[#00FFFF]/20',
            'bg-[#00FFFF]/5',
          )}
        </div>
      )}

    </Card>
  )
}
