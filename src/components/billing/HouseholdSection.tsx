'use client'

import { useState } from 'react'
import { Card, Badge, Button, Input, Spinner } from '@/lib/design-system/components'
import { Users, UserPlus, Mail, X, Crown, Plus, Minus } from 'lucide-react'
import { formatPrice, PRICING, ROLLOVER_LIMITS } from '@/lib/billing/config'
import { toast } from 'sonner'

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

export default function HouseholdSection({ data, billingInterval, onRefresh }: Props) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [seatAction, setSeatAction] = useState<'idle' | 'adding' | 'removing'>('idle')

  if (!data) return null

  const { household, members, invitations, isAdmin } = data
  const activeMembers = members?.filter((m: Member) => m.status === 'active') || []
  const pendingInvitations = invitations?.filter((i: Invitation) => i.status === 'pending') || []
  const includedSeats = 2
  const addonSeats = Math.max(0, household.max_members - includedSeats)
  const canInvite = activeMembers.length + pendingInvitations.length < household.max_members
  const canAddSeat = household.max_members < ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS
  const canRemoveSeat = addonSeats > 0 && activeMembers.length <= household.max_members - 1

  const seatPrice = billingInterval === 'year' ? PRICING.ADDON_ANNUAL : PRICING.ADDON_28DAY
  const seatIntervalLabel = billingInterval === 'year' ? '/year' : '/28 days'

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to send invitation')
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setInviting(false)
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

  const handleAddSeat = async () => {
    setSeatAction('adding')
    try {
      const res = await fetch('/api/billing/addon-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to add seat')
      toast.success('Additional seat added')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSeatAction('idle')
    }
  }

  const handleRemoveSeat = async () => {
    setSeatAction('removing')
    try {
      const res = await fetch('/api/billing/addon-seats', { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to remove seat')
      toast.success('Seat removed')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSeatAction('idle')
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#00FFFF]" />
          <h3 className="text-lg font-bold text-white">{household.name}</h3>
        </div>
        <Badge>
          {activeMembers.length} of {household.max_members} members
        </Badge>
      </div>

      {activeMembers.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-neutral-400 uppercase tracking-wide mb-3">Members</div>
          <div className="space-y-2">
            {activeMembers.map((member) => {
              const name = member.profile?.first_name
                ? `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
                : member.profile?.email || 'Member'
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
                  {member.role === 'admin' && (
                    <Badge variant="premium" className="text-xs">Admin</Badge>
                  )}
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

      {isAdmin && canInvite && (
        <div className="mb-6">
          <div className="text-xs text-neutral-400 uppercase tracking-wide mb-3">Invite Member</div>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
            >
              {inviting ? <Spinner size="sm" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-neutral-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-white">Seat Management</p>
              <p className="text-xs text-neutral-400">
                {includedSeats} included {addonSeats > 0 ? `+ ${addonSeats} add-on` : ''} ({household.max_members} total)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            {canRemoveSeat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveSeat}
                disabled={seatAction !== 'idle'}
              >
                {seatAction === 'removing' ? <Spinner size="sm" /> : <Minus className="w-4 h-4 mr-1" />}
                Remove Seat
              </Button>
            )}
            {canAddSeat && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSeat}
                disabled={seatAction !== 'idle'}
              >
                {seatAction === 'adding' ? <Spinner size="sm" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Seat ({formatPrice(seatPrice)}{seatIntervalLabel})
              </Button>
            )}
          </div>
          {household.max_members >= ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS && (
            <p className="text-xs text-neutral-500 mt-2">Maximum seats reached</p>
          )}
        </div>
      )}
    </Card>
  )
}
