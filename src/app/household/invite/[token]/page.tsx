'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Spinner, Container, Stack, PageHero } from '@/lib/design-system/components'

interface InvitationDetails {
  id: string
  household_id: string
  invited_email: string
  status: string
  created_at: string
  household: {
    household_name: string
    admin_user_id: string
  }
  admin: {
    full_name: string
    email: string
  }
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState('')
  const [currentUserEmail, setCurrentUserEmail] = useState('')

  useEffect(() => {
    if (token) {
      loadInvitation()
    }
  }, [token])

  async function loadInvitation() {
    try {
      setLoading(true)
      setError('')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // User not logged in - redirect to login with return URL
        router.push(`/auth/login?returnTo=/household/invite/${token}`)
        return
      }

      // Get user's email
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', user.id)
        .single()
      
      setCurrentUserEmail(profileData?.email || user.email || '')

      // Get invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .from('household_invitations')
        .select(`
          id,
          household_id,
          invited_email,
          status,
          created_at,
          households!household_invitations_household_id_fkey(
            household_name,
            admin_user_id
          )
        `)
        .eq('invitation_token', token)
        .single()

      if (invitationError || !invitationData) {
        setError('Invitation not found or has expired')
        setLoading(false)
        return
      }

      // Check if invitation is still pending
      if (invitationData.status !== 'pending') {
        setError(`This invitation has already been ${invitationData.status}`)
        setLoading(false)
        return
      }

      // Get admin details
      const household = (invitationData as any).households
      const { data: adminData } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('user_id', household.admin_user_id)
        .single()

      setInvitation({
        ...invitationData,
        household: household,
        admin: adminData || { full_name: 'Unknown', email: '' }
      } as InvitationDetails)

    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptInvitation() {
    if (!invitation) return
    
    setAccepting(true)
    setError('')

    try {
      const response = await fetch('/api/household/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_token: token })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation')
        return
      }

      // Success - redirect to household settings
      router.push('/household/settings')
      
    } catch (err) {
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  async function handleDeclineInvitation() {
    if (!invitation || !confirm('Are you sure you want to decline this invitation?')) return

    try {
      // Update invitation status to declined
      await supabase
        .from('household_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id)

      router.push('/dashboard')
    } catch (err) {
      console.error('Error declining invitation:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Invalid Invitation</h1>
            <p className="text-neutral-300">{error}</p>
          </div>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  // Check if invited email matches current user
  const emailMatches = currentUserEmail.toLowerCase() === invitation.invited_email.toLowerCase()

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Household Invitation"
          subtitle="Join a household and share your transformation journey"
        >
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">👥</span>
          </div>
        </PageHero>

        <div className="max-w-2xl mx-auto w-full">
          <Card className="p-6">
            <p className="text-neutral-300 mb-6">
            You've been invited to join a household account
          </p>
          </Card>
        </div>

        {/* Invitation Details Card */}
        <Card variant="elevated" className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">{invitation.household.household_name}</h2>
            <p className="text-neutral-400">
              Invited by {invitation.admin.full_name || invitation.admin.email}
            </p>
          </div>

          <div className="p-6 bg-primary-500/10 rounded-xl border border-primary-500/20 mb-6">
            <h3 className="font-semibold mb-3">What's included:</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Access to household features and resources</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Your own individual token balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Option to use shared household tokens when needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Track your progress alongside household members</span>
              </li>
            </ul>
          </div>

          {/* Email mismatch warning */}
          {!emailMatches && (
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-6">
              <p className="text-sm text-yellow-500">
                <strong>Note:</strong> This invitation was sent to {invitation.invited_email}, 
                but you're logged in as {currentUserEmail}. 
                You can still accept, but make sure this is the right account.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={handleAcceptInvitation}
              loading={accepting}
              disabled={accepting}
              className="flex-1"
            >
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              onClick={handleDeclineInvitation}
              disabled={accepting}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-sm text-neutral-400">
          <p>
            Invitation sent {new Date(invitation.created_at).toLocaleDateString()}
          </p>
        </div>
      </Stack>
    </Container>
  )
}

