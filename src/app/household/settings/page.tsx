'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge, Spinner } from '@/lib/design-system/components'

export default function HouseholdSettingsPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [household, setHousehold] = useState<any>(null)
  const [error, setError] = useState('')
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    loadHouseholdData()
  }, [])

  async function loadHouseholdData() {
    try {
      setLoading(true)
      
      // Use API route with query params to get all data
      const response = await fetch('/api/household?includeMembers=true')
      const data = await response.json()

      console.log('API response:', { status: response.status, data })

      if (!response.ok || !data.household) {
        console.error('Household API error:', data)
        setError(data.error || 'Not in a household')
        setLoading(false)
        return
      }
      
      setHousehold(data)
    } catch (error) {
      console.error('Error loading household:', error)
      setError('Failed to load household')
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail) return
    
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

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

      // Success!
      setInviteSuccess(`✅ Invitation sent to ${inviteEmail}!`)
      setInviteEmail('')
      await loadHouseholdData() // Reload to show pending invitation
      
    } catch (error) {
      setInviteError('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleToggleSharedTokens() {
    try {
      const newValue = !household.household.shared_tokens_enabled
      
      const response = await fetch('/api/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shared_tokens_enabled: newValue })
      })

      if (response.ok) {
        await loadHouseholdData()
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  if (error || !household) {
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

  const { household: householdInfo, members, invitations, isAdmin } = household

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
              <h2 className="text-2xl font-semibold mb-1">{householdInfo.name}</h2>
              <p className="text-sm text-neutral-400">
                {members?.length || 0} of {householdInfo.max_members} members
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
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    householdInfo.shared_tokens_enabled ? 'bg-primary-500' : 'bg-neutral-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      householdInfo.shared_tokens_enabled ? 'translate-x-7' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Members List */}
        {members && members.length > 0 && (
          <Card variant="elevated" className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Household Members</h2>
            
            <div className="space-y-4">
              {members.map((member: any) => {
                const name = member.profile?.first_name 
                  ? `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
                  : member.profile?.email || 'Member'
                
                return (
                  <div 
                    key={member.user_id}
                    className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-xl"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {name}
                        </span>
                        {member.role === 'admin' && (
                          <Badge variant="premium" className="text-xs">Admin</Badge>
                        )}
                      </div>
                      {member.profile?.email && (
                        <p className="text-xs text-neutral-400 mt-1">{member.profile.email}</p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Invite New Member (Admin Only) */}
        {isAdmin && members && members.length < householdInfo.max_members && (
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
            
            {inviteSuccess && (
              <p className="text-primary-500 text-sm mt-2">{inviteSuccess}</p>
            )}
          </Card>
        )}

        {/* Pending Invitations (Admin Only) */}
        {isAdmin && invitations && invitations.length > 0 && (
          <Card variant="elevated" className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Pending Invitations</h2>
            
            <div className="space-y-3">
              {invitations.map((invitation: any) => (
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
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
