/**
 * Profile Completion Calculation - Single Source of Truth
 * 
 * This is the authoritative calculation for profile completion percentage.
 * All other places should import and use this function.
 */

export interface ProfileData {
  [key: string]: any
}

// Database column defaults that should NOT count toward profile completion.
// These are auto-set by PostgreSQL when a new profile row is created and
// don't represent intentional user input.
const DATABASE_DEFAULTS: Record<string, any> = {
  units: 'US',
  country: 'United States',
  currency: 'USD',
  has_children: false,
  passport: false,
  countries_visited: 0,
  personal_growth_focus: false,
  legacy_mindset: false,
}

// Field to section mapping (matches profile edit page sections)
export const FIELD_TO_SECTION_MAP: Record<string, string> = {
  // Personal Info section
  first_name: 'personal',
  last_name: 'personal',
  email: 'personal',
  phone: 'personal',
  date_of_birth: 'personal',
  gender: 'personal',
  ethnicity: 'personal',
  
  // Love section
  relationship_status: 'love',
  partner_name: 'love',
  relationship_length: 'love',
  
  // Family section
  has_children: 'family',
  children: 'family',
  
  // Health section
  units: 'health',
  height: 'health',
  weight: 'health',
  exercise_frequency: 'health',
  state_health: 'health',
  
  // Home section
  living_situation: 'home',
  time_at_location: 'home',
  city: 'home',
  state: 'home',
  postal_code: 'home',
  country: 'home',
  state_home: 'home',
  
  // Work section
  employment_type: 'work',
  occupation: 'work',
  company: 'work',
  time_in_role: 'work',
  education: 'work',
  state_work: 'work',
  
  // Money section
  currency: 'money',
  household_income: 'money',
  savings_retirement: 'money',
  assets_equity: 'money',
  consumer_debt: 'money',
  state_money: 'money',
  
  // Fun section
  hobbies: 'fun',
  leisure_time_weekly: 'fun',
  state_fun: 'fun',
  
  // Travel section
  travel_frequency: 'travel',
  passport: 'travel',
  countries_visited: 'travel',
  state_travel: 'travel',
  
  // Social section
  close_friends_count: 'social',
  social_preference: 'social',
  state_social: 'social',
  
  // Stuff section
  lifestyle_category: 'stuff',
  state_stuff: 'stuff',
  
  // Spirituality section
  spiritual_practice: 'spirituality',
  meditation_frequency: 'spirituality',
  personal_growth_focus: 'spirituality',
  state_spirituality: 'spirituality',
  
  // Giving section
  volunteer_status: 'giving',
  charitable_giving: 'giving',
  legacy_mindset: 'giving',
  state_giving: 'giving',
  
  // Love & Family state
  state_love: 'love',
  state_family: 'family',
}

// Field definitions with labels for display
export const PROFILE_FIELD_DEFINITIONS = {
  // Core Fields (media excluded - profile_picture_url, progress_photos, story_recordings don't count)
  core: {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    ethnicity: 'Ethnicity'
  },
  relationship: {
    relationship_status: 'Relationship Status',
    partner_name: 'Partner Name',
    relationship_length: 'Relationship Length'
  },
  family: {
    has_children: 'Has Children',
    children: 'Children Details'
  },
  health: {
    units: 'Measurement Units',
    height: 'Height',
    weight: 'Weight',
    exercise_frequency: 'Exercise Frequency'
  },
  location: {
    living_situation: 'Living Situation',
    time_at_location: 'Time at Location',
    city: 'City',
    state: 'State',
    postal_code: 'Postal Code',
    country: 'Country'
  },
  career: {
    employment_type: 'Employment Type',
    occupation: 'Occupation',
    company: 'Company',
    time_in_role: 'Time in Role',
    education: 'Education'
  },
  financial: {
    currency: 'Currency',
    household_income: 'Household Income',
    savings_retirement: 'Savings/Retirement',
    assets_equity: 'Assets/Equity',
    consumer_debt: 'Consumer Debt'
  },
  state: {
    state_fun: 'Fun State',
    state_health: 'Health State',
    state_travel: 'Travel State',
    state_love: 'Love State',
    state_family: 'Family State',
    state_social: 'Social State',
    state_home: 'Home State',
    state_work: 'Work State',
    state_money: 'Money State',
    state_stuff: 'Stuff State',
    state_giving: 'Giving State',
    state_spirituality: 'Spirituality State'
  },
  fun: {
    hobbies: 'Hobbies',
    leisure_time_weekly: 'Weekly Leisure Time'
  },
  travel: {
    travel_frequency: 'Travel Frequency',
    passport: 'Passport',
    countries_visited: 'Countries Visited'
  },
  social: {
    close_friends_count: 'Close Friends Count',
    social_preference: 'Social Preference'
  },
  lifestyle: {
    lifestyle_category: 'Lifestyle Category'
  },
  spirituality: {
    spiritual_practice: 'Spiritual Practice',
    meditation_frequency: 'Meditation Frequency',
    personal_growth_focus: 'Personal Growth Focus'
  },
  giving: {
    volunteer_status: 'Volunteer Status',
    charitable_giving: 'Charitable Giving',
    legacy_mindset: 'Legacy Mindset'
  }
}

// Helper to check if a field has a user-provided value (not a database default)
const hasValue = (profileData: ProfileData, field: string) => {
  if (!(field in profileData)) return false
  const value = profileData[field]

  // Exclude values that match database column defaults
  if (field in DATABASE_DEFAULTS && value === DATABASE_DEFAULTS[field]) return false
  
  // Handle arrays
  if (Array.isArray(value)) return value.length > 0
  
  // Booleans count as having a value (even false) once past the default check
  if (typeof value === 'boolean') return true
  
  // Numbers count as having a value (even 0) once past the default check
  if (typeof value === 'number') return true
  
  // Handle strings - check for non-empty, non-whitespace strings
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  
  // Handle null/undefined
  return value !== null && value !== undefined
}

/**
 * Get list of incomplete fields with their labels
 * Returns an array of { field, label, section, sectionId } objects
 * sectionId can be used to navigate directly to the section in the profile editor
 */
export function getIncompleteFields(profileData: ProfileData | null | undefined): Array<{ field: string, label: string, section: string, sectionId: string }> {
  if (!profileData) return []

  const incompleteFields: Array<{ field: string, label: string, section: string, sectionId: string }> = []

  // Check core fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.core).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Personal Info', sectionId: FIELD_TO_SECTION_MAP[field] || 'personal' })
    }
  })

  // Check relationship fields (conditional)
  if (!hasValue(profileData, 'relationship_status')) {
    incompleteFields.push({ field: 'relationship_status', label: 'Relationship Status', section: 'Love & Relationships', sectionId: 'love' })
  } else if (profileData.relationship_status !== 'Single') {
    if (!hasValue(profileData, 'partner_name')) {
      incompleteFields.push({ field: 'partner_name', label: 'Partner Name', section: 'Love & Relationships', sectionId: 'love' })
    }
    if (!hasValue(profileData, 'relationship_length')) {
      incompleteFields.push({ field: 'relationship_length', label: 'Relationship Length', section: 'Love & Relationships', sectionId: 'love' })
    }
  }

  // Check family fields (conditional)
  if (!hasValue(profileData, 'has_children')) {
    incompleteFields.push({ field: 'has_children', label: 'Has Children', section: 'Family', sectionId: 'family' })
  } else if (profileData.has_children === true) {
    if (!hasValue(profileData, 'children')) {
      incompleteFields.push({ field: 'children', label: 'Children Details', section: 'Family', sectionId: 'family' })
    }
  }

  // Check health fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.health).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Health', sectionId: 'health' })
    }
  })

  // Check location fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.location).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Home & Location', sectionId: 'home' })
    }
  })

  // Check career fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.career).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Work & Career', sectionId: 'work' })
    }
  })

  // Check financial fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.financial).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Money & Finances', sectionId: 'money' })
    }
  })

  // Check state fields (map to their respective sections)
  Object.entries(PROFILE_FIELD_DEFINITIONS.state).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Current State', sectionId: FIELD_TO_SECTION_MAP[field] || 'personal' })
    }
  })

  // Check fun fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.fun).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Fun & Recreation', sectionId: 'fun' })
    }
  })

  // Check travel fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.travel).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Travel & Adventure', sectionId: 'travel' })
    }
  })

  // Check social fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.social).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Social & Friends', sectionId: 'social' })
    }
  })

  // Check lifestyle fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.lifestyle).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Stuff & Lifestyle', sectionId: 'stuff' })
    }
  })

  // Check spirituality fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.spirituality).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Spirituality & Growth', sectionId: 'spirituality' })
    }
  })

  // Check giving fields
  Object.entries(PROFILE_FIELD_DEFINITIONS.giving).forEach(([field, label]) => {
    if (!hasValue(profileData, field)) {
      incompleteFields.push({ field, label, section: 'Giving & Legacy', sectionId: 'giving' })
    }
  })

  return incompleteFields
}

/**
 * Calculates profile completion percentage based on filled fields
 * Uses intelligent conditionals for relationship and family fields
 * NOTE: Media fields (profile_picture_url, progress_photos, story_recordings) are excluded
 */
export function calculateProfileCompletion(profileData: ProfileData | null | undefined): number {
  if (!profileData) return 0

  let totalFields = 0
  let completedFields = 0

  // Core Fields (media excluded - profile_picture_url does NOT count against completion)
  const coreFields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'ethnicity']
  coreFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Relationship Fields (conditional)
  totalFields++ // relationship_status is always counted
  if (hasValue(profileData, 'relationship_status')) {
    completedFields++
    // If not single, partner_name and relationship_length are expected
    if (profileData.relationship_status !== 'Single') {
      totalFields += 2
      if (hasValue(profileData, 'partner_name')) completedFields++
      if (hasValue(profileData, 'relationship_length')) completedFields++
    }
  }

  // Family Fields (conditional)
  totalFields++ // has_children is always counted
  if (hasValue(profileData, 'has_children')) {
    completedFields++
    if (profileData.has_children === true) {
      totalFields += 1
      if (hasValue(profileData, 'children')) completedFields++
    }
  }

  // Health Fields
  const healthFields = ['units', 'height', 'weight', 'exercise_frequency']
  healthFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Location Fields
  const locationFields = ['living_situation', 'time_at_location', 'city', 'state', 'postal_code', 'country']
  locationFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Career Fields
  const careerFields = ['employment_type', 'occupation', 'company', 'time_in_role', 'education']
  careerFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Financial Fields
  const financialFields = ['currency', 'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt']
  financialFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Life Category State Fields (12 categories)
  const stateFields = [
    'state_fun',
    'state_health',
    'state_travel',
    'state_love',
    'state_family',
    'state_social',
    'state_home',
    'state_work',
    'state_money',
    'state_stuff',
    'state_giving',
    'state_spirituality'
  ]
  stateFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Fun & Recreation
  const funFields = ['hobbies', 'leisure_time_weekly']
  funFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Travel & Adventure
  const travelFields = ['travel_frequency', 'passport', 'countries_visited']
  travelFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Social & Friends
  const socialFields = ['close_friends_count', 'social_preference']
  socialFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Stuff & Lifestyle
  const lifestyleFields = ['lifestyle_category']
  lifestyleFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Spirituality & Growth
  const spiritualityFields = ['spiritual_practice', 'meditation_frequency', 'personal_growth_focus']
  spiritualityFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  // Giving & Legacy
  const givingFields = ['volunteer_status', 'charitable_giving', 'legacy_mindset']
  givingFields.forEach(field => {
    totalFields++
    if (hasValue(profileData, field)) completedFields++
  })

  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

  return percentage
}

