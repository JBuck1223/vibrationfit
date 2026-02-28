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
 * Fields that come from user_accounts, not user_profiles
 * These should NOT be compared for change tracking since they're managed separately
 */
const ACCOUNT_SOURCED_FIELDS = [
  'first_name',
  'last_name', 
  'email',
  'phone',
  'date_of_birth',
  'profile_picture_url',
]

/**
 * Get fields that differ between draft and parent
 * Returns list of field keys that have changed
 * NOTE: Excludes account-sourced fields (first_name, last_name, email, phone, date_of_birth, profile_picture_url)
 * as these come from user_accounts and should not be compared against the parent profile
 */
export function getChangedFields(
  draft: Partial<UserProfile>, 
  parent: Partial<UserProfile>
): string[] {
  const changedFields: string[] = []
  
  // List of fields to check for changes
  // NOTE: All Personal Info section fields are excluded since that data comes from user_accounts
  // This includes: first_name, last_name, email, phone, date_of_birth, profile_picture_url, gender, ethnicity
  const fieldsToCheck: (keyof UserProfile)[] = [
    // Relationship (Personal Info fields gender/ethnicity excluded since they're part of Personal Info UI)
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
    
    // Life category state fields
    'state_fun', 'state_health', 'state_travel', 'state_love', 'state_family',
    'state_social', 'state_home', 'state_work', 'state_money', 'state_stuff',
    'state_giving', 'state_spirituality',
    
    // Structured fields
    'hobbies', 'leisure_time_weekly', 'travel_frequency', 'passport', 'countries_visited',
    'trips', 'close_friends_count', 'social_preference', 'lifestyle_category', 'vehicles',
    'items', 'spiritual_practice', 'meditation_frequency', 'personal_growth_focus',
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
    fun: [],
    health: [],
    travel: [],
    love: [],
    family: [],
    social: [],
    home: [],
    work: [],
    money: [],
    stuff: [],
    spirituality: [],
    giving: []
  }
  
  // Map fields to sections
  // NOTE: Personal Info section fields are completely excluded from change tracking
  // All Personal Info fields (first_name, last_name, email, phone, date_of_birth, profile_picture_url, gender, ethnicity)
  // come from or are displayed with user_accounts data and should not show as "changed"
  const fieldToSection: Record<string, string> = {
    // Personal section - NO FIELDS MAPPED - Personal Info doesn't show change tracking
    
    relationship_status: 'love',
    partner_name: 'love',
    relationship_length: 'love',
    state_love: 'love',
    
    has_children: 'family',
    children: 'family',
    state_family: 'family',
    
    units: 'health',
    height: 'health',
    weight: 'health',
    exercise_frequency: 'health',
    state_health: 'health',
    
    living_situation: 'home',
    time_at_location: 'home',
    city: 'home',
    state: 'home',
    postal_code: 'home',
    country: 'home',
    state_home: 'home',
    
    employment_type: 'work',
    occupation: 'work',
    company: 'work',
    time_in_role: 'work',
    education: 'work',
    education_description: 'work',
    state_work: 'work',
    
    currency: 'money',
    household_income: 'money',
    savings_retirement: 'money',
    assets_equity: 'money',
    consumer_debt: 'money',
    state_money: 'money',
    
    hobbies: 'fun',
    leisure_time_weekly: 'fun',
    state_fun: 'fun',
    
    travel_frequency: 'travel',
    passport: 'travel',
    countries_visited: 'travel',
    trips: 'travel',
    state_travel: 'travel',
    
    close_friends_count: 'social',
    social_preference: 'social',
    state_social: 'social',
    
    lifestyle_category: 'stuff',
    vehicles: 'stuff',
    items: 'stuff',
    state_stuff: 'stuff',
    
    spiritual_practice: 'spirituality',
    meditation_frequency: 'spirituality',
    personal_growth_focus: 'spirituality',
    state_spirituality: 'spirituality',
    
    volunteer_status: 'giving',
    charitable_giving: 'giving',
    legacy_mindset: 'giving',
    state_giving: 'giving',
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
  // NOTE: Personal Info section fields are completely excluded from refined tracking
  // All Personal Info fields (first_name, last_name, email, phone, date_of_birth, profile_picture_url, gender, ethnicity)
  // come from or are displayed with user_accounts data
  const fieldToSection: Record<string, string> = {
    // Personal section - NO FIELDS MAPPED - Personal Info doesn't show refined tracking
    
    // Love
    'relationship_status': 'love', 
    'partner_name': 'love', 
    'relationship_length': 'love', 
    'state_love': 'love',
    
    // Family
    'has_children': 'family', 
    'children': 'family',
    'state_family': 'family',
    
    // Health
    'units': 'health',
    'height': 'health', 
    'weight': 'health', 
    'exercise_frequency': 'health',
    'state_health': 'health',
    
    // Home
    'living_situation': 'home', 
    'time_at_location': 'home',
    'city': 'home', 
    'state': 'home', 
    'postal_code': 'home',
    'country': 'home',
    'state_home': 'home',
    
    // Work
    'employment_type': 'work', 
    'occupation': 'work', 
    'company': 'work',
    'time_in_role': 'work',
    'education': 'work',
    'education_description': 'work',
    'state_work': 'work',
    
    // Money
    'currency': 'money',
    'household_income': 'money', 
    'savings_retirement': 'money',
    'assets_equity': 'money',
    'consumer_debt': 'money',
    'state_money': 'money',
    
    // Fun
    'hobbies': 'fun', 
    'leisure_time_weekly': 'fun',
    'state_fun': 'fun',
    
    // Travel
    'travel_frequency': 'travel', 
    'passport': 'travel',
    'countries_visited': 'travel',
    'trips': 'travel',
    'state_travel': 'travel',
    
    // Social
    'close_friends_count': 'social', 
    'social_preference': 'social',
    'state_social': 'social',
    
    // Stuff
    'lifestyle_category': 'stuff',
    'vehicles': 'stuff',
    'items': 'stuff',
    'state_stuff': 'stuff',
    
    // Spirituality
    'spiritual_practice': 'spirituality', 
    'meditation_frequency': 'spirituality',
    'personal_growth_focus': 'spirituality',
    'state_spirituality': 'spirituality',
    
    // Giving
    'volunteer_status': 'giving', 
    'charitable_giving': 'giving',
    'legacy_mindset': 'giving',
    'state_giving': 'giving',
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

