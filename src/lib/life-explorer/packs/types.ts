/**
 * Expedition Pack — the human-curated content unit an expedition is born
 * from. The AI fills the daily path from the Wonder Wall against this pack.
 *
 * Every pack ships with pre-built fallback lessons: "Today" always renders
 * a teachable lesson even if AI generation fails.
 */

import type { CoreResource, LessonPayload, LifeCategoryKey } from '../types'

export interface ExpeditionPackMaterials {
  /** Household items lessons may assume without warning. */
  pantry: string[]
  /** Items that must appear on a weekly forecast ≥ 3 days ahead. */
  plan_ahead: string[]
}

/** A pre-designed recording sheet for a pack experiment (Expedition Kit). */
export interface PackExperimentSheet {
  title: string
  question: string
  prediction_prompt: string
  steps: string[]
  /** Rows of the observation chart, e.g. ['Bare hand', 'Blubber glove']. */
  chart_rows: string[]
  chart_columns: string[]
  result_prompt: string
  draw_prompt: string
}

/**
 * Content for the generated, on-brand printables (see print/layout.ts).
 * Rendered live by /api/life-explorer/print/* — never shipped as static PDFs.
 */
export interface ExpeditionPackPrintables {
  /** Mission line under the title on the kit cover. */
  mission: string
  /** Write-in labels on the Explorer Passport page. */
  passport_lines: string[]
  /** Drawing prompt for the expedition map page. */
  map_prompt: string
  /** Award text on the completion certificate. */
  certificate_line: string
  experiment_sheets: PackExperimentSheet[]
}

export interface ExpeditionPack {
  slug: string
  life_category: LifeCategoryKey
  title: string
  tagline: string
  essential_questions: string[]
  /**
   * Conversation prompts for the day-1 Wonder Wall seeding — things kids
   * this age often say/ask. NEVER auto-inserted: the wall starts empty and
   * fills only with the child's own words, captured during lesson 1.
   */
  likely_wonders: Array<{
    kind: 'know' | 'wonder'
    statement: string
  }>
  /** Tiered, quality-gated resources (see curation.ts). Stored once. */
  resources: CoreResource[]
  vocabulary: string[]
  materials: ExpeditionPackMaterials
  printables: ExpeditionPackPrintables
  /**
   * The proving path: complete, Fun-Contract-passing lessons in order.
   * Used as the ≈5-lesson starting path and as generation fallbacks.
   */
  fallback_lessons: LessonPayload[]
  /**
   * Adult-facing map of this week vs the boxed program the household
   * is comparing against. Optional — oceans week 1 has one.
   */
  facilitator_guide?: FacilitatorGuide
}

export interface FacilitatorGuideRow {
  day: number
  lesson_title: string
  boxed?: string
  this_week?: string
  extra?: string
  math?: string
  reading?: string
  writing?: string
  world?: string
  chapter?: string
  crew?: string
}

export interface FacilitatorGuide {
  for_whom: string
  promise: string
  rows: FacilitatorGuideRow[]
  leftovers: string[]
  /** Subject → what this week does → leftover/later. */
  week_map?: Array<{ subject: string; this_week: string; leftover?: string }>
}
