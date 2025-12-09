'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, DeleteConfirmationDialog, Spinner, Container, Stack, Grid, Heading, Text, VersionBadge, StatusBadge, TrackingMilestoneCard, PageHero } from '@/lib/design-system/components'
import { VersionCard } from './components/VersionCard'
import { colors } from '@/lib/design-system/tokens'
import { 
  Edit3,
  FileText,
  Plus,
  Eye,
  X,
  Trash2,
  CheckCircle,
  Activity,
  GitCompare,
  CalendarDays,
  Copy
} from 'lucide-react'

interface ProfileData {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  version_number: number
  is_draft: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ProfileDashboardPage() {
  const router = useRouter()
  const [activeProfile, setActiveProfile] = useState<ProfileData | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ProfileData[]>([])
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<ProfileData | null>(null)
  const [hasActiveDraft, setHasActiveDraft] = useState(false)
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [versionToClone, setVersionToClone] = useState<string | null>(null)
  const [isCloning, setIsCloning] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/profile?t=${timestamp}&includeVersions=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      
      // Find active profile (not draft)
      const activeProf = data.versions?.find((v: ProfileData) => v.is_active === true && v.is_draft === false) || data.profile
      setActiveProfile(activeProf)
      setCompletionPercentage(data.completionPercentage || 0)
      setVersions(data.versions || [])
      
      // Check for active draft
      const activeDraft = data.versions?.find((v: ProfileData) => v.is_draft === true)
      if (activeDraft) {
        setHasActiveDraft(true)
        setActiveDraftId(activeDraft.id)
      } else {
        setHasActiveDraft(false)
        setActiveDraftId(null)
      }
      
      setError(null)
    } catch (err) {
      console.error('Error fetching profile:', err)
      const message = err instanceof Error ? err.message : 'Failed to load profile data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteVersion = async (versionId: string) => {
    setDeletingVersion(versionId)
    try {
      const response = await fetch(`/api/profile?versionId=${versionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete version' }))
        throw new Error(errorData.error || 'Failed to delete version')
      }

      await fetchProfile()
      
      // Update draft state after deletion
      if (versionToDelete?.is_draft) {
        setHasActiveDraft(false)
        setActiveDraftId(null)
      }
    } catch (error) {
      console.error('Error deleting version:', error)
      throw error
    } finally {
      setDeletingVersion(null)
      setDeleteDialogOpen(false)
      setVersionToDelete(null)
    }
  }

  const handleDeleteClick = (version: ProfileData) => {
    setVersionToDelete(version)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteVersion = async () => {
    if (!versionToDelete) return
    
    try {
      await deleteVersion(versionToDelete.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete version'
      alert(`Failed to delete version: ${errorMessage}`)
      // Keep dialog open for retry
    }
  }

  const handleCloneVersion = async (versionId: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please log in to clone a profile')
        return
      }
      
      // Check if a draft already exists
      const { data: existingDraft } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .single()

      if (existingDraft) {
        // Show override dialog
        setVersionToClone(versionId)
        setShowCloneDialog(true)
        return
      }

      // No existing draft, proceed with clone
      await performClone(versionId)
    } catch (error) {
      console.error('Error checking for drafts:', error)
      alert('Failed to check for existing drafts. Please try again.')
    }
  }

  const performClone = async (versionId: string) => {
    setIsCloning(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Delete any existing drafts
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      // Fetch the version to clone
      const { data: sourceVersion, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', versionId)
        .single()

      if (fetchError || !sourceVersion) {
        alert('Failed to fetch version to clone')
        return
      }

      // Create new draft version
      const { id, created_at, updated_at, version_number, ...versionData } = sourceVersion
      const newVersionData = {
        ...versionData,
        user_id: user.id,
        is_draft: true,
        is_active: false,
        version_number: 1, // Placeholder
      }

      const { data: newVersion, error: insertError } = await supabase
        .from('user_profiles')
        .insert([newVersionData])
        .select()
        .single()

      if (insertError) {
        console.error('Clone insert error:', insertError)
        alert(`Failed to clone version: ${insertError.message || 'Unknown error'}`)
        return
      }

      if (!newVersion) {
        console.error('No new version returned from insert')
        alert('Failed to clone version: No data returned')
        return
      }

      // Navigate to the draft page
      router.push(`/profile/${newVersion.id}/draft`)
      // Don't set isCloning(false) - keep loading overlay visible during navigation
    } catch (error) {
      console.error('Error cloning version:', error)
      alert('Failed to clone version. Please try again.')
      setIsCloning(false)
    }
  }

  const confirmClone = async () => {
    if (versionToClone) {
      // Set isCloning to true BEFORE dismissing dialog to prevent flash
      setIsCloning(true)
      setShowCloneDialog(false)
      await performClone(versionToClone)
      setVersionToClone(null)
    }
  }

  const handleCreateDraft = async () => {
    if (hasActiveDraft && activeDraftId) {
      router.push(`/profile/${activeDraftId}/draft`)
      return
    }
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please log in to create a draft')
        return
      }
      
      // Check if a draft already exists
      const { data: existingDraft } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .maybeSingle()
      
      if (existingDraft) {
        router.push(`/profile/${existingDraft.id}/draft`)
        return
      }
      
      // Find active profile as source
      const sourceProfileId = activeProfile?.id
      
      if (!sourceProfileId) {
        alert('Cannot create draft: No active profile found. Please ensure you have an active profile first.')
        return
      }
      
      // Create draft
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          profileData: activeProfile, 
          saveAsVersion: true, 
          isDraft: true,
          sourceProfileId: sourceProfileId
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        alert('Failed to create draft: ' + errorText)
        return
      }
      
      const data = await response.json()
      await fetchProfile()
      
      if (data.version?.id) {
        router.push(`/profile/${data.version.id}/draft`)
      }
    } catch (error) {
      console.error('Error creating draft:', error)
      alert('Failed to create draft')
    }
  }

  const profileCount = versions.length
  const completedProfiles = versions.filter(v => !v.is_draft && v.is_active).length

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-16">
          <Card className="max-w-md mx-auto p-6 md:p-8">
            <Stack gap="md" align="center">
              <div className="text-red-500">
                <X className="w-12 h-12 md:w-16 md:h-16 mx-auto" />
              </div>
              <Heading level={2} className="text-white">Profile Error</Heading>
              <Text size="sm" className="text-neutral-400 text-center">{error}</Text>
              <Button onClick={fetchProfile} variant="primary" size="sm">
                Try Again
              </Button>
            </Stack>
          </Card>
        </div>
      </Container>
    )
  }

  return (
    <>
        {/* Page Hero */}
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title={activeProfile && activeProfile.first_name && activeProfile.last_name
            ? `${activeProfile.first_name} ${activeProfile.last_name}`
            : 'My Profile'}
          subtitle={activeProfile 
            ? 'View and manage your profile versions below.'
            : 'Create and manage your profile versions below.'}
        >
          {/* Centered Version Info with Enhanced Styling */}
          {activeProfile && (
            <div className="text-center mb-6">
              {/* Version, Status & Date Badges */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <VersionBadge 
                  versionNumber={activeProfile.version_number} 
                  status={activeProfile.is_active && !activeProfile.is_draft ? 'active' : activeProfile.is_draft ? 'draft' : 'complete'} 
                />
                <StatusBadge 
                  status={activeProfile.is_active && !activeProfile.is_draft ? 'active' : activeProfile.is_draft ? 'draft' : 'complete'} 
                  subtle={!(activeProfile.is_active && !activeProfile.is_draft)} 
                  className="uppercase tracking-[0.25em]"
                />
                <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <CalendarDays className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">Created:</span>
                  <span>{new Date(activeProfile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Enhanced with Hover Effects */}
          {activeProfile && (
            <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
              <Button
                onClick={() => router.push(`/profile/${activeProfile.id}`)}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>View Profile</span>
              </Button>
              <Button
                onClick={() => router.push('/profile/edit')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
              >
                <Edit3 className="w-4 h-4 shrink-0" />
                <span>Edit Profile</span>
              </Button>
            </div>
          )}
        </PageHero>

        {/* Create Button (only when no active profile) */}
        {!activeProfile && (
          <Container size="xl">
          <div className="flex justify-end mb-6 md:mb-8">
            <Button
              onClick={() => router.push('/profile/new')}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Profile
            </Button>
          </div>
          </Container>
        )}


        {/* Stats Cards */}
        {activeProfile && (
          <Container size="xl">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <TrackingMilestoneCard
              label="Profiles"
              value={profileCount}
              theme="primary"
            />
            <TrackingMilestoneCard
              label="Active"
              value={completedProfiles}
              theme="secondary"
            />
            <TrackingMilestoneCard
              label="Complete"
              value={`${completionPercentage}%`}
              theme="accent"
            />
          </div>
          </Container>
        )}

        {/* All Versions List */}
        {activeProfile && versions.length > 0 && (
          <Container size="xl">
          <Card className="p-6 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Profile Versions</h2>
            </div>
            <div className="space-y-4">
              {versions.map((version) => {
                const isActive = version.id === activeProfile?.id && version.is_active
                const isDraft = version.is_draft
                
                // Determine button variant based on status
                const getViewButtonVariant = () => {
                  if (isDraft) return 'ghost-yellow'
                  if (isActive) return 'primary'
                  return 'ghost-blue'
                }
                
                return (
                  <VersionCard
                    key={version.id}
                    version={version}
                    actions={
                      <>
                        {isDraft ? (
                          // Draft version - only show View button
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/profile/${version.id}/draft`)
                            }}
                            variant="ghost-yellow"
                            size="sm"
                            className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        ) : (
                          <>
                            {/* Clone button for non-draft versions */}
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCloneVersion(version.id)
                              }}
                              variant="ghost"
                              size="sm"
                              disabled={isCloning}
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Clone
                            </Button>
                            {/* View button */}
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                router.push(`/profile/${version.id}`)
                              }}
                              variant={getViewButtonVariant()}
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </>
                        )}
                      </>
                    }
                  />
                )
              })}
            </div>
          </Card>
          </Container>
        )}

        {/* No Profile State */}
        {!activeProfile && (
          <Container size="xl">
          <div className="text-center py-12 md:py-16">
            <Card className="max-w-md mx-auto p-6 md:p-8">
              <Stack gap="md" align="center">
                <div className="text-5xl md:text-6xl">👤</div>
                <Heading level={3} className="text-white text-xl md:text-2xl">No profile yet</Heading>
                <Text size="sm" className="text-neutral-400 text-center">
                  Start by creating your first profile. Define your personal information and preferences.
                </Text>
                <Button asChild size="sm">
                  <Link href="/profile/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Profile
                  </Link>
                </Button>
              </Stack>
            </Card>
          </div>
          </Container>
        )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setVersionToDelete(null)
        }}
        onConfirm={confirmDeleteVersion}
        itemType="profile version"
        itemName={versionToDelete ? `Version ${versionToDelete.version_number}` : ''}
        isLoading={deletingVersion !== null}
      />

      {/* Clone Override Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Override Existing Draft?
              </h3>
              <button
                onClick={() => setShowCloneDialog(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-400 mb-6">
              You already have a draft profile in progress. Cloning this version will replace your current draft. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloneDialog(false)}
                disabled={isCloning}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmClone}
                disabled={isCloning}
                className="flex-1 gap-2"
              >
                {isCloning ? (
                  <>
                    <Spinner variant="primary" size="sm" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Clone Version
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cloning Loading Overlay */}
      {isCloning && !showCloneDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <div className="text-center py-8">
              <Spinner variant="primary" size="lg" className="mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Cloning Profile Version
              </h3>
              <p className="text-neutral-400">
                Creating your draft version...
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
