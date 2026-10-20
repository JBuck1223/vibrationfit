/**
 * Answer options for Your World. Values match the old Profile values so
 * ported data and new answers read the same everywhere.
 */

export interface WorldOption {
  value: string
  label: string
}

const opts = (...values: string[]): WorldOption[] => values.map((value) => ({ value, label: value }))

export const GENDER_OPTIONS = opts('Male', 'Female', 'Prefer not to say')

export const ETHNICITY_OPTIONS = opts(
  'Asian',
  'Black',
  'Hispanic',
  'Middle Eastern',
  'Multi-ethnic',
  'Native American',
  'Pacific Islander',
  'White',
  'Other',
  'Prefer not to say',
)

export const RELATIONSHIP_STATUS_OPTIONS = opts('Single', 'In a Relationship', 'Married')

export const RELATIONSHIP_LENGTH_OPTIONS = opts(
  '1-6 months',
  '6-12 months',
  '12-18 months',
  '18-24 months',
  '2-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
)

export const SOCIAL_PREFERENCE_OPTIONS: WorldOption[] = [
  { value: 'introvert', label: 'Introvert' },
  { value: 'ambivert', label: 'Ambivert' },
  { value: 'extrovert', label: 'Extrovert' },
]

export const LIVING_SITUATION_OPTIONS = opts('Own', 'Rent', 'With family/friends', 'Other', 'Prefer not to say')

const TENURE: WorldOption[] = [
  { value: '<3 months', label: 'Less than 3 months' },
  ...opts('3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years'),
]

export const TIME_AT_LOCATION_OPTIONS = TENURE
export const TIME_IN_ROLE_OPTIONS = TENURE

export const EMPLOYMENT_TYPE_OPTIONS = opts(
  'Employed',
  'Business Owner',
  'Freelance/Contractor',
  'Retired',
  'Student (Full Time)',
  'Student (Working)',
  'Unemployed',
)

export const EDUCATION_OPTIONS = opts(
  'High School',
  'Some College',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
  'Prefer not to say',
)

export const CURRENCY_OPTIONS: WorldOption[] = [
  { value: 'USD', label: 'USD $' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'GBP', label: 'GBP £' },
  { value: 'Other', label: 'Other' },
]

const BRACKETS = [
  ['<10,000', 'Less than 10,000'],
  ['10,000-24,999', '10,000 - 24,999'],
  ['25,000-49,999', '25,000 - 49,999'],
  ['50,000-99,999', '50,000 - 99,999'],
  ['100,000-249,999', '100,000 - 249,999'],
  ['250,000-499,999', '250,000 - 499,999'],
  ['500,000-999,999', '500,000 - 999,999'],
  ['1,000,000+', '1,000,000+'],
] as const

export const AMOUNT_OPTIONS: WorldOption[] = [
  ...BRACKETS.map(([value, label]) => ({ value, label })),
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

export const DEBT_OPTIONS: WorldOption[] = [
  { value: 'None', label: 'None' },
  { value: 'Under 10,000', label: 'Under 10,000' },
  ...BRACKETS.slice(1).map(([value, label]) => ({ value, label })),
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

export const PET_KIND_SUGGESTIONS = ['Dog', 'Cat', 'Horse', 'Bird', 'Fish', 'Rabbit', 'Reptile']

export function hasPartner(status: string | undefined): boolean {
  return status === 'In a Relationship' || status === 'Married'
}
