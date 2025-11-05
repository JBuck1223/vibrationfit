'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, DeleteConfirmationDialog, Spinner, Container, Stack, Grid, Heading, Text, CreatedDateBadge } from '@/lib/design-system/components'
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
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-white mb-3">
                {activeProfile.first_name && activeProfile.last_name
                  ? `${activeProfile.first_name} ${activeProfile.last_name}`
                  : 'My Profile'}
              </h2>
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  V{activeProfile.version_number}
                </span>
                {activeProfile.is_active && (
                  <Badge variant="success">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              
              {/* Metadata */}
              <CreatedDateBadge 
                createdAt={activeProfile.created_at} 
                className="mb-6"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full justify-center">
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
                  variant="primary"
                  size="sm"
                  className="text-xs md:text-sm w-full md:w-auto md:flex-1 flex items-center justify-center gap-2 font-semibold border-2"
                  style={{
                    backgroundColor: colors.energy.yellow[500],
                    color: '#000000',
                    borderColor: colors.energy.yellow[500]
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.energy.yellow[500]
                    e.currentTarget.style.borderColor = colors.energy.yellow[500]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.energy.yellow[500]
                    e.currentTarget.style.color = '#000000'
                    e.currentTarget.style.borderColor = colors.energy.yellow[500]
                  }}
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
          </div>
        )}

        {/* Stats Cards */}
        {activeProfile && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{profileCount}</p>
                <p className="text-sm text-neutral-400 mb-2">Profiles</p>
              </div>
            </Card>
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-secondary-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{completedProfiles}</p>
                <p className="text-sm text-neutral-400 mb-2">Active</p>
              </div>
            </Card>
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-accent-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{completionPercentage}%</p>
                <p className="text-sm text-neutral-400 mb-2">Complete</p>
              </div>
            </Card>
          </div>
        )}

        {/* All Versions List */}
        {activeProfile && versions.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Profile Versions</h2>
              <Badge variant="info">{versions.length} {versions.length === 1 ? 'Version' : 'Versions'}</Badge>
            </div>
            <div className="space-y-4">
              {versions.map((version) => {
                const isActive = version.id === activeProfile?.id && version.is_active
                
                return (
                  <VersionCard
                    key={version.id}
                    version={version}
                    actions={
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
                    }
                  />
                )
              })}
            </div>
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
