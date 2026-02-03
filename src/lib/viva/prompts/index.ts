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
// GPT-5 Optimized: Simplified exports
export {
  MASTER_VISION_SHARED_SYSTEM_PROMPT,
  MASTER_VISION_EXECUTION_RULES,
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

// NEW V3 PROMPTS - Life Vision Process Enhancement

// Ideal State Questions (Step 2: Unleash Imagination)
// Now using static questions from @/lib/life-vision/ideal-state-questions

// Blueprint Prompt (Step 3: Being/Doing/Receiving generation)
export {
  buildBlueprintPrompt,
  type BeingDoingReceivingLoop,
} from './blueprint-prompt'

// Final Assembly Prompt (Step 6: Forward/Conclusion generation)
export { buildFinalAssemblyPrompt } from './final-assembly-prompt'

// Activation Prompt (Step 6: Celebration & next steps)
export { buildActivationReflectionPrompt } from './activation-prompt'

// Flip Frequency (already well-structured in flip-frequency.ts)
// Imported directly from @/lib/viva/flip-frequency
// ENHANCED V3: Now includes density awareness in flip-frequency-prompt.ts

// Imagination Starter (Get Me Started feature)
export {
  buildImaginationStarterPrompt,
  extractCategoryProfileData,
  CATEGORY_PROFILE_FIELDS,
} from './imagination-starter-prompt'

// Focus Story (5-7 minute day-in-the-life narratives)
export {
  FOCUS_HIGHLIGHT_SYSTEM_PROMPT,
  FOCUS_STORY_SYSTEM_PROMPT,
  buildHighlightExtractionPrompt,
  buildDayInTheLifeStoryPrompt,
  buildStoryRefinementPrompt,
  type FocusHighlight,
  type VisionSections,
} from './focus-story-prompt'

// Shared Components
export { VIVA_PERSONA, VIVA_PERSONA_WITH_GOLDEN_RULES } from './shared/viva-persona'