'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Eye, Edit3, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDraftProfile, getParentProfile, getChangedFields, getChangedSections, commitDraft } from '@/lib/profile/draft-helpers'
import { UserProfile } from '@/lib/supabase/profile'
import { 
  Button, 
  Card, 
  Spinner,
  Icon,
  VersionBadge,
  StatusBadge,
  WarningConfirmationDialog,
  Badge,
  Container
} from '@/lib/design-system/components'
import { ProfileField } from '../../components/ProfileField'
import { colors } from '@/lib/design-system/tokens'
import { 
  User, Heart, Users, Activity, MapPin, Briefcase, DollarSign,
  Plane, Package, UserPlus, Sparkles, Camera
} from 'lucide-react'

// Neon Yellow from design tokens
const NEON_YELLOW = colors.energy.yellow[500]

// Profile sections mapping
const profileSections = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'relationship', title: 'Love', icon: Heart },
  { id: 'family', title: 'Family', icon: Users },
  { id: 'health', title: 'Health', icon: Activity },
  { id: 'location', title: 'Home', icon: MapPin },
  { id: 'career', title: 'Work', icon: Briefcase },
  { id: 'financial', title: 'Money', icon: DollarSign },
  { id: 'fun-recreation', title: 'Fun', icon: Sparkles },
  { id: 'travel-adventure', title: 'Travel', icon: Plane },
  { id: 'social-friends', title: 'Social', icon: UserPlus },
  { id: 'possessions-lifestyle', title: 'Possessions', icon: Package },
  { id: 'spirituality-growth', title: 'Spirituality', icon: Sparkles },
  { id: 'giving-legacy', title: 'Giving', icon: Heart },
  { id: 'photos-notes', title: 'Photos & Notes', icon: Camera }
]

export default function ProfileDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile> | null>(null)
  const [parentProfile, setParentProfile] = useState<Partial<UserProfile> | null>(null)
  const [changedFields, setChangedFields] = useState<string[]>([])
  const [changedSections, setChangedSections] = useState<Record<string, string[]>>({})
  const [isCommitting, setIsCommitting] = useState(false)
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [isNotDraft, setIsNotDraft] = useState(false)
  const [activeProfile, setActiveProfile] = useState<Partial<UserProfile> | null>(null)
  const [user, setUser] = useState<any>(null)

  // Load draft profile
  const loadDraftProfile = useCallback(async (draftId: string, userId: string) => {
    try {
      console.log('Loading draft profile:', draftId)
      
      // Fetch the draft
      const { data: draftData, error: draftError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', userId)
        .single()

      if (draftError || !draftData || !draftData.is_draft) {
        // Try to fetch as active profile to show "create draft" prompt
        const { data: activeData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', draftId)
          .eq('user_id', userId)
          .single()

        if (activeData && !activeData.is_draft) {
          setError('This Profile ID is not a draft.')
          setIsNotDraft(true)
          setActiveProfile(activeData)
          return
        }

        throw new Error('Draft profile not found')
      }

      console.log('Draft profile loaded:', draftData)
      setDraftProfile(draftData)

      // Fetch parent profile if it exists
      if (draftData.parent_id) {
        const parent = await getParentProfile(draftData.parent_id)
        if (parent) {
          setParentProfile(parent)
          
          // Calculate changed fields
          const changed = getChangedFields(draftData, parent)
          const sections = getChangedSections(draftData, parent)
          
          console.log('Changed fields:', changed)
          console.log('Changed sections:', sections)
          
          setChangedFields(changed)
          setChangedSections(sections)
        }
      }
    } catch (err) {
      console.error('Error loading draft profile:', err)
      setError('Failed to load draft profile')
    }
  }, [supabase])

  useEffect(() => {
    const loadProfileById = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }
        setUser(currentUser)

        // Resolve params
        const resolvedParams = await params
        const profileId = resolvedParams.id

        console.log('Loading profile by ID:', profileId)

        // Load the draft profile
        await loadDraftProfile(profileId, currentUser.id)
      } catch (err) {
        console.error('Error in loadProfileById:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfileById()
  }, [params, router, supabase, loadDraftProfile])

  // Handle creating a draft from active profile
  const handleCreateDraft = async () => {
    if (!activeProfile || !user) return

    try {
      setLoading(true)
      
      // Check if draft already exists
      const { data: existingDraft } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (existingDraft) {
        router.push(`/profile/${existingDraft.id}/draft`)
        return
      }

      // Create draft via API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: activeProfile,
          saveAsVersion: true,
          isDraft: true,
          sourceProfileId: activeProfile.id
        })
      })

      if (!response.ok) throw new Error('Failed to create draft')

      const { version } = await response.json()
      router.push(`/profile/${version.id}/draft`)
    } catch (err) {
      console.error('Error creating draft:', err)
      alert('Failed to create draft')
    } finally {
      setLoading(false)
    }
  }

  // Handle field save
  const handleFieldSave = async (fieldKey: string, newValue: any) => {
    if (!draftProfile) return

    try {
      const response = await fetch(`/api/profile?profileId=${draftProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: newValue })
      })

      if (!response.ok) throw new Error('Failed to save field')

      // Reload draft to get updated data
      const { data: updatedDraft } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', draftProfile.id)
        .single()

      if (updatedDraft) {
        setDraftProfile(updatedDraft)
        
        // Recalculate changed fields
        if (parentProfile) {
          const changed = getChangedFields(updatedDraft, parentProfile)
          const sections = getChangedSections(updatedDraft, parentProfile)
          setChangedFields(changed)
          setChangedSections(sections)
        }
      }
    } catch (err) {
      console.error('Error saving field:', err)
      throw err
    }
  }

  // Show commit confirmation dialog
  const handleCommitAsActive = () => {
    if (!draftProfile) {
      alert('No draft profile to commit')
      return
    }

    if (changedFields.length === 0) {
      alert('No changes to commit')
      return
    }

    setShowCommitDialog(true)
  }

  // Confirm commit
  const confirmCommit = async () => {
    if (!draftProfile) return

    setShowCommitDialog(false)
    setIsCommitting(true)

    try {
      const committedProfile = await commitDraft(draftProfile.id as string)
      
      // Navigate to the new active profile
      router.push(`/profile/${committedProfile.id}`)
    } catch (err) {
      console.error('Error committing draft:', err)
      alert('Failed to commit draft as active profile')
    } finally {
      setIsCommitting(false)
    }
  }

  // Check if field is changed
  const isFieldChanged = (fieldKey: string): boolean => {
    return changedFields.includes(fieldKey)
  }

  // Render field with yellow highlighting if changed
  const renderField = (props: any) => {
    const isChanged = isFieldChanged(props.fieldKey)
    
    return (
      <div
        className={`rounded-lg p-3 ${isChanged ? '' : ''}`}
        style={isChanged ? { 
          border: `2px solid ${NEON_YELLOW}80`,
          backgroundColor: `${NEON_YELLOW}10`
        } : undefined}
      >
        <ProfileField
          {...props}
          editable={true}
          onSave={handleFieldSave}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
      </Container>
    )
  }

  if (error && isNotDraft && activeProfile) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <div className="text-secondary-400 mb-4">
            <Icon icon={Eye} size="xl" className="mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">This Profile is Not a Draft</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <p className="text-neutral-400 mb-6">Would you like to create a draft from this profile?</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleCreateDraft} variant="primary">
              Create Draft
            </Button>
            <Button onClick={() => router.push('/profile')} variant="outline">
              Back to Profile
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Draft</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => router.push('/profile')} variant="outline">
              Back to Profile
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  if (!draftProfile) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Draft not found</h2>
          <p className="text-neutral-400 mb-6">This draft doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/profile">Back to Profile</Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const changedFieldCount = changedFields.length
  const totalSections = profileSections.length
  const sectionsWithChanges = Object.keys(changedSections).filter(
    key => changedSections[key].length > 0
  ).length

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  DRAFT PROFILE
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                  Refine Your Profile
                </h1>
                <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                  Changed fields will show in yellow. Once you are happy with your changes, click "Commit as Active Profile".
                </p>
              </div>
              
              {/* Centered Version Info */}
              <div className="text-center mb-6">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  <VersionBadge 
                    versionNumber={draftProfile.version_number || 1} 
                    status="draft" 
                  />
                  <StatusBadge status="draft" subtle={true} className="uppercase tracking-[0.25em]" />
                  <span className="text-neutral-300 text-xs md:text-sm">
                    Created: {new Date(draftProfile.created_at || '').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  </span>
                  {changedFieldCount > 0 && (
                    <Badge 
                      variant="warning" 
                      className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
                    >
                      {changedFieldCount} {changedFieldCount === 1 ? 'field' : 'fields'} changed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Icon icon={Eye} size="sm" className="shrink-0" />
                  <span>All Profiles</span>
                </Button>
                <Button
                  onClick={handleCommitAsActive}
                  disabled={isCommitting || changedFieldCount === 0}
                  variant="primary"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  {isCommitting ? (
                    <>
                      <Spinner variant="primary" size="sm" />
                      <span>Committing...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={CheckCircle} size="sm" className="shrink-0" />
                      <span>Commit as Active Profile</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <Container size="xl">
        <div className="space-y-8">
          {profileSections.map((section) => {
            const sectionChanges = changedSections[section.id] || []
            const hasSectionChanges = sectionChanges.length > 0
            
            return (
              <Card key={section.id} className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${!hasSectionChanges ? 'bg-neutral-700' : ''}`}
                    style={hasSectionChanges ? { backgroundColor: `${NEON_YELLOW}33`, border: `2px solid ${NEON_YELLOW}` } : undefined}
                  >
                    <Icon 
                      icon={section.icon} 
                      size="sm" 
                      color={hasSectionChanges ? NEON_YELLOW : '#FFFFFF'} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                    {hasSectionChanges && (
                      <p className="text-sm" style={{ color: NEON_YELLOW }}>
                        {sectionChanges.length} {sectionChanges.length === 1 ? 'field' : 'fields'} changed
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {section.id === 'personal' && (
                    <>
                      {renderField({ label: 'Email', value: draftProfile.email, fieldKey: 'email', type: 'text' })}
                      {renderField({ label: 'Phone', value: draftProfile.phone, fieldKey: 'phone', type: 'text' })}
                      {renderField({ label: 'Date of Birth', value: draftProfile.date_of_birth, fieldKey: 'date_of_birth', type: 'text' })}
                      {renderField({ label: 'Gender', value: draftProfile.gender, fieldKey: 'gender', type: 'select', selectOptions: [
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Prefer not to say', label: 'Prefer not to say' }
                      ]})}
                      {renderField({ label: 'Ethnicity', value: draftProfile.ethnicity, fieldKey: 'ethnicity', type: 'select', selectOptions: [
                        { value: 'Asian', label: 'Asian' },
                        { value: 'Black', label: 'Black' },
                        { value: 'Hispanic', label: 'Hispanic' },
                        { value: 'White', label: 'White' },
                        { value: 'Other', label: 'Other' }
                      ]})}
                    </>
                  )}
                  
                  {section.id === 'relationship' && (
                    <>
                      {renderField({ label: 'Status', value: draftProfile.relationship_status, fieldKey: 'relationship_status', type: 'select', selectOptions: [
                        { value: 'Single', label: 'Single' },
                        { value: 'Dating', label: 'Dating' },
                        { value: 'In a Relationship', label: 'In a Relationship' },
                        { value: 'Married', label: 'Married' }
                      ]})}
                      {renderField({ label: 'Partner', value: draftProfile.partner_name, fieldKey: 'partner_name' })}
                      {renderField({ label: 'Relationship Length', value: draftProfile.relationship_length, fieldKey: 'relationship_length' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_love, fieldKey: 'clarity_love', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_love, fieldKey: 'dream_love', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_love, fieldKey: 'contrast_love', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_love, fieldKey: 'worry_love', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'family' && (
                    <>
                      {renderField({ label: 'Has Children', value: draftProfile.has_children, fieldKey: 'has_children', type: 'boolean' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_family, fieldKey: 'clarity_family', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_family, fieldKey: 'dream_family', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_family, fieldKey: 'contrast_family', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_family, fieldKey: 'worry_family', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'health' && (
                    <>
                      {renderField({ label: 'Height', value: draftProfile.height, fieldKey: 'height', type: 'number' })}
                      {renderField({ label: 'Weight', value: draftProfile.weight, fieldKey: 'weight', type: 'number' })}
                      {renderField({ label: 'Exercise Frequency', value: draftProfile.exercise_frequency, fieldKey: 'exercise_frequency' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_health, fieldKey: 'clarity_health', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_health, fieldKey: 'dream_health', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_health, fieldKey: 'contrast_health', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_health, fieldKey: 'worry_health', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'location' && (
                    <>
                      {renderField({ label: 'Living Situation', value: draftProfile.living_situation, fieldKey: 'living_situation' })}
                      {renderField({ label: 'City', value: draftProfile.city, fieldKey: 'city' })}
                      {renderField({ label: 'State', value: draftProfile.state, fieldKey: 'state' })}
                      {renderField({ label: 'Country', value: draftProfile.country, fieldKey: 'country' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_home, fieldKey: 'clarity_home', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_home, fieldKey: 'dream_home', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_home, fieldKey: 'contrast_home', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_home, fieldKey: 'worry_home', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'career' && (
                    <>
                      {renderField({ label: 'Employment Type', value: draftProfile.employment_type, fieldKey: 'employment_type' })}
                      {renderField({ label: 'Occupation', value: draftProfile.occupation, fieldKey: 'occupation' })}
                      {renderField({ label: 'Company', value: draftProfile.company, fieldKey: 'company' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_work, fieldKey: 'clarity_work', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_work, fieldKey: 'dream_work', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_work, fieldKey: 'contrast_work', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_work, fieldKey: 'worry_work', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'financial' && (
                    <>
                      {renderField({ label: 'Household Income', value: draftProfile.household_income, fieldKey: 'household_income' })}
                      {renderField({ label: 'Savings & Retirement', value: draftProfile.savings_retirement, fieldKey: 'savings_retirement' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_money, fieldKey: 'clarity_money', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_money, fieldKey: 'dream_money', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_money, fieldKey: 'contrast_money', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_money, fieldKey: 'worry_money', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'fun-recreation' && (
                    <>
                      {renderField({ label: 'Hobbies', value: draftProfile.hobbies, fieldKey: 'hobbies', type: 'array' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_fun, fieldKey: 'clarity_fun', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_fun, fieldKey: 'dream_fun', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_fun, fieldKey: 'contrast_fun', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_fun, fieldKey: 'worry_fun', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'travel-adventure' && (
                    <>
                      {renderField({ label: 'Travel Frequency', value: draftProfile.travel_frequency, fieldKey: 'travel_frequency' })}
                      {renderField({ label: 'Countries Visited', value: draftProfile.countries_visited, fieldKey: 'countries_visited', type: 'number' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_travel, fieldKey: 'clarity_travel', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_travel, fieldKey: 'dream_travel', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_travel, fieldKey: 'contrast_travel', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_travel, fieldKey: 'worry_travel', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'social-friends' && (
                    <>
                      {renderField({ label: 'Close Friends Count', value: draftProfile.close_friends_count, fieldKey: 'close_friends_count' })}
                      {renderField({ label: 'Social Preference', value: draftProfile.social_preference, fieldKey: 'social_preference' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_social, fieldKey: 'clarity_social', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_social, fieldKey: 'dream_social', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_social, fieldKey: 'contrast_social', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_social, fieldKey: 'worry_social', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'possessions-lifestyle' && (
                    <>
                      {renderField({ label: 'Lifestyle Category', value: draftProfile.lifestyle_category, fieldKey: 'lifestyle_category' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_stuff, fieldKey: 'clarity_stuff', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_stuff, fieldKey: 'dream_stuff', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_stuff, fieldKey: 'contrast_stuff', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_stuff, fieldKey: 'worry_stuff', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'spirituality-growth' && (
                    <>
                      {renderField({ label: 'Spiritual Practice', value: draftProfile.spiritual_practice, fieldKey: 'spiritual_practice' })}
                      {renderField({ label: 'Meditation Frequency', value: draftProfile.meditation_frequency, fieldKey: 'meditation_frequency' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_spirituality, fieldKey: 'clarity_spirituality', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_spirituality, fieldKey: 'dream_spirituality', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_spirituality, fieldKey: 'contrast_spirituality', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_spirituality, fieldKey: 'worry_spirituality', type: 'story', collapsible: true })}
                    </>
                  )}
                  
                  {section.id === 'giving-legacy' && (
                    <>
                      {renderField({ label: 'Volunteer Status', value: draftProfile.volunteer_status, fieldKey: 'volunteer_status' })}
                      {renderField({ label: 'Charitable Giving', value: draftProfile.charitable_giving, fieldKey: 'charitable_giving' })}
                      {renderField({ label: "What's going well?", value: draftProfile.clarity_giving, fieldKey: 'clarity_giving', type: 'story', collapsible: true })}
                      {renderField({ label: 'Dreams', value: draftProfile.dream_giving, fieldKey: 'dream_giving', type: 'story', collapsible: true })}
                      {renderField({ label: "What's not working?", value: draftProfile.contrast_giving, fieldKey: 'contrast_giving', type: 'story', collapsible: true })}
                      {renderField({ label: 'Worries', value: draftProfile.worry_giving, fieldKey: 'worry_giving', type: 'story', collapsible: true })}
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </Container>

      {/* Commit Confirmation Dialog */}
      <WarningConfirmationDialog
        isOpen={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        onConfirm={confirmCommit}
        title="Commit Draft as Active Profile?"
        message={`Are you sure you want to commit this draft profile with ${changedFieldCount} changed ${changedFieldCount === 1 ? 'field' : 'fields'} as your active profile? This will create a new version.`}
        confirmText={isCommitting ? 'Committing...' : 'Commit as Active Profile'}
        type="commit"
        isLoading={isCommitting}
      />
    </>
  )
}

