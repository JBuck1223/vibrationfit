'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, DeleteConfirmationDialog, Spinner, Container, Stack, Grid, Heading, Text, CreatedDateBadge } from '@/lib/design-system/components'
import { VersionCard } from './components/VersionCard'
import { 
  Edit3,
  FileText,
  Plus,
  Eye,
  X,
  Trash2,
  CheckCircle,
  Activity,
  GitCompare
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

  const handleCreateDraft = async () => {
    if (hasActiveDraft && activeDraftId) {
      router.push(`/profile/${activeDraftId}/edit/draft`)
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
        router.push(`/profile/${existingDraft.id}/edit/draft`)
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
        router.push(`/profile/${data.version.id}/edit/draft`)
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
      <Container size="xl">
        {/* Create Button (only when no active profile) */}
        {!activeProfile && (
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
        )}

        {/* Current Profile Information */}
        {activeProfile && (
          <Card className="p-4 md:p-6 mb-6 md:mb-8">
            <Stack gap="md">
              {/* Profile Header */}
              <div className="text-center">
                <Heading level={2} className="text-white mb-3 text-4xl font-bold">
                  {activeProfile.first_name && activeProfile.last_name
                    ? `${activeProfile.first_name} ${activeProfile.last_name}`
                    : 'My Profile'}
                </Heading>
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 flex-wrap">
                  <span className="px-2 md:px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs md:text-sm font-medium">
                    V{activeProfile.version_number}
                  </span>
                  {activeProfile.is_active && (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                
                {/* Metadata */}
                <CreatedDateBadge 
                  createdAt={activeProfile.created_at} 
                  className="mb-4 md:mb-6"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full">
                <Button
                  onClick={() => router.push(`/profile/${activeProfile.id}`)}
                  variant="primary"
                  size="sm"
                  className="text-xs md:text-sm w-full md:w-auto md:flex-1 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Profile
                </Button>
                <Button
                  onClick={() => router.push('/profile/edit')}
                  variant="secondary"
                  size="sm"
                  className="text-xs md:text-sm w-full md:w-auto md:flex-1 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
                {hasActiveDraft && activeDraftId ? (
                  <Button
                    onClick={() => router.push(`/profile/${activeDraftId}/edit/draft`)}
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm w-full md:w-auto md:flex-1 flex items-center justify-center gap-2 border-2 border-[#FFFF00] text-[#FFFF00] hover:bg-[#FFFF00]/10 hover:border-[#FFFF00]"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Draft
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateDraft}
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm w-full md:w-auto md:flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Draft
                  </Button>
                )}
              </div>
            </Stack>
          </Card>
        )}

        {/* Stats Cards */}
        {activeProfile && (
          <Grid responsiveCols={{ mobile: 1, tablet: 3, desktop: 3 }} gap="md" className="mb-6 md:mb-8">
            <Card className="p-4 md:p-6 text-center">
              <Stack gap="sm" align="center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
                </div>
                <Text size="lg" className="text-white font-bold text-2xl md:text-3xl">{profileCount}</Text>
                <Text size="sm" className="text-neutral-400">Profiles</Text>
              </Stack>
            </Card>
            <Card className="p-4 md:p-6 text-center">
              <Stack gap="sm" align="center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-secondary-500" />
                </div>
                <Text size="lg" className="text-white font-bold text-2xl md:text-3xl">{completedProfiles}</Text>
                <Text size="sm" className="text-neutral-400">Active</Text>
              </Stack>
            </Card>
            <Card className="p-4 md:p-6 text-center">
              <Stack gap="sm" align="center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-accent-500" />
                </div>
                <Text size="lg" className="text-white font-bold text-2xl md:text-3xl">{completionPercentage}%</Text>
                <Text size="sm" className="text-neutral-400">Complete</Text>
              </Stack>
            </Card>
          </Grid>
        )}

        {/* All Versions List */}
        {activeProfile && versions.length > 0 && (
          <Card className="p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
              <Heading level={3} className="text-white text-lg md:text-xl">Profile Versions</Heading>
              <div className="flex items-center gap-3">
                {versions.length > 1 && (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      router.push('/profile/compare')
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare Any Two
                  </Button>
                )}
                <Badge variant="info">{versions.length} {versions.length === 1 ? 'Version' : 'Versions'}</Badge>
              </div>
            </div>
            <Stack gap="md">
              {versions.map((version) => {
                const isActive = version.id === activeProfile?.id && version.is_active
                
                return (
                  <VersionCard
                    key={version.id}
                    version={version}
                    actions={
                      <>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push(`/profile/${version.id}`)
                          }}
                          variant="primary"
                          size="sm"
                          className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteClick(version)
                          }}
                          variant="danger"
                          size="sm"
                          className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                          disabled={deletingVersion === version.id}
                        >
                          {deletingVersion === version.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    }
                  />
                )
              })}
            </Stack>
          </Card>
        )}

        {/* No Profile State */}
        {!activeProfile && (
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
        )}
      </Container>

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
    </>
  )
}
