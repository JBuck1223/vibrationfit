'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, Button, Spinner } from '@/lib/design-system/components'
import { Users, UserPlus, Mail, X, Crown, Zap, Tag, Check, Loader2, Sparkles } from 'lucide-react'
import { formatPrice, PRICING } from '@/lib/billing/config'
import { toast } from 'sonner'

const INTENSIVE_PRICE = 20000

type CouponValidation = {
  valid: boolean
  name?: string
  discountAmount?: number
  discountType?: 'percent' | 'fixed'
  discountValue?: number
  error?: string
}

type Member = {
  user_id: string
  role: 'admin' | 'member'
  status: string
  joined_at: string
  profile?: {
    first_name?: string
    last_name?: string
    email?: string
  }
}

type Invitation = {
  id: string
  invited_email: string
  status: string
  created_at: string
}

type HouseholdInfo = {
  id: string
  name: string
  max_members: number
  shared_tokens_enabled: boolean
  admin_user_id: string
}

type HouseholdData = {
  household: HouseholdInfo
  members: Member[]
  invitations: Invitation[]
  isAdmin: boolean
}

type Props = {
  data: HouseholdData | null
  billingInterval: string
  onRefresh: () => void
}

type MemberIntensive = {
  userId: string
  status: 'pending' | 'in_progress' | 'completed' | string
  purchasedByAdmin: boolean
}

export default function HouseholdSection({ data, billingInterval, onRefresh }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [adding, setAdding] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const [memberIntensives, setMemberIntensives] = useState<MemberIntensive[]>([])

  const fetchIntensiveStatus = useCallback(async () => {
    if (!data?.household?.id) return
    try {
      const res = await fetch(`/api/household/intensives?householdId=${data.household.id}`)
      if (res.ok) {
        const result = await res.json()
        setMemberIntensives(result.intensives || [])
      }
    } catch {
      // non-critical
    }
  }, [data?.household?.id])

  useEffect(() => {
    fetchIntensiveStatus()
  }, [fetchIntensiveStatus])

  if (!data) return null

  const { household, members, invitations, isAdmin } = data
  const activeMembers = members?.filter((m: Member) => m.status === 'active') || []
  const pendingInvitations = invitations?.filter((i: Invitation) => i.status === 'pending') || []
  const totalOccupied = activeMembers.length + pendingInvitations.length
  const INCLUDED_SEATS = 2
  const paidSeats = Math.max(0, totalOccupied - INCLUDED_SEATS)

  const seatPrice = billingInterval === 'year' ? PRICING.ADDON_ANNUAL : PRICING.ADDON_28DAY
  const seatIntervalLabel = billingInterval === 'year' ? '/year' : '/28 days'
  const willNeedPaidSeat = totalOccupied + 1 > INCLUDED_SEATS

  const intensiveDiscount = couponResult?.valid ? (couponResult.discountAmount || 0) : 0
  const intensiveFinal = Math.max(0, INTENSIVE_PRICE - intensiveDiscount)

  const resetForm = () => {
    setShowAddForm(false)
    setFirstName('')
    setLastName('')
    setEmail('')
    setFormError('')
    setCouponCode('')
    setCouponResult(null)
    setAgreedToTerms(false)
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
          purchaseAmount: INTENSIVE_PRICE,
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

  const handleAddMember = async () => {
    setFormError('')
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('All fields are required')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/billing/add-household-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          promoCode: couponResult?.valid ? couponCode.trim() : undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to add member')

      if (result.intensiveWaived) {
        toast.success('Member added with intensive included at no charge')
      } else {
        toast.success(`Member added and invitation sent to ${email.trim()}`)
      }
      resetForm()
      onRefresh()
      fetchIntensiveStatus()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setCancelingId(invitationId)
    try {
      const res = await fetch(`/api/household/invite?id=${invitationId}`, { method: 'DELETE' })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to cancel invitation')
      }
      toast.success('Invitation canceled')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#00FFFF]" />
          <h3 className="text-lg font-bold text-white">{household.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {paidSeats > 0 && (
            <Badge variant="neutral" className="text-xs">
              {paidSeats} add-on seat{paidSeats > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge>
            {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {activeMembers.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-neutral-400 uppercase tracking-wide mb-3">Members</div>
          <div className="space-y-2">
            {activeMembers.map((member) => {
              const name = member.profile?.first_name
                ? `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
                : member.profile?.email || 'Member'
              const intensive = memberIntensives.find(i => i.userId === member.user_id)
              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between bg-neutral-900 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {member.role === 'admin' ? (
                      <Crown className="w-4 h-4 text-[#FFFF00] flex-shrink-0" />
                    ) : (
                      <Users className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-white">{name}</span>
                      {member.profile?.email && (
                        <p className="text-xs text-neutral-500">{member.profile.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {intensive && (
                      <div className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 bg-[#39FF14]/10 border border-[#39FF14]/20">
                        <Sparkles className="w-3 h-3 text-[#39FF14]" />
                        <span className="text-[#39FF14]">
                          {intensive.status === 'completed' ? 'Intensive Complete' :
                           intensive.status === 'in_progress' ? 'Intensive Active' :
                           'Intensive Assigned'}
                        </span>
                      </div>
                    )}
                    {member.role === 'admin' && (
                      <Badge variant="premium" className="text-xs">Admin</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-neutral-400 uppercase tracking-wide mb-3">Pending Invitations</div>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between bg-neutral-900 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-white">{inv.invited_email}</span>
                    <p className="text-xs text-neutral-500">
                      Sent {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleCancelInvitation(inv.id)}
                    disabled={cancelingId === inv.id}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-red-400"
                  >
                    {cancelingId === inv.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && !showAddForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Household Member
        </Button>
      )}

      {isAdmin && showAddForm && (
        <div className="rounded-2xl border-2 border-[#00FFFF]/20 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.03), transparent)' }}>
          <div className="p-5">
            <div className="text-center mb-4">
              <UserPlus className="w-8 h-8 text-[#00FFFF] mx-auto mb-2" />
              <h4 className="text-lg font-bold text-white">Add Household Member</h4>
              <p className="text-xs text-neutral-400 mt-1">
                They&apos;ll receive an email to create their account and join your household.
              </p>
            </div>

            <div className="space-y-2.5 mb-4">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-base text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00FFFF] transition-colors"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-base text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00FFFF] transition-colors"
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="member@email.com"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-base text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00FFFF] transition-colors"
              />
              {formError && (
                <p className="text-xs text-[#FF0040]">{formError}</p>
              )}
            </div>

            <div className="border-t border-neutral-800 pt-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#39FF14]" />
                <span className="text-sm font-semibold text-white">Activation Intensive</span>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-300 bg-neutral-900/60 rounded-lg px-3 py-2 mb-3">
                <span>Partner Intensive (one-time)</span>
                <span className="font-medium text-white">{formatPrice(INTENSIVE_PRICE)}</span>
              </div>

              <div className="flex gap-2 mb-2">
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
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-base text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#39FF14] transition-colors"
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
                <div className="flex items-center gap-1.5 text-xs text-green-400 mb-2">
                  <Check className="w-3 h-3" />
                  <span>{couponResult.name || 'Coupon applied'}</span>
                  {intensiveDiscount > 0 && (
                    <span className="text-green-300">(-{formatPrice(intensiveDiscount)})</span>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl p-3 mb-4 bg-neutral-900/60 border border-neutral-700/50">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2">Order Summary</div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Activation Intensive (one-time)</span>
                <span>{intensiveFinal === 0 ? 'Free' : formatPrice(intensiveFinal)}</span>
              </div>
              {willNeedPaidSeat && (
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Add-on seat ({formatPrice(seatPrice)}{seatIntervalLabel} recurring)</span>
                  <span>Prorated</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 mt-1.5 border-t border-neutral-700/60">
                <span>Due today</span>
                <span>
                  {intensiveFinal === 0 && !willNeedPaidSeat
                    ? 'No charge'
                    : willNeedPaidSeat
                      ? `${formatPrice(intensiveFinal)} + proration`
                      : formatPrice(intensiveFinal)
                  }
                </span>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4 border border-neutral-700/40 bg-neutral-800/30">
              <p className="text-xs text-neutral-300 leading-relaxed">
                A one-time charge of <span className="text-white font-medium">{formatPrice(intensiveFinal)}</span> for
                the Activation Intensive will be charged to your payment method on file today.
                {willNeedPaidSeat && (
                  <> An additional <span className="text-white font-medium">{formatPrice(seatPrice)}{seatIntervalLabel}</span> recurring
                  seat add-on will be added to your subscription.</>
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
                  I understand and agree to the charges described above.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddMember}
                disabled={!agreedToTerms || adding}
              >
                {adding ? <Spinner size="sm" /> : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add Member & Purchase Intensive
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && paidSeats > 0 && !showAddForm && (
        <div className="bg-neutral-900 rounded-xl p-4 mt-4">
          <p className="text-xs text-neutral-400">
            <span className="text-white font-medium">{INCLUDED_SEATS} included</span> + <span className="text-white font-medium">{paidSeats} add-on</span> seat{paidSeats > 1 ? 's' : ''} at {formatPrice(seatPrice)}{seatIntervalLabel} each
          </p>
        </div>
      )}
    </Card>
  )
}
