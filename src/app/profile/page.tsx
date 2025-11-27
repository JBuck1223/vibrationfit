'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, DeleteConfirmationDialog, Spinner, Container, Stack, Grid, Heading, Text, CreatedDateBadge, VersionBadge, StatusBadge } from '@/lib/design-system/components'
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
        {/* Page Hero */}
        <div className="mb-8">
          {/* Subtle Gradient Background */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
            {/* Modern Enhanced Layout with Card Container */}
            <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              
              <div className="relative z-10">
                {/* Eyebrow */}
                <div className="text-center mb-4">
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                    THE LIFE I CHOOSE
                  </div>
                </div>
                
                {/* Title Section */}
                <div className="text-center mb-4">
                  <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                    {activeProfile && activeProfile.first_name && activeProfile.last_name
                      ? `${activeProfile.first_name} ${activeProfile.last_name}`
                      : 'My Profile'}
                  </h1>
                </div>
                
                {/* Subtitle */}
                <div className="text-center mb-6">
                  <p className="text-xs md:text-lg text-neutral-300">
                    {activeProfile 
                      ? 'View and manage your profile versions below.'
                      : 'Create and manage your profile versions below.'}
                  </p>
                </div>

                {/* Centered Version Info with Enhanced Styling */}
                {activeProfile && (
                  <div className="text-center mb-6">
                    {/* Version, Status & Date Badges */}
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                      <VersionBadge 
                        versionNumber={activeProfile.version_number} 
                        status={activeProfile.is_active && !activeProfile.is_draft ? 'active' : activeProfile.is_draft ? 'draft' : 'complete'} 
                      />
                      <CreatedDateBadge createdAt={activeProfile.created_at} />
                      <StatusBadge 
                        status={activeProfile.is_active && !activeProfile.is_draft ? 'active' : activeProfile.is_draft ? 'draft' : 'complete'} 
                        subtle={!(activeProfile.is_active && !activeProfile.is_draft)} 
                      />
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
              </div>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{profileCount}</p>
                  <p className="text-xs text-neutral-400">Profiles</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completedProfiles}</p>
                  <p className="text-xs text-neutral-400">Active</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-accent-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completionPercentage}%</p>
                  <p className="text-xs text-neutral-400">Complete</p>
                </div>
              </div>
            </Card>
          </div>
          </Container>
        )}

        {/* All Versions List */}
        {activeProfile && versions.length > 0 && (
          <Container size="xl">
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
    </>
  )
}
