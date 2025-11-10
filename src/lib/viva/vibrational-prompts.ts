/**
 * Vibrational Prompts (Legacy Location)
 * 
 * This file now re-exports from the centralized prompts folder.
 * All prompts have been moved to /src/lib/viva/prompts/vibrational-prompts.ts
 * 
 * This file is kept for backward compatibility.
 * New code should import from '@/lib/viva/prompts' or '@/lib/viva/prompts/vibrational-prompts'
 */

export {
  buildVibrationalAnalyzerPrompt,
  buildSceneGenerationPrompt,
  buildNorthStarReflectionPrompt,
  type VibrationalAnalyzerPromptInput,
  type SceneGenerationPromptInput,
  type NorthStarReflectionPromptInput,
} from './prompts/vibrational-prompts'
