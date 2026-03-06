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
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  
  // Household name editing
  const [editingName, setEditingName] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [savingName, setSavingName] = useState(false)

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
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) {
      setInviteError('First name, last name, and email are all required')
      return
    }
    
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const response = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: inviteFirstName.trim(),
          lastName: inviteLastName.trim(),
          email: inviteEmail.trim().toLowerCase(),
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invitation')
        return
      }

      setInviteSuccess(`Invitation sent to ${inviteFirstName.trim()}!`)
      setInviteFirstName('')
      setInviteLastName('')
      setInviteEmail('')
      await loadHouseholdData()
      
    } catch (error) {
      setInviteError('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleSaveHouseholdName() {
    if (!newHouseholdName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHouseholdName.trim() }),
      })
      if (res.ok) {
        setEditingName(false)
        await loadHouseholdData()
      }
    } catch (err) {
      console.error('Error saving household name:', err)
    } finally {
      setSavingName(false)
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
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  className="text-xl font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveHouseholdName()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                />
                <Button size="sm" onClick={handleSaveHouseholdName} loading={savingName} disabled={!newHouseholdName.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-semibold mb-1">{householdInfo.name}</h2>
                {isAdmin && (
                  <button
                    onClick={() => { setNewHouseholdName(householdInfo.name); setEditingName(true) }}
                    className="text-neutral-500 hover:text-primary-500 transition-colors"
                    title="Rename household"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                )}
              </div>
            )}
            <p className="text-xs md:text-sm text-neutral-400">
              {members?.length || 0} {(members?.length || 0) === 1 ? 'member' : 'members'}
            </p>
          </div>
            {isAdmin && !editingName && (
              <Badge variant="premium">Admin</Badge>
            )}
          </div>

        {/* Shared Token Pool Info */}
        <div className="p-4 md:p-6 bg-primary-500/10 rounded-xl border border-primary-500/20">
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-semibold">Shared Token Pool</h3>
            <Badge variant="success" className="text-xs">Active</Badge>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            All household members share one token pool from the plan owner
          </p>
        </div>
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
        {isAdmin && (
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Invite Member</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Input
                type="text"
                placeholder="First name"
                value={inviteFirstName}
                onChange={(e) => setInviteFirstName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Last name"
                value={inviteLastName}
                onChange={(e) => setInviteLastName(e.target.value)}
              />
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-3 md:mt-4">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
            <Button
              size="sm"
              onClick={handleInviteMember}
              loading={inviting}
              disabled={!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim() || inviting}
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
