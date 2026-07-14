'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, Heart, Copy, Sparkles } from 'lucide-react'
import { Card, Button, Badge, Spinner, Container, Stack } from '@/lib/design-system/components'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { useLifeVisionStudioAreaChrome } from '@/components/life-vision-studio/useLifeVisionStudioAreaChrome'
import { MergeVisionsTool } from './components/MergeVisionsTool'
import { ConvertVisionTool } from './components/ConvertVisionTool'

interface HouseholdData {
  household: {
    id: string
    name: string
    admin_user_id: string
    shared_tokens_enabled: boolean
  }
  isAdmin: boolean
  members: Array<{
    user_id: string
    role: string
    profile: {
      first_name: string
      last_name: string
      email: string
      profile_picture_url?: string | null
    }
  }>
}

export default function HouseholdVisionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { visions: studioVisions, loading: studioLoading, refreshVisions } = useLifeVisionStudio()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [household, setHousehold] = useState<HouseholdData | null>(null)

  // Tools open via the Life Vision area bar (?tool=convert / ?tool=merge)
  const activeTool = searchParams.get('tool')
  const showConvertTool = activeTool === 'convert'
  const showMergeTool = activeTool === 'merge'

  const openTool = (tool: 'convert' | 'merge') => router.push(`/life-vision/household?tool=${tool}`)
  const closeTool = () => router.replace('/life-vision/household')

  // Mirror /life-vision: when a household vision exists, this hub redirects to
  // it (active first, then newest complete, then draft) so clicking Household
  // shows the vision itself. The hub only renders for the empty state and as
  // the host route for the convert/merge tools.
  const householdVisions = studioVisions.filter(v => v.is_household)
  const redirectTarget = !activeTool && !studioLoading
    ? (householdVisions.find(v => v.is_active && !v.is_draft)
      ?? householdVisions.find(v => !v.is_draft)
      ?? householdVisions.find(v => v.is_draft))
    : undefined

  useEffect(() => {
    if (!redirectTarget) return
    if (redirectTarget.is_draft) {
      router.replace(`/life-vision/${redirectTarget.id}/draft`)
    } else {
      router.replace(`/life-vision/${redirectTarget.id}`)
    }
  }, [redirectTarget, router])

  useLifeVisionStudioAreaChrome({
    contextEyebrow: 'The Life We Choose',
    contextText: household
      ? `Shared household visions for ${household.household.name}.`
      : undefined,
  })

  useEffect(() => {
    let cancelled = false
    async function loadHousehold() {
      try {
        const response = await fetch('/api/household?includeMembers=true')
        const data = await response.json()
        if (cancelled) return

        if (response.status === 401) {
          setError('Please log in to view household visions')
        } else if (!response.ok || !data.household) {
          setError('You are not part of a household account')
        } else {
          setHousehold(data)
        }
      } catch (err) {
        console.error('Error loading household:', err)
        if (!cancelled) setError('Failed to load household')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHousehold()
    return () => { cancelled = true }
  }, [])

  if (loading || studioLoading || redirectTarget) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !household) {
    return (
      <Container size="md">
        <Card className="text-center p-8">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-neutral-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">No Household Account</h1>
          <p className="text-neutral-300 mb-6">
            {error || 'You\'re not currently part of a household account.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/account/household')}>
              Household
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Household Members Info */}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-secondary-500" />
            <h3 className="text-lg font-semibold">Household Members</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {household.members.filter((member) => member.profile != null).map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded-full"
              >
                {member.profile.profile_picture_url ? (
                  <img
                    src={member.profile.profile_picture_url}
                    alt={member.profile.first_name || 'Member'}
                    className="w-6 h-6 rounded-full object-cover border border-primary-500"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {member.profile.first_name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-sm">
                  {member.profile.first_name} {member.profile.last_name}
                </span>
                {member.role === 'admin' && (
                  <Badge variant="primary" className="!text-xs !py-0.5">Admin</Badge>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-400 mt-4">
            All members can view and edit household visions. 
            {household.isAdmin ? ' As admin, you can also delete household visions.' : ''}
          </p>
        </Card>

        {/* Empty state — with any household vision present, the hub redirects to it.
            Hidden while a tool modal is open over a household that already has visions. */}
        {householdVisions.length === 0 && (
        <Card className="text-center p-12">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">No Household Visions Yet</h2>
          <p className="text-neutral-300 mb-6 max-w-md mx-auto">
            Create your first household vision to start building a shared future together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline"
              onClick={() => openTool('convert')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Convert Personal Vision
            </Button>
            <Button 
              variant="outline"
              onClick={() => openTool('merge')}
            >
              <Copy className="w-4 h-4 mr-2" />
              Merge Two Visions
            </Button>
          </div>
        </Card>
        )}

        {/* Convert Tool */}
        {showConvertTool && household && (
          <ConvertVisionTool 
            onClose={closeTool}
            householdId={household.household.id}
            householdMembers={household.members}
            onSuccess={refreshVisions}
          />
        )}

        {/* Merge Tool */}
        {showMergeTool && household && (
          <MergeVisionsTool 
            onClose={closeTool}
            householdId={household.household.id}
            householdMembers={household.members}
            onSuccess={refreshVisions}
          />
        )}
      </Stack>
    </Container>
  )
}
