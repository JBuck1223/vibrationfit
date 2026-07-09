'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, Badge, Spinner, Stack, Modal } from '@/lib/design-system/components'
import { Pencil } from 'lucide-react'
import { HouseholdSharingSettingsCard } from './HouseholdSharingSettingsCard'

const glassCard = 'border border-white/[0.06] p-4 shadow-none sm:p-5'

export function AccountHouseholdSettings() {
  const [loading, setLoading] = useState(true)
  const [household, setHousehold] = useState<any>(null)
  const [error, setError] = useState('')

  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const [editingName, setEditingName] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null)

  useEffect(() => {
    void loadHouseholdData()
  }, [])

  async function loadHouseholdData() {
    try {
      setLoading(true)

      const response = await fetch('/api/household?includeMembers=true')
      const data = await response.json()

      if (!response.ok || !data.household) {
        if (response.status === 404) {
          console.log('User is not in a household')
        } else {
          console.error('Household API error:', {
            status: response.status,
            error: data.error,
          })
        }
        setError(data.error || 'Not in a household')
        setLoading(false)
        return
      }

      setHousehold(data)
      setError('')
    } catch (err) {
      console.error('Exception loading household:', err)
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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invitation')
        return
      }

      setInviteSuccess(`Invitation sent to ${inviteFirstName.trim()}.`)
      setInviteFirstName('')
      setInviteLastName('')
      setInviteEmail('')
      await loadHouseholdData()
    } catch {
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
        method: 'DELETE',
      })

      if (response.ok) {
        await loadHouseholdData()
        setShowDeleteDialog(false)
        setInvitationToDelete(null)
      } else {
        const data = await response.json()
        setInviteError(data.error || 'Failed to cancel invitation')
      }
    } catch (err) {
      console.error('Error canceling invitation:', err)
      setInviteError('Failed to cancel invitation')
    }
  }

  function closeDeleteDialog() {
    setShowDeleteDialog(false)
    setInvitationToDelete(null)
  }

  return (
    <section className="min-w-0" aria-label="Household">
      <h2 className="sr-only">Household</h2>

      {loading && (
        <Card variant="glass" className={`${glassCard} flex min-h-[8rem] items-center justify-center`}>
          <Spinner size="md" />
        </Card>
      )}

      {!loading && (error || !household) && (
        <Card variant="glass" className={glassCard}>
          <p className="text-sm text-neutral-400">
            You are not part of a household account. When you join or create one, member and invitation
            management will appear here.
          </p>
        </Card>
      )}

      {!loading && household && (
        <Stack gap="md">
          <Card variant="glass" className={glassCard}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      value={newHouseholdName}
                      onChange={(e) => setNewHouseholdName(e.target.value)}
                      className="text-base font-semibold sm:max-w-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveHouseholdName()
                        if (e.key === 'Escape') setEditingName(false)
                      }}
                    />
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleSaveHouseholdName()}
                        loading={savingName}
                        disabled={!newHouseholdName.trim()}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-white sm:text-lg">{household.household.name}</p>
                    {household.isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewHouseholdName(household.household.name)
                          setEditingName(true)
                        }}
                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-primary-500"
                        title="Rename household"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  {household.members?.length || 0}{' '}
                  {(household.members?.length || 0) === 1 ? 'member' : 'members'}
                </p>
              </div>
              {household.isAdmin && !editingName && <Badge variant="premium">Admin</Badge>}
            </div>

            <div className="mt-5 rounded-xl border border-primary-500/20 bg-primary-500/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Shared token pool</h3>
                <Badge variant="success" className="text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                All household members share one token pool from the plan owner.
              </p>
            </div>
          </Card>

          {household.members && household.members.length > 0 && (
            <Card variant="glass" className={glassCard}>
              <h3 className="mb-4 text-base font-semibold text-white">Members</h3>
              <div className="space-y-2">
                {household.members.map((member: any) => {
                  const name = member.profile?.first_name
                    ? `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
                    : member.profile?.email || 'Member'

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{name}</span>
                          {member.role === 'admin' && (
                            <Badge variant="premium" className="text-[10px]">
                              Admin
                            </Badge>
                          )}
                        </div>
                        {member.profile?.email && (
                          <p className="mt-0.5 truncate text-xs text-neutral-500">{member.profile.email}</p>
                        )}
                        <p className="mt-1 text-[11px] text-neutral-600">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {(household.members?.length || 0) > 1 && <HouseholdSharingSettingsCard />}

          {household.isAdmin && (
            <Card variant="glass" className={glassCard}>
              <h3 className="mb-1 text-base font-semibold text-white">Invite member</h3>
              <p className="mb-4 text-xs text-neutral-500">They will receive an email with steps to join.</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="sm:flex-1"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => void handleInviteMember()}
                  loading={inviting}
                  disabled={!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim() || inviting}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Send invitation
                </Button>
              </div>

              {inviteError && <p className="mt-2 text-xs text-red-400">{inviteError}</p>}
              {inviteSuccess && <p className="mt-2 text-xs text-primary-500">{inviteSuccess}</p>}
            </Card>
          )}

          {household.isAdmin && household.invitations && household.invitations.length > 0 && (
            <Card variant="glass" className={glassCard}>
              <h3 className="mb-4 text-base font-semibold text-white">Pending invitations</h3>
              <div className="space-y-2">
                {household.invitations.map((invitation: any) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{invitation.invited_email}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Sent {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="w-full shrink-0 sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Stack>
      )}

      <Modal
        isOpen={showDeleteDialog}
        onClose={closeDeleteDialog}
        title="Cancel invitation?"
        size="sm"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="sm" onClick={closeDeleteDialog} className="flex-1">
              Keep invitation
            </Button>
            <Button variant="danger" size="sm" onClick={() => void confirmCancelInvitation()} className="flex-1">
              Cancel invitation
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-neutral-400">
          Are you sure you want to cancel this invitation? This cannot be undone.
        </p>
      </Modal>
    </section>
  )
}
