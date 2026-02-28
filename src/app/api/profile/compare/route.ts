import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Profile Version Comparison API
// ============================================================================

// Schema for comparison request
const CompareVersionsSchema = z.object({
  version1Id: z.string().uuid(),
  version2Id: z.string().uuid()
})

// Field category mapping for grouping changes
const FIELD_CATEGORIES: Record<string, string> = {
  // Personal Info
  first_name: 'personal',
  last_name: 'personal',
  email: 'personal',
  phone: 'personal',
  profile_picture_url: 'personal',
  date_of_birth: 'personal',
  gender: 'personal',
  ethnicity: 'personal',
  
  // Career
  employment_type: 'career',
  occupation: 'career',
  company: 'career',
  time_in_role: 'career',
  state_work: 'career',
  
  // Financial
  currency: 'financial',
  household_income: 'financial',
  savings_retirement: 'financial',
  assets_equity: 'financial',
  consumer_debt: 'financial',
  state_money: 'financial',
  
  // Health
  units: 'health',
  height: 'health',
  weight: 'health',
  exercise_frequency: 'health',
  health_conditions: 'health',
  medications: 'health',
  state_health: 'health',
  
  // Location
  city: 'location',
  state: 'location',
  country: 'location',
  postal_code: 'location',
  living_situation: 'location',
  time_at_location: 'location',
  state_home: 'location',
  
  // Relationships
  relationship_status: 'relationships',
  relationship_length: 'relationships',
  partner_name: 'relationships',
  state_love: 'relationships',
  
  // Family
  has_children: 'family',
  number_of_children: 'family',
  children_ages: 'family',
  state_family: 'family',
  
  // Stories (Life Vision - State for remaining categories)
  state_fun: 'stories',
  state_travel: 'stories',
  state_social: 'stories',
  state_stuff: 'stories',
  state_spirituality: 'stories',
  state_giving: 'stories',
  current_story: 'stories',
  desired_story: 'stories',
  
  // Structured Data
  hobbies: 'activities',
  leisure_time_weekly: 'activities',
  travel_frequency: 'activities',
  passport: 'activities',
  countries_visited: 'activities',
  close_friends_count: 'activities',
  social_preference: 'activities',
  lifestyle_category: 'activities',
  spiritual_practice: 'activities',
  meditation_frequency: 'activities',
  personal_growth_focus: 'activities',
  volunteer_status: 'activities',
  charitable_giving: 'activities',
  legacy_mindset: 'activities',
  
  // Education
  education: 'education',
  education_description: 'education',
  
  // Media
  progress_photos: 'media',
  story_recordings: 'media'
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  personal: 'Personal Info',
  career: 'Career',
  financial: 'Financial',
  health: 'Health',
  location: 'Location',
  relationships: 'Relationships',
  family: 'Family',
  stories: 'Life Vision Stories',
  activities: 'Activities & Lifestyle',
  education: 'Education',
  media: 'Media'
}

// Helper function to categorize changes
function categorizeChanges(diff: Record<string, any>) {
  const categorized: Record<string, Array<{ field: string; change: any }>> = {}
  
  Object.entries(diff).forEach(([field, change]) => {
    const category = FIELD_CATEGORIES[field] || 'other'
    if (!categorized[category]) {
      categorized[category] = []
    }
    categorized[category].push({ field, change })
  })
  
  return categorized
}

// Helper function to get field label
function getFieldLabel(fieldName: string): string {
  // Try to get from database function, fallback to mapping
  const labelMap: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    ethnicity: 'Ethnicity',
    relationship_status: 'Relationship Status',
    partner_name: 'Partner Name',
    has_children: 'Has Children',
    number_of_children: 'Number of Children',
    children_ages: 'Children Ages',
    height: 'Height',
    weight: 'Weight',
    exercise_frequency: 'Exercise Frequency',
    city: 'City',
    state: 'State',
    country: 'Country',
    occupation: 'Occupation',
    company: 'Company',
    household_income: 'Household Income',
    state_health: 'Health State',
    state_love: 'Love State',
    state_family: 'Family State',
    state_work: 'Work State',
    state_money: 'Money State',
    state_fun: 'Fun State',
    state_travel: 'Travel State',
    state_social: 'Social State',
    state_home: 'Home State',
    state_stuff: 'Stuff State',
    state_spirituality: 'Spirituality State',
    state_giving: 'Giving State',
    current_story: 'Current Story',
    desired_story: 'Desired Story'
  }
  
  return labelMap[fieldName] || fieldName.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// ============================================================================
// GET /api/profile/compare - Compare two versions
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const version1Id = searchParams.get('version1')
    const version2Id = searchParams.get('version2')

    if (!version1Id || !version2Id) {
      return NextResponse.json(
        { error: 'Both version1 and version2 query parameters are required' },
        { status: 400 }
      )
    }

    if (version1Id === version2Id) {
      return NextResponse.json(
        { error: 'Cannot compare a version to itself' },
        { status: 400 }
      )
    }

    // Get both versions
    const [version1Result, version2Result] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', version1Id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', version2Id)
        .eq('user_id', user.id)
        .single()
    ])

    if (version1Result.error || !version1Result.data) {
      return NextResponse.json(
        { error: 'Version 1 not found or access denied' },
        { status: 404 }
      )
    }

    if (version2Result.error || !version2Result.data) {
      return NextResponse.json(
        { error: 'Version 2 not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate diff using database function
    const { data: diff, error: diffError } = await supabase.rpc(
      'calculate_version_diff',
      {
        p_old_version_id: version1Id,
        p_new_version_id: version2Id,
        p_user_id: user.id
      }
    )

    if (diffError) {
      console.error('Error calculating diff:', diffError)
      return NextResponse.json(
        { error: `Failed to calculate version differences: ${diffError.message || diffError}` },
        { status: 500 }
      )
    }

    // Parse diff if it's a string
    const diffObject = typeof diff === 'string' ? JSON.parse(diff) : diff

    // Categorize changes
    const categorized = categorizeChanges(diffObject)

    // Get version numbers
    const { data: v1Number } = await supabase.rpc('get_profile_version_number', {
      p_profile_id: version1Id
    })
    const { data: v2Number } = await supabase.rpc('get_profile_version_number', {
      p_profile_id: version2Id
    })

    return NextResponse.json({
      version1: {
        id: version1Result.data.id,
        version_number: v1Number || version1Result.data.version_number || 1,
        is_draft: version1Result.data.is_draft,
        is_active: version1Result.data.is_active,
        created_at: version1Result.data.created_at,
        updated_at: version1Result.data.updated_at
      },
      version2: {
        id: version2Result.data.id,
        version_number: v2Number || version2Result.data.version_number || 1,
        is_draft: version2Result.data.is_draft,
        is_active: version2Result.data.is_active,
        created_at: version2Result.data.created_at,
        updated_at: version2Result.data.updated_at
      },
      diff: diffObject,
      categorized,
      summary: {
        totalChanges: Object.keys(diffObject).length,
        categories: Object.keys(categorized).map(cat => ({
          name: cat,
          label: CATEGORY_LABELS[cat] || cat,
          count: categorized[cat].length
        }))
      },
      fieldLabels: Object.keys(diffObject).reduce((acc, field) => {
        acc[field] = getFieldLabel(field)
        return acc
      }, {} as Record<string, string>)
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/profile/compare:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

