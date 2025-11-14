'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Badge, Spinner } from '@/lib/design-system/components'
import { Household, HouseholdMember, HouseholdInvitation } from '@/lib/supabase/household'

export default function HouseholdSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  
  // Shared tokens toggle
  const [sharedTokensEnabled, setSharedTokensEnabled] = useState(false)
  const [updatingSettings, setUpdatingSettings] = useState(false)

  useEffect(() => {
    loadHouseholdData()
  }, [])

  async function loadHouseholdData() {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setCurrentUserId(user.id)

      // Get household info
      const { data: householdData, error: householdError } = await supabase
        .from('user_profiles')
        .select(`
          household_id,
          households!user_profiles_household_id_fkey(
            id,
            household_name,
            admin_user_id,
            shared_tokens_enabled,
            max_members,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (householdError || !householdData?.household_id) {
        // User not in a household - redirect to create one
        setLoading(false)
        return
      }

      const householdInfo = (householdData as any).households
      setHousehold(householdInfo)
      setIsAdmin(householdInfo.admin_user_id === user.id)
      setSharedTokensEnabled(householdInfo.shared_tokens_enabled)

      // Get household members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select(`
          user_id,
          role,
          joined_at,
          allow_shared_tokens,
          user_profiles!household_members_user_id_fkey(
            full_name,
            email
          )
        `)
        .eq('household_id', householdData.household_id)
        .order('joined_at', { ascending: true })

      if (!membersError && membersData) {
        setMembers(membersData as any)
      }

      // Get pending invitations (admin only)
      if (householdInfo.admin_user_id === user.id) {
        const { data: invitesData, error: invitesError } = await supabase
          .from('household_invitations')
          .select('*')
          .eq('household_id', householdData.household_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (!invitesError && invitesData) {
          setInvitations(invitesData)
        }
      }

    } catch (error) {
      console.error('Error loading household data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail || !household) return
    
    setInviting(true)
    setInviteError('')

    try {
      const response = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invitation')
        return
      }

      // Success - reload invitations
      setInviteEmail('')
      await loadHouseholdData()
      
    } catch (error) {
      setInviteError('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleToggleSharedTokens() {
    if (!isAdmin || !household) return
    
    setUpdatingSettings(true)

    try {
      const newValue = !sharedTokensEnabled
      
      const response = await fetch('/api/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shared_tokens_enabled: newValue })
      })

      if (response.ok) {
        setSharedTokensEnabled(newValue)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    } finally {
      setUpdatingSettings(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!isAdmin || !confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch('/api/household/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        await loadHouseholdData()
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  async function handleLeaveHousehold() {
    if (!confirm('Are you sure you want to leave this household? You can create your own solo account.')) return

    try {
      const response = await fetch('/api/household/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId })
      })

      if (response.ok) {
        router.push('/household/convert-to-solo')
      }
    } catch (error) {
      console.error('Error leaving household:', error)
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      // Delete invitation
      await supabase
        .from('household_invitations')
        .delete()
        .eq('id', invitationId)
      
      await loadHouseholdData()
    } catch (error) {
      console.error('Error canceling invitation:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">No Household Account</h1>
          <p className="text-neutral-300 mb-8">
            You're not currently part of a household account.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Household Settings</h1>
          <p className="text-neutral-300">
            Manage your household account and members
          </p>
        </div>

        {/* Household Info Card */}
        <Card variant="elevated" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">{household.household_name}</h2>
              <p className="text-sm text-neutral-400">
                {members.length} of {household.max_members} members
              </p>
            </div>
            {isAdmin && (
              <Badge variant="premium">Admin</Badge>
            )}
          </div>

          {/* Shared Tokens Toggle (Admin Only) */}
          {isAdmin && (
            <div className="p-6 bg-primary-500/10 rounded-xl border border-primary-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Shared Token Pool</h3>
                  <p className="text-sm text-neutral-400">
                    Allow members to use your tokens when they run out
                  </p>
                </div>
                <button
                  onClick={handleToggleSharedTokens}
                  disabled={updatingSettings}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    sharedTokensEnabled ? 'bg-primary-500' : 'bg-neutral-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      sharedTokensEnabled ? 'translate-x-7' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Members List */}
        <Card variant="elevated" className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Household Members</h2>
          
          <div className="space-y-4">
            {members.map((member) => {
              const profile = (member as any).user_profiles
              const isCurrentUser = member.user_id === currentUserId
              const isMemberAdmin = member.role === 'admin'

              return (
                <div 
                  key={member.user_id}
                  className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-xl"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {profile?.full_name || profile?.email || 'Unknown User'}
                      </span>
                      {isMemberAdmin && (
                        <Badge variant="premium" className="text-xs">Admin</Badge>
                      )}
                      {isCurrentUser && (
                        <Badge variant="info" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400">{profile?.email}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Admin can remove non-admin members */}
                  {isAdmin && !isMemberAdmin && !isCurrentUser && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Invite New Member (Admin Only) */}
        {isAdmin && members.length < household.max_members && (
          <Card variant="elevated" className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Invite Member</h2>
            
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleInviteMember}
                loading={inviting}
                disabled={!inviteEmail || inviting}
              >
                Send Invitation
              </Button>
            </div>

            {inviteError && (
              <p className="text-red-500 text-sm mt-2">{inviteError}</p>
            )}
          </Card>
        )}

        {/* Pending Invitations (Admin Only) */}
        {isAdmin && invitations.length > 0 && (
          <Card variant="elevated" className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Pending Invitations</h2>
            
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div 
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-xl"
                >
                  <div>
                    <p className="font-semibold">{invitation.invited_email}</p>
                    <p className="text-sm text-neutral-400">
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Leave Household (Non-Admin Members) */}
        {!isAdmin && (
          <Card variant="elevated" className="border-2 border-red-500/20">
            <h2 className="text-2xl font-semibold mb-4">Leave Household</h2>
            <p className="text-neutral-300 mb-6">
              If you leave this household, you can create your own solo account.
              You'll need to purchase your own subscription.
            </p>
            <Button
              variant="danger"
              onClick={handleLeaveHousehold}
            >
              Leave Household
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

