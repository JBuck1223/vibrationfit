'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, PageHero, Card, Button, Badge, Input, Spinner } from '@/lib/design-system/components'
import { Tag, Plus, Copy, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/billing/config'

type Coupon = {
  id: string
  name: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  currency: string
  min_purchase_amount: number | null
  max_discount_amount: number | null
  eligible_products: string[] | null
  eligible_tiers: string[] | null
  max_redemptions: number | null
  max_redemptions_per_user: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  campaign_id: string | null
  metadata: Record<string, any>
  created_at: string
  total_redemptions: number
  codes_count: number
  master_code: string | null
  coupon_codes: { id: string; code: string; batch_id: string | null; redemption_count: number; is_active: boolean }[]
}

function discountLabel(c: Coupon): string {
  if (c.discount_type === 'percent') return `${c.discount_value}% off`
  return `${formatPrice(c.discount_value)} off`
}

function statusBadge(c: Coupon) {
  if (!c.is_active) return <Badge>Inactive</Badge>
  if (c.valid_until && new Date(c.valid_until) < new Date()) return <Badge variant="warning">Expired</Badge>
  if (c.max_redemptions && c.total_redemptions >= c.max_redemptions) return <Badge variant="warning">Maxed</Badge>
  return <Badge variant="success">Active</Badge>
}

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [formDiscountValue, setFormDiscountValue] = useState('')
  const [formMaxRedemptions, setFormMaxRedemptions] = useState('')
  const [formMaxPerUser, setFormMaxPerUser] = useState('1')
  const [formValidUntil, setFormValidUntil] = useState('')
  const [formEligibleProducts, setFormEligibleProducts] = useState('')
  const [creating, setCreating] = useState(false)

  // Bulk generation state
  const [bulkCouponId, setBulkCouponId] = useState<string | null>(null)
  const [bulkCount, setBulkCount] = useState('100')
  const [bulkPrefix, setBulkPrefix] = useState('')
  const [generating, setGenerating] = useState(false)

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formDiscountValue) return

    setCreating(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          code: formCode || undefined,
          discountType: formDiscountType,
          discountValue: Number(formDiscountValue),
          maxRedemptions: formMaxRedemptions ? Number(formMaxRedemptions) : undefined,
          maxRedemptionsPerUser: Number(formMaxPerUser) || 1,
          validUntil: formValidUntil || undefined,
          eligibleProducts: formEligibleProducts
            ? formEligibleProducts.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('Coupon created')
      setShowCreate(false)
      setFormName('')
      setFormCode('')
      setFormDiscountValue('')
      setFormMaxRedemptions('')
      setFormValidUntil('')
      setFormEligibleProducts('')
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create coupon')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.is_active }),
      })
      if (!res.ok) throw new Error()
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
      fetchCoupons()
    } catch {
      toast.error('Failed to update coupon')
    }
  }

  const handleBulkGenerate = async () => {
    if (!bulkCouponId) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/coupons/${bulkCouponId}/generate-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number(bulkCount) || 100,
          prefix: bulkPrefix || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      const data = await res.json()
      toast.success(`${data.codesGenerated} codes generated`)
      setBulkCouponId(null)
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate codes')
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard')
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Coupons & Promotions"
          subtitle="Create, manage, and track promotional codes"
        >
          <div className="flex justify-center w-full">
            <Button variant="primary" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </PageHero>

        {/* Create Coupon Form */}
        {showCreate && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">New Coupon</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Name</label>
                  <Input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Launch 50% Off"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Code (optional)</label>
                  <Input
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    placeholder="LAUNCH50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Discount Type</label>
                  <select
                    value={formDiscountType}
                    onChange={e => setFormDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="w-full rounded-xl bg-neutral-800 border-2 border-neutral-700 text-white px-4 py-2.5 focus:border-[#39FF14] focus:outline-none"
                  >
                    <option value="percent">Percent Off</option>
                    <option value="fixed">Fixed Amount Off (cents)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    {formDiscountType === 'percent' ? 'Percent (1-100)' : 'Amount (cents)'}
                  </label>
                  <Input
                    type="number"
                    value={formDiscountValue}
                    onChange={e => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'percent' ? '50' : '5000'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Max Redemptions</label>
                  <Input
                    type="number"
                    value={formMaxRedemptions}
                    onChange={e => setFormMaxRedemptions(e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Max Per User</label>
                  <Input
                    type="number"
                    value={formMaxPerUser}
                    onChange={e => setFormMaxPerUser(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Expires</label>
                  <Input
                    type="datetime-local"
                    value={formValidUntil}
                    onChange={e => setFormValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Eligible Products</label>
                  <Input
                    value={formEligibleProducts}
                    onChange={e => setFormEligibleProducts(e.target.value)}
                    placeholder="intensive, tokens (comma-sep)"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Bulk Generate Modal */}
        {bulkCouponId && (
          <Card className="p-6 border-2 border-[#39FF14]/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#39FF14]" />
              Bulk Generate Codes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Count</label>
                <Input
                  type="number"
                  value={bulkCount}
                  onChange={e => setBulkCount(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Prefix (optional)</label>
                <Input
                  value={bulkPrefix}
                  onChange={e => setBulkPrefix(e.target.value.toUpperCase())}
                  placeholder="LAUNCH"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="primary" className="flex-1" onClick={handleBulkGenerate} disabled={generating}>
                  {generating ? 'Generating...' : `Generate ${bulkCount} Codes`}
                </Button>
                <Button variant="ghost" onClick={() => setBulkCouponId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Coupon List */}
        {coupons.length === 0 ? (
          <Card className="p-8 text-center">
            <Tag className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400">No coupons yet. Create your first one above.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {coupons.map(coupon => {
              const isExpanded = expandedId === coupon.id
              return (
                <Card key={coupon.id} className="overflow-hidden">
                  {/* Header row */}
                  <button
                    className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-neutral-900/50 transition-colors text-left"
                    onClick={() => setExpandedId(isExpanded ? null : coupon.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-5 h-5 text-[#39FF14]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{coupon.name}</span>
                          {statusBadge(coupon)}
                        </div>
                        <div className="text-sm text-neutral-400 flex items-center gap-3">
                          <span className="font-mono text-[#39FF14]">{coupon.master_code || 'No code'}</span>
                          <span>{discountLabel(coupon)}</span>
                          <span>{coupon.total_redemptions}{coupon.max_redemptions ? `/${coupon.max_redemptions}` : ''} used</span>
                          {coupon.codes_count > 1 && <span>{coupon.codes_count} codes</span>}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 p-4 md:p-5 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-neutral-500">Discount</span>
                          <div className="text-white font-medium">{discountLabel(coupon)}</div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Per User Limit</span>
                          <div className="text-white font-medium">{coupon.max_redemptions_per_user}</div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Products</span>
                          <div className="text-white font-medium">
                            {coupon.eligible_products?.join(', ') || 'All'}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Expires</span>
                          <div className="text-white font-medium">
                            {coupon.valid_until
                              ? new Date(coupon.valid_until).toLocaleDateString()
                              : 'Never'}
                          </div>
                        </div>
                      </div>

                      {/* Codes list */}
                      {coupon.coupon_codes && coupon.coupon_codes.length > 0 && (
                        <div>
                          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Codes</div>
                          <div className="flex flex-wrap gap-2">
                            {coupon.coupon_codes.slice(0, 20).map(cc => (
                              <button
                                key={cc.id}
                                onClick={() => copyCode(cc.code)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 rounded-lg text-sm font-mono text-neutral-300 hover:bg-neutral-700 transition-colors"
                                title="Click to copy"
                              >
                                {cc.code}
                                <Copy className="w-3 h-3 text-neutral-500" />
                              </button>
                            ))}
                            {coupon.coupon_codes.length > 20 && (
                              <span className="text-sm text-neutral-500 self-center">
                                +{coupon.coupon_codes.length - 20} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-neutral-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBulkCouponId(coupon.id)
                            setExpandedId(null)
                          }}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Generate Codes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={coupon.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                          onClick={() => handleToggleActive(coupon)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        {coupon.master_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(coupon.master_code!)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Code
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}
