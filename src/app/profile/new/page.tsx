'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Button, Badge } from '@/lib/design-system/components'
import { ProfileSidebar } from '../components/ProfileSidebar'
import { PersonalInfoSection } from '../components/PersonalInfoSection'
import { RelationshipSection } from '../components/RelationshipSection'
import { FamilySection } from '../components/FamilySection'
import { HealthSection } from '../components/HealthSection'
import { LocationSection } from '../components/LocationSection'
import { CareerSection } from '../components/CareerSection'
import { FinancialSection } from '../components/FinancialSection'
import { UserProfile } from '@/lib/supabase/profile'
import { Save, AlertCircle, CheckCircle, Loader2, History, Eye, Plus, ArrowLeft } from 'lucide-react'

export default function NewProfileVersionPage() {
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
      'relationship_status', 'partner_name', 'number_of_children', 'children_ages',
      'health_conditions', 'medications', 'exercise_frequency', 'living_situation',
      'time_at_location', 'city', 'state', 'postal_code', 'country',
      'employment_type', 'occupation', 'company', 'time_in_role', 'household_income',
      'profile_picture_url'
    ]
    
    const completedFields = fields.filter(field => 
      profileData[field as keyof UserProfile] !== null && 
      profileData[field as keyof UserProfile] !== undefined && 
      profileData[field as keyof UserProfile] !== ''
    ).length
    
    return Math.round((completedFields / fields.length) * 100)
  }

  // Fetch current profile to use as starting point
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        const data = await response.json()
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
  }, [])

  // Handle profile changes
  const handleProfileChange = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      saveProfile({ ...profile, ...updates })
    }, 1000)
    
    setAutoSaveTimeout(timeout)
  }, [profile, autoSaveTimeout])

  // Save as new version function
  const saveAsNewVersion = async (isDraft = false) => {
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
          isDraft 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save new version')
      }

      const data = await response.json()
      console.log('New version save response:', data)
      
      setSaveStatus('saved')
      setLastSaved(new Date())
      setError(null)
      
      // Redirect to view the new version
      if (data.version?.id) {
        router.push(`/profile?versionId=${data.version.id}`)
      } else {
        router.push('/profile')
      }
    } catch (error) {
      console.error('Error saving new version:', error)
      setError(error instanceof Error ? error.message : 'Failed to save new version')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // Manual save function
  const handleManualSave = useCallback(async () => {
    await saveAsNewVersion(false)
  }, [profile])

  // Get completed sections
  const getCompletedSections = useCallback(() => {
    return Object.keys({
      personal: true,
      relationship: true,
      family: true,
      health: true,
      location: true,
      career: true,
      financial: true
    }).filter(section => {
      switch (section) {
        case 'personal':
          return profile.first_name && profile.last_name && profile.email
        case 'relationship':
          return profile.relationship_status
        case 'family':
          return profile.has_children !== undefined && 
                 (profile.has_children === false || 
                  (profile.number_of_children && profile.children_ages?.length))
        case 'health':
          return profile.exercise_frequency
        case 'location':
          return profile.living_situation && profile.time_at_location && 
                 profile.city && profile.state
        case 'career':
          return profile.employment_type && profile.occupation
        case 'financial':
          return profile.household_income
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
            <div className="text-neutral-400">Loading profile...</div>
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
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.push('/profile')}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Profile
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">Create New Profile Version</h1>
              <p className="text-neutral-400">
                Make changes to your profile and save as a new version to track your growth over time.
              </p>
            </div>
          </div>
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
                <span className="text-sm text-green-500">Version Saved!</span>
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
              onClick={() => saveAsNewVersion(true)}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Save as Draft
            </Button>
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Create Version'}
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
            <p className="text-neutral-300 mb-4">
              Your profile is 100% complete! Your AI assistant now has all the information needed to provide personalized guidance.
            </p>
            <Button
              onClick={handleManualSave}
              variant="primary"
              size="lg"
              className="flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Create Final Version
            </Button>
          </div>
        )}
      </Container>
    </PageLayout>
  )
}
