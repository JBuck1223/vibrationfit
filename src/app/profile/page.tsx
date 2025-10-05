'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Button, Badge } from '@/lib/design-system/components'
import { ProfileSidebar } from './components/ProfileSidebar'
import { PersonalInfoSection } from './components/PersonalInfoSection'
import { RelationshipSection } from './components/RelationshipSection'
import { FamilySection } from './components/FamilySection'
import { HealthSection } from './components/HealthSection'
import { LocationSection } from './components/LocationSection'
import { CareerSection } from './components/CareerSection'
import { FinancialSection } from './components/FinancialSection'
import { UserProfile } from '@/lib/supabase/profile'
import { Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [activeSection, setActiveSection] = useState('personal')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save functionality
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Manual completion calculation fallback
  const calculateCompletionManually = (profileData: Partial<UserProfile>): number => {
    if (!profileData) return 0
    
    const fields = [
      'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
      'relationship_status', 'partner_name', 'children_count', 'children_names',
      'health_conditions', 'medications', 'exercise_frequency', 'living_situation',
      'time_at_location', 'city', 'state', 'postal_code', 'country',
      'employment_type', 'occupation', 'company', 'time_in_role', 'household_income'
    ]
    
    const completedFields = fields.filter(field => 
      profileData[field as keyof UserProfile] !== null && 
      profileData[field as keyof UserProfile] !== undefined && 
      profileData[field as keyof UserProfile] !== ''
    ).length
    
    return Math.round((completedFields / fields.length) * 100)
  }

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        console.log('Profile page: Starting fetch to /api/profile')
        const response = await fetch('/api/profile')
        console.log('Profile page: Response received', { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText 
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Profile page: Unauthorized, redirecting to login')
            router.push('/auth/login')
            return
          }
          const errorText = await response.text()
          console.error('Profile page: API error response', errorText)
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Profile page: Data received', data)
        setProfile(data.profile || {})
        setCompletionPercentage(data.completionPercentage || 0)
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

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
        throw new Error('Failed to save profile')
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

  // Debounced auto-save
  const handleProfileChange = useCallback((updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile)

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      saveProfile(newProfile)
    }, 1000) // 1 second delay

    setAutoSaveTimeout(timeout)
  }, [profile, autoSaveTimeout, saveProfile])

  // Manual save function
  const handleManualSave = async () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
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
      'financial'
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
      onError: setError
    }

    switch (activeSection) {
      case 'personal':
        return <PersonalInfoSection {...commonProps} />
      case 'relationship':
        return <RelationshipSection {...commonProps} />
      case 'family':
        return <FamilySection {...commonProps} />
      case 'health':
        return <HealthSection {...commonProps} />
      case 'location':
        return <LocationSection {...commonProps} />
      case 'career':
        return <CareerSection {...commonProps} />
      case 'financial':
        return <FinancialSection {...commonProps} />
      default:
        return <PersonalInfoSection {...commonProps} />
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <Container size="xl" className="py-8">
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
            <div className="text-neutral-400">Loading your profile...</div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-neutral-400">
            Help your AI Vibrational Assistant understand you better. The more complete your profile, the more personalized your guidance becomes.
          </p>
        </div>

        {/* Save Status Bar */}
        <div className="mb-6 flex items-center justify-between">
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

          <div className="flex items-center gap-3">
            <Badge variant="primary" className="flex items-center gap-2">
              {completionPercentage}% Complete
            </Badge>
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Now'}
            </Button>
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              completedSections={completedSections}
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {renderSection()}
          </div>
        </div>

        {/* Completion Celebration */}
        {completionPercentage === 100 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-xl text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Profile Complete!</h3>
            <p className="text-neutral-300">
              Your AI Vibrational Assistant now has a complete understanding of your life context. 
              Expect more personalized and relevant guidance in all your interactions.
            </p>
          </div>
        )}
      </Container>
    </PageLayout>
  )
}
