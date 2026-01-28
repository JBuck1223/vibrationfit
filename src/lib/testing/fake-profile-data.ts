/**
 * Fake Profile Data Generator
 * Uses @faker-js/faker to generate realistic test data for the Activation Intensive
 * 
 * Only use for testing purposes!
 */

import { faker } from '@faker-js/faker'
import { UserProfile } from '@/lib/supabase/profile'

// Helper to generate a date in the past
const pastDate = (yearsAgo: number) => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - yearsAgo)
  return date.toISOString().split('T')[0]
}

// Helper to generate a US phone number in (XXX) XXX-XXXX format
const formatPhoneNumber = () => {
  const areaCode = faker.helpers.arrayElement(['212', '310', '415', '512', '720', '818', '305', '404', '617', '702'])
  const prefix = faker.string.numeric(3)
  const line = faker.string.numeric(4)
  return `(${areaCode}) ${prefix}-${line}`
}

// Common hobbies list for variety
const commonHobbies = [
  'Yoga', 'Hiking', 'Reading', 'Cooking', 'Photography', 'Gardening', 'Meditation',
  'Running', 'Swimming', 'Cycling', 'Painting', 'Music', 'Dancing', 'Writing',
  'Travel', 'Gaming', 'Podcasts', 'Weightlifting', 'Tennis', 'Golf', 'Skiing',
  'Surfing', 'Rock Climbing', 'Martial Arts', 'Board Games', 'Wine Tasting',
  'Volunteering', 'Crafting', 'Pottery', 'Woodworking'
]

// Clarity/contrast story generators for each life category
const clarityStoryGenerators = {
  fun: () => faker.helpers.arrayElement([
    `I enjoy ${faker.helpers.arrayElements(commonHobbies, 2).join(' and ')} regularly. These activities bring me joy and help me unwind.`,
    `My weekends are usually filled with ${faker.helpers.arrayElement(commonHobbies).toLowerCase()}. I've been doing it for ${faker.number.int({ min: 1, max: 10 })} years now.`,
    `I've recently discovered a passion for ${faker.helpers.arrayElement(commonHobbies).toLowerCase()}, and it's become a highlight of my week.`
  ]),
  health: () => faker.helpers.arrayElement([
    `I maintain my health through regular exercise and mindful eating. I work out ${faker.number.int({ min: 2, max: 5 })} times a week.`,
    `My health journey has been positive lately. I prioritize sleep, nutrition, and movement.`,
    `I've developed consistent healthy habits including morning routines and regular check-ups.`
  ]),
  travel: () => faker.helpers.arrayElement([
    `I love exploring new places. My favorite trip was to ${faker.location.country()}. I try to travel ${faker.helpers.arrayElement(['quarterly', 'yearly', 'whenever possible'])}.`,
    `Travel is one of my passions. I've visited ${faker.number.int({ min: 5, max: 30 })} countries and have many more on my bucket list.`,
    `I enjoy both adventure travel and relaxing vacations. Next on my list is ${faker.location.country()}.`
  ]),
  love: () => faker.helpers.arrayElement([
    `I'm in a loving, supportive relationship. We communicate openly and prioritize quality time together.`,
    `My relationship is a source of strength. We share common values and support each other's growth.`,
    `Love in my life feels abundant and nurturing. I'm grateful for the connection I have.`
  ]),
  family: () => faker.helpers.arrayElement([
    `My family relationships are strong. We stay connected through regular calls and gatherings.`,
    `Family is important to me. I cherish our traditions and the memories we create together.`,
    `I have a supportive family network that I can always count on.`
  ]),
  social: () => faker.helpers.arrayElement([
    `I have a close group of ${faker.number.int({ min: 3, max: 8 })} friends I can truly count on. We get together regularly.`,
    `My social life is fulfilling. I balance quality friendships with meaningful group activities.`,
    `I've built authentic connections with people who share my values and interests.`
  ]),
  home: () => faker.helpers.arrayElement([
    `My home is my sanctuary. I've created a space that feels peaceful and reflects who I am.`,
    `I love where I live. The neighborhood, the space, and the energy all feel right.`,
    `My living situation is comfortable and supports my lifestyle and goals.`
  ]),
  work: () => faker.helpers.arrayElement([
    `My career is progressing well. I find meaning in what I do and feel valued by my team.`,
    `Work is fulfilling and challenging in the right ways. I'm growing professionally.`,
    `I've found a good balance between ambition and satisfaction in my career.`
  ]),
  money: () => faker.helpers.arrayElement([
    `My finances are on track. I'm building savings and investing in my future.`,
    `I feel financially secure and am making progress toward my financial goals.`,
    `Money management has become easier. I have clarity on my budget and priorities.`
  ]),
  stuff: () => faker.helpers.arrayElement([
    `I've curated my possessions to include what truly adds value to my life.`,
    `My relationship with material things is healthy. I appreciate what I have.`,
    `I've found a good balance between comfort and minimalism.`
  ]),
  giving: () => faker.helpers.arrayElement([
    `I regularly contribute to causes I care about through donations and volunteer work.`,
    `Giving back is important to me. I volunteer ${faker.helpers.arrayElement(['monthly', 'quarterly', 'regularly'])}.`,
    `I feel fulfilled by the impact I make through charitable giving and community involvement.`
  ]),
  spirituality: () => faker.helpers.arrayElement([
    `My spiritual practice centers me. I meditate ${faker.helpers.arrayElement(['daily', 'several times a week', 'regularly'])}.`,
    `I've developed a personal spiritual practice that brings peace and clarity.`,
    `Spirituality and personal growth are priorities. I invest time in self-reflection and learning.`
  ])
}

const contrastStoryGenerators = {
  fun: () => faker.helpers.arrayElement([
    `I sometimes struggle to make time for fun activities with my busy schedule.`,
    `I'd like to explore more creative hobbies but haven't found the right one yet.`,
    `Recreation often takes a backseat to responsibilities. I want to change that.`
  ]),
  health: () => faker.helpers.arrayElement([
    `Consistency with exercise has been challenging lately. I want to build better habits.`,
    `I know I could improve my nutrition. Stress eating is something I'm working on.`,
    `Sleep quality hasn't been great. I need to prioritize rest more.`
  ]),
  travel: () => faker.helpers.arrayElement([
    `I haven't traveled as much as I'd like due to time and budget constraints.`,
    `Planning trips feels overwhelming. I often postpone adventures I want to take.`,
    `Work-life balance makes it hard to take extended trips.`
  ]),
  love: () => faker.helpers.arrayElement([
    `Communication could be better in my relationship. We're working on it.`,
    `Finding quality time together has been challenging with our busy schedules.`,
    `I sometimes feel we've gotten into a routine and could use more spontaneity.`
  ]),
  family: () => faker.helpers.arrayElement([
    `Distance makes it hard to see family as often as I'd like.`,
    `Some family relationships could use more attention and nurturing.`,
    `I struggle to balance family obligations with other priorities.`
  ]),
  social: () => faker.helpers.arrayElement([
    `Making new friends as an adult has been challenging.`,
    `I sometimes feel isolated and wish I had more social connections.`,
    `I've let some friendships fade and want to reconnect.`
  ]),
  home: () => faker.helpers.arrayElement([
    `My space could use some organization and decluttering.`,
    `I dream of a different living situation but it's not feasible right now.`,
    `Some aspects of my home don't feel aligned with who I'm becoming.`
  ]),
  work: () => faker.helpers.arrayElement([
    `Work-life balance is a struggle. I often work longer than I should.`,
    `I'm not sure if this career path is my true calling.`,
    `Office politics and stress sometimes affect my well-being.`
  ]),
  money: () => faker.helpers.arrayElement([
    `I worry about having enough saved for the future.`,
    `Debt is something I'm actively working to reduce.`,
    `Financial planning feels overwhelming. I need more clarity.`
  ]),
  stuff: () => faker.helpers.arrayElement([
    `I have too much stuff and need to declutter.`,
    `I sometimes buy things I don't really need.`,
    `My possessions don't always reflect my values.`
  ]),
  giving: () => faker.helpers.arrayElement([
    `I wish I could give more of my time and resources.`,
    `I haven't found the right cause to dedicate myself to.`,
    `Busy schedules have limited my volunteer involvement.`
  ]),
  spirituality: () => faker.helpers.arrayElement([
    `I've been inconsistent with my spiritual practice lately.`,
    `I'm still exploring what spirituality means to me.`,
    `Finding time for reflection and meditation has been challenging.`
  ])
}

// UI Dropdown values - MUST match the actual dropdowns in profile edit sections
const UI_VALUES = {
  // These are the EXACT values used in the UI dropdown components
  assets_equity: ['<10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say'],
  consumer_debt: ['None', 'Under 10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say'],
  education: ['High School', 'Some College', 'Associate Degree', "Bachelor's Degree", "Master's Degree", 'Doctorate', 'Other', 'Prefer not to say'],
  // Employment type from CareerSection.tsx
  employment_type: ['Employed', 'Business Owner', 'Freelance/Contractor', 'Retired', 'Student (Full Time)', 'Student (Working)', 'Unemployed'],
  ethnicity: ['Asian', 'Black', 'Hispanic', 'Middle Eastern', 'Multi-ethnic', 'Native American', 'Pacific Islander', 'White', 'Other', 'Prefer not to say'],
  exercise_frequency: ['None', '1-2x', '3-4x', '5+'],
  gender: ['Male', 'Female', 'Prefer not to say'],
  household_income: ['<10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say'],
  living_situation: ['Own', 'Rent', 'With family/friends', 'Other', 'Prefer not to say'],
  relationship_length: ['1-6 months', '6-12 months', '12-18 months', '18-24 months', '2-3 years', '3-5 years', '5-10 years', '10+ years'],
  relationship_status: ['Single', 'In a Relationship', 'Married'],
  savings_retirement: ['<10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say'],
  time_at_location: ['<3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years'],
  time_in_role: ['<3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years'],
  units: ['US', 'Metric'],
  // Fun & Recreation - from FunRecreationSection.tsx
  leisure_time_weekly: ['0-5', '6-15', '16-25', '25+'],
  // Social - from SocialFriendsSection.tsx
  close_friends_count: ['0', '1-3', '4-8', '9+'],
  social_preference: ['introvert', 'ambivert', 'extrovert'],
  // Spirituality - from SpiritualityGrowthSection.tsx
  spiritual_practice: ['none', 'religious', 'spiritual', 'secular'],
  meditation_frequency: ['never', 'rarely', 'weekly', 'daily'],
  // Giving - from GivingLegacySection.tsx
  volunteer_status: ['none', 'occasional', 'regular', 'frequent'],
  charitable_giving: ['none', '<500', '500-2000', '2000+'],
}

/**
 * Generate a complete fake profile for testing
 */
export function generateFakeProfile(): Partial<UserProfile> {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const hasChildren = faker.datatype.boolean()
  const relationshipStatus = faker.helpers.arrayElement(UI_VALUES.relationship_status)
  const isInRelationship = relationshipStatus !== 'Single'
  
  // Generate children if applicable
  const numChildren = hasChildren ? faker.number.int({ min: 1, max: 4 }) : 0
  const children = hasChildren ? Array.from({ length: numChildren }, () => ({
    first_name: faker.person.firstName(),
    birthday: pastDate(faker.number.int({ min: 1, max: 18 }))
  })) : null

  // Generate vehicles and items
  const vehicles = faker.helpers.maybe(() => Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => ({
    name: `${faker.date.past({ years: 5 }).getFullYear()} ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
    year_acquired: faker.date.past({ years: 5 }).getFullYear().toString(),
    ownership_status: faker.helpers.arrayElement(['paid_in_full', 'own_with_payment', 'leased']) as 'paid_in_full' | 'own_with_payment' | 'leased'
  })), { probability: 0.7 }) || null

  const items = faker.helpers.maybe(() => Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    name: faker.helpers.arrayElement(['MacBook Pro', 'iPhone', 'Camera Equipment', 'Home Gym', 'Electric Bike', 'Art Collection', 'Musical Instrument']),
    year_acquired: faker.date.past({ years: 3 }).getFullYear().toString(),
    ownership_status: faker.helpers.arrayElement(['paid_in_full', 'own_with_payment']) as 'paid_in_full' | 'own_with_payment'
  })), { probability: 0.6 }) || null

  // Generate trips
  const trips = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
    destination: `${faker.location.city()}, ${faker.location.country()}`,
    year: faker.date.past({ years: 5 }).getFullYear().toString(),
    duration: faker.helpers.arrayElement(['3 days', '1 week', '2 weeks', '10 days'])
  }))

  return {
    // Personal Info
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: formatPhoneNumber(),
    profile_picture_url: null, // Leave blank - user can upload
    date_of_birth: pastDate(faker.number.int({ min: 25, max: 55 })),
    gender: faker.helpers.arrayElement(UI_VALUES.gender),
    ethnicity: faker.helpers.arrayElement(UI_VALUES.ethnicity),

    // Relationship
    relationship_status: relationshipStatus,
    relationship_length: isInRelationship ? faker.helpers.arrayElement(UI_VALUES.relationship_length) : null,
    partner_name: isInRelationship ? faker.person.firstName() : null,

    // Family
    has_children: hasChildren,
    children: children,

    // Health
    units: faker.helpers.arrayElement(UI_VALUES.units),
    height: faker.number.int({ min: 60, max: 78 }), // inches
    weight: faker.number.int({ min: 120, max: 220 }), // lbs
    exercise_frequency: faker.helpers.arrayElement(UI_VALUES.exercise_frequency),
    // Note: health_conditions and medications are not in the user_profiles schema

    // Location
    living_situation: faker.helpers.arrayElement(UI_VALUES.living_situation),
    time_at_location: faker.helpers.arrayElement(UI_VALUES.time_at_location),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    postal_code: faker.location.zipCode(),
    country: 'United States',

    // Career
    employment_type: faker.helpers.arrayElement(UI_VALUES.employment_type),
    occupation: faker.person.jobTitle(),
    company: faker.company.name(),
    time_in_role: faker.helpers.arrayElement(UI_VALUES.time_in_role),
    education: faker.helpers.arrayElement(UI_VALUES.education),
    education_description: faker.helpers.arrayElement([
      'Business Administration', 'Computer Science', 'Psychology', 'Marketing', 
      'Engineering', 'Communications', 'Liberal Arts', 'Finance'
    ]),

    // Financial
    currency: 'USD',
    household_income: faker.helpers.arrayElement(UI_VALUES.household_income),
    savings_retirement: faker.helpers.arrayElement(UI_VALUES.savings_retirement),
    assets_equity: faker.helpers.arrayElement(UI_VALUES.assets_equity),
    consumer_debt: faker.helpers.arrayElement(UI_VALUES.consumer_debt),

    // Fun & Recreation
    hobbies: faker.helpers.arrayElements(commonHobbies, faker.number.int({ min: 3, max: 6 })),
    leisure_time_weekly: faker.helpers.arrayElement(UI_VALUES.leisure_time_weekly),

    // Travel
    travel_frequency: faker.helpers.arrayElement(['never', 'yearly', 'quarterly', 'monthly']) as 'never' | 'yearly' | 'quarterly' | 'monthly',
    passport: faker.datatype.boolean({ probability: 0.7 }),
    countries_visited: faker.number.int({ min: 1, max: 25 }),
    trips: trips,

    // Social
    close_friends_count: faker.helpers.arrayElement(UI_VALUES.close_friends_count),
    social_preference: faker.helpers.arrayElement(UI_VALUES.social_preference) as 'introvert' | 'ambivert' | 'extrovert',

    // Stuff
    lifestyle_category: faker.helpers.arrayElement(['minimalist', 'moderate', 'comfortable', 'luxury']) as 'minimalist' | 'moderate' | 'comfortable' | 'luxury',
    vehicles: vehicles,
    items: items,

    // Spirituality
    spiritual_practice: faker.helpers.arrayElement(UI_VALUES.spiritual_practice),
    meditation_frequency: faker.helpers.arrayElement(UI_VALUES.meditation_frequency),
    personal_growth_focus: faker.datatype.boolean({ probability: 0.8 }),

    // Giving
    volunteer_status: faker.helpers.arrayElement(UI_VALUES.volunteer_status),
    charitable_giving: faker.helpers.arrayElement(UI_VALUES.charitable_giving),
    legacy_mindset: faker.datatype.boolean({ probability: 0.7 }),

    // Clarity Stories (What's going well)
    clarity_fun: clarityStoryGenerators.fun(),
    clarity_health: clarityStoryGenerators.health(),
    clarity_travel: clarityStoryGenerators.travel(),
    clarity_love: clarityStoryGenerators.love(),
    clarity_family: clarityStoryGenerators.family(),
    clarity_social: clarityStoryGenerators.social(),
    clarity_home: clarityStoryGenerators.home(),
    clarity_work: clarityStoryGenerators.work(),
    clarity_money: clarityStoryGenerators.money(),
    clarity_stuff: clarityStoryGenerators.stuff(),
    clarity_giving: clarityStoryGenerators.giving(),
    clarity_spirituality: clarityStoryGenerators.spirituality(),

    // Contrast Stories (What's not going well)
    contrast_fun: contrastStoryGenerators.fun(),
    contrast_health: contrastStoryGenerators.health(),
    contrast_travel: contrastStoryGenerators.travel(),
    contrast_love: contrastStoryGenerators.love(),
    contrast_family: contrastStoryGenerators.family(),
    contrast_social: contrastStoryGenerators.social(),
    contrast_home: contrastStoryGenerators.home(),
    contrast_work: contrastStoryGenerators.work(),
    contrast_money: contrastStoryGenerators.money(),
    contrast_stuff: contrastStoryGenerators.stuff(),
    contrast_giving: contrastStoryGenerators.giving(),
    contrast_spirituality: contrastStoryGenerators.spirituality(),

    // Notes
    version_notes: `Test profile generated for Activation Intensive testing on ${new Date().toLocaleDateString()}.`
  }
}

/**
 * Generate just the personal info section
 */
export function generateFakePersonalInfo(): Partial<UserProfile> {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  return {
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: formatPhoneNumber(),
    date_of_birth: pastDate(faker.number.int({ min: 25, max: 55 })),
    gender: faker.helpers.arrayElement(UI_VALUES.gender),
    ethnicity: faker.helpers.arrayElement(UI_VALUES.ethnicity)
  }
}

/**
 * Check if we're in a testing context (dev mode or super_admin)
 */
export function shouldShowTestDataButton(): boolean {
  // Only show in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  // In production, this would need to check for super_admin status
  // But that check should happen on the component level
  return false
}
