/**
 * Admin-configurable AI settings for the storybook pipeline.
 *
 * Both tools live in the ai_tools table and are editable at
 * /admin/ai-models → Tools:
 * - life_explorer_storybook_writer      (text model, temperature, max tokens, system prompt)
 * - life_explorer_storybook_illustrator (fal edit model; system_prompt = the style bible)
 *
 * Code defaults below are the fallback if a row is missing or inactive.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_BOOK_SYSTEM_PROMPT } from './book-prompts'
import { BOOK_STYLE_BIBLE } from './book-characters'

export const STORYBOOK_WRITER_TOOL_KEY = 'life_explorer_storybook_writer'
export const STORYBOOK_ILLUSTRATOR_TOOL_KEY = 'life_explorer_storybook_illustrator'

export interface StorybookWriterConfig {
  /** Gateway-qualified model id, e.g. "openai/gpt-5.6-terra". */
  gatewayModel: string
  /** Bare model name for token tracking, e.g. "gpt-5.6-terra". */
  modelName: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  /** Reasoning models (gpt-5 family, o-series) reject custom temperature. */
  supportsTemperature: boolean
  maxTokensParam: 'max_tokens' | 'max_completion_tokens'
}

export interface StorybookIllustratorConfig {
  /** fal edit model used for the cover and pages. */
  editModel: string
  /** Style bible appended to every illustration prompt. */
  styleBible: string
}

interface AiToolRow {
  model_name: string
  temperature: number | string
  max_tokens: number
  system_prompt: string | null
}

async function loadToolRow(
  supabase: SupabaseClient,
  toolKey: string
): Promise<AiToolRow | null> {
  const { data } = await supabase
    .from('ai_tools')
    .select('model_name, temperature, max_tokens, system_prompt')
    .eq('tool_key', toolKey)
    .eq('is_active', true)
    .maybeSingle()
  return (data as AiToolRow | null) || null
}

export async function loadStorybookWriterConfig(
  supabase: SupabaseClient
): Promise<StorybookWriterConfig> {
  const row = await loadToolRow(supabase, STORYBOOK_WRITER_TOOL_KEY)
  const modelName = row?.model_name || 'gpt-5.6-terra'

  // Capability flags live on ai_model_pricing; fall back to a gpt-5/o-series
  // heuristic (same as the VIVA coach) if the pricing row is missing.
  const { data: caps } = await supabase
    .from('ai_model_pricing')
    .select('supports_temperature, max_tokens_param')
    .eq('model_name', modelName)
    .eq('is_active', true)
    .maybeSingle()
  const isReasoningByName = /(^|\/)(gpt-5|o\d)/.test(modelName)

  return {
    modelName,
    // The AI gateway wants provider-qualified ids; ai_tools stores bare OpenAI names.
    gatewayModel: modelName.includes('/') ? modelName : `openai/${modelName}`,
    temperature: row ? Number(row.temperature) : 0.9,
    // Reasoning models spend output tokens on thinking — budget generously.
    maxTokens: row?.max_tokens || 8000,
    systemPrompt: row?.system_prompt || DEFAULT_BOOK_SYSTEM_PROMPT,
    supportsTemperature: caps ? caps.supports_temperature !== false : !isReasoningByName,
    maxTokensParam:
      caps?.max_tokens_param === 'max_completion_tokens' || (!caps && isReasoningByName)
        ? 'max_completion_tokens'
        : 'max_tokens',
  }
}

export async function loadStorybookIllustratorConfig(
  supabase: SupabaseClient
): Promise<StorybookIllustratorConfig> {
  const row = await loadToolRow(supabase, STORYBOOK_ILLUSTRATOR_TOOL_KEY)
  return {
    editModel: row?.model_name || 'fal-ai/nano-banana/edit',
    styleBible: row?.system_prompt || BOOK_STYLE_BIBLE,
  }
}
