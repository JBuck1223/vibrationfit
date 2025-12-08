/**
 * Draft Profile Helper Functions
 * Utilities for managing draft user_profiles rows with change tracking
 */

import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/supabase/profile'

/**
 * Get or create draft profile for user
 * If draft exists, returns it. If not, creates one based on active profile.
 */
export async function ensureDraftExists(activeProfileId: string): Promise<Partial<UserProfile>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Check for existing draft
  const { data: draft } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_draft', true)
    .eq('is_active', false)
    .maybeSingle()
  
  if (draft) {
    return draft as Partial<UserProfile>
  }
  
  // Create draft from active profile
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      saveAsVersion: true,
      isDraft: true,
      sourceProfileId: activeProfileId
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to create draft profile')
  }
  
  const { profile: newDraft } = await response.json()
  return newDraft as Partial<UserProfile>
}

/**
 * Get active profile for user
 */
export async function getActiveProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle()
  
  return data as Partial<UserProfile> | null
}

/**
 * Get draft profile for user (if exists)
 */
export async function getDraftProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
    .maybeSingle()
  
  return data as Partial<UserProfile> | null
}

/**
 * Get parent profile for comparison
 */
export async function getParentProfile(parentId: string): Promise<Partial<UserProfile> | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', parentId)
    .maybeSingle()
  
  return data as Partial<UserProfile> | null
}

/**
 * Update a specific field in draft profile
 */
export async function updateDraftField(
  draftId: string, 
  fieldKey: string, 
  value: any
): Promise<Partial<UserProfile>> {
  const response = await fetch(`/api/profile?profileId=${draftId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [fieldKey]: value })
  })
  
  if (!response.ok) {
    throw new Error('Failed to update draft field')
  }
  
  const { profile } = await response.json()
  return profile as Partial<UserProfile>
}

/**
 * Commit draft as new active profile
 */
export async function commitDraft(draftId: string): Promise<Partial<UserProfile>> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      saveAsVersion: true,
      isDraft: false,
      sourceProfileId: draftId
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to commit draft')
  }
  
  const { profile } = await response.json()
  return profile as Partial<UserProfile>
}

/**
 * Delete draft profile
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const response = await fetch(`/api/profile?versionId=${draftId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete draft')
  }
}

/**
 * Get fields that differ between draft and parent
 * Returns list of field keys that have changed
 */
export function getChangedFields(
  draft: Partial<UserProfile>, 
  parent: Partial<UserProfile>
): string[] {
  const changedFields: string[] = []
  
  // List of fields to check for changes
  const fieldsToCheck: (keyof UserProfile)[] = [
    // Core fields
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'ethnicity',
    'profile_picture_url',
    
    // Relationship
    'relationship_status', 'partner_name', 'relationship_length',
    
    // Family
    'has_children', 'children',
    
    // Health
    'units', 'height', 'weight', 'exercise_frequency',
    
    // Location
    'living_situation', 'time_at_location', 'city', 'state', 'postal_code', 'country',
    
    // Career
    'employment_type', 'occupation', 'company', 'time_in_role', 'education', 'education_description',
    
    // Financial
    'currency', 'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt',
    
    // Life category clarity fields
    'clarity_fun', 'clarity_health', 'clarity_travel', 'clarity_love', 'clarity_family',
    'clarity_social', 'clarity_home', 'clarity_work', 'clarity_money', 'clarity_stuff',
    'clarity_giving', 'clarity_spirituality',
    
    // Life category dream fields
    'dream_fun', 'dream_health', 'dream_travel', 'dream_love', 'dream_family',
    'dream_social', 'dream_home', 'dream_work', 'dream_money', 'dream_stuff',
    'dream_giving', 'dream_spirituality',
    
    // Life category contrast fields
    'contrast_fun', 'contrast_health', 'contrast_travel', 'contrast_love', 'contrast_family',
    'contrast_social', 'contrast_home', 'contrast_work', 'contrast_money', 'contrast_stuff',
    'contrast_giving', 'contrast_spirituality',
    
    // Life category worry fields
    'worry_fun', 'worry_health', 'worry_travel', 'worry_love', 'worry_family',
    'worry_social', 'worry_home', 'worry_work', 'worry_money', 'worry_stuff',
    'worry_giving', 'worry_spirituality',
    
    // Structured fields
    'hobbies', 'leisure_time_weekly', 'travel_frequency', 'passport', 'countries_visited',
    'trips', 'close_friends_count', 'social_preference', 'lifestyle_category', 'vehicles',
    'toys', 'spiritual_practice', 'meditation_frequency', 'personal_growth_focus',
    'volunteer_status', 'charitable_giving', 'legacy_mindset',
    
    // Media
    'progress_photos', 'version_notes'
  ]
  
  for (const field of fieldsToCheck) {
    const draftValue = draft[field]
    const parentValue = parent[field]
    
    // Normalize values for comparison
    const draftNormalized = normalizeValue(draftValue)
    const parentNormalized = normalizeValue(parentValue)
    
    if (draftNormalized !== parentNormalized) {
      changedFields.push(field)
    }
  }
  
  return changedFields
}

/**
 * Normalize value for comparison
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return JSON.stringify(value)
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}

/**
 * Check if a specific field has changed
 */
export function isFieldChanged(
  draft: Partial<UserProfile>,
  parent: Partial<UserProfile>,
  fieldKey: string
): boolean {
  return getChangedFields(draft, parent).includes(fieldKey)
}

/**
 * Get section-level changes (group fields by section)
 */
export function getChangedSections(
  draft: Partial<UserProfile>,
  parent: Partial<UserProfile>
): Record<string, string[]> {
  const changedFields = getChangedFields(draft, parent)
  const sections: Record<string, string[]> = {
    personal: [],
    relationship: [],
    family: [],
    health: [],
    location: [],
    career: [],
    financial: [],
    'fun-recreation': [],
    'travel-adventure': [],
    'social-friends': [],
    'possessions-lifestyle': [],
    'spirituality-growth': [],
    'giving-legacy': [],
    'photos-notes': []
  }
  
  // Map fields to sections
  const fieldToSection: Record<string, string> = {
    first_name: 'personal',
    last_name: 'personal',
    email: 'personal',
    phone: 'personal',
    date_of_birth: 'personal',
    gender: 'personal',
    ethnicity: 'personal',
    profile_picture_url: 'personal',
    
    relationship_status: 'relationship',
    partner_name: 'relationship',
    relationship_length: 'relationship',
    clarity_love: 'relationship',
    dream_love: 'relationship',
    contrast_love: 'relationship',
    worry_love: 'relationship',
    
    has_children: 'family',
    children: 'family',
    clarity_family: 'family',
    dream_family: 'family',
    contrast_family: 'family',
    worry_family: 'family',
    
    units: 'health',
    height: 'health',
    weight: 'health',
    exercise_frequency: 'health',
    clarity_health: 'health',
    dream_health: 'health',
    contrast_health: 'health',
    worry_health: 'health',
    
    living_situation: 'location',
    time_at_location: 'location',
    city: 'location',
    state: 'location',
    postal_code: 'location',
    country: 'location',
    clarity_home: 'location',
    dream_home: 'location',
    contrast_home: 'location',
    worry_home: 'location',
    
    employment_type: 'career',
    occupation: 'career',
    company: 'career',
    time_in_role: 'career',
    education: 'career',
    education_description: 'career',
    clarity_work: 'career',
    dream_work: 'career',
    contrast_work: 'career',
    worry_work: 'career',
    
    currency: 'financial',
    household_income: 'financial',
    savings_retirement: 'financial',
    assets_equity: 'financial',
    consumer_debt: 'financial',
    clarity_money: 'financial',
    dream_money: 'financial',
    contrast_money: 'financial',
    worry_money: 'financial',
    
    hobbies: 'fun-recreation',
    leisure_time_weekly: 'fun-recreation',
    clarity_fun: 'fun-recreation',
    dream_fun: 'fun-recreation',
    contrast_fun: 'fun-recreation',
    worry_fun: 'fun-recreation',
    
    travel_frequency: 'travel-adventure',
    passport: 'travel-adventure',
    countries_visited: 'travel-adventure',
    trips: 'travel-adventure',
    clarity_travel: 'travel-adventure',
    dream_travel: 'travel-adventure',
    contrast_travel: 'travel-adventure',
    worry_travel: 'travel-adventure',
    
    close_friends_count: 'social-friends',
    social_preference: 'social-friends',
    clarity_social: 'social-friends',
    dream_social: 'social-friends',
    contrast_social: 'social-friends',
    worry_social: 'social-friends',
    
    lifestyle_category: 'possessions-lifestyle',
    vehicles: 'possessions-lifestyle',
    toys: 'possessions-lifestyle',
    clarity_stuff: 'possessions-lifestyle',
    dream_stuff: 'possessions-lifestyle',
    contrast_stuff: 'possessions-lifestyle',
    worry_stuff: 'possessions-lifestyle',
    
    spiritual_practice: 'spirituality-growth',
    meditation_frequency: 'spirituality-growth',
    personal_growth_focus: 'spirituality-growth',
    clarity_spirituality: 'spirituality-growth',
    dream_spirituality: 'spirituality-growth',
    contrast_spirituality: 'spirituality-growth',
    worry_spirituality: 'spirituality-growth',
    
    volunteer_status: 'giving-legacy',
    charitable_giving: 'giving-legacy',
    legacy_mindset: 'giving-legacy',
    clarity_giving: 'giving-legacy',
    dream_giving: 'giving-legacy',
    contrast_giving: 'giving-legacy',
    worry_giving: 'giving-legacy',
    
    progress_photos: 'photos-notes',
    version_notes: 'photos-notes'
  }
  
  for (const field of changedFields) {
    const section = fieldToSection[field]
    if (section && sections[section]) {
      sections[section].push(field)
    }
  }
  
  return sections
}

/**
 * Check if user has an active draft
 */
export async function hasDraft(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { count } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
  
  return (count || 0) > 0
}

/**
 * Get refined fields from draft
 */
export function getRefinedFields(draft: Partial<UserProfile>): string[] {
  return draft.refined_fields || []
}

/**
 * Check if specific field is refined
 */
export function isFieldRefined(draft: Partial<UserProfile>, fieldKey: string): boolean {
  return draft.refined_fields?.includes(fieldKey) || false
}

/**
 * Derive refined sections from refined fields
 * This provides section-level view from field-level data
 */
export function getRefinedSections(draft: Partial<UserProfile>): string[] {
  const refinedFields = getRefinedFields(draft)
  const sections = new Set<string>()
  
  // Map fields to their sections
  const fieldToSection: Record<string, string> = {
    // Personal
    'email': 'personal', 
    'phone': 'personal', 
    'date_of_birth': 'personal',
    'gender': 'personal', 
    'ethnicity': 'personal',
    'first_name': 'personal',
    'last_name': 'personal',
    'profile_picture_url': 'personal',
    
    // Love
    'relationship_status': 'love', 
    'partner_name': 'love', 
    'relationship_length': 'love', 
    'clarity_love': 'love',
    'dream_love': 'love', 
    'contrast_love': 'love', 
    'worry_love': 'love',
    
    // Family
    'has_children': 'family', 
    'children': 'family',
    'clarity_family': 'family',
    'dream_family': 'family', 
    'contrast_family': 'family', 
    'worry_family': 'family',
    
    // Health
    'units': 'health',
    'height': 'health', 
    'weight': 'health', 
    'exercise_frequency': 'health',
    'clarity_health': 'health', 
    'dream_health': 'health',
    'contrast_health': 'health', 
    'worry_health': 'health',
    
    // Home
    'living_situation': 'home', 
    'time_at_location': 'home',
    'city': 'home', 
    'state': 'home', 
    'postal_code': 'home',
    'country': 'home',
    'clarity_home': 'home', 
    'dream_home': 'home',
    'contrast_home': 'home', 
    'worry_home': 'home',
    
    // Work
    'employment_type': 'work', 
    'occupation': 'work', 
    'company': 'work',
    'time_in_role': 'work',
    'education': 'work',
    'education_description': 'work',
    'clarity_work': 'work', 
    'dream_work': 'work',
    'contrast_work': 'work', 
    'worry_work': 'work',
    
    // Money
    'currency': 'money',
    'household_income': 'money', 
    'savings_retirement': 'money',
    'assets_equity': 'money',
    'consumer_debt': 'money',
    'clarity_money': 'money', 
    'dream_money': 'money',
    'contrast_money': 'money', 
    'worry_money': 'money',
    
    // Fun
    'hobbies': 'fun', 
    'leisure_time_weekly': 'fun',
    'clarity_fun': 'fun', 
    'dream_fun': 'fun',
    'contrast_fun': 'fun', 
    'worry_fun': 'fun',
    
    // Travel
    'travel_frequency': 'travel', 
    'passport': 'travel',
    'countries_visited': 'travel',
    'trips': 'travel',
    'clarity_travel': 'travel', 
    'dream_travel': 'travel',
    'contrast_travel': 'travel', 
    'worry_travel': 'travel',
    
    // Social
    'close_friends_count': 'social', 
    'social_preference': 'social',
    'clarity_social': 'social', 
    'dream_social': 'social',
    'contrast_social': 'social', 
    'worry_social': 'social',
    
    // Stuff
    'lifestyle_category': 'stuff',
    'vehicles': 'stuff',
    'toys': 'stuff',
    'clarity_stuff': 'stuff', 
    'dream_stuff': 'stuff',
    'contrast_stuff': 'stuff', 
    'worry_stuff': 'stuff',
    
    // Spirituality
    'spiritual_practice': 'spirituality', 
    'meditation_frequency': 'spirituality',
    'personal_growth_focus': 'spirituality',
    'clarity_spirituality': 'spirituality', 
    'dream_spirituality': 'spirituality',
    'contrast_spirituality': 'spirituality', 
    'worry_spirituality': 'spirituality',
    
    // Giving
    'volunteer_status': 'giving', 
    'charitable_giving': 'giving',
    'legacy_mindset': 'giving',
    'clarity_giving': 'giving', 
    'dream_giving': 'giving',
    'contrast_giving': 'giving', 
    'worry_giving': 'giving',
  }
  
  refinedFields.forEach(field => {
    const section = fieldToSection[field]
    if (section) sections.add(section)
  })
  
  return Array.from(sections)
}

/**
 * Check if section is refined (derived from fields)
 */
export function isSectionRefined(draft: Partial<UserProfile>, sectionKey: string): boolean {
  return getRefinedSections(draft).includes(sectionKey)
}

