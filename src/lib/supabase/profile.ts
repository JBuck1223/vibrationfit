import { createClient } from './server'

export interface UserProfile {
  id?: string
  user_id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  profile_picture_url?: string | null
  date_of_birth?: string | null
  gender?: string | null
  ethnicity?: string | null
  relationship_status?: string | null
  relationship_length?: string | null
  partner_name?: string | null
  has_children?: boolean | null
  number_of_children?: number | null // Deprecated - use children array instead
  children_ages?: string[] | null // Deprecated - use children array instead
  children?: Array<{
    first_name: string
    birthday?: string | null
  }> | null
  units?: string | null
  height?: number | null
  weight?: number | null
  exercise_frequency?: string | null
  health_conditions?: string | null
  medications?: string | null
  living_situation?: string | null
  time_at_location?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  employment_type?: string | null
  occupation?: string | null
  company?: string | null
  time_in_role?: string | null
  education?: string | null
  education_description?: string | null
  currency?: string | null
  household_income?: string | null
  savings_retirement?: string | null
  assets_equity?: string | null
  consumer_debt?: string | null
  version_notes?: string | null
  progress_photos?: string[] | null
  story_recordings?: Array<{
    url: string
    transcript: string
    type: 'audio' | 'video'
    category: string
    duration?: number
    created_at: string
  }> | null
  // Life Vision Clarity Fields (12 categories) - What's going well?
  clarity_fun?: string | null
  clarity_health?: string | null
  clarity_travel?: string | null
  clarity_love?: string | null
  clarity_family?: string | null
  clarity_social?: string | null
  clarity_home?: string | null
  clarity_work?: string | null
  clarity_money?: string | null
  clarity_stuff?: string | null
  clarity_giving?: string | null
  clarity_spirituality?: string | null
  // Life Vision Contrast Fields (12 categories) - What's not going well?
  contrast_fun?: string | null
  contrast_health?: string | null
  contrast_travel?: string | null
  contrast_love?: string | null
  contrast_family?: string | null
  contrast_social?: string | null
  contrast_home?: string | null
  contrast_work?: string | null
  contrast_money?: string | null
  contrast_stuff?: string | null
  contrast_giving?: string | null
  contrast_spirituality?: string | null
  // Structured Data Fields (12 categories)
  // Fun & Recreation
  hobbies?: string[] | null
  leisure_time_weekly?: string | null
  // Travel & Adventure
  travel_frequency?: 'never' | 'yearly' | 'quarterly' | 'monthly' | null
  passport?: boolean | null
  countries_visited?: number | null
  trips?: Array<{
    destination: string
    year?: string | null
    duration?: string | null
  }> | null
  // Social & Friends
  close_friends_count?: string | null
  social_preference?: 'introvert' | 'ambivert' | 'extrovert' | null
  // Possessions & Lifestyle
  lifestyle_category?: 'minimalist' | 'moderate' | 'comfortable' | 'luxury' | null
  vehicles?: Array<{
    name: string
    year_acquired?: string | null
    ownership_status: 'paid_in_full' | 'own_with_payment' | 'leased' | 'borrowed'
  }> | null
  toys?: Array<{
    name: string
    year_acquired?: string | null
    ownership_status: 'paid_in_full' | 'own_with_payment' | 'leased' | 'borrowed'
  }> | null
  // Spirituality & Growth
  spiritual_practice?: string | null
  meditation_frequency?: string | null
  personal_growth_focus?: boolean | null
  // Giving & Legacy
  volunteer_status?: string | null
  charitable_giving?: string | null
  legacy_mindset?: boolean | null
  ai_tags?: any | null
  created_at?: string
  updated_at?: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profile])
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

export async function upsertUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ ...profile, user_id: userId }, { 
      onConflict: 'user_id',
      ignoreDuplicates: false 
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    return null
  }

  return data
}

export async function getProfileCompletionPercentage(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('get_profile_completion_percentage', { user_uuid: userId })

  if (error) {
    console.error('Error getting profile completion percentage:', error)
    return 0
  }

  return data || 0
}

export async function deleteUserProfile(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting user profile:', error)
    return false
  }

  return true
}

/**
 * Get the active profile for a user (single source of truth)
 * This is the ONLY function that should be used to fetch the active profile
 * Filters by is_active = true to ensure we get the correct profile
 */
export async function getActiveProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    // Only log if it's not a "no rows" error
    if (error.code && error.code !== 'PGRST116') {
      console.error('Error fetching active profile:', error)
    }
    return null
  }

  return data as UserProfile | null
}

/**
 * Get active profile with specific fields only (for lightweight queries)
 * Useful for components that only need basic info like Header
 */
export async function getActiveProfileFields(
  userId: string, 
  fields: Array<keyof UserProfile>
): Promise<Partial<UserProfile> | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select(fields.join(', '))
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    // Only log if it's not a "no rows" error
    if (error.code && error.code !== 'PGRST116') {
      console.error('Error fetching active profile fields:', error)
    }
    return null
  }

  return data as Partial<UserProfile> | null
}
