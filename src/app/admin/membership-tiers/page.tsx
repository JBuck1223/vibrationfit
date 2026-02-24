'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Container, Card, Badge, Button, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import {
  Layers,
  Coins,
  HardDrive,
  Clock,
  Users,
  RefreshCw,
  Check,
  AlertTriangle,
  Crown,
  Repeat,
  CalendarDays,
  Infinity as InfinityIcon,
  Pencil,
  X,
  Save,
  DollarSign,
} from 'lucide-react'

interface MembershipTier {
  id: string
  name: string
  description: string | null
  is_active: boolean
  tier_type: string
  billing_interval: string
  plan_category: string
  is_household_plan: boolean
  monthly_token_grant: number
  annual_token_grant: number
  storage_quota_gb: number
  included_seats: number
  max_household_members: number | null
  rollover_max_cycles: number | null
  stripe_price_id: string | null
  stripe_product_id: string | null
  price_monthly: number
  price_yearly: number | null
  display_order: number
  updated_at: string
}

function formatTokens(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`
  }
  if (amount >= 1_000) {
    const val = amount / 1_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}k`
  }
  return amount.toLocaleString()
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

function getExpirationLabel(billingInterval: string): string {
  switch (billingInterval) {
    case 'one-time': return 'Never'
    case 'month': return '84 days'
    case 'year': return '364 days'
    default: return billingInterval
  }
}

function getBillingLabel(billingInterval: string): string {
  switch (billingInterval) {
    case 'one-time': return 'One-Time'
    case 'month': return '28-Day'
    case 'year': return 'Annual'
    default: return billingInterval
  }
}

function getTierPrice(tier: MembershipTier): number {
  if (tier.billing_interval === 'year' && tier.price_yearly) return tier.price_yearly
  return tier.price_monthly
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'intensive': return 'bg-accent-500/20 text-accent-400 border-accent-500/30'
    case 'subscription': return 'bg-primary-500/20 text-primary-400 border-primary-500/30'
    case 'addon': return 'bg-energy-500/20 text-energy-400 border-energy-500/30'
    default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
  }
}

function TierCard({
  tier,
  onSave,
}: {
  tier: MembershipTier
  onSave: (id: string, updates: Partial<MembershipTier>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editValues, setEditValues] = useState({
    monthly_token_grant: tier.monthly_token_grant,
    annual_token_grant: tier.annual_token_grant,
    storage_quota_gb: tier.storage_quota_gb,
    price_monthly: tier.price_monthly,
    price_yearly: tier.price_yearly || 0,
  })

  const tokenGrant = tier.billing_interval === 'year'
    ? tier.annual_token_grant
    : tier.monthly_token_grant

  const displayPrice = getTierPrice(tier)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(tier.id, editValues)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValues({
      monthly_token_grant: tier.monthly_token_grant,
      annual_token_grant: tier.annual_token_grant,
      storage_quota_gb: tier.storage_quota_gb,
      price_monthly: tier.price_monthly,
      price_yearly: tier.price_yearly || 0,
    })
    setEditing(false)
  }

  return (
    <Card
      variant="elevated"
      className={`p-5 md:p-6 relative transition-all duration-200 ${
        !tier.is_active ? 'opacity-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base md:text-lg font-semibold text-white truncate">{tier.name}</h3>
            {tier.is_household_plan && (
              <Users className="w-4 h-4 text-secondary-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(tier.plan_category)}`}>
              {tier.plan_category}
            </span>
            <span className="text-xs text-neutral-500">
              {getBillingLabel(tier.billing_interval)}
            </span>
            {!tier.is_active && (
              <Badge className="bg-red-500/20 text-red-400 text-xs">Inactive</Badge>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="text-lg md:text-xl font-bold text-white">
            {displayPrice > 0 ? formatPrice(displayPrice) : 'Free'}
          </div>
          <div className="text-xs text-neutral-500">
            {tier.billing_interval === 'year' ? '/year' : tier.billing_interval === 'month' ? '/28 days' : ''}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {!editing ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Tokens */}
          <div className="bg-[#1A1A1A] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs text-neutral-400">Tokens</span>
            </div>
            <div className="text-lg font-bold text-white">{formatTokens(tokenGrant)}</div>
            <div className="text-[10px] text-neutral-500">{tokenGrant.toLocaleString()}</div>
          </div>

          {/* Storage */}
          <div className="bg-[#1A1A1A] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-secondary-400" />
              <span className="text-xs text-neutral-400">Storage</span>
            </div>
            <div className="text-lg font-bold text-white">{tier.storage_quota_gb} GB</div>
          </div>

          {/* Expiration */}
          <div className="bg-[#1A1A1A] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-energy-400" />
              <span className="text-xs text-neutral-400">Token Expiry</span>
            </div>
            <div className="flex items-center gap-1">
              {tier.billing_interval === 'one-time' ? (
                <InfinityIcon className="w-5 h-5 text-primary-400" />
              ) : (
                <span className="text-sm font-semibold text-white">{getExpirationLabel(tier.billing_interval)}</span>
              )}
            </div>
          </div>

          {/* Seats / Rollover */}
          <div className="bg-[#1A1A1A] rounded-xl p-3">
            {tier.is_household_plan ? (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-accent-400" />
                  <span className="text-xs text-neutral-400">Seats</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {tier.included_seats} included
                  {tier.max_household_members && ` (max ${tier.max_household_members})`}
                </div>
              </>
            ) : tier.rollover_max_cycles ? (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <Repeat className="w-3.5 h-3.5 text-accent-400" />
                  <span className="text-xs text-neutral-400">Rollover</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {tier.rollover_max_cycles} cycles max
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarDays className="w-3.5 h-3.5 text-accent-400" />
                  <span className="text-xs text-neutral-400">Billing</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {getBillingLabel(tier.billing_interval)}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-3 mb-4">
          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">
                <DollarSign className="w-3 h-3 inline mr-0.5" />
                Price (cents){tier.billing_interval === 'month' ? ' /28 days' : tier.billing_interval === 'year' ? ' /month display' : ''}
              </label>
              <input
                type="number"
                value={editValues.price_monthly}
                onChange={(e) => setEditValues(prev => ({ ...prev, price_monthly: parseInt(e.target.value) || 0 }))}
                className="w-full bg-[#1A1A1A] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                = {formatPrice(editValues.price_monthly)}
              </span>
            </div>
            {tier.billing_interval === 'year' && (
              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  <DollarSign className="w-3 h-3 inline mr-0.5" />
                  Yearly Price (cents)
                </label>
                <input
                  type="number"
                  value={editValues.price_yearly}
                  onChange={(e) => setEditValues(prev => ({ ...prev, price_yearly: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-[#1A1A1A] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  = {formatPrice(editValues.price_yearly)}
                </span>
              </div>
            )}
          </div>

          {/* Tokens */}
          {tier.billing_interval === 'year' ? (
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Annual Token Grant</label>
              <input
                type="number"
                value={editValues.annual_token_grant}
                onChange={(e) => setEditValues(prev => ({ ...prev, annual_token_grant: parseInt(e.target.value) || 0 }))}
                className="w-full bg-[#1A1A1A] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                = {formatTokens(editValues.annual_token_grant)}
              </span>
            </div>
          ) : (
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Monthly Token Grant</label>
              <input
                type="number"
                value={editValues.monthly_token_grant}
                onChange={(e) => setEditValues(prev => ({ ...prev, monthly_token_grant: parseInt(e.target.value) || 0 }))}
                className="w-full bg-[#1A1A1A] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                = {formatTokens(editValues.monthly_token_grant)}
              </span>
            </div>
          )}

          {/* Storage */}
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Storage (GB)</label>
            <input
              type="number"
              value={editValues.storage_quota_gb}
              onChange={(e) => setEditValues(prev => ({ ...prev, storage_quota_gb: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[#1A1A1A] border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
        <div className="text-[10px] text-neutral-600">
          Updated {new Date(tier.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="text-xs"
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-xs"
              disabled={saving}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="text-xs"
              disabled={saving}
            >
              {saving ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Save className="w-3 h-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function AdminMembershipTiersPage() {
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/membership-tiers', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error('Please log in to access admin features')
        if (response.status === 403) throw new Error('Admin access required')
        throw new Error(`Failed to fetch tiers (${response.status})`)
      }

      const data = await response.json()
      setTiers(data.tiers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTiers()
  }, [fetchTiers])

  const handleSave = async (id: string, updates: Partial<MembershipTier>) => {
    setError(null)
    setSuccessMessage(null)

    const response = await fetch('/api/admin/membership-tiers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, ...updates }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to update tier')
    }

    setSuccessMessage('Tier updated successfully')
    setTimeout(() => setSuccessMessage(null), 3000)

    // Refresh data
    await fetchTiers()
  }

  // Group tiers by category
  const intensiveTiers = tiers.filter(t => t.plan_category === 'intensive')
  const subscriptionTiers = tiers.filter(t => t.plan_category === 'subscription')
  const addonTiers = tiers.filter(t => t.plan_category === 'addon')
  const otherTiers = tiers.filter(t => !['intensive', 'subscription', 'addon'].includes(t.plan_category))

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="ADMIN"
            title="Membership Tiers"
            subtitle="View and manage token grants, storage quotas, and billing configuration"
          />

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-xl px-4 py-3 text-primary-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <Card variant="outlined" className="p-4 md:p-6">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-neutral-300 text-sm mb-3">{error}</p>
              <Button variant="primary" size="sm" onClick={fetchTiers}>
                Try Again
              </Button>
            </Card>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" variant="primary" />
              <span className="ml-3 text-neutral-400">Loading membership tiers...</span>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card variant="elevated" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-primary-400" />
                    <span className="text-xs text-neutral-400">Total Tiers</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{tiers.length}</div>
                </Card>
                <Card variant="elevated" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-accent-400" />
                    <span className="text-xs text-neutral-400">Intensive</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{intensiveTiers.length}</div>
                </Card>
                <Card variant="elevated" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="w-4 h-4 text-secondary-400" />
                    <span className="text-xs text-neutral-400">Subscriptions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{subscriptionTiers.length}</div>
                </Card>
                <Card variant="elevated" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-energy-400" />
                    <span className="text-xs text-neutral-400">Household</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{tiers.filter(t => t.is_household_plan).length}</div>
                </Card>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={fetchTiers}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Refresh
                </Button>
              </div>

              {/* Intensive Tiers */}
              {intensiveTiers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-accent-400" />
                    Activation Intensive
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intensiveTiers.map(tier => (
                      <TierCard key={tier.id} tier={tier} onSave={handleSave} />
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription Tiers */}
              {subscriptionTiers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-primary-400" />
                    Subscriptions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptionTiers.map(tier => (
                      <TierCard key={tier.id} tier={tier} onSave={handleSave} />
                    ))}
                  </div>
                </div>
              )}

              {/* Add-on Tiers */}
              {addonTiers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-energy-400" />
                    Add-ons
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addonTiers.map(tier => (
                      <TierCard key={tier.id} tier={tier} onSave={handleSave} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Tiers */}
              {otherTiers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-4">
                    Other
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherTiers.map(tier => (
                      <TierCard key={tier.id} tier={tier} onSave={handleSave} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
