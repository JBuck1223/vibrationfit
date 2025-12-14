'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Heart, Sparkles, Copy, Eye, Edit3, Trash2 } from 'lucide-react'
import { Card, Button, Badge, Spinner, Container, Stack, PageHero } from '@/lib/design-system/components'
import { VisionVersionCard } from '../components/VisionVersionCard'
import { getVisionCategoryKeys } from '@/lib/design-system/vision-categories'
import { createClient } from '@/lib/supabase/client'
import { addCalculatedVersionNumbers } from '@/lib/life-vision/version-helpers'
import { MergeVisionsTool } from './components/MergeVisionsTool'

const VISION_SECTIONS = getVisionCategoryKeys()

function calculateCompletionPercentage(vision: VisionData | Record<string, unknown>) {
  const sections = VISION_SECTIONS.map(section => (vision as any)[section] as string)
  const filledSections = sections.filter(section => String(section || '').trim().length > 0).length
  const totalSections = VISION_SECTIONS.length
  return Math.round((filledSections / totalSections) * 100)
}

interface VisionData {
  id: string
  user_id: string                          // Creator/initiator (always set)
  household_id: string | null              // Set for household visions
  title?: string
  forward: string
  fun: string
  travel: string
  home: string
  family: string
  love: string
  health: string
  money: string
  work: string
  social: string
  stuff: string
  giving: string
  spirituality: string
  conclusion: string
  is_draft: boolean
  is_active: boolean
  perspective: 'singular' | 'plural'
  created_at: string
  updated_at: string
  parent_id?: string | null
  source_visions?: string[] | null
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [household, setHousehold] = useState<HouseholdData | null>(null)
  const [visions, setVisions] = useState<VisionData[]>([])
  const [showMergeTool, setShowMergeTool] = useState(false)

  useEffect(() => {
    loadHouseholdVisions()
  }, [])

  async function loadHouseholdVisions() {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Please log in to view household visions')
        setLoading(false)
        return
      }

      // Get household data
      const householdResponse = await fetch('/api/household?includeMembers=true')
      const householdData = await householdResponse.json()

      if (!householdResponse.ok || !householdData.household) {
        setError('You are not part of a household account')
        setLoading(false)
        return
      }

      setHousehold(householdData)

      // Fetch household visions
      const { data: visionData, error: visionError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('household_id', householdData.household.id)
        .order('created_at', { ascending: false })

      if (visionError) {
        console.error('Error fetching household visions:', visionError)
        setError('Failed to load household visions')
        return
      }

      // Add calculated version numbers
      const visionsWithVersions = await addCalculatedVersionNumbers(
        visionData || []
      )

      setVisions(visionsWithVersions)
    } catch (err) {
      console.error('Error loading household visions:', err)
      setError('Failed to load household visions')
    } finally {
      setLoading(false)
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
            <Button variant="outline" onClick={() => router.push('/household/settings')}>
              Household Settings
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Household Visions"
          subtitle={`For ${household.household.name}`}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push('/life-vision')}
            >
              Personal Visions
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push('/life-vision/household/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Household Vision
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowMergeTool(true)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Merge Personal Visions
            </Button>
          </div>
        </PageHero>

        {/* Household Members Info */}
        <Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-secondary-500" />
            <h3 className="text-lg font-semibold">Household Members</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {household.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded-full"
              >
                {/* Profile Picture */}
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

        {/* Visions List */}
        {visions.length === 0 ? (
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
                onClick={() => router.push('/life-vision/household/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Household Vision
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowMergeTool(true)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Merge Personal Visions
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {visions.map((vision) => {
              const completionPercent = calculateCompletionPercentage(vision)
              const isDraft = vision.is_draft
              const isActive = vision.is_active

              return (
                <Card 
                  key={vision.id} 
                  variant="elevated"
                  className="p-6 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-secondary-500" />
                          <h3 className="text-2xl font-bold">
                            {vision.title || 'Untitled Household Vision'}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                          <Badge variant="secondary" className="!bg-secondary-500/20 !text-secondary-500">
                            Household Vision
                          </Badge>
                          {isDraft && (
                            <Badge variant="neutral">Draft</Badge>
                          )}
                          {isActive && (
                            <Badge variant="success">Active</Badge>
                          )}
                          <span>•</span>
                          <span>{completionPercent}% Complete</span>
                          <span>•</span>
                          <span>{new Date(vision.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-400">
                          {VISION_SECTIONS.filter(section => 
                            String(vision[section as keyof VisionData] || '').trim().length > 0
                          ).length} of {VISION_SECTIONS.length} categories
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isDraft) {
                            router.push(`/life-vision/${vision.id}/draft`)
                          } else {
                            router.push(`/life-vision/${vision.id}`)
                          }
                        }}
                      >
                        {isDraft ? <><Edit3 className="w-4 h-4 mr-2" />Continue Editing</> : <><Eye className="w-4 h-4 mr-2" />View</>}
                      </Button>

                      {!isDraft && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/life-vision/${vision.id}/refine`)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Refine
                        </Button>
                      )}

                      {household.isAdmin && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Delete this household vision? This cannot be undone.')) {
                              const supabase = createClient()
                              await supabase
                                .from('vision_versions')
                                .delete()
                                .eq('id', vision.id)
                              loadHouseholdVisions()
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Merge Tool */}
        {showMergeTool && household && (
          <MergeVisionsTool 
            onClose={() => setShowMergeTool(false)}
            householdId={household.household.id}
            householdMembers={household.members}
            onSuccess={loadHouseholdVisions}
          />
        )}
      </Stack>
    </Container>
  )
}

