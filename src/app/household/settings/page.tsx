'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Button, Card, Input, Badge, Spinner, Stack, PageHero } from '@/lib/design-system/components'

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
  
  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadHouseholdData()
  }, [])

  async function loadHouseholdData() {
    try {
      setLoading(true)
      
      const response = await fetch('/api/household?includeMembers=true')
      const data = await response.json()

      if (!response.ok || !data.household) {
        // 404 is expected when user isn't in a household - not an error
        if (response.status === 404) {
          console.log('User is not in a household')
        } else {
          // Log actual errors (500, auth issues, etc.)
          console.error('Household API error:', { 
            status: response.status, 
            error: data.error 
          })
        }
        setError(data.error || 'Not in a household')
        setLoading(false)
        return
      }
      
      setHousehold(data)
    } catch (error) {
      console.error('Exception loading household:', error)
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

  function handleCancelInvitation(invitationId: string) {
    setInvitationToDelete(invitationId)
    setShowDeleteDialog(true)
  }

  async function confirmCancelInvitation() {
    if (!invitationToDelete) return

    try {
      const response = await fetch(`/api/household/invite?id=${invitationToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reload household data to refresh invitations list
        await loadHouseholdData()
        setShowDeleteDialog(false)
        setInvitationToDelete(null)
      } else {
        const data = await response.json()
        setInviteError(data.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error canceling invitation:', error)
      setInviteError('Failed to cancel invitation')
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !household) {
    return (
      <Container size="md">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">No Household Account</h1>
          <p className="text-sm md:text-base text-neutral-300 mb-4 md:mb-8">
            You're not currently part of a household account.
          </p>
          <Button size="sm" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </Container>
    )
  }

  const { household: householdInfo, members, invitations, isAdmin } = household

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Household Settings"
          subtitle="Manage your household account and members"
        >
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
        </PageHero>

        {/* Household Info Card */}
        <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-0">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-1">{householdInfo.name}</h2>
            <p className="text-xs md:text-sm text-neutral-400">
              {members?.length || 0} of {householdInfo.max_members} members
            </p>
          </div>
            {isAdmin && (
              <Badge variant="premium">Admin</Badge>
            )}
          </div>

        {/* Shared Tokens Toggle (Admin Only) */}
        {isAdmin && (
          <div className="p-4 md:p-6 bg-primary-500/10 rounded-xl border border-primary-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Shared Token Pool</h3>
                <p className="text-xs md:text-sm text-neutral-400">
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
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Household Members</h2>
            
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
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Invite Member</h2>
          
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
            <Button
              size="sm"
              onClick={handleInviteMember}
              loading={inviting}
              disabled={!inviteEmail || inviting}
              className="w-full md:w-auto"
            >
              Send Invitation
            </Button>
          </div>

          {inviteError && (
            <p className="text-red-500 text-xs md:text-sm mt-2">{inviteError}</p>
          )}
          
          {inviteSuccess && (
            <p className="text-primary-500 text-xs md:text-sm mt-2">{inviteSuccess}</p>
          )}
        </Card>
        )}

        {/* Pending Invitations (Admin Only) */}
        {isAdmin && invitations && invitations.length > 0 && (
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Pending Invitations</h2>
            
          <div className="space-y-3">
            {invitations.map((invitation: any) => (
              <div 
                key={invitation.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 bg-[#1F1F1F] rounded-xl gap-3 md:gap-0"
              >
                <div>
                  <p className="text-sm md:text-base font-semibold">{invitation.invited_email}</p>
                  <p className="text-xs md:text-sm text-neutral-400">
                    Sent {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvitation(invitation.id)}
                  className="w-full md:w-auto"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </Card>
        )}
      </Stack>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 md:px-6">
          <div className="bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Cancel Invitation?</h3>
            <p className="text-sm md:text-base text-neutral-300 mb-4 md:mb-6">
              Are you sure you want to cancel this invitation? This action cannot be undone.
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setInvitationToDelete(null)
                }}
                className="flex-1"
              >
                Keep Invitation
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmCancelInvitation}
                className="flex-1"
              >
                Cancel Invitation
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
