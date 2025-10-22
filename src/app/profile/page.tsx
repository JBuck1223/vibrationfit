'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Badge } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { ProfileField } from './components/ProfileField'
import { SavedRecordings } from '@/components/SavedRecordings'
import { 
  User, 
  Heart, 
  Users, 
  Activity, 
  MapPin, 
  Briefcase, 
  DollarSign,
  Edit3,
  FileText,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Camera,
  Clock,
  Home,
  Building,
  GraduationCap,
  Star,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react'
import NextImage from 'next/image'

interface ProfileViewPageProps {}

export default function ProfileViewPage({}: ProfileViewPageProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [isViewingVersion, setIsViewingVersion] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    fetchProfile()
  }, [])

  // Refresh profile when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProfile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Check for version parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const versionId = urlParams.get('versionId')
    if (versionId) {
      setCurrentVersionId(versionId)
      // We'll determine if this is actually the current version after we fetch versions
      fetchProfileVersion(versionId)
    } else {
      setCurrentVersionId(null)
      setIsViewingVersion(false)
    }
  }, [])

  // Update version viewing state when versions data is available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const versionId = urlParams.get('versionId')
    
    if (!versionId) {
      // No versionId in URL = viewing current version
      setIsViewingVersion(false)
      setCurrentVersionId(null)
    } else if (versions.length > 0) {
      // Check if the versionId matches the latest version (which is the current)
      const latestVersion = versions[0] // versions are ordered by version_number desc
      if (versionId === latestVersion?.id) {
        // This is actually the current version, even though it has a versionId
        setIsViewingVersion(false)
        setCurrentVersionId(versionId) // Keep the versionId so version info card shows
        // Don't clean up the URL - let user see version info even for current version
      } else {
        // This is a historical version
        setIsViewingVersion(true)
        setCurrentVersionId(versionId)
      }
    }
  }, [versions])

  const fetchProfile = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = Date.now()
      const response = await fetch(`/api/profile?t=${timestamp}&includeVersions=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      console.log('Profile view: Fetched data:', data)
      console.log('Profile view: Versions received:', data.versions?.length || 0)
      setProfile(data.profile || {})
      setCompletionPercentage(data.completionPercentage || 0)
      setVersions(data.versions || [])
      
      // Get user ID from Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const deleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return
    }

    setDeletingVersion(versionId)
    try {
      const response = await fetch(`/api/profile?versionId=${versionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete version')
      }

      // Refresh the profile to get updated versions list
      await fetchProfile()
    } catch (error) {
      console.error('Error deleting version:', error)
      alert('Failed to delete version. Please try again.')
    } finally {
      setDeletingVersion(null)
    }
  }

  const fetchProfileVersion = async (versionId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/profile?versionId=${versionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile version')
      }
      const data = await response.json()
      setProfile(data.profile || {})
      setCompletionPercentage(data.completionPercentage || 0)
      setCurrentVersionId(versionId)
      setIsViewingVersion(true)
    } catch (error) {
      console.error('Error fetching profile version:', error)
      setError('Failed to load profile version')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldSave = async (fieldKey: string, newValue: any) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [fieldKey]: newValue,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        [fieldKey]: newValue,
      }))
      
      // Update completion percentage if returned
      if (data.completionPercentage !== undefined) {
        setCompletionPercentage(data.completionPercentage)
      }

      // Optionally refresh the full profile to ensure consistency
      await fetchProfile()
    } catch (error) {
      console.error('Error saving field:', error)
      throw error // Re-throw so the ProfileField component can handle it
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Not specified'
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateOfBirth.split('T')[0].split('-')
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years old`
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400'
    if (percentage >= 60) return 'text-yellow-400'
    if (percentage >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCompletionBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getCurrentVersionInfo = () => {
    if (!isViewingVersion || !currentVersionId) return null
    return versions.find(v => v.id === currentVersionId)
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextMedia = () => {
    if (profile.progress_photos) {
      setLightboxIndex((prev) => (prev + 1) % profile.progress_photos!.length)
    }
  }

  const prevMedia = () => {
    if (profile.progress_photos) {
      setLightboxIndex((prev) => (prev - 1 + profile.progress_photos!.length) % profile.progress_photos!.length)
    }
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|quicktime)$/i.test(url) || url.includes('video/')
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          prevMedia()
          break
        case 'ArrowRight':
          nextMedia()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading your profile...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <User className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Error</h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <Button onClick={fetchProfile} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          {/* Mobile Header */}
          <div className="md:hidden space-y-4 mb-6">
            {/* Title and Badge */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">My Profile</h1>
                {isViewingVersion && getCurrentVersionInfo() && (
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      Version {getCurrentVersionInfo()?.version_number}
                    </Badge>
                    {getCurrentVersionInfo()?.is_draft && (
                      <Badge variant="warning">
                        Draft
                      </Badge>
                    )}
                  </div>
                )}
                {!isViewingVersion && (
                  <Badge variant="success">
                    Current Version
                  </Badge>
                )}
              </div>
              <p className="text-neutral-400 text-sm">
                {isViewingVersion 
                  ? `Viewing saved version from ${getCurrentVersionInfo() ? new Date(getCurrentVersionInfo().created_at).toLocaleDateString() : ''}`
                  : 'This is your current active profile.'
                }
              </p>
            </div>

            {/* Action Buttons - Stacked */}
            <div className="space-y-2">
              {isViewingVersion && currentVersionId ? (
                <Button
                  onClick={() => {
                    setCurrentVersionId(null)
                    setIsViewingVersion(false)
                    window.history.pushState({}, '', '/profile')
                    fetchProfile()
                  }}
                  variant="primary"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Current
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/profile/edit')}
                  variant="primary"
                  className="w-full"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowVersions(!showVersions)}
                  variant="outline"
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-1" />
                  {showVersions ? 'Hide' : 'Show'} Versions
                </Button>
                <Button
                  onClick={() => router.push('/profile/new')}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Version
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                {isViewingVersion && getCurrentVersionInfo() && (
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      Version {getCurrentVersionInfo()?.version_number}
                    </Badge>
                    {getCurrentVersionInfo()?.is_draft && (
                      <Badge variant="warning">
                        Draft
                      </Badge>
                    )}
                  </div>
                )}
                {!isViewingVersion && (
                  <Badge variant="success">
                    Current Version
                  </Badge>
                )}
              </div>
              <p className="text-neutral-400">
                {isViewingVersion 
                  ? `Viewing saved version from ${getCurrentVersionInfo() ? new Date(getCurrentVersionInfo().created_at).toLocaleDateString() : ''}`
                  : 'Complete overview of your current personal information'
                }
              </p>
            </div>
            {isViewingVersion && currentVersionId ? (
              <Button
                onClick={() => {
                  setCurrentVersionId(null)
                  setIsViewingVersion(false)
                  window.history.pushState({}, '', '/profile')
                  fetchProfile()
                }}
                variant="primary"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Current
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/profile/edit')}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
            <Button
              onClick={() => setShowVersions(!showVersions)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              {showVersions ? 'Hide' : 'Show'} Versions
            </Button>
            <Button
              onClick={() => router.push('/profile/new')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Version
            </Button>
          </div>

        </div>

        {/* Main Content */}
        <div>
          {/* Versions List */}
          {showVersions && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Versions</h2>
              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 mb-2">No saved versions yet</p>
                  <p className="text-sm text-neutral-500">Create your first version to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <Card key={version.id} variant="outlined" className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        {/* Version Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">
                              Version {version.version_number}
                            </h3>
                            {version.is_draft && (
                              <Badge variant="warning">
                                Draft
                              </Badge>
                            )}
                            <Badge variant="success" className="px-1 text-xs">
                              {version.completion_percentage}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-neutral-400">
                            <p>
                              <span className="font-medium">Created:</span> {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                            <p className="text-xs text-neutral-500 font-mono">
                              ID: {version.id}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row gap-2 md:w-auto w-full">
                          <Button
                            onClick={() => window.location.href = `/profile?versionId=${version.id}`}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 flex-1 md:flex-none"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            onClick={() => deleteVersion(version.id)}
                            variant="danger"
                            size="sm"
                            className="flex items-center gap-2 flex-1 md:flex-none"
                            disabled={deletingVersion === version.id}
                          >
                            {deletingVersion === version.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Profile Completion & Version Info */}
        <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Profile Completion</h2>
                {isViewingVersion && getCurrentVersionInfo() && (
                  <p className="text-sm text-neutral-400 mt-1">
                    Version {getCurrentVersionInfo()?.version_number} • Saved on {new Date(getCurrentVersionInfo()?.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className={`text-2xl font-bold ${getCompletionColor(completionPercentage)}`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getCompletionBg(completionPercentage)}`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-neutral-400 mt-2">
              {completionPercentage >= 80 
                ? "Excellent! Your profile is well-completed." 
                : completionPercentage >= 60 
                ? "Good progress! A few more details would be helpful."
                : "Keep going! Complete more sections to unlock your full potential."
              }
            </p>

            {/* Current Version Information */}
            {!currentVersionId && versions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-green-500" />
                  Current Version Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-400">Version ID:</span>
                    <span className="font-mono text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                      {versions[0]?.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-400">Last Updated:</span>
                    <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                      <div className="text-xs md:text-sm">
                        <p className="text-white font-medium">
                          {versions[0]?.created_at 
                            ? `${new Date(versions[0].created_at).toLocaleDateString()} at ${new Date(versions[0].created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                            : 'Date not available'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

        {/* Version Information */}
        {(() => {
          const urlVersionId = new URLSearchParams(window.location.search).get('versionId')
          return urlVersionId && (getCurrentVersionInfo() || urlVersionId)
        })() && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Version Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Version ID:</span>
                <span className="font-mono text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                  {getCurrentVersionInfo()?.id || new URLSearchParams(window.location.search).get('versionId')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Submitted:</span>
                <span className="text-sm text-white">
                  {getCurrentVersionInfo()?.created_at 
                    ? `${new Date(getCurrentVersionInfo().created_at).toLocaleDateString()} at ${new Date(getCurrentVersionInfo().created_at).toLocaleTimeString()}`
                    : 'Date not available'
                  }
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Picture and Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Picture */}
          <Card className="p-6 text-center">
            <div className="relative inline-block mb-4">
              {profile.profile_picture_url ? (
                <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-4 border-primary-500/20">
                  <NextImage
                    src={profile.profile_picture_url}
                    alt="Profile picture"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 border-4 border-primary-500/20 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {profile.first_name && profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`
                : 'Your Name'
              }
            </h3>
            {userId && (
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                ID: {userId}
              </p>
            )}
            <Button
              onClick={() => router.push('/profile/edit')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Update Photo
            </Button>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2 space-y-4">
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Email</p>
                    <p className="text-white font-medium">
                      {profile.email || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Date of Birth</p>
                    <p className="text-white font-medium">
                      {profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Age</p>
                    <p className="text-white font-medium">
                      {profile.date_of_birth ? formatAge(profile.date_of_birth) : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Gender</p>
                    <p className="text-white font-medium">
                      {profile.gender || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Phone</p>
                    <p className="text-white font-medium">
                      {profile.phone || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Ethnicity</p>
                    <p className="text-white font-medium">
                      {profile.ethnicity || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Relationship */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-500" />
              Romance & Partnership
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Status" 
                value={profile.relationship_status}
                editable={!isViewingVersion}
                fieldKey="relationship_status"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Single', label: 'Single' },
                  { value: 'Dating', label: 'Dating' },
                  { value: 'In a Relationship', label: 'In a Relationship' },
                  { value: 'Engaged', label: 'Engaged' },
                  { value: 'Married', label: 'Married' },
                  { value: 'Separated', label: 'Separated' },
                  { value: 'Divorced', label: 'Divorced' },
                  { value: 'Widowed', label: 'Widowed' },
                ]}
              />
              <ProfileField 
                label="Partner" 
                value={profile.partner_name}
                editable={!isViewingVersion}
                fieldKey="partner_name"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Relationship Length" 
                value={profile.relationship_length}
                editable={!isViewingVersion}
                fieldKey="relationship_length"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Less than 1 year', label: 'Less than 1 year' },
                  { value: '1-2 years', label: '1-2 years' },
                  { value: '3-5 years', label: '3-5 years' },
                  { value: '6-10 years', label: '6-10 years' },
                  { value: '10+ years', label: '10+ years' },
                ]}
              />
              <ProfileField 
                label="My Current Story Around Romance & Partnership" 
                value={profile.romance_partnership_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="romance_partnership_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="romance_partnership"
              />
            </div>
          </Card>

          {/* Family */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Family & Parenting
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Has Children" 
                value={profile.has_children} 
                type="boolean"
                editable={!isViewingVersion}
                fieldKey="has_children"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Number of Children" 
                value={profile.number_of_children}
                type="number"
                editable={!isViewingVersion}
                fieldKey="number_of_children"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Children's Ages" 
                value={profile.children_ages} 
                type="array"
                editable={!isViewingVersion}
                fieldKey="children_ages"
                onSave={handleFieldSave}
                placeholder="Add child's age (e.g., 5, 12, 16)"
              />
              <ProfileField 
                label="My Current Story Around Family & Parenting" 
                value={profile.family_parenting_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="family_parenting_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="family_parenting"
              />
            </div>
          </Card>

          {/* Health */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              Health & Vitality
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Height" 
                value={profile.height ? `${profile.height} ${profile.units === 'US' ? 'inches' : 'cm'}` : null}
                editable={!isViewingVersion}
                fieldKey="height"
                onSave={handleFieldSave}
                type="number"
              />
              <ProfileField 
                label="Weight" 
                value={profile.weight ? `${profile.weight} ${profile.units === 'US' ? 'lbs' : 'kg'}` : null}
                editable={!isViewingVersion}
                fieldKey="weight"
                onSave={handleFieldSave}
                type="number"
              />
              <ProfileField 
                label="Units" 
                value={profile.units}
                editable={!isViewingVersion}
                fieldKey="units"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'US', label: 'US (inches, lbs)' },
                  { value: 'Metric', label: 'Metric (cm, kg)' },
                ]}
              />
              <ProfileField 
                label="Exercise Frequency" 
                value={profile.exercise_frequency}
                editable={!isViewingVersion}
                fieldKey="exercise_frequency"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Never', label: 'Never' },
                  { value: '1-2 times per week', label: '1-2 times per week' },
                  { value: '3-4 times per week', label: '3-4 times per week' },
                  { value: '5+ times per week', label: '5+ times per week' },
                  { value: 'Daily', label: 'Daily' },
                ]}
              />
              <ProfileField 
                label="My Current Story Around Health & Vitality" 
                value={profile.health_vitality_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="health_vitality_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="health_vitality"
              />
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-primary-500" />
              Home & Environment
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Living Situation" 
                value={profile.living_situation}
                editable={!isViewingVersion}
                fieldKey="living_situation"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Own', label: 'Own' },
                  { value: 'Rent', label: 'Rent' },
                  { value: 'Living with family', label: 'Living with family' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <ProfileField 
                label="Time at Location" 
                value={profile.time_at_location}
                editable={!isViewingVersion}
                fieldKey="time_at_location"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Less than 1 year', label: 'Less than 1 year' },
                  { value: '1-2 years', label: '1-2 years' },
                  { value: '3-5 years', label: '3-5 years' },
                  { value: '6-10 years', label: '6-10 years' },
                  { value: '10+ years', label: '10+ years' },
                ]}
              />
              <ProfileField 
                label="City" 
                value={profile.city}
                editable={!isViewingVersion}
                fieldKey="city"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="State" 
                value={profile.state}
                editable={!isViewingVersion}
                fieldKey="state"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Postal Code" 
                value={profile.postal_code}
                editable={!isViewingVersion}
                fieldKey="postal_code"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Country" 
                value={profile.country}
                editable={!isViewingVersion}
                fieldKey="country"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="My Current Story Around Home & Environment" 
                value={profile.home_environment_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="home_environment_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="home_environment"
              />
            </div>
          </Card>

          {/* Career */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-500" />
              Career & Work
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Employment Type" 
                value={profile.employment_type}
                editable={!isViewingVersion}
                fieldKey="employment_type"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Self-employed', label: 'Self-employed' },
                  { value: 'Business Owner', label: 'Business Owner' },
                  { value: 'Freelance', label: 'Freelance' },
                  { value: 'Unemployed', label: 'Unemployed' },
                  { value: 'Retired', label: 'Retired' },
                  { value: 'Student', label: 'Student' },
                ]}
              />
              <ProfileField 
                label="Occupation" 
                value={profile.occupation}
                editable={!isViewingVersion}
                fieldKey="occupation"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Company" 
                value={profile.company}
                editable={!isViewingVersion}
                fieldKey="company"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Time in Role" 
                value={profile.time_in_role}
                editable={!isViewingVersion}
                fieldKey="time_in_role"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Less than 1 year', label: 'Less than 1 year' },
                  { value: '1-2 years', label: '1-2 years' },
                  { value: '3-5 years', label: '3-5 years' },
                  { value: '5-10 years', label: '5-10 years' },
                  { value: '10+ years', label: '10+ years' },
                ]}
              />
              <ProfileField 
                label="My Current Story Around Career & Work" 
                value={profile.career_work_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="career_work_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="career_work"
              />
            </div>
          </Card>

          {/* Financial */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              Money & Wealth
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Currency" 
                value={profile.currency}
                editable={!isViewingVersion}
                fieldKey="currency"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'CAD', label: 'CAD ($)' },
                  { value: 'AUD', label: 'AUD ($)' },
                ]}
              />
              <ProfileField 
                label="Household Income" 
                value={profile.household_income}
                editable={!isViewingVersion}
                fieldKey="household_income"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Under 25,000', label: 'Under $25,000' },
                  { value: '25,000-49,999', label: '$25,000-$49,999' },
                  { value: '50,000-74,999', label: '$50,000-$74,999' },
                  { value: '75,000-99,999', label: '$75,000-$99,999' },
                  { value: '100,000-249,999', label: '$100,000-$249,999' },
                  { value: '250,000-499,999', label: '$250,000-$499,999' },
                  { value: '500,000+', label: '$500,000+' },
                ]}
              />
              <ProfileField 
                label="Savings & Retirement" 
                value={profile.savings_retirement}
                editable={!isViewingVersion}
                fieldKey="savings_retirement"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Under 10,000', label: 'Under $10,000' },
                  { value: '10,000-24,999', label: '$10,000-$24,999' },
                  { value: '25,000-49,999', label: '$25,000-$49,999' },
                  { value: '50,000-99,999', label: '$50,000-$99,999' },
                  { value: '100,000-249,999', label: '$100,000-$249,999' },
                  { value: '250,000-499,999', label: '$250,000-$499,999' },
                  { value: '500,000+', label: '$500,000+' },
                ]}
              />
              <ProfileField 
                label="Assets & Equity" 
                value={profile.assets_equity}
                editable={!isViewingVersion}
                fieldKey="assets_equity"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'Under 10,000', label: 'Under $10,000' },
                  { value: '10,000-24,999', label: '$10,000-$24,999' },
                  { value: '25,000-49,999', label: '$25,000-$49,999' },
                  { value: '50,000-99,999', label: '$50,000-$99,999' },
                  { value: '100,000-249,999', label: '$100,000-$249,999' },
                  { value: '250,000-499,999', label: '$250,000-$499,999' },
                  { value: '500,000+', label: '$500,000+' },
                ]}
              />
              <ProfileField 
                label="Consumer Debt" 
                value={profile.consumer_debt}
                editable={!isViewingVersion}
                fieldKey="consumer_debt"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'None', label: 'None' },
                  { value: 'Under 10,000', label: 'Under $10,000' },
                  { value: '10,000-24,999', label: '$10,000-$24,999' },
                  { value: '25,000-49,999', label: '$25,000-$49,999' },
                  { value: '50,000+', label: '$50,000+' },
                ]}
              />
              <ProfileField 
                label="My Current Story Around Money & Wealth" 
                value={profile.money_wealth_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="money_wealth_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="money_wealth"
              />
            </div>
          </Card>

          {/* Fun & Recreation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-accent-500" />
              Fun & Recreation
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Current Hobbies" 
                value={profile.hobbies} 
                type="array"
                editable={!isViewingVersion}
                fieldKey="hobbies"
                onSave={handleFieldSave}
                placeholder="Add a hobby"
              />
              <ProfileField 
                label="Leisure Time Per Week" 
                value={profile.leisure_time_weekly}
                editable={!isViewingVersion}
                fieldKey="leisure_time_weekly"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: '0-5 hours', label: '0-5 hours' },
                  { value: '6-15 hours', label: '6-15 hours' },
                  { value: '16-25 hours', label: '16-25 hours' },
                  { value: '25+ hours', label: '25+ hours' },
                ]}
              />
              <ProfileField 
                label="My Current Story Around Fun & Recreation" 
                value={profile.fun_recreation_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="fun_recreation_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="fun_recreation"
              />
            </div>
          </Card>

          {/* Travel & Adventure */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary-500" />
              Travel & Adventure
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Travel Frequency" 
                value={profile.travel_frequency}
                editable={!isViewingVersion}
                fieldKey="travel_frequency"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'never', label: 'Never' },
                  { value: 'yearly', label: 'Yearly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
              <ProfileField 
                label="Has Valid Passport" 
                value={profile.passport} 
                type="boolean"
                editable={!isViewingVersion}
                fieldKey="passport"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="Countries Visited" 
                value={profile.countries_visited}
                type="number"
                editable={!isViewingVersion}
                fieldKey="countries_visited"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="My Current Story Around Travel & Adventure" 
                value={profile.travel_adventure_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="travel_adventure_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="travel_adventure"
              />
            </div>
          </Card>

          {/* Social & Friends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-500" />
              Social & Friends
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Close Friends Count" 
                value={profile.close_friends_count}
                editable={!isViewingVersion}
                fieldKey="close_friends_count"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: '0', label: '0' },
                  { value: '1-3', label: '1-3' },
                  { value: '4-8', label: '4-8' },
                  { value: '9+', label: '9+' },
                ]}
              />
              <ProfileField 
                label="Social Preference" 
                value={profile.social_preference}
                editable={!isViewingVersion}
                fieldKey="social_preference"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'introvert', label: 'Introvert' },
                  { value: 'ambivert', label: 'Ambivert' },
                  { value: 'extrovert', label: 'Extrovert' },
                ]}
              />
              <ProfileField 
                label="My Current Story Around Social & Friends" 
                value={profile.social_friends_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="social_friends_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="social_friends"
              />
            </div>
          </Card>

          {/* Possessions & Lifestyle */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary-500" />
              Possessions & Lifestyle
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Lifestyle Category" 
                value={profile.lifestyle_category}
                editable={!isViewingVersion}
                fieldKey="lifestyle_category"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'minimalist', label: 'Minimalist' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'luxury', label: 'Luxury' },
                ]}
              />
              <ProfileField 
                label="Primary Vehicle" 
                value={profile.primary_vehicle}
                editable={!isViewingVersion}
                fieldKey="primary_vehicle"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="My Current Story Around Possessions & Lifestyle" 
                value={profile.possessions_lifestyle_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="possessions_lifestyle_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="possessions_lifestyle"
              />
            </div>
          </Card>

          {/* Spirituality & Growth */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent-500" />
              Spirituality & Growth
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Spiritual Practice" 
                value={profile.spiritual_practice}
                editable={!isViewingVersion}
                fieldKey="spiritual_practice"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'none', label: 'None' },
                  { value: 'religious', label: 'Religious' },
                  { value: 'spiritual', label: 'Spiritual' },
                  { value: 'secular', label: 'Secular' },
                ]}
              />
              <ProfileField 
                label="Meditation Frequency" 
                value={profile.meditation_frequency}
                editable={!isViewingVersion}
                fieldKey="meditation_frequency"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'never', label: 'Never' },
                  { value: 'rarely', label: 'Rarely' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'daily', label: 'Daily' },
                ]}
              />
              <ProfileField 
                label="Personal Growth Focus" 
                value={profile.personal_growth_focus} 
                type="boolean"
                editable={!isViewingVersion}
                fieldKey="personal_growth_focus"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="My Current Story Around Spirituality & Growth" 
                value={profile.spirituality_growth_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="spirituality_growth_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="spirituality_growth"
              />
            </div>
          </Card>

          {/* Giving & Legacy */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-secondary-500" />
              Giving & Legacy
            </h3>
            <div className="space-y-3">
              <ProfileField 
                label="Volunteer Status" 
                value={profile.volunteer_status}
                editable={!isViewingVersion}
                fieldKey="volunteer_status"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'none', label: 'None' },
                  { value: 'occasional', label: 'Occasional' },
                  { value: 'regular', label: 'Regular' },
                  { value: 'frequent', label: 'Frequent' },
                ]}
              />
              <ProfileField 
                label="Annual Charitable Giving" 
                value={profile.charitable_giving}
                editable={!isViewingVersion}
                fieldKey="charitable_giving"
                onSave={handleFieldSave}
                type="select"
                selectOptions={[
                  { value: 'none', label: 'None' },
                  { value: '<500', label: 'Under $500' },
                  { value: '500-2000', label: '$500-$2,000' },
                  { value: '2000+', label: '$2,000+' },
                ]}
              />
              <ProfileField 
                label="Legacy Mindset" 
                value={profile.legacy_mindset} 
                type="boolean"
                editable={!isViewingVersion}
                fieldKey="legacy_mindset"
                onSave={handleFieldSave}
              />
              <ProfileField 
                label="My Current Story Around Giving & Legacy" 
                value={profile.giving_legacy_story}
                type="story"
                editable={!isViewingVersion}
                fieldKey="giving_legacy_story"
                onSave={handleFieldSave}
              />
              
              {/* Saved Recordings */}
              <SavedRecordings
                recordings={profile.story_recordings || []}
                categoryFilter="giving_legacy"
              />
            </div>
          </Card>

          {/* Version Notes */}
          {profile.version_notes && (
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Version Notes
              </h3>
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">{profile.version_notes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Media */}
        <div className="mt-8">
          {profile.progress_photos && profile.progress_photos.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-500" />
                Media
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.progress_photos.map((media, index) => (
                  <div key={index} className="relative group">
                    {isVideo(media) ? (
                      <div className="relative">
                        <video
                          src={media}
                          className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                          onClick={() => openLightbox(index)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media}
                        alt={`Media ${index + 1}`}
                        className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                        onClick={() => openLightbox(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-neutral-400 mt-3">
                {profile.progress_photos.length} media file{profile.progress_photos.length !== 1 ? 's' : ''} • Click to view in lightbox
              </p>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/profile/edit')}
            variant="primary"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span className="sm:hidden">Edit</span>
            <span className="hidden sm:inline">Edit Profile</span>
          </Button>
          <Button
            onClick={() => router.push('/profile/new')}
            variant="secondary"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">New Version</span>
            <span className="hidden sm:inline">Create New Version</span>
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="sm:hidden">Dashboard</span>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
        </div>

      {/* Lightbox */}
      {lightboxOpen && profile.progress_photos && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {profile.progress_photos.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content */}
            <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center">
              {isVideo(profile.progress_photos[lightboxIndex]) ? (
                <video
                  src={profile.progress_photos[lightboxIndex]}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={profile.progress_photos[lightboxIndex]}
                  alt={`Media ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Media Counter */}
            {profile.progress_photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} of {profile.progress_photos.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {profile.progress_photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                {profile.progress_photos.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === lightboxIndex ? 'border-primary-500' : 'border-neutral-600'
                    }`}
                  >
                    {isVideo(media) ? (
                      <div className="relative w-full h-full">
                        <video
                          src={media}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
