'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {  Button, Badge, Card, CategoryCard, WarningConfirmationDialog, Icon, VersionBadge, StatusBadge, PageHero, Container, Stack, Spinner, IntensiveCompletionBanner } from '@/lib/design-system/components'
import ProfileVersionManager from '@/components/ProfileVersionManager'
import VersionStatusIndicator from '@/components/VersionStatusIndicator'
import VersionActionToolbar from '@/components/VersionActionToolbar'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { PersonalInfoSection } from '../../components/PersonalInfoSection'
import { RelationshipSection } from '../../components/RelationshipSection'
import { FamilySection } from '../../components/FamilySection'
import { HealthSection } from '../../components/HealthSection'
import { LocationSection } from '../../components/LocationSection'
import { CareerSection } from '../../components/CareerSection'
import { FinancialSection } from '../../components/FinancialSection'
import { PhotosAndNotesSection } from '../../components/PhotosAndNotesSection'
import { FunRecreationSection } from '../../components/FunRecreationSection'
import { TravelAdventureSection } from '../../components/TravelAdventureSection'
import { SocialFriendsSection } from '../../components/SocialFriendsSection'
import { PossessionsLifestyleSection } from '../../components/PossessionsLifestyleSection'
import { SpiritualityGrowthSection } from '../../components/SpiritualityGrowthSection'
import { GivingLegacySection } from '../../components/GivingLegacySection'
import { UserProfile } from '@/lib/supabase/profile'
import { Save, AlertCircle, CheckCircle, Loader2, History, Eye, Plus, ArrowLeft, Edit3, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, FileText, User, Camera, Check, CalendarDays, Info, X } from 'lucide-react'
import { getIncompleteFields, calculateProfileCompletion } from '@/lib/utils/profile-completion'
import { markIntensiveStep, isInIntensiveMode } from '@/lib/intensive/checklist'

export default function ProfileEditPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  const categoryGridRef = useRef<HTMLDivElement>(null)
  
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
  const [showIncompleteFields, setShowIncompleteFields] = useState(false)
  const [highlightedField, setHighlightedField] = useState<string | null>(null)
  const [intensiveMode, setIntensiveMode] = useState(false)
  const [profileMarkedComplete, setProfileMarkedComplete] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [intensiveCheckComplete, setIntensiveCheckComplete] = useState(false)
  const [versionStatus, setVersionStatus] = useState({
    isDraft: false,
    isActive: false,
    versionNumber: 1,
    createdAt: ''
  })
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [showDraftWarning, setShowDraftWarning] = useState(false)
  const [showCommitWarning, setShowCommitWarning] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Clear highlighted field when the field gets a value
  useEffect(() => {
    if (highlightedField && profile) {
      const fieldValue = (profile as any)[highlightedField]
      // Check if field now has a value
      const hasValue = fieldValue !== null && 
                       fieldValue !== undefined && 
                       fieldValue !== '' &&
                       (Array.isArray(fieldValue) ? fieldValue.length > 0 : true)
      if (hasValue) {
        setHighlightedField(null)
      }
    }
  }, [highlightedField, profile])

  // Handle URL hash navigation to set active section
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove the '#'
    if (hash) {
      const sectionExists = profileSections.find(section => section.id === hash)
      if (sectionExists) {
        setActiveSection(hash)
      }
    }
  }, [])

  // Helper function to get category info from design system
  const getCategoryInfo = (categoryId: string) => {
    // Use vision category directly for all categories except 'personal' and 'photos-notes'
    const category = getVisionCategory(categoryId as any)
    
    if (category) {
      return {
        id: categoryId,
        title: category.label,
        icon: category.icon,
        description: category.description
      }
    }
    
    if (categoryId === 'personal') {
      return {
        id: 'personal',
        title: 'Personal',
        icon: User,
        description: 'Basic information about you'
      }
    }
    
    if (categoryId === 'photos-notes') {
      return {
        id: 'photos-notes',
        title: 'Media',
        icon: Camera,
        description: 'Media and additional notes'
      }
    }
    
    return {
      id: categoryId,
      title: categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: User,
      description: 'Profile section'
    }
  }

  // Profile sections in order (Personal first, Media last)
  // Using vision-categories.ts keys as single source of truth
  const profileSections = [
    { id: 'personal', title: 'Personal', description: 'Basic information about you' },
    { id: 'fun', title: 'Fun', description: 'Hobbies and joyful activities' },
    { id: 'health', title: 'Health', description: 'Physical and mental well-being' },
    { id: 'travel', title: 'Travel', description: 'Places to explore and adventures' },
    { id: 'love', title: 'Love', description: 'Romantic relationships' },
    { id: 'family', title: 'Family', description: 'Family relationships and life' },
    { id: 'social', title: 'Social', description: 'Social connections and friendships' },
    { id: 'home', title: 'Home', description: 'Living space and environment' },
    { id: 'work', title: 'Work', description: 'Work and career aspirations' },
    { id: 'money', title: 'Money', description: 'Financial goals and wealth' },
    { id: 'stuff', title: 'Stuff', description: 'Material belongings and things' },
    { id: 'giving', title: 'Giving', description: 'Contribution and legacy' },
    { id: 'spirituality', title: 'Spirituality', description: 'Spiritual growth and expansion' },
    { id: 'photos-notes', title: 'Media', description: 'Media and additional notes' }
  ]

  // Navigation functions for previous/next buttons
  const getCurrentSectionIndex = () => {
    return profileSections.findIndex(section => section.id === activeSection)
  }

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
    // Scroll to category grid after DOM updates
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        categoryGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  const goToPreviousSection = () => {
    const currentIndex = getCurrentSectionIndex()
    if (currentIndex > 0) {
      handleSectionChange(profileSections[currentIndex - 1].id)
    }
  }

  const goToNextSection = () => {
    const currentIndex = getCurrentSectionIndex()
    if (currentIndex < profileSections.length - 1) {
      handleSectionChange(profileSections[currentIndex + 1].id)
    }
  }

  const isFirstSection = () => getCurrentSectionIndex() === 0
  const isLastSection = () => getCurrentSectionIndex() === profileSections.length - 1

  // Manual save only - no auto-save timeout needed

  // Manual completion calculation with intelligent conditionals (matches API logic)
  // Use the single source of truth for completion calculation (from profile-completion.ts)
  // This excludes media fields (profile_picture_url, progress_photos, story_recordings)

  // Helper function to get current version info (matches profile detail page)
  const getCurrentVersionInfo = () => {
    if (!profileId) return null
    // Find the version info for the current profileId
    const versionInfo = versions.find(v => v.id === profileId)
    if (versionInfo) return versionInfo
    
    // If not in versions list yet, use profile data directly
    if (profile && (profile as any).id === profileId) {
      const profileAny = profile as any
      return {
        id: profile.id,
        version_number: profileAny.version_number,
        is_draft: profileAny.is_draft,
        is_active: profileAny.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        completion_percentage: profileAny.completion_percentage
      }
    }
    
    return null
  }

  // Fetch profile data (matches life-vision pattern exactly)
  useEffect(() => {
    async function fetchProfile() {
      try {
        // If we have a profileId, fetch that specific profile version directly (like life-vision does)
        if (profileId) {
          console.log('Profile edit page: Loading specific profile version:', profileId)
          
          // Fetch the specific profile version directly
          const response = await fetch(`/api/profile/versions/${profileId}?t=${Date.now()}`)
          
          if (!response.ok) {
            if (response.status === 401) {
              router.push('/auth/login')
              return
            }
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to load profile version')
          }
          
          const versionData = await response.json()
          const profileData = versionData.profile
          
          if (!profileData) {
            throw new Error('Profile not found')
          }

          console.log('Profile version loaded:', {
            id: profileData.id,
            is_draft: profileData.is_draft,
            is_active: profileData.is_active,
            version_number: profileData.version_number,
            created_at: profileData.created_at
          })

          setProfile(profileData)
          setCurrentVersionId(profileData.id)
          
          // Also fetch versions list for other functionality
          const versionsResponse = await fetch(`/api/profile?includeVersions=true&t=${Date.now()}`)
          if (versionsResponse.ok) {
            const versionsData = await versionsResponse.json()
            setVersions(versionsData.versions || [])
          }
        } else {
          // No profileId - fetch active profile
          console.log('Profile edit page: Loading active profile')
          const response = await fetch(`/api/profile?t=${Date.now()}`)
          
          if (!response.ok) {
            if (response.status === 401) {
              router.push('/auth/login')
              return
            }
            throw new Error('Failed to fetch profile')
          }
          
          const data = await response.json()
          setProfile(data.profile || {})
          setVersions(data.versions || [])
          setCurrentVersionId(null)
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
  // Uses the single source of truth from profile-completion.ts (excludes media fields)
  useEffect(() => {
    if (Object.keys(profile).length > 0) {
      const newPercentage = calculateProfileCompletion(profile)
      setCompletionPercentage(newPercentage)
    }
  }, [profile])

  // Check if user is in intensive mode and if profile step is already complete
  useEffect(() => {
    async function checkIntensiveMode() {
      const inIntensive = await isInIntensiveMode()
      setIntensiveMode(inIntensive)
      
      // If in intensive mode, check if profile step is already marked complete
      if (inIntensive) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: intensiveData } = await supabase
            .from('intensive_purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('completion_status', 'pending')
            .maybeSingle()
          
          if (intensiveData) {
            const { data: checklistData } = await supabase
              .from('intensive_checklist')
              .select('profile_completed, profile_completed_at')
              .eq('intensive_id', intensiveData.id)
              .maybeSingle()
            
            // If already complete, mark state so we don't redirect
            if (checklistData?.profile_completed) {
              setProfileMarkedComplete(true)
              setCompletedAt(checklistData.profile_completed_at)
            }
          }
        }
      }
      
      // Mark that we've finished checking intensive status
      setIntensiveCheckComplete(true)
    }
    checkIntensiveMode()
  }, [])

  // Auto-mark profile step complete when reaching 100% in intensive mode (only for first-time completion)
  useEffect(() => {
    async function markProfileComplete() {
      // Only redirect if:
      // 1. We've finished checking if the step is already complete
      // 2. We're in intensive mode
      // 3. Profile is 100% complete
      // 4. Step is NOT already marked complete (first-time completion)
      if (intensiveCheckComplete && intensiveMode && completionPercentage >= 100 && !profileMarkedComplete) {
        const success = await markIntensiveStep('profile_completed')
        if (success) {
          setProfileMarkedComplete(true)
          console.log('✅ Profile step marked complete in intensive')
          // Redirect to dashboard to show progress with completion toast
          router.push('/intensive/dashboard?completed=profile')
        }
      }
    }
    markProfileComplete()
  }, [intensiveCheckComplete, intensiveMode, completionPercentage, profileMarkedComplete, router])

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
        // Update profile with new version data
        setProfile(prev => ({
          ...prev,
          ...data.version,
          version_number: data.version.version_number,
          is_draft: data.version.is_draft,
          is_active: data.version.is_active,
          created_at: data.version.created_at || prev.created_at
        }))
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

  // Manual save function
  const saveProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      console.log('💾 Saving profile data:', { 
        profileId, 
        hasVehicles: !!profileData.vehicles?.length,
        hasItems: !!profileData.items?.length,
        vehiclesCount: profileData.vehicles?.length || 0,
        itemsCount: profileData.items?.length || 0
      })
      
      // Use PUT method to update the specific profile being edited
      const apiUrl = profileId 
        ? `/api/profile?profileId=${profileId}`
        : '/api/profile'
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Profile save error response:', errorText)
        throw new Error(`Failed to save profile: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Profile save response:', {
        hasProfile: !!data.profile,
        hasVehicles: !!data.profile?.vehicles?.length,
        hasItems: !!data.profile?.items?.length,
        vehiclesCount: data.profile?.vehicles?.length || 0,
        itemsCount: data.profile?.items?.length || 0
      })
      
      // Only update profile if the save was successful and returned valid data
      if (data.profile && Object.keys(data.profile).length > 0) {
        setProfile(data.profile)
      } else {
        console.log('Profile save failed or returned empty data, keeping current local state')
      }
      setSaveStatus('saved')
      setLastSaved(new Date())
      setError(null)
      setHasUnsavedChanges(false)

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
  }, [profileId])

  // Manual save only - no auto-save
  const handleProfileChange = useCallback((updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile)
    setHasUnsavedChanges(true)
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
            // Completion percentage will be calculated in real-time via useEffect
          } else {
            setProfile(data.profile || {})
            // Completion percentage will be calculated in real-time via useEffect
          }
        } else {
          setProfile(data.profile || {})
          // Completion percentage will be calculated in real-time via useEffect
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
    console.log('🔵 handleManualSave called with profile:', {
      hasVehicles: !!profile.vehicles?.length,
      hasItems: !!profile.items?.length,
      vehiclesCount: profile.vehicles?.length || 0,
      itemsCount: profile.items?.length || 0
    })
    await saveProfile(profile)
  }

  // Calculate completed sections
  // NOTE: Database has defaults for: units='US', country='United States', currency='USD',
  // has_children=false, passport=false, countries_visited=0, personal_growth_focus=false, legacy_mindset=false
  // These should NOT count as "user completed this section"
  const getCompletedSections = useCallback(() => {
    // Use the same section IDs as profileSections array
    const sections = [
      'personal',
      'fun',
      'health',
      'travel',
      'love',
      'family',
      'social',
      'home',
      'work',
      'money',
      'stuff',
      'giving',
      'spirituality',
      'photos-notes'
    ]

    return sections.filter(section => {
      switch (section) {
        case 'personal':
          // Personal section is complete if core fields are filled
          return profile.first_name && profile.last_name && profile.email && 
                 profile.phone && profile.date_of_birth && profile.gender
        case 'love':
          // Love/Relationship section is complete if relationship status is set
          // and if not Single, then partner info should be included
          return profile.relationship_status && 
                 (profile.relationship_status === 'Single' || 
                  (profile.partner_name && profile.relationship_length))
        case 'family':
          // Family section requires user action beyond defaults
          // has_children defaults to false, so we need clarity story OR explicit children data
          const hasChildrenData = profile.has_children === true && 
                 profile.children && profile.children.length > 0 && 
                 profile.children.some(c => c.first_name && c.first_name.trim().length > 0)
          return hasChildrenData || (profile.clarity_family && profile.clarity_family.trim().length > 0)
        case 'health':
          // Health section - units defaults to 'US', don't count that
          // Require actual user input: height, weight, exercise_frequency, OR clarity story
          return (profile.height || profile.weight || profile.exercise_frequency ||
                 (profile.clarity_health && profile.clarity_health.trim().length > 0))
        case 'home':
          // Home/Location - country defaults to 'United States', don't count that
          // Require actual user input beyond default
          return (profile.living_situation || profile.time_at_location || 
                 profile.city || profile.state || profile.postal_code ||
                 (profile.clarity_home && profile.clarity_home.trim().length > 0))
        case 'work':
          // Work/Career section is complete if career fields OR clarity story is filled
          return (profile.employment_type || profile.occupation || profile.company || 
                 profile.time_in_role || profile.education ||
                 (profile.clarity_work && profile.clarity_work.trim().length > 0))
        case 'money':
          // Money/Financial - currency defaults to 'USD', don't count that
          // Require actual user input beyond default
          return (profile.household_income || profile.savings_retirement || 
                 profile.assets_equity || profile.consumer_debt ||
                 (profile.clarity_money && profile.clarity_money.trim().length > 0))
        case 'fun':
          // Fun section - hobbies defaults to empty array, don't count that
          return (profile.hobbies && profile.hobbies.length > 0) || 
                 profile.leisure_time_weekly ||
                 (profile.clarity_fun && profile.clarity_fun.trim().length > 0)
        case 'travel':
          // Travel section - passport defaults to false, countries_visited to 0
          // Only count if user actually set travel_frequency OR clarity story
          // passport=true or countries_visited>0 means user changed from default
          return profile.travel_frequency || 
                 profile.passport === true ||
                 (profile.countries_visited != null && profile.countries_visited > 0) ||
                 (profile.clarity_travel && profile.clarity_travel.trim().length > 0)
        case 'social':
          // Social section is complete if any social fields OR clarity story is filled
          return profile.close_friends_count || 
                 profile.social_preference ||
                 (profile.clarity_social && profile.clarity_social.trim().length > 0)
        case 'stuff':
          // Stuff/Possessions section is complete if any lifestyle fields OR clarity story is filled
          return profile.lifestyle_category || 
                 (profile.clarity_stuff && profile.clarity_stuff.trim().length > 0)
        case 'spirituality':
          // Spirituality - personal_growth_focus defaults to false
          // Only count if user set practice, meditation, OR personal_growth_focus=true, OR clarity story
          return profile.spiritual_practice || 
                 profile.meditation_frequency || 
                 profile.personal_growth_focus === true ||
                 (profile.clarity_spirituality && profile.clarity_spirituality.trim().length > 0)
        case 'giving':
          // Giving - legacy_mindset defaults to false
          // Only count if user set volunteer, charitable, OR legacy_mindset=true, OR clarity story
          return profile.volunteer_status || 
                 profile.charitable_giving || 
                 profile.legacy_mindset === true ||
                 (profile.clarity_giving && profile.clarity_giving.trim().length > 0)
        case 'photos-notes':
          // Photos/Notes section is complete if any media or notes are added
          return (profile.version_notes && profile.version_notes.trim().length > 0) || 
                 (profile.progress_photos && profile.progress_photos.length > 0)
        default:
          return false
      }
    })
  }, [profile])

  const completedSections = getCompletedSections()

  // Initialize selected categories with all sections
  useEffect(() => {
    if (profileSections.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories(profileSections.map(s => s.id))
    }
  }, [profileSections.length])

  // Render section content
  const renderSection = () => {
    const commonProps = {
      profile,
      onProfileChange: handleProfileChange,
      onProfileReload: reloadProfile,
      onError: setError,
      hasUnsavedChanges,
      highlightedField
    }

    let sectionContent
    switch (activeSection) {
      case 'personal':
        sectionContent = <PersonalInfoSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'love':
        sectionContent = <RelationshipSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'family':
        sectionContent = <FamilySection {...commonProps} profileId={profileId} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'health':
        sectionContent = <HealthSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'home':
        sectionContent = <LocationSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'work':
        sectionContent = <CareerSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'money':
        sectionContent = <FinancialSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'photos-notes':
        sectionContent = <PhotosAndNotesSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'fun':
        sectionContent = <FunRecreationSection {...commonProps} profileId={profileId} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'travel':
        sectionContent = <TravelAdventureSection {...commonProps} profileId={profileId} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'social':
        sectionContent = <SocialFriendsSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'stuff':
        sectionContent = <PossessionsLifestyleSection {...commonProps} profileId={profileId} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'spirituality':
        sectionContent = <SpiritualityGrowthSection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      case 'giving':
        sectionContent = <GivingLegacySection {...commonProps} onSave={handleManualSave} isSaving={isSaving} />
        break
      default:
        sectionContent = <PersonalInfoSection {...commonProps} />
    }

    return (
      <div className="space-y-6">
        {sectionContent}
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-start">
            <Button
              onClick={goToPreviousSection}
              disabled={isFirstSection()}
              variant="outline"
              size="sm"
              className="w-24 md:w-auto"
            >
              <ChevronsLeft className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronLeft className="w-4 h-4 flex-shrink-0 hidden md:block" />
              <span className="hidden md:inline">Previous</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>{getCurrentSectionIndex() + 1} of {profileSections.length}</span>
            <span>•</span>
            <span>{getCategoryInfo(activeSection).title}</span>
          </div>
          
          <div className="flex-1 flex justify-end">
            <Button
              onClick={goToNextSection}
              disabled={isLastSection()}
              variant="outline"
              size="sm"
              className="w-24 md:w-auto"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronsRight className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronRight className="w-4 h-4 flex-shrink-0 hidden md:block" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Determine display status based on is_active and is_draft (matches life-vision pattern)
  const getDisplayStatus = () => {
    if (!profile || Object.keys(profile).length === 0) return 'complete'
    
    const profileAny = profile as any
    // Explicitly check for true values (handle null/undefined)
    const isActive = profileAny.is_active === true
    const isDraft = profileAny.is_draft === true
    
    if (isActive && !isDraft) {
      return 'active'
    } else if (!isActive && isDraft) {
      return 'draft'
    } else {
      return 'complete'
    }
  }

  const displayStatus = getDisplayStatus()
  
  // Use profile data directly (matches life-vision pattern)
  const profileAny = profile as any
  const badgeVersionNumber = profileAny?.version_number || 1
  const badgeCreatedAt = profile?.created_at || ''
  // Always use real-time calculated completion percentage
  const badgeCompletionPercentage = completionPercentage

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Intensive Completion Banner - Shows when step is already complete */}
        {intensiveMode && profileMarkedComplete && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Create Profile"
            completedAt={completedAt}
          />
        )}

        {/* Header */}
        <PageHero
          title="Edit Profile"
          subtitle={!profileId ? "Help VIVA understand you better. The more complete your profile, the more personalized your guidance becomes." : undefined}
        >
          {/* Centered Version Info with Enhanced Styling */}
          {profileId && profile && Object.keys(profile).length > 0 && badgeCreatedAt && (
            <div className="text-center">
              {/* Version, Status & Date Badges */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <VersionBadge 
                  versionNumber={badgeVersionNumber} 
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
                  <span>{new Date(badgeCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {/* Profile Completion Percentage */}
                <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <span className="font-medium">Complete:</span>
                  <span className="font-semibold text-[#39FF14]">{badgeCompletionPercentage}%</span>
                </div>
              </div>
            </div>
          )}
        </PageHero>

        {/* Profile Completion Progress - Clickable */}
        {(() => {
          // Calculate locally to stay in sync with incomplete fields display
          const localCompletion = calculateProfileCompletion(profile)
          const incompleteFields = getIncompleteFields(profile)
          
          // Debug: Log completion details to console
          console.log('🔍 Profile Completion Debug:')
          console.log('  Completion:', localCompletion + '%')
          console.log('  leisure_time_weekly value:', (profile as any).leisure_time_weekly, '| type:', typeof (profile as any).leisure_time_weekly)
          console.log('  Incomplete fields from getIncompleteFields():', incompleteFields)
          
          if (localCompletion < 100) {
            console.log('  Profile data keys:', Object.keys(profile))
            
            // Check specific fields that might be missing
            const fieldsToCheck = [
              'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'ethnicity',
              'relationship_status', 'has_children',
              'units', 'height', 'weight', 'exercise_frequency',
              'living_situation', 'time_at_location', 'city', 'state', 'postal_code', 'country',
              'employment_type', 'occupation', 'company', 'time_in_role', 'education',
              'currency', 'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt',
              'hobbies', 'leisure_time_weekly',
              'travel_frequency', 'passport', 'countries_visited',
              'close_friends_count', 'social_preference',
              'lifestyle_category',
              'spiritual_practice', 'meditation_frequency', 'personal_growth_focus',
              'volunteer_status', 'charitable_giving', 'legacy_mindset',
              'clarity_fun', 'clarity_health', 'clarity_travel', 'clarity_love', 'clarity_family',
              'clarity_social', 'clarity_home', 'clarity_work', 'clarity_money', 'clarity_stuff',
              'clarity_giving', 'clarity_spirituality'
            ]
            
            const missingOrEmpty = fieldsToCheck.filter(field => {
              const value = (profile as any)[field]
              if (value === undefined || value === null || value === '') return true
              if (Array.isArray(value) && value.length === 0) return true
              return false
            })
            console.log('  Fields with no value:', missingOrEmpty)
            
            // Check conditionals
            if ((profile as any).relationship_status !== 'Single') {
              console.log('  Relationship conditionals - partner_name:', (profile as any).partner_name, 'relationship_length:', (profile as any).relationship_length)
            }
            if ((profile as any).has_children === true) {
              console.log('  Children conditionals - children array:', (profile as any).children)
            }
          }
          
          return (
            <Card className="relative">
              <button 
                onClick={() => setShowIncompleteFields(!showIncompleteFields)}
                className="w-full text-left focus:outline-none"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-primary-500">{localCompletion}% Complete</span>
                    {incompleteFields.length > 0 && (
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        Click to see {incompleteFields.length} missing field{incompleteFields.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-3 border border-neutral-600">
                    <div
                      className="h-3 rounded-full transition-all duration-500 bg-primary-500"
                      style={{ width: `${localCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </button>
              
              {/* Incomplete Fields Dropdown */}
              {showIncompleteFields && incompleteFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-neutral-200">Missing Fields ({incompleteFields.length})</h4>
                    <button 
                      onClick={() => setShowIncompleteFields(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {(() => {
                      // Group by section
                      const grouped = incompleteFields.reduce((acc, field) => {
                        if (!acc[field.section]) acc[field.section] = []
                        acc[field.section].push(field)
                        return acc
                      }, {} as Record<string, typeof incompleteFields>)
                      
                      return Object.entries(grouped).map(([section, fields]) => (
                        <div key={section} className="bg-neutral-800/50 rounded-lg p-3">
                          <h5 className="text-xs font-semibold text-primary-400 mb-2">{section}</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {fields.map(field => (
                              <button
                                key={field.field}
                                onClick={() => {
                                  setShowIncompleteFields(false)
                                  setHighlightedField(field.field)
                                  handleSectionChange(field.sectionId)
                                }}
                                className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded hover:bg-primary-500/30 hover:text-primary-300 transition-colors cursor-pointer"
                              >
                                {field.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">
                    Note: Media uploads (photos, videos) are optional and don't affect completion.
                  </p>
                </div>
              )}
            </Card>
          )
        })()}

        {/* Continue to Next Step - Show only when profile JUST reached 100% (not already complete) */}
        {intensiveMode && completionPercentage >= 100 && !profileMarkedComplete && (
          <Card className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-primary-500/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Profile Complete!</h3>
                  <p className="text-sm text-neutral-300">You're ready for the next step of your Activation Intensive</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/assessment/new')}
                className="whitespace-nowrap"
              >
                Continue to Assessment
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
        
        {/* Version Actions - Only show for non-active versions (drafts/completed) */}
        {currentVersionId && profileAny?.is_active !== true && (
          <VersionActionToolbar
            versionId={currentVersionId}
            versionNumber={badgeVersionNumber}
            isActive={profileAny?.is_active === true}
            isDraft={profileAny?.is_draft === true}
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

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
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
          />
        )}

        {/* Life Areas Navigation */}
        <Card>
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-white mb-1">Select Life Areas</h3>
            <p className="text-sm text-neutral-400">
              Showing {selectedCategories.length} of {profileSections.length} areas
              {completedSections.length > 0 && (
                <span className="ml-2 text-[#39FF14]">
                  • {completedSections.length} completed
                </span>
              )}
            </p>
          </div>

            {/* Category Grid */}
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1">
              {profileSections.map((section) => {
                const categoryInfo = getCategoryInfo(section.id)
                const isSelected = selectedCategories.includes(section.id)
                const isCompleted = completedSections.includes(section.id)
                const isActive = activeSection === section.id
                
                // Create category object for CategoryCard
                const category = {
                  key: section.id,
                  label: categoryInfo.title,
                  icon: categoryInfo.icon
                }

                return (
                  <div key={section.id} className="relative">
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#333] border-2 border-[#39FF14] flex items-center justify-center z-10">
                        <Check className="w-3 h-3 text-[#39FF14]" strokeWidth={3} />
                      </div>
                    )}
                    <CategoryCard 
                      category={category}
                      selected={isActive}
                      onClick={() => handleSectionChange(section.id)}
                      variant="outlined"
                      selectionStyle="border"
                      iconColor={isActive ? "#39FF14" : "#FFFFFF"}
                      selectedIconColor="#39FF14"
                      className={isActive ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : ''}
                    />
                  </div>
                )
              })}
            </div>
        </Card>

        {/* Main Content - Full Width */}
        <div ref={categoryGridRef} className="w-full">
          {renderSection()}
        </div>
      </Stack>

      {/* Warning Dialogs - Outside Stack (modals/portals) */}
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
    </Container>
  )
}