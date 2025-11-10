/**
 * Central Prompts Index
 * 
 * All VIVA prompts exported from a single location for easy importing
 */

// Vision Composer
export {
  VISION_COMPOSER_SYSTEM_PROMPT,
  VISION_COMPOSER_TASKS_PROMPT,
} from './vision-composer-prompt'

// Conversation Generator
export { buildConversationGeneratorPrompt } from './conversation-generator-prompt'

// Category Summary
export {
  CATEGORY_SUMMARY_SYSTEM_PROMPT,
  buildCategorySummaryPrompt,
} from './category-summary-prompt'

// Prompt Suggestions
export { buildPromptSuggestionsPrompt } from './prompt-suggestions-prompt'

// Master Vision Assembly (imported by refine-category as well)
export {
  MASTER_VISION_SHARED_SYSTEM_PROMPT,
  FIVE_PHASE_INSTRUCTIONS,
  FLOW_FLEXIBILITY_NOTE,
  STYLE_GUARDRAILS,
  MICRO_REWRITE_RULE,
  buildMasterVisionPrompt,
} from './master-vision-prompts'

// Merge Clarity
export { MERGE_CLARITY_SYSTEM_PROMPT } from './merge-clarity-prompt'

// Vibrational Analysis & Scene Generation
export {
  buildVibrationalAnalyzerPrompt,
  buildSceneGenerationPrompt,
  buildNorthStarReflectionPrompt,
  type VibrationalAnalyzerPromptInput,
  type SceneGenerationPromptInput,
  type NorthStarReflectionPromptInput,
} from './vibrational-prompts'

// Chat System Prompt
export {
  buildVivaSystemPrompt,
  REFINEMENT_INSTRUCTIONS,
  type BuildChatSystemPromptInput,
} from './chat-system-prompt'

// Flip Frequency (already well-structured in flip-frequency.ts)
// Imported directly from @/lib/viva/flip-frequency

// Shared Components
export { VIVA_PERSONA, VIVA_PERSONA_WITH_GOLDEN_RULES } from './shared/viva-persona'