'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { 
  User, 
  Heart, 
  Users, 
  Activity, 
  MapPin, 
  Briefcase, 
  DollarSign,
  Edit3,
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
  History
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Not specified'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-neutral-400">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                {isViewingVersion && getCurrentVersionInfo() && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      Version {getCurrentVersionInfo()?.version_number}
                    </span>
                    {getCurrentVersionInfo()?.is_draft && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        Draft
                      </span>
                    )}
                  </div>
                )}
                {!isViewingVersion && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Current Version
                  </span>
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
              onClick={() => router.push('/profile/new')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Version
            </Button>
            <Button
              onClick={() => setShowVersions(!showVersions)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              {showVersions ? 'Hide' : 'Show'} Versions
            </Button>
            <Button
              onClick={fetchProfile}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Completion Progress */}
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
          </Card>

          {/* Versions List */}
          {showVersions && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Versions</h2>
              {versions.length === 0 ? (
                <p className="text-neutral-400">No saved versions yet.</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-white">
                            Version {version.version_number}
                          </span>
                          {version.is_draft && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              Draft
                            </span>
                          )}
                          <span className="text-sm text-neutral-400">
                            {version.completion_percentage}% complete
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-neutral-500">
                            <span className="font-mono">ID:</span> {version.id}
                          </p>
                          <p className="text-xs text-neutral-500">
                            <span className="font-medium">Submitted:</span> {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => window.location.href = `/profile?versionId=${version.id}`}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <Button
                          onClick={() => deleteVersion(version.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:border-red-400"
                          disabled={deletingVersion === version.id}
                        >
                          {deletingVersion === version.id ? (
                            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

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
            <p className="text-neutral-400 mb-2">
              {profile.email || 'your.email@example.com'}
            </p>
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
            {/* Version Information */}
            {(() => {
              const urlVersionId = new URLSearchParams(window.location.search).get('versionId')
              console.log('🔍 Version card debug:', {
                isViewingVersion,
                currentVersionId,
                urlVersionId,
                getCurrentVersionInfo: getCurrentVersionInfo(),
                versions: versions.length,
                shouldShowCard: urlVersionId && getCurrentVersionInfo()
              })
              return null
            })()}
            {(() => {
              const urlVersionId = new URLSearchParams(window.location.search).get('versionId')
              const versionInfo = getCurrentVersionInfo()
              return urlVersionId && (versionInfo || urlVersionId)
            })() && (
              <Card className="p-6">
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
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Name</p>
                    <p className="text-white font-medium">
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name} ${profile.last_name}` 
                        : profile.first_name || profile.last_name || 'Not specified'}
                    </p>
                  </div>
                </div>
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
                    <p className="text-sm text-neutral-400">Height</p>
                    <p className="text-white font-medium">
                      {profile.height ? `${profile.height} ${profile.units === 'US' ? 'inches' : 'cm'}` : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Weight</p>
                    <p className="text-white font-medium">
                      {profile.weight ? `${profile.weight} ${profile.units === 'US' ? 'lbs' : 'kg'}` : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Units</p>
                    <p className="text-white font-medium">
                      {profile.units || 'Not specified'}
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
              Relationship
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Status</p>
                <p className="text-white font-medium">
                  {profile.relationship_status || 'Not specified'}
                </p>
              </div>
              {profile.partner_name && (
                <div>
                  <p className="text-sm text-neutral-400">Partner</p>
                  <p className="text-white font-medium">{profile.partner_name}</p>
                </div>
              )}
              {profile.relationship_length && (
                <div>
                  <p className="text-sm text-neutral-400">Relationship Length</p>
                  <p className="text-white font-medium">{profile.relationship_length}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Family */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Family
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Has Children</p>
                <p className="text-white font-medium">
                  {profile.has_children === true ? 'Yes' : profile.has_children === false ? 'No' : 'Not specified'}
                </p>
              </div>
              {profile.has_children && profile.number_of_children && (
                <div>
                  <p className="text-sm text-neutral-400">Number of Children</p>
                  <p className="text-white font-medium">{profile.number_of_children}</p>
                </div>
              )}
              {profile.children_ages && profile.children_ages.length > 0 && (
                <div>
                  <p className="text-sm text-neutral-400">Children's Ages</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.children_ages.map((age, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm">
                        Child {index + 1}: {age} {age === '1' ? 'year' : 'years'} old
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Health */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              Health & Wellness
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Exercise Frequency</p>
                <p className="text-white font-medium">
                  {profile.exercise_frequency || 'Not specified'}
                </p>
              </div>
              {profile.health_conditions && (
                <div>
                  <p className="text-sm text-neutral-400">Health Conditions</p>
                  <p className="text-white font-medium">{profile.health_conditions}</p>
                </div>
              )}
              {profile.medications && (
                <div>
                  <p className="text-sm text-neutral-400">Medications</p>
                  <p className="text-white font-medium">{profile.medications}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Living Situation</p>
                <p className="text-white font-medium">
                  {profile.living_situation || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Time at Location</p>
                <p className="text-white font-medium">
                  {profile.time_at_location || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Address</p>
                <p className="text-white font-medium">
                  {[profile.city, profile.state, profile.postal_code, profile.country]
                    .filter(Boolean)
                    .join(', ') || 'Not specified'}
                </p>
              </div>
            </div>
          </Card>

          {/* Career */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-500" />
              Career
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Employment Type</p>
                <p className="text-white font-medium">
                  {profile.employment_type || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Occupation</p>
                <p className="text-white font-medium">
                  {profile.occupation || 'Not specified'}
                </p>
              </div>
              {profile.company && (
                <div>
                  <p className="text-sm text-neutral-400">Company</p>
                  <p className="text-white font-medium">{profile.company}</p>
                </div>
              )}
              {profile.time_in_role && (
                <div>
                  <p className="text-sm text-neutral-400">Time in Role</p>
                  <p className="text-white font-medium">{profile.time_in_role}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Financial */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              Financial
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Household Income</p>
                <p className="text-white font-medium">
                  {profile.household_income || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Savings & Retirement</p>
                <p className="text-white font-medium">
                  {profile.savings_retirement || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Assets & Equity</p>
                <p className="text-white font-medium">
                  {profile.assets_equity || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Consumer Debt</p>
                <p className="text-white font-medium">
                  {profile.consumer_debt || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Currency</p>
                <p className="text-white font-medium">
                  {profile.currency || 'Not specified'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/profile/edit')}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Button>
          <Button
            onClick={() => router.push('/profile/new')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Version
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
