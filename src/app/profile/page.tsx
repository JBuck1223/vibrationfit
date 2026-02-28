'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, DeleteConfirmationDialog, Spinner, Container, Stack, Grid, Heading, Text, TrackingMilestoneCard, PageHero } from '@/lib/design-system/components'
import { VersionCard } from './components/VersionCard'
import { colors } from '@/lib/design-system/tokens'
import { 
  FileText,
  Plus,
  Eye,
  Pencil,
  X,
  Trash2,
  CheckCircle,
  Activity,
  GitCompare,
  Copy,
  User,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { IntensiveCompletionBanner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'

interface ProfileData {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  version_number?: number // Calculated, not stored
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
  
  // Fresh profile dialog state
  const [showFreshProfileDialog, setShowFreshProfileDialog] = useState(false)
  const [isCreatingFresh, setIsCreatingFresh] = useState(false)
  
  // Intensive mode state
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
    checkIntensiveMode()
  }, [])

  const checkIntensiveMode = async () => {
    try {
      // Use centralized intensive check (source of truth: intensive_checklist.status)
      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIsIntensiveMode(true)
        
        // Check if profile step is already completed (data is already in intensiveData)
        if (intensiveData.profile_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(intensiveData.profile_completed_at || intensiveData.created_at)
        }
      }
    } catch (error) {
      console.error('Error checking intensive mode:', error)
    }
  }

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/profile?t=${timestamp}&includeVersions=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      
      // Check if profile exists and has an ID (empty object {} would be truthy but invalid)
      // data.profile contains the full active profile data from the API
      const validProfile = data.profile && data.profile.id ? data.profile : null
      setActiveProfile(validProfile)
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

      // Create new draft version (version_number is calculated, not stored)
      const { id, created_at, updated_at, version_number, ...versionData } = sourceVersion
      const newVersionData = {
        ...versionData,
        user_id: user.id,
        is_draft: true,
        is_active: false,
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

  const handleCreateFirstProfile = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please log in to create a profile')
        return
      }
      
      // Get user account data to pre-fill profile
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, profile_picture_url')
        .eq('id', user.id)
        .single()
      
      // Create new profile with just user_id (other fields come from user_accounts)
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating profile:', error)
        alert('Failed to create profile: ' + (error.message || 'Unknown error'))
        return
      }
      
      if (!newProfile) {
        alert('Failed to create profile - no data returned.')
        return
      }
      
      router.push(`/profile/${newProfile.id}/edit`)
    } catch (error) {
      console.error('Error creating first profile:', error)
      alert('Failed to create profile')
    }
  }

  const handleCreateFreshProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please log in to create a profile')
        return
      }
      
      // Check if a draft already exists
      const { data: existingDraft } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (existingDraft) {
        // Show override dialog
        setShowFreshProfileDialog(true)
        return
      }

      // No existing draft, proceed with creation
      await performCreateFreshProfile()
    } catch (error) {
      console.error('Error checking for drafts:', error)
      alert('Failed to check for existing drafts. Please try again.')
    }
  }

  const performCreateFreshProfile = async () => {
    setIsCreatingFresh(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please log in to create a profile')
        setIsCreatingFresh(false)
        return
      }
      
      // Delete any existing drafts first (only one draft at a time)
      const { data: existingDrafts, error: findError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      if (findError) {
        console.error('Error finding existing drafts:', findError)
      }

      // Delete each draft individually
      if (existingDrafts && existingDrafts.length > 0) {
        console.log(`Found ${existingDrafts.length} existing draft(s) to delete`)
        for (const draft of existingDrafts) {
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', draft.id)
            .eq('user_id', user.id)

          if (deleteError) {
            console.error(`Failed to delete draft ${draft.id}:`, deleteError)
          } else {
            console.log(`Deleted draft ${draft.id}`)
          }
        }
      }
      
      // Create a brand new profile from scratch as a draft
      // Note: Database trigger auto-sets parent_id, so we need to clear it after insert
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          is_draft: true,
          is_active: false
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating fresh profile:', error)
        alert('Failed to create profile: ' + (error.message || 'Unknown error'))
        setIsCreatingFresh(false)
        return
      }
      
      if (!newProfile) {
        alert('Failed to create profile - no data returned.')
        setIsCreatingFresh(false)
        return
      }

      // IMPORTANT: Clear the parent_id that the database trigger auto-set
      // This ensures the draft page treats this as a fresh profile with no change tracking
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ parent_id: null })
        .eq('id', newProfile.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error clearing parent_id:', updateError)
        // Continue anyway - the profile was created, just might have change tracking
      }
      
      // Navigate to draft page
      router.push(`/profile/${newProfile.id}/draft`)
      // Don't set isCreatingFresh(false) - keep loading overlay visible during navigation
    } catch (error) {
      console.error('Error creating fresh profile:', error)
      alert('Failed to create profile')
      setIsCreatingFresh(false)
    }
  }

  const confirmCreateFreshProfile = async () => {
    // Set loading state BEFORE dismissing dialog to prevent flash
    setIsCreatingFresh(true)
    setShowFreshProfileDialog(false)
    await performCreateFreshProfile()
  }

  const profileCount = versions.length
  const completedProfiles = versions.filter(v => !v.is_draft && v.is_active).length

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
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
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner - Shows above PageHero when step is already complete in intensive mode */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Create Profile"
            completedAt={completedAt}
          />
        )}

        {/* Page Hero - Always shows, with intensive eyebrow when in intensive mode */}
        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE • STEP 3 OF 14" : "PROFILE"}
          title="All Profiles"
          subtitle="View all of your Profile versions below."
        >
          {/* Action buttons - only when NOT in intensive mode */}
          {!isIntensiveMode && (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                onClick={() => router.push('/profile/new')}
                variant="outline"
                size="md"
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                How It Works
              </Button>
              {activeProfile && (
                <Button
                  onClick={handleCreateFreshProfile}
                  variant="outline"
                  size="md"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Start New Profile
                </Button>
              )}
            </div>
          )}
        </PageHero>

        {/* Stats Cards */}
        {activeProfile && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
        )}

        {/* All Versions List */}
        {activeProfile && versions.length > 0 && (
          <Card className="p-6">
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
                          <>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                router.push(`/profile/${version.id}`)
                              }}
                              variant="ghost-yellow"
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2 font-semibold"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
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
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Clone button for non-draft versions - Hidden in intensive mode */}
                            {!isIntensiveMode && (
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
                            )}
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
        )}

        {/* No Profile State */}
        {!activeProfile && (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No profile yet</h3>
              <p className="text-neutral-400 mb-6 md:mb-8">
                Start by creating your first profile. Define your personal information and preferences.
              </p>
              <Button size="lg" onClick={handleCreateFirstProfile}>
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Profile
              </Button>
            </Card>
          </div>
        )}
      </Stack>

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

      {/* Fresh Profile Override Dialog */}
      {showFreshProfileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Override Existing Draft?
              </h3>
              <button
                onClick={() => setShowFreshProfileDialog(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-400 mb-6">
              Only one draft at a time. Starting a new profile will delete your existing draft. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFreshProfileDialog(false)}
                disabled={isCreatingFresh}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmCreateFreshProfile}
                disabled={isCreatingFresh}
                className="flex-1 gap-2"
              >
                {isCreatingFresh ? (
                  <>
                    <Spinner variant="primary" size="sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Fresh
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Fresh Profile Loading Overlay */}
      {isCreatingFresh && !showFreshProfileDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <div className="text-center py-8">
              <Spinner variant="primary" size="lg" className="mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Creating Fresh Profile
              </h3>
              <p className="text-neutral-400">
                Setting up your new profile...
              </p>
            </div>
          </Card>
        </div>
      )}
    </Container>
  )
}
