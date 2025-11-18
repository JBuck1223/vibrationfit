/**
 * Profile Context Utility
 * Maps life vision categories to relevant profile fields for personalized AI prompts
 */

export interface ProfileContext {
  [key: string]: any
}

/**
 * Extract relevant profile fields for a specific category
 */
export function getProfileContextForCategory(
  category: string,
  profile: any
): ProfileContext {
  if (!profile) return {}

  const contextMap: Record<string, () => ProfileContext> = {
    // Map actual category keys to profile context extractors
    'fun': () => ({
      hobbies: profile.hobbies || [],
      leisure_time_weekly: profile.leisure_time_weekly,
      lifestyle_category: profile.lifestyle_category,
      social_preference: profile.social_preference,
    }),

    'health': () => ({
      exercise_frequency: profile.exercise_frequency,
      height: profile.height,
      weight: profile.weight,
      units: profile.units,
    }),

    'travel': () => ({
      travel_frequency: profile.travel_frequency,
      passport: profile.passport,
      countries_visited: profile.countries_visited,
      lifestyle_category: profile.lifestyle_category,
    }),

    'love': () => ({
      relationship_status: profile.relationship_status,
      relationship_length: profile.relationship_length,
      partner_name: profile.partner_name,
    }),

    'family': () => ({
      has_children: profile.has_children,
      number_of_children: profile.number_of_children,
      children_ages: profile.children_ages,
      relationship_status: profile.relationship_status,
    }),

    'social': () => ({
      close_friends_count: profile.close_friends_count,
      social_preference: profile.social_preference,
      lifestyle_category: profile.lifestyle_category,
    }),

    'home': () => ({
      city: profile.city,
      state: profile.state,
      country: profile.country,
      living_situation: profile.living_situation,
      time_at_location: profile.time_at_location,
      primary_vehicle: profile.primary_vehicle,
    }),

    'work': () => ({
      occupation: profile.occupation,
      company: profile.company,
      employment_type: profile.employment_type,
      time_in_role: profile.time_in_role,
      education: profile.education,
    }),

    'money': () => ({
      household_income: profile.household_income,
      savings_retirement: profile.savings_retirement,
      assets_equity: profile.assets_equity,
      consumer_debt: profile.consumer_debt,
      currency: profile.currency,
    }),

    'stuff': () => ({
      lifestyle_category: profile.lifestyle_category,
      primary_vehicle: profile.primary_vehicle,
      living_situation: profile.living_situation,
    }),

    'giving': () => ({
      volunteer_status: profile.volunteer_status,
      charitable_giving: profile.charitable_giving,
      legacy_mindset: profile.legacy_mindset,
      occupation: profile.occupation,
    }),

    'spirituality': () => ({
      spiritual_practice: profile.spiritual_practice,
      meditation_frequency: profile.meditation_frequency,
      personal_growth_focus: profile.personal_growth_focus,
    }),

    'wildcard': () => ({
      // Wildcard gets a broad context
      lifestyle_category: profile.lifestyle_category,
      personal_growth_focus: profile.personal_growth_focus,
    }),
  }

  const getContext = contextMap[category]
  return getContext ? getContext() : {}
}

/**
 * Format profile context into a readable string for AI prompts
 */
export function formatProfileContextForPrompt(context: ProfileContext): string {
  const lines: string[] = []

  // Hobbies
  if (context.hobbies && Array.isArray(context.hobbies) && context.hobbies.length > 0) {
    lines.push(`Current Hobbies: ${context.hobbies.join(', ')}`)
  }

  // Leisure Time
  if (context.leisure_time_weekly) {
    lines.push(`Weekly Leisure Time: ${context.leisure_time_weekly}`)
  }

  // Lifestyle
  if (context.lifestyle_category) {
    lines.push(`Lifestyle: ${context.lifestyle_category}`)
  }

  // Social Preference
  if (context.social_preference) {
    lines.push(`Social Style: ${context.social_preference}`)
  }

  // Exercise
  if (context.exercise_frequency) {
    lines.push(`Exercise Frequency: ${context.exercise_frequency}`)
  }

  // Body Stats
  if (context.height || context.weight) {
    const stats = []
    if (context.height) stats.push(`${context.height} ${context.units === 'US' ? 'inches' : 'cm'}`)
    if (context.weight) stats.push(`${context.weight} ${context.units === 'US' ? 'lbs' : 'kg'}`)
    if (stats.length) lines.push(`Physical Stats: ${stats.join(', ')}`)
  }

  // Travel
  if (context.travel_frequency) {
    lines.push(`Travel Frequency: ${context.travel_frequency}`)
  }
  if (context.passport !== undefined) {
    lines.push(`Passport: ${context.passport ? 'Yes' : 'No'}`)
  }
  if (context.countries_visited !== undefined && context.countries_visited > 0) {
    lines.push(`Countries Visited: ${context.countries_visited}`)
  }

  // Relationship
  if (context.relationship_status) {
    lines.push(`Relationship Status: ${context.relationship_status}`)
  }
  if (context.relationship_length) {
    lines.push(`Relationship Length: ${context.relationship_length}`)
  }
  if (context.partner_name) {
    lines.push(`Partner: ${context.partner_name}`)
  }

  // Family
  if (context.has_children !== undefined) {
    if (context.has_children) {
      const childInfo = []
      if (context.number_of_children) childInfo.push(`${context.number_of_children} children`)
      if (context.children_ages && context.children_ages.length > 0) {
        childInfo.push(`ages: ${context.children_ages.join(', ')}`)
      }
      lines.push(`Family: ${childInfo.join(', ')}`)
    } else {
      lines.push('Family: No children')
    }
  }

  // Friends
  if (context.close_friends_count) {
    lines.push(`Close Friends: ${context.close_friends_count}`)
  }

  // Location
  if (context.city || context.state || context.country) {
    const location = [context.city, context.state, context.country].filter(Boolean).join(', ')
    lines.push(`Location: ${location}`)
  }
  if (context.living_situation) {
    lines.push(`Living Situation: ${context.living_situation}`)
  }
  if (context.time_at_location) {
    lines.push(`Time at Location: ${context.time_at_location}`)
  }
  if (context.primary_vehicle) {
    lines.push(`Primary Vehicle: ${context.primary_vehicle}`)
  }

  // Career
  if (context.occupation) {
    lines.push(`Occupation: ${context.occupation}`)
  }
  if (context.company) {
    lines.push(`Company: ${context.company}`)
  }
  if (context.employment_type) {
    lines.push(`Employment: ${context.employment_type}`)
  }
  if (context.time_in_role) {
    lines.push(`Time in Role: ${context.time_in_role}`)
  }
  if (context.education) {
    lines.push(`Education: ${context.education}`)
  }

  // Finances
  if (context.household_income) {
    lines.push(`Household Income: ${context.household_income}`)
  }
  if (context.savings_retirement) {
    lines.push(`Savings/Retirement: ${context.savings_retirement}`)
  }
  if (context.assets_equity) {
    lines.push(`Assets/Equity: ${context.assets_equity}`)
  }
  if (context.consumer_debt) {
    lines.push(`Consumer Debt: ${context.consumer_debt}`)
  }

  // Contribution
  if (context.volunteer_status) {
    lines.push(`Volunteer Status: ${context.volunteer_status}`)
  }
  if (context.charitable_giving) {
    lines.push(`Charitable Giving: ${context.charitable_giving}`)
  }
  if (context.legacy_mindset !== undefined) {
    lines.push(`Legacy Mindset: ${context.legacy_mindset ? 'Yes' : 'No'}`)
  }

  // Spirituality
  if (context.spiritual_practice) {
    lines.push(`Spiritual Practice: ${context.spiritual_practice}`)
  }
  if (context.meditation_frequency) {
    lines.push(`Meditation Frequency: ${context.meditation_frequency}`)
  }
  if (context.personal_growth_focus !== undefined) {
    lines.push(`Personal Growth Focus: ${context.personal_growth_focus ? 'Yes' : 'No'}`)
  }

  return lines.length > 0 ? lines.join('\n') : 'No profile information available yet.'
}

