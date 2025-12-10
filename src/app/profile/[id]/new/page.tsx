'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Card, StatusBadge, Spinner, Container, Icon } from '@/lib/design-system/components'
import { ProfileSidebar } from '../../components/ProfileSidebar'
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
import { createClient } from '@/lib/supabase/client'
import { getParentProfile, getChangedSections, getChangedFields } from '@/lib/profile/draft-helpers'
import { Save, AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { colors } from '@/lib/design-system/tokens'

// Neon Yellow from design tokens
const NEON_YELLOW = colors.energy.yellow[500]

export default function NewProfileVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [parentProfile, setParentProfile] = useState<Partial<UserProfile> | null>(null)
  const [changedFields, setChangedFields] = useState<string[]>([])
  const [changedSections, setChangedSections] = useState<Record<string, string[]>>({})
  const [activeSection, setActiveSection] = useState('personal')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

  // Navigation functions
  const getCurrentSectionIndex = () => {
    return profileSections.findIndex(section => section.id === activeSection)
  }

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Load profile and parent for comparison
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Resolve params
        const resolvedParams = await params
        const profileId = resolvedParams.id

        // Fetch the profile being edited
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', profileId)
          .eq('user_id', user.id)
          .single()

        if (profileError || !profileData) {
          setError('Profile not found')
          setIsLoading(false)
          return
        }

        setProfile(profileData)

        // Fetch parent profile if exists
        if (profileData.parent_id) {
          const parent = await getParentProfile(profileData.parent_id)
          if (parent) {
            setParentProfile(parent)
            
            // Calculate changed fields
            const changed = getChangedFields(profileData, parent)
            const sections = getChangedSections(profileData, parent)
            
            console.log('Changed fields:', changed)
            console.log('Changed sections:', sections)
            
            setChangedFields(changed)
            setChangedSections(sections)
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [params, router, supabase])

  // Handle profile updates
  const handleProfileChange = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates }
      
      // Recalculate changed fields if parent exists
      if (parentProfile) {
        const changed = getChangedFields(updated, parentProfile)
        const sections = getChangedSections(updated, parentProfile)
        setChangedFields(changed)
        setChangedSections(sections)
      }
      
      return updated
    })
    setSaveStatus('idle')
  }

  // Handle save
  const handleSave = async () => {
    if (!profile?.id) return

    try {
      setSaveStatus('saving')
      setIsSaving(true)

      const response = await fetch(`/api/profile?profileId=${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (!response.ok) throw new Error('Failed to save profile')

      const { profile: updatedProfile } = await response.json()
      setProfile(updatedProfile)
      setSaveStatus('saved')
      
      // Clear saved status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveStatus('error')
      setError('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if section has changes
  const isSectionChanged = (sectionId: string): boolean => {
    return changedSections[sectionId]?.length > 0
  }

  // Render active section
  const renderActiveSection = () => {
    // Check if current section has changes
    const hasChanges = isSectionChanged(activeSection)
    
    // Wrapper style for sections with changes
    const sectionWrapperStyle = hasChanges ? {
      border: `2px solid ${NEON_YELLOW}40`,
      borderRadius: '12px',
      padding: '16px',
      backgroundColor: `${NEON_YELLOW}08`
    } : {}

    const sectionProps = {
      profile,
      onProfileChange: handleProfileChange,
      onError: setError
    }

    const sectionContent = (() => {
      switch (activeSection) {
        case 'personal':
          return <PersonalInfoSection {...sectionProps} />
        case 'relationship':
          return <RelationshipSection {...sectionProps} />
        case 'family':
          return <FamilySection {...sectionProps} />
        case 'health':
          return <HealthSection {...sectionProps} />
        case 'location':
          return <LocationSection {...sectionProps} />
        case 'career':
          return <CareerSection {...sectionProps} />
        case 'financial':
          return <FinancialSection {...sectionProps} />
        case 'fun-recreation':
          return <FunRecreationSection {...sectionProps} />
        case 'travel-adventure':
          return <TravelAdventureSection {...sectionProps} />
        case 'social-friends':
          return <SocialFriendsSection {...sectionProps} />
        case 'possessions-lifestyle':
          return <PossessionsLifestyleSection {...sectionProps} />
        case 'spirituality-growth':
          return <SpiritualityGrowthSection {...sectionProps} />
        case 'giving-legacy':
          return <GivingLegacySection {...sectionProps} />
        case 'photos-notes':
          return <PhotosAndNotesSection {...sectionProps} />
        default:
          return <PersonalInfoSection {...sectionProps} />
      }
    })()

    return (
      <div style={sectionWrapperStyle}>
        {hasChanges && (
          <div className="mb-4 flex items-center gap-2">
            <Badge 
              variant="warning" 
              className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
            >
              {changedSections[activeSection]?.length || 0} fields changed
            </Badge>
          </div>
        )}
        {sectionContent}
      </div>
    )
  }

  if (isLoading) {
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
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/profile')} variant="primary">
            Back to Profile
          </Button>
        </Card>
      </Container>
    )
  }

  const currentSection = profileSections.find(s => s.id === activeSection)
  const changedFieldCount = changedFields.length

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-4 mb-6">
        <Container size="xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profile')}
              >
                <Icon icon={ArrowLeft} size="sm" />
                <span className="ml-2">Back</span>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Edit Profile</h1>
                {changedFieldCount > 0 && (
                  <Badge 
                    variant="warning" 
                    className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30 mt-1"
                  >
                    {changedFieldCount} {changedFieldCount === 1 ? 'field' : 'fields'} changed
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && (
                <span className="text-primary-500 text-sm flex items-center gap-1">
                  <Icon icon={CheckCircle} size="sm" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-danger-500 text-sm flex items-center gap-1">
                  <Icon icon={AlertCircle} size="sm" />
                  Error
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="primary"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Spinner variant="primary" size="sm" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={Save} size="sm" />
                    <span className="ml-2">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <ProfileSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              profile={profile}
              changedSections={changedSections}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Section Dropdown */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800"
              >
                <div>
                  <h3 className="text-white font-semibold">{currentSection?.title}</h3>
                  <p className="text-neutral-400 text-sm">{currentSection?.description}</p>
                </div>
                <Icon icon={ChevronDown} size="sm" color="#999" />
              </button>
              {isDropdownOpen && (
                <div className="mt-2 bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                  {profileSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        handleSectionChange(section.id)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left p-4 border-b border-neutral-800 last:border-b-0 ${
                        activeSection === section.id ? 'bg-neutral-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{section.title}</h4>
                          <p className="text-neutral-400 text-sm">{section.description}</p>
                        </div>
                        {isSectionChanged(section.id) && (
                          <Badge 
                            variant="warning" 
                            className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
                          >
                            •
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Section Content */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{currentSection?.title}</h2>
                {isSectionChanged(activeSection) && (
                  <Badge 
                    variant="warning" 
                    className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
                  >
                    {changedSections[activeSection]?.length || 0} fields changed
                  </Badge>
                )}
              </div>

              {renderActiveSection()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-neutral-800">
                <Button
                  onClick={goToPreviousSection}
                  disabled={isFirstSection()}
                  variant="outline"
                >
                  <Icon icon={ChevronLeft} size="sm" />
                  <span className="ml-2">Previous</span>
                </Button>
                <Button
                  onClick={goToNextSection}
                  disabled={isLastSection()}
                  variant="primary"
                >
                  <span className="mr-2">Next</span>
                  <Icon icon={ChevronRight} size="sm" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  )
}

