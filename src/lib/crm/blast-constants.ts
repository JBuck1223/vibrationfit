import type { Audience } from './blast-filters'

export type FilterField =
  | 'engagement_status'
  | 'health_status'
  | 'subscription_tier'
  | 'subscription_status'
  | 'intensive_status'
  | 'days_since_last_login_gt'
  | 'days_since_last_login_lt'
  | 'has_phone'
  | 'sms_opt_in'
  | 'email_opt_in'
  | 'has_vision'
  | 'has_journal_entry'
  | 'profile_completion_gte'
  | 'lead_status'
  | 'lead_type'
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'created_after'
  | 'created_before'

export interface FilterFieldOption {
  value: FilterField
  label: string
  group: 'member' | 'lead' | 'shared'
}

export const MEMBER_FILTER_OPTIONS: FilterFieldOption[] = [
  { value: 'intensive_status', label: 'Intensive Status', group: 'member' },
  { value: 'subscription_status', label: 'Subscription Status', group: 'member' },
  { value: 'subscription_tier', label: 'Subscription Tier', group: 'member' },
  { value: 'engagement_status', label: 'Engagement Status', group: 'member' },
  { value: 'health_status', label: 'Health Status', group: 'member' },
  { value: 'days_since_last_login_gt', label: 'Days Since Login (more than)', group: 'member' },
  { value: 'days_since_last_login_lt', label: 'Days Since Login (less than)', group: 'member' },
  { value: 'has_phone', label: 'Has Phone Number', group: 'member' },
  { value: 'sms_opt_in', label: 'SMS Opt-in', group: 'member' },
  { value: 'email_opt_in', label: 'Email Opt-in', group: 'member' },
  { value: 'has_vision', label: 'Has Vision', group: 'member' },
  { value: 'has_journal_entry', label: 'Has Journal Entry', group: 'member' },
  { value: 'profile_completion_gte', label: 'Profile Completion (at least %)', group: 'member' },
]

export const LEAD_FILTER_OPTIONS: FilterFieldOption[] = [
  { value: 'lead_status', label: 'Lead Status', group: 'lead' },
  { value: 'lead_type', label: 'Lead Type', group: 'lead' },
  { value: 'utm_source', label: 'UTM Source', group: 'lead' },
  { value: 'utm_medium', label: 'UTM Medium', group: 'lead' },
  { value: 'utm_campaign', label: 'UTM Campaign', group: 'lead' },
]

export const SHARED_FILTER_OPTIONS: FilterFieldOption[] = [
  { value: 'created_after', label: 'Created After', group: 'shared' },
  { value: 'created_before', label: 'Created Before', group: 'shared' },
]

export const ENGAGEMENT_STATUS_VALUES = ['active', 'at_risk', 'champion', 'inactive']
export const HEALTH_STATUS_VALUES = ['healthy', 'needs_attention', 'churned']
export const INTENSIVE_STATUS_VALUES = ['no_intensive', 'pending', 'in_progress', 'completed', 'unlocked']
export const SUBSCRIPTION_STATUS_VALUES = ['active', 'trialing', 'canceled', 'past_due', 'free']
export const BOOLEAN_FILTER_VALUES = ['yes', 'no']
export const LEAD_STATUS_VALUES = ['new', 'contacted', 'qualified', 'converted', 'lost']
export const LEAD_TYPE_VALUES = ['contact', 'demo', 'intensive_intake']

export const VALUE_OPTIONS: Partial<Record<FilterField, string[]>> = {
  engagement_status: ENGAGEMENT_STATUS_VALUES,
  health_status: HEALTH_STATUS_VALUES,
  intensive_status: INTENSIVE_STATUS_VALUES,
  subscription_status: SUBSCRIPTION_STATUS_VALUES,
  has_phone: BOOLEAN_FILTER_VALUES,
  sms_opt_in: BOOLEAN_FILTER_VALUES,
  email_opt_in: BOOLEAN_FILTER_VALUES,
  has_vision: BOOLEAN_FILTER_VALUES,
  has_journal_entry: BOOLEAN_FILTER_VALUES,
  lead_status: LEAD_STATUS_VALUES,
  lead_type: LEAD_TYPE_VALUES,
}

export function getFilterOptions(audience: Audience): FilterFieldOption[] {
  const shared = [...SHARED_FILTER_OPTIONS]
  if (audience === 'members') return [...MEMBER_FILTER_OPTIONS, ...shared]
  if (audience === 'leads') return [...LEAD_FILTER_OPTIONS, ...shared]
  return [...MEMBER_FILTER_OPTIONS, ...LEAD_FILTER_OPTIONS, ...shared]
}

export function getValueOptions(field: FilterField): string[] | null {
  return VALUE_OPTIONS[field] ?? null
}

export function isDateField(field: FilterField): boolean {
  return field === 'created_after' || field === 'created_before'
}

export function isNumberField(field: FilterField): boolean {
  return field === 'days_since_last_login_gt' || field === 'days_since_last_login_lt' || field === 'profile_completion_gte'
}

export function isBooleanField(field: FilterField): boolean {
  return field === 'has_phone' || field === 'sms_opt_in' || field === 'email_opt_in' || field === 'has_vision' || field === 'has_journal_entry'
}

export function isDynamicSelectField(field: FilterField): boolean {
  return field === 'subscription_tier'
}

export type FilterOperator = 'is' | 'is_not'

export function isMultiSelectField(field: FilterField): boolean {
  return (!!VALUE_OPTIONS[field] && !isBooleanField(field)) || isDynamicSelectField(field)
}

export function formatFilterValue(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
