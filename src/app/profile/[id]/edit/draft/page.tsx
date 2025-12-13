'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {  Button, Badge, Card, WarningConfirmationDialog, Container, Stack, PageHero } from '@/lib/design-system/components'
import ProfileVersionManager from '@/components/ProfileVersionManager'
import VersionStatusIndicator from '@/components/VersionStatusIndicator'
import VersionActionToolbar from '@/components/VersionActionToolbar'
import { ProfileSidebar } from '../../../components/ProfileSidebar'
import { PersonalInfoSection } from '../../../components/PersonalInfoSection'
import { RelationshipSection } from '../../../components/RelationshipSection'
import { FamilySection } from '../../../components/FamilySection'
import { HealthSection } from '../../../components/HealthSection'
import { LocationSection } from '../../../components/LocationSection'
import { CareerSection } from '../../../components/CareerSection'
import { FinancialSection } from '../../../components/FinancialSection'
import { PhotosAndNotesSection } from '../../../components/PhotosAndNotesSection'
import { FunRecreationSection } from '../../../components/FunRecreationSection'
import { TravelAdventureSection } from '../../../components/TravelAdventureSection'
import { SocialFriendsSection } from '../../../components/SocialFriendsSection'
import { PossessionsLifestyleSection } from '../../../components/PossessionsLifestyleSection'
import { SpiritualityGrowthSection } from '../../../components/SpiritualityGrowthSection'
import { GivingLegacySection } from '../../../components/GivingLegacySection'
import { UserProfile } from '@/lib/supabase/profile'
import { Save, AlertCircle, CheckCircle, Loader2, History, Eye, Plus, ArrowLeft, Edit3, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, FileText } from 'lucide-react'

export default function ProfileEditPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [activeSection, setActiveSection] = useState('personal')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [versionStatus, setVersionStatus] = useState({
    isDraft: false,
    isActive: false,
    versionNumber: 1
  })
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [showDraftWarning, setShowDraftWarning] = useState(false)
  const [showCommitWarning, setShowCommitWarning] = useState(false)

  // Profile sections for mobile dropdown (matching ProfileSidebar)
  const profileSections = [
    { id: 'personal', title: 'Personal Info', description: 'Basic information about you' },
    { id: 'fun-recreation', title: 'Fun', description: 'Hobbies and joyful activities' },
    { id: 'health', title: 'Health', description: 'Physical and mental well-being' },
    { id: 'travel-adventure', title: 'Travel', description: 'Places to explore and adventures' },
    { id: 'relationship', title: 'Love', description: 'Romantic relationships' },
    { id: 'family', title: 'Family', description: 'Family relationships and life' },
    { id: 'social-friends', title: 'Social', description: 'Social connections and friendships' },
    { id: 'location', title: 'Home', description: 'Living space and environment' },
    { id: 'career', title: 'Work', description: 'Work and career aspirations' },
    { id: 'financial', title: 'Money', description: 'Financial goals and wealth' },
    { id: 'possessions-lifestyle', title: 'Stuff', description: 'Material belongings and things' },
    { id: 'giving-legacy', title: 'Giving', description: 'Contribution and legacy' },
    { id: 'spirituality-growth', title: 'Spirituality', description: 'Spiritual growth and expansion' },
    { id: 'photos-notes', title: 'Photos & Notes', description: 'Media and additional notes' }
  ]

  // Navigation functions for previous/next buttons
  const getCurrentSectionIndex = () => {
    return profileSections.findIndex(section => section.id === activeSection)
  }

  const goToPreviousSection = () => {
    const currentIndex = getCurrentSectionIndex()
    if (currentIndex > 0) {
      setActiveSection(profileSections[currentIndex - 1].id)
    }
  }

  const goToNextSection = () => {
    const currentIndex = getCurrentSectionIndex()
    if (currentIndex < profileSections.length - 1) {
      setActiveSection(profileSections[currentIndex + 1].id)
    }
  }

  const isFirstSection = () => getCurrentSectionIndex() === 0
  const isLastSection = () => getCurrentSectionIndex() === profileSections.length - 1

  // Manual save only - no auto-save timeout needed

  // Manual completion calculation with intelligent conditionals (matches API logic)
  const calculateCompletionManually = (profileData: Partial<UserProfile>): number => {
    if (!profileData) return 0

    let totalFields = 0
    let completedFields = 0

    // Helper to check if a field has value
    const hasValue = (field: keyof UserProfile) => {
      const value = profileData[field]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'boolean') return true
      return value !== null && value !== undefined && value !== ''
    }

    // Core Fields (always required)
    const coreFields: (keyof UserProfile)[] = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'profile_picture_url']
    coreFields.forEach(field => {
      totalFields++
      if (hasValue(field)) completedFields++
    })

    // Relationship Fields (conditional)
    totalFields++
    if (hasValue('relationship_status')) {
      completedFields++
      if (profileData.relationship_status !== 'Single') {
        totalFields += 2
        if (hasValue('partner_name')) completedFields++
        if (hasValue('relationship_length')) completedFields++
      }
    }

    // Family Fields (conditional)
    totalFields++
    if (profileData.has_children !== undefined && profileData.has_children !== null) {
      completedFields++
      if (profileData.has_children === true) {
        totalFields += 2
        if (hasValue('number_of_children')) completedFields++
        if (hasValue('children_ages')) completedFields++
      }
    }

    // Health, Location, Career, Financial Fields
    const healthFields: (keyof UserProfile)[] = ['units', 'height', 'weight', 'exercise_frequency']
    const locationFields: (keyof UserProfile)[] = ['living_situation', 'time_at_location', 'city', 'state', 'postal_code', 'country']
    const careerFields: (keyof UserProfile)[] = ['employment_type', 'occupation', 'company', 'time_in_role', 'education']
    const financialFields: (keyof UserProfile)[] = ['currency', 'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt']

    ;[...healthFields, ...locationFields, ...careerFields, ...financialFields].forEach(field => {
      totalFields++
      if (hasValue(field)) completedFields++
    })

    // Life Category Clarity Fields (12 categories)
    const clarityFields: (keyof UserProfile)[] = [
      'clarity_fun', 'clarity_health', 'clarity_travel', 'clarity_love', 'clarity_family', 'clarity_social',
      'clarity_home', 'clarity_work', 'clarity_money', 'clarity_stuff', 'clarity_giving', 'clarity_spirituality'
    ]
    clarityFields.forEach(field => {
      totalFields++
      if (hasValue(field)) completedFields++
    })

    // Structured Life Category Fields
    const structuredFields: (keyof UserProfile)[] = [
      'hobbies', 'leisure_time_weekly',
      'travel_frequency', 'passport', 'countries_visited',
      'close_friends_count', 'social_preference',
      'lifestyle_category',
      'spiritual_practice', 'meditation_frequency', 'personal_growth_focus',
      'volunteer_status', 'charitable_giving', 'legacy_mindset'
    ]
    structuredFields.forEach(field => {
      totalFields++
      if (hasValue(field)) completedFields++
    })

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
  }

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        console.log('Profile edit page: Starting fetch to /api/profile')
        const response = await fetch('/api/profile')
        console.log('Profile edit page: Response received', { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText 
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Profile edit page: Unauthorized, redirecting to login')
            router.push('/auth/login')
            return
          }
          const errorText = await response.text()
          console.error('Profile edit page: API error response', errorText)
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`)
        }
        

        const data = await response.json()
        console.log('Profile edit page: Data received', data)
        
        // Load the specific profile version if we have a profileId
        if (profileId && data.versions) {
          const targetVersion = data.versions.find((v: any) => v.id === profileId)
          if (targetVersion) {
            setProfile(targetVersion)
            setCompletionPercentage(targetVersion.completion_percentage || 0)
            setCurrentVersionId(targetVersion.id)
            
            setVersionStatus({ 
              isDraft: targetVersion.is_draft || false, 
              isActive: targetVersion.is_active || false,
              versionNumber: targetVersion.version_number || 1
            })
            setVersions(data.versions || [])
            
            console.log('Profile version loaded:', {
              id: targetVersion.id,
              is_draft: targetVersion.is_draft,
              is_active: targetVersion.is_active,
              version_number: targetVersion.version_number,
              created_at: targetVersion.created_at
            })
          } else {
            setProfile(data.profile || {})
            setCompletionPercentage(data.completionPercentage || 0)
            setCurrentVersionId(null)
            setVersionStatus({ isDraft: false, isActive: false, versionNumber: 1 })
            setVersions(data.versions || [])
          }
        } else {
          setProfile(data.profile || {})
          setCompletionPercentage(data.completionPercentage || 0)
          setCurrentVersionId(null)
          setVersionStatus({ isDraft: false, isActive: false, versionNumber: 1 })
          setVersions(data.versions || [])
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router, profileId])

  // Recalculate completion percentage whenever profile changes
  useEffect(() => {
    if (Object.keys(profile).length > 0) {
      const newPercentage = calculateCompletionManually(profile)
      setCompletionPercentage(newPercentage)
    }
  }, [profile])

  // Fetch versions
  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/profile?includeVersions=true')
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    }
  }

  // Save as version function
  const saveAsVersion = async (isDraft = true) => {
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          profileData: profile, 
          saveAsVersion: true, 
          isDraft,
          sourceProfileId: currentVersionId
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Version save error response:', errorText)
        throw new Error(`Failed to save version: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Version save response:', data)
      
      // Update current version info
      if (data.version) {
        setCurrentVersionId(data.version.id)
        setVersionStatus({
          isDraft: data.version.is_draft,
          isActive: data.version.is_active,
          versionNumber: data.version.version_number
        })
      }
      
      setSaveStatus('saved')
      setLastSaved(new Date())
      setError(null)
      
      // Refresh versions list
      await fetchVersions()

      // Clear save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Error saving version:', error)
      setError(error instanceof Error ? error.message : 'Failed to save version')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save function
  const saveProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileData }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Profile save error response:', errorText)
        throw new Error(`Failed to save profile: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Profile save response:', data)
      console.log('Setting profile to:', data.profile)
      
      // Only update profile if the save was successful and returned valid data
      if (data.profile && Object.keys(data.profile).length > 0) {
        // Preserve the current profile picture URL if the API doesn't return it
        const currentProfilePicture = profile.profile_picture_url
        const updatedProfile = {
          ...data.profile,
          profile_picture_url: data.profile.profile_picture_url || currentProfilePicture
        }
        
        setProfile(updatedProfile)
        setCompletionPercentage(data.completionPercentage)
      } else {
        console.log('Profile save failed or returned empty data, keeping current local state')
        // Keep current local state if save failed
        setCompletionPercentage(calculateCompletionManually(profile))
      }
      setSaveStatus('saved')
      setLastSaved(new Date())
      setError(null)

      // Clear save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
      setError('Failed to save profile changes')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Manual save only - no auto-save
  const handleProfileChange = useCallback((updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile)
    // No auto-save - user must click "Save Edits" button
  }, [profile])

  // Version management handlers
  const handleVersionSelect = (versionId: string) => {
    router.push(`/profile/${versionId}/edit`)
  }

  const handleVersionCreate = async (sourceVersionId: string, isDraft: boolean) => {
    await saveAsVersion(isDraft)
  }

  const handleVersionCommit = async (draftId: string) => {
    try {
      const response = await fetch('/api/profile/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftProfileId: draftId })
      })

      if (!response.ok) throw new Error('Failed to commit draft')
      
      await fetchVersions()
      // Refresh current page
      window.location.reload()
    } catch (error) {
      console.error('Error committing draft:', error)
      setError('Failed to commit draft')
    }
  }

  const handleVersionDelete = async (versionId: string) => {
    try {
      const response = await fetch(`/api/profile/versions/${versionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete version')
      
      await fetchVersions()
      // If we deleted the current version, redirect to main profile
      if (versionId === currentVersionId) {
        router.push('/profile')
      }
    } catch (error) {
      console.error('Error deleting version:', error)
      setError('Failed to delete version')
    }
  }

  // Reload profile from database
  const reloadProfile = useCallback(async () => {
    try {
      console.log('🔄 Reloading profile from database...')
      const response = await fetch(`/api/profile?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Profile reloaded', {
          recordingsCount: data.profile?.story_recordings?.length || 0
        })
        
        // Load the specific profile version if we have a profileId
        if (profileId && data.versions) {
          const targetVersion = data.versions.find((v: any) => v.id === profileId)
          if (targetVersion) {
            setProfile(targetVersion)
            setCompletionPercentage(targetVersion.completion_percentage || 0)
          } else {
            setProfile(data.profile || {})
            setCompletionPercentage(data.completionPercentage || 0)
          }
        } else {
          setProfile(data.profile || {})
          setCompletionPercentage(data.completionPercentage || 0)
        }
      }
    } catch (error) {
      console.error('Failed to reload profile:', error)
    }
  }, [profileId, router])

  // Manual save function
  const handleSaveClick = () => {
    handleManualSave()
  }

  const handleDraftClick = () => {
    setShowDraftWarning(true)
  }

  const handleCommitClick = () => {
    console.log('Commit button clicked, versionStatus:', versionStatus)
    setShowCommitWarning(true)
  }

  const confirmSave = () => {
    handleManualSave()
  }

  const confirmDraft = () => {
    setShowDraftWarning(false)
    saveAsVersion(true)
  }

  const confirmCommit = () => {
    console.log('Confirming commit, versionStatus:', versionStatus)
    setShowCommitWarning(false)
    saveAsVersion(false)
  }

  const handleManualSave = async () => {
    await saveProfile(profile)
  }

  // Calculate completed sections
  const getCompletedSections = useCallback(() => {
    const sections = [
      'personal',
      'relationship', 
      'family',
      'health',
      'location',
      'career',
      'financial',
      'fun-recreation',
      'travel-adventure',
      'social-friends',
      'possessions-lifestyle',
      'spirituality-growth',
      'giving-legacy',
      'photos-notes'
    ]

    return sections.filter(section => {
      switch (section) {
        case 'personal':
          return profile.profile_picture_url && profile.date_of_birth && profile.gender && profile.ethnicity
        case 'relationship':
          return profile.relationship_status && 
                 (profile.relationship_status === 'Single' || profile.relationship_length)
        case 'family':
          return profile.has_children !== undefined && 
                 (profile.has_children === false || 
                  (profile.number_of_children && profile.children_ages?.length))
        case 'health':
          return profile.units && profile.height && profile.weight && profile.exercise_frequency
        case 'location':
          return profile.living_situation && profile.time_at_location && 
                 profile.city && profile.state && profile.postal_code && profile.country
        case 'career':
          return profile.employment_type && profile.occupation && profile.company && profile.time_in_role
        case 'financial':
          return profile.currency && profile.household_income && profile.savings_retirement && 
                 profile.assets_equity && profile.consumer_debt
        case 'fun-recreation':
          return (profile.hobbies && profile.hobbies.length > 0) || 
                 profile.leisure_time_weekly ||
                 (profile.clarity_fun && profile.clarity_fun.trim().length > 0)
        case 'travel-adventure':
          return profile.travel_frequency || 
                 profile.passport !== undefined || 
                 profile.countries_visited !== undefined ||
                 (profile.clarity_travel && profile.clarity_travel.trim().length > 0)
        case 'social-friends':
          return profile.close_friends_count || 
                 profile.social_preference ||
                 (profile.clarity_social && profile.clarity_social.trim().length > 0)
        case 'possessions-lifestyle':
          return profile.lifestyle_category || 
                 (profile.clarity_stuff && profile.clarity_stuff.trim().length > 0)
        case 'spirituality-growth':
          return profile.spiritual_practice || 
                 profile.meditation_frequency || 
                 profile.personal_growth_focus !== undefined ||
                 (profile.clarity_spirituality && profile.clarity_spirituality.trim().length > 0)
        case 'giving-legacy':
          return profile.volunteer_status || 
                 profile.charitable_giving || 
                 profile.legacy_mindset !== undefined ||
                 (profile.clarity_giving && profile.clarity_giving.trim().length > 0)
        case 'photos-notes':
          return (profile.version_notes && profile.version_notes.trim().length > 0) || 
                 (profile.progress_photos && profile.progress_photos.length > 0)
        default:
          return false
      }
    })
  }, [profile])

  const completedSections = getCompletedSections()

  // Render section content
  const renderSection = () => {
    const commonProps = {
      profile,
      onProfileChange: handleProfileChange,
      onProfileReload: reloadProfile,
      onError: setError
    }

    let sectionContent
    switch (activeSection) {
      case 'personal':
        sectionContent = <PersonalInfoSection {...commonProps} />
        break
      case 'relationship':
        sectionContent = <RelationshipSection {...commonProps} />
        break
      case 'family':
        sectionContent = <FamilySection {...commonProps} />
        break
      case 'health':
        sectionContent = <HealthSection {...commonProps} />
        break
      case 'location':
        sectionContent = <LocationSection {...commonProps} />
        break
      case 'career':
        sectionContent = <CareerSection {...commonProps} />
        break
      case 'financial':
        sectionContent = <FinancialSection {...commonProps} />
        break
      case 'photos-notes':
        sectionContent = <PhotosAndNotesSection {...commonProps} />
        break
      case 'fun-recreation':
        sectionContent = <FunRecreationSection {...commonProps} />
        break
      case 'travel-adventure':
        sectionContent = <TravelAdventureSection {...commonProps} />
        break
      case 'social-friends':
        sectionContent = <SocialFriendsSection {...commonProps} />
        break
      case 'possessions-lifestyle':
        sectionContent = <PossessionsLifestyleSection {...commonProps} />
        break
      case 'spirituality-growth':
        sectionContent = <SpiritualityGrowthSection {...commonProps} />
        break
      case 'giving-legacy':
        sectionContent = <GivingLegacySection {...commonProps} />
        break
      default:
        sectionContent = <PersonalInfoSection {...commonProps} />
    }

    return (
      <div className="space-y-6">
        {sectionContent}
        
        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleManualSave}
            variant="primary"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-start">
            <Button
              onClick={goToPreviousSection}
              disabled={isFirstSection()}
              variant="outline"
              className="flex items-center gap-2 w-24"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>{getCurrentSectionIndex() + 1} of {profileSections.length}</span>
            <span>•</span>
            <span>{profileSections.find(s => s.id === activeSection)?.title}</span>
          </div>
          
          <div className="flex-1 flex justify-end">
            <Button
              onClick={goToNextSection}
              disabled={isLastSection()}
              variant="outline"
              className="flex items-center gap-2 w-24"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <div className="text-neutral-400">Loading your profile...</div>
      </div>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Edit Draft Profile"
          subtitle="Help VIVA understand you better. The more complete your profile, the more personalized your guidance becomes."
        >
          {currentVersionId && (
            <VersionStatusIndicator
              isActive={versionStatus.isActive}
              isDraft={versionStatus.isDraft}
              versionNumber={versionStatus.versionNumber}
              completionPercentage={completionPercentage}
              showIcon={true}
              showCompletion={true}
            />
          )}
        </PageHero>

        <div className="hidden md:block">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Edit Draft Profile</h1>
              {currentVersionId && (
                <VersionStatusIndicator
                  isActive={versionStatus.isActive}
                  isDraft={versionStatus.isDraft}
                  versionNumber={versionStatus.versionNumber}
                  completionPercentage={completionPercentage}
                  showIcon={true}
                  showCompletion={true}
                />
              )}
            </div>
            <p className="text-neutral-400">
              {profileId ? (
                versionStatus.isActive ? 'Editing active profile version' :
                versionStatus.isDraft ? 'Editing draft version' :
                `Editing version ${versionStatus.versionNumber}`
              ) : 'Help VIVA understand you better. The more complete your profile, the more personalized your guidance becomes.'}
            </p>
          </div>
        </div>
      </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                  <span className="text-sm text-primary-500">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">Save failed</span>
                </>
              )}
              {lastSaved && saveStatus === 'idle' && (
                <span className="text-sm text-neutral-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
            {/* Profile Percentage Bar */}
            <div className="flex items-center gap-3 sm:flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">Profile:</span>
                <span className="text-sm font-medium text-primary-500">{completionPercentage}%</span>
              </div>
              <div className="flex-1 bg-neutral-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-primary-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <Button
                onClick={() => router.push(`/profile/${profileId}`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 font-semibold w-full sm:w-auto"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              
              <Button
                onClick={handleSaveClick}
                disabled={isSaving}
                size="sm"
                className="flex items-center gap-2 font-semibold w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              {currentVersionId && (
                <VersionActionToolbar
                  versionId={currentVersionId}
                  versionNumber={versionStatus.versionNumber}
                  isActive={versionStatus.isActive}
                  isDraft={versionStatus.isDraft}
                  onSaveAsDraft={() => saveAsVersion(true)}
                  onCommitAsActive={() => saveAsVersion(false)}
                  onCreateDraft={() => saveAsVersion(true)}
                  onSetActive={() => {
                    // This would be handled by the toolbar
                  }}
                  onDelete={() => handleVersionDelete(currentVersionId)}
                  isLoading={isSaving}
                />
              )}
              
              <Button
                onClick={() => setShowVersions(!showVersions)}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 font-semibold w-full sm:w-auto"
              >
                <History className="w-4 h-4" />
                Versions
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Versions List */}
        {showVersions && (
          <ProfileVersionManager
            userId={profileId}
            onVersionSelect={handleVersionSelect}
            onVersionCreate={handleVersionCreate}
            onVersionCommit={handleVersionCommit}
            onVersionDelete={handleVersionDelete}
            className="mb-6"
          />
        )}

        {/* Mobile Dropdown Navigation */}
        <div className="lg:hidden mb-6">
          <Card className="p-4">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-white">
                  {profileSections.find(s => s.id === activeSection)?.title || 'Select Section'}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="mt-3 space-y-1">
                {profileSections.map((section) => {
                  const isActive = activeSection === section.id
                  const isCompleted = completedSections.includes(section.id)

                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                          : 'hover:bg-neutral-800 border border-transparent text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {section.title}
                            </span>
                            {isCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1 truncate">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <ProfileSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              completedSections={completedSections}
            />
          </div>

          {/* Content - Full width on mobile, 3/4 width on desktop */}
          <div className="col-span-1 lg:col-span-3">
            {renderSection()}
          </div>
        </div>

        {/* Completion Celebration */}
        {completionPercentage === 100 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-xl text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Profile Complete!</h3>
            <p className="text-neutral-300">
              Your Vibrational Intelligence Virtual Assistant now has a complete understanding of your life context. 
              Expect more personalized and relevant guidance in all your interactions.
            </p>
          </div>
        )}
        
        {/* Warning Dialogs */}
        <WarningConfirmationDialog
          isOpen={showDraftWarning}
          onClose={() => setShowDraftWarning(false)}
          onConfirm={confirmDraft}
          title="Save as Draft?"
          message="Only one draft at a time. This will override any other draft."
          confirmText="Save as Draft"
          type="draft"
          isLoading={isSaving}
        />
        
        <WarningConfirmationDialog
          isOpen={showCommitWarning}
          onClose={() => setShowCommitWarning(false)}
          onConfirm={confirmCommit}
          title="Commit as Active Version?"
          message="This will become your active profile version."
          confirmText="Commit as Active"
          type="commit"
          isLoading={isSaving}
        />
      </Stack>
    </Container>
  )
}