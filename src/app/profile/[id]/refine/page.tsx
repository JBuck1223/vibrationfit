'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { 
  Button, 
  Card,
  Spinner,
  Icon,
  VersionBadge,
  StatusBadge,
  Badge,
  Container,
  CategoryCard,
  AutoResizeTextarea
} from '@/lib/design-system/components'
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  CheckCircle,
  Check,
  Copy,
  User,
  Heart,
  Users,
  Activity,
  MapPin,
  Briefcase,
  DollarSign,
  Plane,
  Package,
  UserPlus,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/supabase/profile'
import { 
  getParentProfile, 
  getChangedSections, 
  getChangedFields
} from '@/lib/profile/draft-helpers'
import { ProfileField } from '../../components/ProfileField'
import { colors } from '@/lib/design-system/tokens'

const NEON_YELLOW = colors.energy.yellow[500]

// Profile sections (matching the 12 life categories + personal info)
const PROFILE_CATEGORIES = [
  { key: 'personal', label: 'Personal Info', icon: User, order: 0 },
  { key: 'fun', label: 'Fun', icon: Sparkles, order: 1 },
  { key: 'health', label: 'Health', icon: Activity, order: 2 },
  { key: 'travel', label: 'Travel', icon: Plane, order: 3 },
  { key: 'love', label: 'Love', icon: Heart, order: 4 },
  { key: 'family', label: 'Family', icon: Users, order: 5 },
  { key: 'social', label: 'Social', icon: UserPlus, order: 6 },
  { key: 'home', label: 'Home', icon: MapPin, order: 7 },
  { key: 'work', label: 'Work', icon: Briefcase, order: 8 },
  { key: 'money', label: 'Money', icon: DollarSign, order: 9 },
  { key: 'stuff', label: 'Possessions', icon: Package, order: 10 },
  { key: 'giving', label: 'Giving', icon: Heart, order: 11 },
  { key: 'spirituality', label: 'Spirituality', icon: Sparkles, order: 12 },
]

export default function ProfileRefinePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const profileId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [activeProfile, setActiveProfile] = useState<Partial<UserProfile> | null>(null)
  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile> | null>(null)
  const [changedFields, setChangedFields] = useState<string[]>([])
  const [changedSections, setChangedSections] = useState<Record<string, string[]>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('section') || 'personal')
  const [showCurrent, setShowCurrent] = useState(true)
  const [showDraft, setShowDraft] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Load profiles once
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true)

        // Get user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }
        setUser(currentUser)

        // Fetch draft profile
        const { data: draft, error: draftError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', profileId)
          .eq('user_id', currentUser.id)
          .single()

        if (draftError || !draft) {
          console.error('Draft not found:', draftError)
          router.push('/profile')
          return
        }

        if (!draft.is_draft) {
          console.log('Not a draft, redirecting to view page')
          router.push(`/profile/${profileId}`)
          return
        }

        setDraftProfile(draft)

        // Fetch parent (active) profile
        if (draft.parent_id) {
          const parent = await getParentProfile(draft.parent_id)
          if (parent) {
            setActiveProfile(parent)
            
            // Calculate changed fields
            const changed = getChangedFields(draft, parent)
            const sections = getChangedSections(draft, parent)
            
            setChangedFields(changed)
            setChangedSections(sections)
          }
        } else {
          // No parent, try to find active profile
          const { data: active } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .eq('is_draft', false)
            .single()

          if (active) {
            setActiveProfile(active)
            const changed = getChangedFields(draft, active)
            const sections = getChangedSections(draft, active)
            setChangedFields(changed)
            setChangedSections(sections)
          }
        }
      } catch (err) {
        console.error('Error loading profiles:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [profileId, router, supabase])

  // Handle category selection (no refresh!)
  const handleCategorySelect = (categoryKey: string) => {
    setSelectedCategory(categoryKey)
    
    // Update URL without refresh
    const currentPath = window.location.pathname
    router.replace(`${currentPath}?section=${categoryKey}`, { scroll: false })
  }

  // Get current section info
  const currentSection = PROFILE_CATEGORIES.find(cat => cat.key === selectedCategory)
  
  // Count refined sections from calculated changes
  const refinedSectionCount = Object.keys(changedSections).filter(
    key => changedSections[key].length > 0
  ).length

  // Check if field has changed (use calculated changedFields array)
  const isFieldChanged = (fieldKey: string): boolean => {
    return changedFields.includes(fieldKey)
  }

  // Render field with optional yellow highlighting
  const renderField = (props: any, showHighlight: boolean = false) => {
    const isChanged = showHighlight && isFieldChanged(props.fieldKey)
    
    return (
      <div
        key={props.fieldKey}
        className={`${isChanged ? 'rounded-lg p-3' : ''}`}
        style={isChanged ? { 
          border: `2px solid ${NEON_YELLOW}80`,
          backgroundColor: `${NEON_YELLOW}10`
        } : undefined}
      >
        <ProfileField
          {...props}
          editable={false}
          autoEdit={false}
        />
      </div>
    )
  }

  // Render section fields
  const renderSectionFields = (profile: Partial<UserProfile>, showHighlight: boolean = false) => {
    if (!selectedCategory) return null

    switch (selectedCategory) {
      case 'personal':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Email', value: profile.email, fieldKey: 'email', type: 'text' }, showHighlight)}
            {renderField({ label: 'Phone', value: profile.phone, fieldKey: 'phone', type: 'text' }, showHighlight)}
            {renderField({ label: 'Date of Birth', value: profile.date_of_birth, fieldKey: 'date_of_birth', type: 'text' }, showHighlight)}
            {renderField({ label: 'Gender', value: profile.gender, fieldKey: 'gender', type: 'text' }, showHighlight)}
            {renderField({ label: 'Ethnicity', value: profile.ethnicity, fieldKey: 'ethnicity', type: 'text' }, showHighlight)}
          </div>
        )
      
      case 'love':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Status', value: profile.relationship_status, fieldKey: 'relationship_status' }, showHighlight)}
            {renderField({ label: 'Partner', value: profile.partner_name, fieldKey: 'partner_name' }, showHighlight)}
            {renderField({ label: 'Relationship Length', value: profile.relationship_length, fieldKey: 'relationship_length' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_love, fieldKey: 'clarity_love', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_love, fieldKey: 'dream_love', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_love, fieldKey: 'contrast_love', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_love, fieldKey: 'worry_love', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'family':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Has Children', value: profile.has_children, fieldKey: 'has_children', type: 'boolean' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_family, fieldKey: 'clarity_family', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_family, fieldKey: 'dream_family', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_family, fieldKey: 'contrast_family', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_family, fieldKey: 'worry_family', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'health':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Height', value: profile.height, fieldKey: 'height', type: 'number' }, showHighlight)}
            {renderField({ label: 'Weight', value: profile.weight, fieldKey: 'weight', type: 'number' }, showHighlight)}
            {renderField({ label: 'Exercise Frequency', value: profile.exercise_frequency, fieldKey: 'exercise_frequency' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_health, fieldKey: 'clarity_health', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_health, fieldKey: 'dream_health', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_health, fieldKey: 'contrast_health', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_health, fieldKey: 'worry_health', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'home':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Living Situation', value: profile.living_situation, fieldKey: 'living_situation' }, showHighlight)}
            {renderField({ label: 'City', value: profile.city, fieldKey: 'city' }, showHighlight)}
            {renderField({ label: 'State', value: profile.state, fieldKey: 'state' }, showHighlight)}
            {renderField({ label: 'Country', value: profile.country, fieldKey: 'country' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_home, fieldKey: 'clarity_home', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_home, fieldKey: 'dream_home', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_home, fieldKey: 'contrast_home', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_home, fieldKey: 'worry_home', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'work':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Employment Type', value: profile.employment_type, fieldKey: 'employment_type' }, showHighlight)}
            {renderField({ label: 'Occupation', value: profile.occupation, fieldKey: 'occupation' }, showHighlight)}
            {renderField({ label: 'Company', value: profile.company, fieldKey: 'company' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_work, fieldKey: 'clarity_work', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_work, fieldKey: 'dream_work', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_work, fieldKey: 'contrast_work', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_work, fieldKey: 'worry_work', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'money':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Household Income', value: profile.household_income, fieldKey: 'household_income' }, showHighlight)}
            {renderField({ label: 'Savings & Retirement', value: profile.savings_retirement, fieldKey: 'savings_retirement' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_money, fieldKey: 'clarity_money', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_money, fieldKey: 'dream_money', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_money, fieldKey: 'contrast_money', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_money, fieldKey: 'worry_money', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'fun':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Hobbies', value: profile.hobbies, fieldKey: 'hobbies', type: 'array' }, showHighlight)}
            {renderField({ label: 'Leisure Time Weekly', value: profile.leisure_time_weekly, fieldKey: 'leisure_time_weekly' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_fun, fieldKey: 'clarity_fun', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_fun, fieldKey: 'dream_fun', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_fun, fieldKey: 'contrast_fun', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_fun, fieldKey: 'worry_fun', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'travel':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Travel Frequency', value: profile.travel_frequency, fieldKey: 'travel_frequency' }, showHighlight)}
            {renderField({ label: 'Countries Visited', value: profile.countries_visited, fieldKey: 'countries_visited', type: 'number' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_travel, fieldKey: 'clarity_travel', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_travel, fieldKey: 'dream_travel', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_travel, fieldKey: 'contrast_travel', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_travel, fieldKey: 'worry_travel', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'social':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Close Friends Count', value: profile.close_friends_count, fieldKey: 'close_friends_count' }, showHighlight)}
            {renderField({ label: 'Social Preference', value: profile.social_preference, fieldKey: 'social_preference' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_social, fieldKey: 'clarity_social', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_social, fieldKey: 'dream_social', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_social, fieldKey: 'contrast_social', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_social, fieldKey: 'worry_social', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'stuff':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Lifestyle Category', value: profile.lifestyle_category, fieldKey: 'lifestyle_category' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_stuff, fieldKey: 'clarity_stuff', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_stuff, fieldKey: 'dream_stuff', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_stuff, fieldKey: 'contrast_stuff', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_stuff, fieldKey: 'worry_stuff', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'spirituality':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Spiritual Practice', value: profile.spiritual_practice, fieldKey: 'spiritual_practice' }, showHighlight)}
            {renderField({ label: 'Meditation Frequency', value: profile.meditation_frequency, fieldKey: 'meditation_frequency' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_spirituality, fieldKey: 'clarity_spirituality', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_spirituality, fieldKey: 'dream_spirituality', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_spirituality, fieldKey: 'contrast_spirituality', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_spirituality, fieldKey: 'worry_spirituality', type: 'story' }, showHighlight)}
          </div>
        )
      
      case 'giving':
        return (
          <div className="space-y-4">
            {renderField({ label: 'Volunteer Status', value: profile.volunteer_status, fieldKey: 'volunteer_status' }, showHighlight)}
            {renderField({ label: 'Charitable Giving', value: profile.charitable_giving, fieldKey: 'charitable_giving' }, showHighlight)}
            {renderField({ label: "What's going well?", value: profile.clarity_giving, fieldKey: 'clarity_giving', type: 'story' }, showHighlight)}
            {renderField({ label: 'Dreams', value: profile.dream_giving, fieldKey: 'dream_giving', type: 'story' }, showHighlight)}
            {renderField({ label: "What's not working?", value: profile.contrast_giving, fieldKey: 'contrast_giving', type: 'story' }, showHighlight)}
            {renderField({ label: 'Worries', value: profile.worry_giving, fieldKey: 'worry_giving', type: 'story' }, showHighlight)}
          </div>
        )
      
      default:
        return <p className="text-neutral-400">Section not yet implemented</p>
    }
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

  if (!draftProfile || !activeProfile) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Profile not found</h2>
          <p className="text-neutral-400 mb-6">Unable to load profiles for comparison.</p>
          <Button onClick={() => router.push('/profile')}>
            Back to Profile
          </Button>
        </Card>
      </Container>
    )
  }

  const changedFieldCount = changedFields.length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  PROFILE COMPARISON
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                  Review Profile Changes
                </h1>
                <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                  Compare active and draft profiles side-by-side by section
                </p>
              </div>
              
              {/* Version Info */}
              <div className="text-center mb-6">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  <VersionBadge 
                    versionNumber={draftProfile.version_number || 1} 
                    status="draft" 
                  />
                  <StatusBadge 
                    status="draft" 
                    subtle={true}
                    className="uppercase tracking-[0.25em]"
                  />
                  <span className="text-neutral-300 text-xs md:text-sm">
                    Created: {new Date(draftProfile.created_at || '').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  </span>
                  {refinedSectionCount > 0 && (
                    <Badge 
                      variant="warning" 
                      className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30"
                    >
                      {refinedSectionCount} of {PROFILE_CATEGORIES.length} Sections Changed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-3xl mx-auto">
                <Button
                  onClick={() => router.push(`/profile/${profileId}/draft`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Icon icon={Eye} size="sm" className="shrink-0" />
                  <span>View Draft</span>
                </Button>
                
                {changedFieldCount > 0 && (
                  <Button
                    onClick={() => router.push(`/profile/${profileId}/draft`)}
                    variant="primary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                  >
                    <Icon icon={CheckCircle} size="sm" className="shrink-0" />
                    <span>Review & Commit</span>
                  </Button>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose a Section to Compare</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-2">
          {PROFILE_CATEGORIES.map((category) => {
            const isRefined = (changedSections[category.key]?.length || 0) > 0
            return (
              <div key={category.key} className="relative">
                {isRefined && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#333] border-2 border-[#FFFF00] flex items-center justify-center z-10">
                    <Check className="w-3 h-3 text-[#FFFF00]" strokeWidth={3} />
                  </div>
                )}
                <CategoryCard 
                  category={category} 
                  selected={selectedCategory === category.key} 
                  variant="outlined"
                  selectionStyle="border"
                  iconColor={isRefined ? NEON_YELLOW : (selectedCategory === category.key ? "#39FF14" : "#FFFFFF")}
                  selectedIconColor={isRefined ? NEON_YELLOW : "#39FF14"}
                  className={selectedCategory === category.key ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : ''}
                  onClick={() => handleCategorySelect(category.key)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Section & Draft Display */}
      {selectedCategory && currentSection && (
        <div className="mb-8">
          {/* Mobile Toggle Buttons */}
          <div className="lg:hidden mb-4 space-y-2">
            <Button
              onClick={() => setShowCurrent(!showCurrent)}
              variant={showCurrent ? "primary" : "outline"}
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              {showCurrent ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showCurrent ? 'Hide' : 'Show'} Active Profile
            </Button>
            <Button
              onClick={() => setShowDraft(!showDraft)}
              variant={showDraft ? "draft" : "outline"}
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              {showDraft ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showDraft ? 'Hide' : 'Show'} Draft Profile
            </Button>
          </div>

          {/* Desktop Toggle Buttons */}
          <div className="hidden lg:flex gap-4 mb-4">
            <Button
              onClick={() => setShowCurrent(!showCurrent)}
              variant={showCurrent ? "primary" : "outline"}
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              {showCurrent ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showCurrent ? 'Hide' : 'Show'} Active Profile
            </Button>
            <Button
              onClick={() => setShowDraft(!showDraft)}
              variant={showDraft ? "draft" : "outline"}
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              {showDraft ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showDraft ? 'Hide' : 'Show'} Draft Profile
            </Button>
          </div>

          <div className={`space-y-6 ${showCurrent && showDraft ? 'lg:grid lg:grid-cols-2' : ''} lg:gap-6 lg:space-y-0`}>
            {/* Active Profile (Left) */}
            <div className={`${showCurrent ? 'block' : 'hidden'}`}>
              <Card>
                {/* Centered Header */}
                <div className="text-center mb-4 md:mb-6 lg:mb-8">
                  <h3 className="text-sm font-semibold text-primary-500 tracking-widest mb-3">
                    ACTIVE PROFILE
                  </h3>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <currentSection.icon className="w-6 h-6 text-primary-500" />
                    <span className="text-base font-semibold text-primary-500">
                      {currentSection.label}
                    </span>
                  </div>
                </div>
                
                {/* Section content */}
                {renderSectionFields(activeProfile, false)}
              </Card>
            </div>

            {/* Draft Profile (Right) with Yellow Highlights */}
            <div className={`${showDraft ? 'block' : 'hidden'}`}>
              <Card>
                {/* Centered Header */}
                <div className="text-center mb-4 md:mb-6 lg:mb-8">
                  <h3 className="text-sm font-semibold tracking-widest mb-3" style={{ color: NEON_YELLOW }}>
                    DRAFT PROFILE
                  </h3>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <currentSection.icon className="w-6 h-6" style={{ color: NEON_YELLOW }} />
                    <span className="text-base font-semibold" style={{ color: NEON_YELLOW }}>
                      {currentSection.label}
                    </span>
                  </div>
                </div>
                
                {/* Section content with yellow highlights */}
                {renderSectionFields(draftProfile, true)}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
