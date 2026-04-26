'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Button, DeleteConfirmationDialog, Heading, Text, Stack, VersionBadge, StatusBadge, Container, PageHero, Spinner, IntensiveCompletionBanner } from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { VISION_CATEGORIES, getVisionCategory, getVisionCategoryLabel, convertCategoryKey, visionToRecordingKey } from '@/lib/design-system/vision-categories'
import { UserProfile } from '@/lib/supabase/profile'
import { SavedRecordings } from '@/components/SavedRecordings'
import { DEFAULT_PROFILE_IMAGE_URL } from '../components/ProfilePictureUpload'
import { formatPhoneDisplay, phoneToDigits } from '@/lib/phone-format'
import { Icon } from '@/lib/design-system/components'
import { useProfileStudio } from '@/components/profile-studio/ProfileStudioContext'
import { loadIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'
import { createClient } from '@/lib/supabase/client'
import { 
  User, 
  CalendarDays,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Trash2,
} from 'lucide-react'
import NextImage from 'next/image'
import { calculateProfileCompletion } from '@/lib/utils/profile-completion'

const getCategoryInfo = (categoryId: string) => {
  const visionCategoryKey = convertCategoryKey(categoryId as any, 'vision', 'vision')
  const category = getVisionCategory(visionCategoryKey || categoryId as any)
  
  if (category) {
    return {
      id: categoryId,
      title: category.label,
      icon: category.icon,
      color: 'text-primary-500',
      order: category.order,
      recordingCategory: visionToRecordingKey(categoryId as any)
    }
  }
  
  return {
    id: categoryId,
    title: categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: User,
    color: 'text-primary-500',
    order: 999,
    recordingCategory: categoryId
  }
}

const getOrderedProfileCategories = () => {
  const profileCategoryKeys = ['love', 'family', 'health', 'home', 'work', 'money', 'fun', 'travel', 'social', 'stuff', 'spirituality', 'giving']
  
  return profileCategoryKeys
    .map(categoryId => getCategoryInfo(categoryId))
    .sort((a, b) => a.order - b.order)
}

export default function ProfileDetailPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  // `versions` comes from ProfileStudioContext (provided by the profile layout).
  // Previously this page refetched /api/profile?includeVersions=true on every mount,
  // duplicating what the context already loads — causing 2-4 redundant network calls
  // per profile navigation.
  const { versions, refreshVersions } = useProfileStudio()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<any>(null)

  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    if (Object.keys(profile).length > 0) {
      const newPercentage = calculateProfileCompletion(profile)
      setCompletionPercentage(newPercentage)
    }
  }, [profile])

  useEffect(() => {
    // Use the cached intensive snapshot — this is populated once per session by
    // GlobalLayout, so the check below is usually synchronous and never hits the DB.
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user || cancelled) return
        const snap = await loadIntensiveSnapshot(session.user.id)
        if (cancelled || !snap?.intensive) return
        setIsIntensiveMode(true)
        if (snap.intensive.profile_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(snap.intensive.profile_completed_at || snap.intensive.created_at)
        }
      } catch (error) {
        console.error('Error checking intensive mode:', error)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (profileId) {
      fetchProfileVersion(profileId)
    }
  }, [profileId])

  const fetchProfileVersion = async (versionId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/profile?versionId=${versionId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to fetch profile version (${response.status})`)
      }
      const data = await response.json()
      setProfile(data.profile || {})
    } catch (error) {
      console.error('Error fetching profile version:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile version'
      setError(errorMessage)
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

      // Refresh the shared versions list in the studio context so the next
      // profile page doesn't render a stale cache entry for the deleted version.
      await refreshVersions()
      router.push('/profile')
    } catch (error) {
      console.error('Error deleting version:', error)
      throw error
    } finally {
      setDeletingVersion(null)
    }
  }

  const handleDeleteVersion = (version: any) => {
    setVersionToDelete(version)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteVersion = async () => {
    if (!versionToDelete) return
    
    try {
      await deleteVersion(versionToDelete.id)
      setDeleteDialogOpen(false)
      setVersionToDelete(null)
    } catch (error) {
      console.error('Error deleting version:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete version. Please try again.'
      alert(errorMessage)
    }
  }

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return null
    return formatPhoneDisplay(phoneToDigits(phone)) || phone
  }

  const formatDateOfBirth = (dateOfBirth: string | null | undefined) => {
    if (!dateOfBirth) return null
    const dateStr = dateOfBirth.split('T')[0]
    const [year, month, day] = dateStr.split('-')
    if (year && month && day) {
      return `${month}-${day}-${year}`
    }
    return dateOfBirth
  }

  const getCurrentVersionInfo = () => {
    if (!profileId) return null
    const versionInfo = versions.find(v => v.id === profileId)
    if (versionInfo) return versionInfo
    
    if (profile && profile.id === profileId) {
      const profileAny = profile as any
      return {
        id: profile.id,
        version_number: profileAny.version_number,
        is_draft: profileAny.is_draft,
        is_active: profileAny.is_active,
        // Fallback to empty string so the return type stays compatible with
        // ProfileVersion (whose created_at is a required string).
        created_at: profile.created_at ?? '',
        updated_at: profile.updated_at,
      }
    }
    
    return null
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

  // Read-only field renderer
  const renderField = (label: string, value: any) => {
    if (value === null || value === undefined || value === '') return null
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-neutral-500">{label}</span>
        <span className="text-sm text-neutral-300">{displayValue}</span>
      </div>
    )
  }

  const renderCategoryFields = (categoryId: string) => {
    switch (categoryId) {
      case 'love':
        return (
          <div className="space-y-3">
            {renderField('Status', profile.relationship_status)}
            {renderField('Partner', profile.partner_name)}
            {renderField('Relationship Length', profile.relationship_length)}
            {profile.state_love && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('love')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_love}</p>
              </div>
            )}
          </div>
        )
      
      case 'family':
        return (
          <div className="space-y-3">
            {renderField('Has Children', profile.has_children)}
            {Array.isArray(profile.children) && profile.children.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-500">Children</span>
                <div className="space-y-1">
                  {profile.children.map((child: any, index: number) => (
                    <div key={index} className="text-sm text-neutral-300">
                      {child.first_name || 'Unnamed'}{child.birthday ? ` (${new Date(child.birthday).toLocaleDateString()})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profile.state_family && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('family')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_family}</p>
              </div>
            )}
          </div>
        )
      
      case 'health':
        return (
          <div className="space-y-3">
            {renderField('Height', profile.height ? `${profile.height} ${profile.units === 'US' ? 'inches' : 'cm'}` : null)}
            {renderField('Weight', profile.weight ? `${profile.weight} ${profile.units === 'US' ? 'lbs' : 'kg'}` : null)}
            {renderField('Exercise Frequency', profile.exercise_frequency)}
            {profile.state_health && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('health')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_health}</p>
              </div>
            )}
          </div>
        )
      
      case 'home':
        return (
          <div className="space-y-3">
            {renderField('Living Situation', profile.living_situation)}
            {renderField('Time at Location', profile.time_at_location)}
            {renderField('City', profile.city)}
            {renderField('State', profile.state)}
            {renderField('Postal Code', profile.postal_code)}
            {renderField('Country', profile.country)}
            {profile.state_home && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('home')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_home}</p>
              </div>
            )}
          </div>
        )
      
      case 'work':
        return (
          <div className="space-y-3">
            {renderField('Employment Type', profile.employment_type)}
            {renderField('Occupation', profile.occupation)}
            {renderField('Company', profile.company)}
            {renderField('Time in Role', profile.time_in_role)}
            {renderField('Education', profile.education)}
            {profile.education_description && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Education Description</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.education_description}</p>
              </div>
            )}
            {profile.state_work && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('work')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_work}</p>
              </div>
            )}
          </div>
        )
      
      case 'money':
        return (
          <div className="space-y-3">
            {renderField('Currency', profile.currency)}
            {renderField('Household Income', profile.household_income)}
            {renderField('Savings & Retirement', profile.savings_retirement)}
            {renderField('Assets & Equity', profile.assets_equity)}
            {renderField('Consumer Debt', profile.consumer_debt)}
            {profile.state_money && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('money')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_money}</p>
              </div>
            )}
          </div>
        )
      
      case 'fun':
        return (
          <div className="space-y-3">
            {Array.isArray(profile.hobbies) && profile.hobbies.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-500">Current Hobbies</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map((hobby: string, index: number) => (
                    <span key={index} className="text-xs px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300">{hobby}</span>
                  ))}
                </div>
              </div>
            )}
            {renderField('Leisure Time Per Week', profile.leisure_time_weekly)}
            {profile.state_fun && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('fun')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_fun}</p>
              </div>
            )}
          </div>
        )
      
      case 'travel':
        return (
          <div className="space-y-3">
            {renderField('Travel Frequency', profile.travel_frequency)}
            {renderField('Has Valid Passport', profile.passport)}
            {renderField('Countries Visited', profile.countries_visited)}
            {Array.isArray(profile.trips) && profile.trips.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-500">Trips Taken</span>
                <div className="space-y-1">
                  {profile.trips.map((trip: any, index: number) => (
                    <div key={index} className="text-sm text-neutral-300">
                      {trip.destination || 'Unknown'}{trip.year ? ` (${trip.year})` : ''}{trip.duration ? ` - ${trip.duration}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profile.state_travel && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('travel')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_travel}</p>
              </div>
            )}
          </div>
        )
      
      case 'social':
        return (
          <div className="space-y-3">
            {renderField('Close Friends Count', profile.close_friends_count)}
            {renderField('Social Preference', profile.social_preference)}
            {profile.state_social && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('social')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_social}</p>
              </div>
            )}
          </div>
        )
      
      case 'stuff':
        return (
          <div className="space-y-3">
            {renderField('Lifestyle Category', profile.lifestyle_category)}
            {Array.isArray(profile.vehicles) && profile.vehicles.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-500">Vehicles</span>
                <div className="space-y-1">
                  {profile.vehicles.map((vehicle: any, index: number) => {
                    const status = vehicle.ownership_status === 'paid_in_full' ? 'Paid In Full'
                      : vehicle.ownership_status === 'own_with_payment' ? 'Own with a payment'
                      : vehicle.ownership_status === 'leased' ? 'Leased'
                      : vehicle.ownership_status === 'borrowed' ? 'Borrowed'
                      : ''
                    return (
                      <div key={index} className="text-sm text-neutral-300">
                        {vehicle.name || 'Unknown'}{vehicle.year_acquired ? ` (${vehicle.year_acquired})` : ''}{status ? ` - ${status}` : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {Array.isArray(profile.items) && profile.items.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-500">Items</span>
                <div className="space-y-1">
                  {profile.items.map((item: any, index: number) => {
                    const status = item.ownership_status === 'paid_in_full' ? 'Paid In Full'
                      : item.ownership_status === 'own_with_payment' ? 'Own with a payment'
                      : item.ownership_status === 'leased' ? 'Leased'
                      : item.ownership_status === 'borrowed' ? 'Borrowed'
                      : ''
                    return (
                      <div key={index} className="text-sm text-neutral-300">
                        {item.name || 'Unknown'}{item.year_acquired ? ` (${item.year_acquired})` : ''}{status ? ` - ${status}` : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {profile.state_stuff && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('stuff')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_stuff}</p>
              </div>
            )}
          </div>
        )
      
      case 'spirituality':
        return (
          <div className="space-y-3">
            {renderField('Spiritual Practice', profile.spiritual_practice)}
            {renderField('Meditation Frequency', profile.meditation_frequency)}
            {renderField('Personal Growth Focus', profile.personal_growth_focus)}
            {profile.state_spirituality && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('spirituality')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_spirituality}</p>
              </div>
            )}
          </div>
        )
      
      case 'giving':
        return (
          <div className="space-y-3">
            {renderField('Volunteer Status', profile.volunteer_status)}
            {renderField('Annual Charitable Giving', profile.charitable_giving)}
            {renderField('Legacy Mindset', profile.legacy_mindset)}
            {profile.state_giving && (
              <div className="pt-1">
                <span className="text-xs text-neutral-500">Current State of {getVisionCategoryLabel('giving')}</span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap mt-1">{profile.state_giving}</p>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
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
            <Button onClick={() => fetchProfileVersion(profileId)} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }

  const versionInfo = getCurrentVersionInfo()
  const displayStatus = versionInfo?.is_active && !versionInfo?.is_draft ? 'active' : versionInfo?.is_draft ? 'draft' : 'complete'

  if (!profile || Object.keys(profile).length === 0) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <div className="pb-6">
      <Stack gap="md">
        {/* Intensive Completion Banner */}
        {isIntensiveMode && isAlreadyCompleted && completedAt && (
          <Container size="xl">
            <IntensiveCompletionBanner 
              stepTitle="Create Profile"
              completedAt={completedAt}
            />
          </Container>
        )}

        {/* Page Hero */}
        <PageHero
          title={profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : 'My Profile'}
          className="mb-4"
        >
          {/* Profile Picture */}
          <div className="text-center">
            <div className="inline-block w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700">
              <NextImage
                src={profile.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                alt="Profile picture"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Version Info */}
          {versionInfo && (
            <div className="text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <VersionBadge 
                  versionNumber={versionInfo.version_number} 
                  status={displayStatus} 
                />
                <StatusBadge 
                  status={displayStatus} 
                  subtle={displayStatus !== 'active'}
                  className="uppercase tracking-[0.25em]"
                />
                <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <CalendarDays className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">Created:</span>
                  <span>{new Date(versionInfo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="text-xs md:text-sm font-semibold text-[#39FF14]">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          )}
        </PageHero>

        {/* Personal Information Card */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <div className="px-1 py-2 md:px-0 md:py-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary-500">
                <Icon icon={User} size="xs" color="#000000" />
              </div>
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-[0.25em]">Personal Information</h3>
            </div>
            <div className="border-b border-neutral-800 mb-2" />
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderField('Full Name', (profile.first_name || profile.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null)}
              {renderField('Email', profile.email)}
              {renderField('Phone', formatPhoneNumber(profile.phone))}
              {renderField('Birthday', formatDateOfBirth(profile.date_of_birth))}
              {renderField('Gender', profile.gender)}
              {renderField('Ethnicity', profile.ethnicity)}
            </div>
          </div>
        </Card>

        {/* Media */}
        {Array.isArray(profile.progress_photos) && profile.progress_photos.length > 0 && (
          <Card className="transition-all duration-300 hover:shadow-lg">
            <div className="px-1 py-2 md:px-0 md:py-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary-500">
                  <Icon icon={Camera} size="xs" color="#000000" />
                </div>
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-[0.25em]">Media</h3>
              </div>
              <div className="border-b border-neutral-800 mb-2" />
              <div className="pt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.progress_photos.map((media, index) => (
                    <div key={index} className="relative group">
                      {isVideo(media) ? (
                        <div className="relative" onClick={() => openLightbox(index)}>
                          <OptimizedVideo
                            url={media}
                            context="list"
                            lazy={true}
                            className="w-full aspect-[4/3] rounded-lg"
                          />
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
                <p className="text-xs text-neutral-500 mt-3">
                  {profile.progress_photos.length} media file{profile.progress_photos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Life Category Cards */}
        {getOrderedProfileCategories().map((category) => {
          const IconComponent = category.icon
          const fields = renderCategoryFields(category.id)
          if (!fields) return null
          
          return (
            <Card key={category.id} className="transition-all duration-300 hover:shadow-lg">
              <div className="px-1 py-2 md:px-0 md:py-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary-500">
                    <Icon icon={IconComponent} size="xs" color="#000000" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-[0.25em]">{category.title}</h3>
                </div>
                <div className="border-b border-neutral-800 mb-2" />
                <div className="pt-2">
                  {fields}
                  <SavedRecordings
                    recordings={profile.story_recordings || []}
                    categoryFilter={category.recordingCategory}
                  />
                </div>
              </div>
            </Card>
          )
        })}

        {/* Delete Button */}
        {!isIntensiveMode && (
          <div className="text-center pt-4">
            <Button
              onClick={() => {
                const currentVersion = getCurrentVersionInfo()
                if (currentVersion) {
                  handleDeleteVersion(currentVersion)
                }
              }}
              variant="danger"
              size="sm"
              className="flex items-center gap-2 mx-auto"
              disabled={deletingVersion !== null}
            >
              {deletingVersion ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Version
                </>
              )}
            </Button>
          </div>
        )}
      </Stack>

      {/* Lightbox */}
      {lightboxOpen && Array.isArray(profile.progress_photos) && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

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

            {profile.progress_photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} of {profile.progress_photos.length}
              </div>
            )}

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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setVersionToDelete(null)
        }}
        onConfirm={confirmDeleteVersion}
        itemName={`Version ${versionToDelete?.version_number || ''}`}
        itemType="profile version"
        isLoading={deletingVersion === versionToDelete?.id}
        loadingText="Deleting version..."
      />
    </div>
  )
}
