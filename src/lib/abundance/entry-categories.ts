/**
 * Abundance entry categories ("kind of abundance").
 * Single source of truth for forms and display across abundance-tracker.
 * Display fallback for null/unknown: "Others" (key others).
 */

import type { LucideIcon } from 'lucide-react'
import {
  Landmark,
  Briefcase,
  Feather,
  Gift,
  Sparkles,
  Shirt,
  PlayCircle,
  HandHeart,
  Zap,
  TrendingUp,
  Settings,
  Tag,
  Coins,
} from 'lucide-react'

export interface EntryCategoryOption {
  value: string
  label: string
  icon: LucideIcon
}

/** Ordered list for form dropdowns (11 categories). */
export const ABUNDANCE_ENTRY_CATEGORIES: EntryCategoryOption[] = [
  { value: 'salary', label: 'Salary', icon: Landmark },
  { value: 'business_income', label: 'Business Income', icon: Briefcase },
  { value: 'tips', label: 'Tips', icon: Feather },
  { value: 'gifts', label: 'Gifts', icon: Gift },
  { value: 'unexpected_income', label: 'Unexpected Income', icon: Sparkles },
  { value: 'free_stuff', label: 'Free Stuff', icon: Shirt },
  { value: 'e_course', label: 'E-Course / Digital', icon: PlayCircle },
  { value: 'support', label: 'Support / Kindness', icon: HandHeart },
  { value: 'synchronicity', label: 'Synchronicity', icon: Zap },
  { value: 'opportunity', label: 'Opportunity', icon: TrendingUp },
  { value: 'others', label: 'Others', icon: Settings },
]

/** Labels and icons for display. Includes legacy keys so existing data still renders. */
export const ENTRY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  salary: { label: 'Salary', icon: Landmark },
  business_income: { label: 'Business Income', icon: Briefcase },
  tips: { label: 'Tips', icon: Feather },
  gifts: { label: 'Gifts', icon: Gift },
  unexpected_income: { label: 'Unexpected Income', icon: Sparkles },
  free_stuff: { label: 'Free Stuff', icon: Shirt },
  e_course: { label: 'E-Course / Digital', icon: PlayCircle },
  support: { label: 'Support / Kindness', icon: HandHeart },
  synchronicity: { label: 'Synchronicity', icon: Zap },
  opportunity: { label: 'Opportunity', icon: TrendingUp },
  others: { label: 'Others', icon: Settings },
  // Legacy keys (old app) – display only
  gift: { label: 'Gift', icon: Gift },
  discount: { label: 'Discount', icon: Tag },
  income: { label: 'Income', icon: Briefcase },
  found_money: { label: 'Found Money', icon: Coins },
  uncategorized: { label: 'Others', icon: Settings },
}

/** Get label and icon for an entry_category. Falls back to "Others" for null/unknown. */
export function getEntryCategoryDisplay(
  key: string | null | undefined
): { label: string; icon: LucideIcon } {
  if (key && ENTRY_LABELS[key]) return ENTRY_LABELS[key]
  return { label: 'Others', icon: Settings }
}
