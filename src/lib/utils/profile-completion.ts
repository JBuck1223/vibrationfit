/**
 * Profile Completion Calculation - Single Source of Truth
 * 
 * This is the authoritative calculation for profile completion percentage.
 * All other places should import and use this function.
 */

export interface ProfileData {
  [key: string]: any
}

/**
 * Calculates profile completion percentage based on filled fields
 * Uses intelligent conditionals for relationship and family fields
 */
export function calculateProfileCompletion(profileData: ProfileData | null | undefined): number {
  if (!profileData) return 0

  let totalFields = 0
  let completedFields = 0

  // Helper to check if a field has value
  const hasValue = (field: string) => {
    // Check if field exists in the data (not just undefined)
    if (!(field in profileData)) return false
    const value = profileData[field]
    
    // Handle arrays
    if (Array.isArray(value)) return value.length > 0
    
    // Booleans always count as having a value (even false)
    if (typeof value === 'boolean') return true
    
    // Handle numbers (0 is a valid value)
    if (typeof value === 'number') return true
    
    // Handle strings - check for non-empty, non-whitespace strings
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    
    // Handle null/undefined
    return value !== null && value !== undefined
  }

  // Core Fields
  const coreFields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'profile_picture_url']
  coreFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Relationship Fields (conditional)
  totalFields++ // relationship_status is always counted
  if (hasValue('relationship_status')) {
    completedFields++
    // If not single, partner_name and relationship_length are expected
    if (profileData.relationship_status !== 'Single') {
      totalFields += 2
      if (hasValue('partner_name')) completedFields++
      if (hasValue('relationship_length')) completedFields++
    }
  }

  // Family Fields (conditional)
  totalFields++ // has_children is always counted
  if (profileData.has_children !== undefined && profileData.has_children !== null) {
    completedFields++
    // If has children, expect number and ages
    if (profileData.has_children === true) {
      totalFields += 2
      if (hasValue('number_of_children')) completedFields++
      if (hasValue('children_ages')) completedFields++
    }
  }

  // Health Fields
  const healthFields = ['units', 'height', 'weight', 'exercise_frequency']
  healthFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Location Fields
  const locationFields = ['living_situation', 'time_at_location', 'city', 'state', 'postal_code', 'country']
  locationFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Career Fields
  const careerFields = ['employment_type', 'occupation', 'company', 'time_in_role', 'education']
  careerFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Financial Fields
  const financialFields = ['currency', 'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt']
  financialFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Life Category Story Fields (12 categories - using NEW field names)
  const storyFields = [
    'fun_story',
    'health_story',
    'travel_story',
    'love_story',
    'family_story',
    'social_story',
    'home_story',
    'work_story',
    'money_story',
    'stuff_story',
    'giving_story',
    'spirituality_story'
  ]
  storyFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Structured Life Category Fields
  // Fun & Recreation
  const funFields = ['hobbies', 'leisure_time_weekly']
  funFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Travel & Adventure
  const travelFields = ['travel_frequency', 'passport', 'countries_visited']
  travelFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Social & Friends
  const socialFields = ['close_friends_count', 'social_preference']
  socialFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Possessions & Lifestyle
  const lifestyleFields = ['lifestyle_category', 'primary_vehicle']
  lifestyleFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Spirituality & Growth
  const spiritualityFields = ['spiritual_practice', 'meditation_frequency', 'personal_growth_focus']
  spiritualityFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Giving & Legacy
  const givingFields = ['volunteer_status', 'charitable_giving', 'legacy_mindset']
  givingFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

  return percentage
}

