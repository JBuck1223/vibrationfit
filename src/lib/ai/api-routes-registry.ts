// ============================================================================
// API Routes Registry - Complete List of All AI API Routes
// ============================================================================
// This registry contains ALL API routes that make AI calls, not just those
// in AI_MODELS. Used by /admin/ai-models for comprehensive management.

import { AI_MODELS, type AIModelConfig } from './config'

export interface APIRouteConfig {
  // Route identification
  routePath: string // e.g., '/api/viva/chat'
  routeName: string // Display name
  actionType: string // Token tracking action_type
  category: 'text' | 'audio' | 'image' | 'admin' // Category for grouping
  
  // Model configuration (for text-based routes)
  modelConfig?: AIModelConfig
  
  // Non-text routes (audio, image, etc.)
  model?: string // e.g., 'whisper-1', 'dall-e-3', 'tts-1'
  usesOverride?: boolean // Whether it uses token override system
  
  // Metadata
  description: string
  filePath: string // Source file path
  hasTokenTracking: boolean // Whether token tracking is implemented
  multipleCalls?: number // Number of AI calls in this route (if > 1)
  usedBy?: string[] // Pages/components that use this feature
}

// ============================================================================
// COMPLETE API ROUTES REGISTRY
// ============================================================================

export const API_ROUTES_REGISTRY: APIRouteConfig[] = [
  // ==========================================================================
  // TEXT-BASED ROUTES (from AI_MODELS)
  // ==========================================================================
  {
    routePath: '/api/viva/chat',
    routeName: 'VIVA Chat',
    actionType: 'chat_conversation',
    category: 'text',
    modelConfig: AI_MODELS.CHAT_CONVERSATION,
    description: 'Streaming AI chat endpoint with OpenAI - VIVA conversations',
    filePath: 'src/app/api/viva/chat/route.ts',
    hasTokenTracking: true,
    usedBy: ['/viva - Master VIVA Assistant'],
  },
  {
    routePath: '/api/viva/category-summary',
    routeName: 'Life Vision Category Summary',
    actionType: 'life_vision_category_summary',
    category: 'text',
    modelConfig: AI_MODELS.LIFE_VISION_CATEGORY_SUMMARY,
    description: 'Generates personalized category summaries from user input, profile, and assessment',
    filePath: 'src/app/api/viva/category-summary/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key] - Step 1: Category Summary Generation'],
  },
  {
    routePath: '/api/viva/master-vision',
    routeName: 'Life Vision Master Assembly',
    actionType: 'life_vision_master_assembly',
    category: 'text',
    modelConfig: AI_MODELS.LIFE_VISION_MASTER_ASSEMBLY,
    description: 'Assembles complete life vision document from all category summaries',
    filePath: 'src/app/api/viva/master-vision/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/assembly - Step 5: Master Vision Assembly'],
  },
  {
    routePath: '/api/viva/prompt-suggestions',
    routeName: 'Prompt Suggestions',
    actionType: 'prompt_suggestions',
    category: 'text',
    modelConfig: AI_MODELS.PROMPT_SUGGESTIONS,
    description: 'Generates personalized, creative prompts for life vision reflection',
    filePath: 'src/app/api/viva/prompt-suggestions/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key] - Personalized Reflection Prompts'],
  },
  {
    routePath: '/api/viva/flip-frequency',
    routeName: 'Frequency Flip',
    actionType: 'frequency_flip',
    category: 'text',
    modelConfig: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
    },
    description: 'Converts contrast/lack language into clarity seeds',
    filePath: 'src/app/api/viva/flip-frequency/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key] - Contrast to Clarity Transformation'],
  },
  {
    routePath: '/api/viva/merge-clarity',
    routeName: 'Merge Clarity',
    actionType: 'life_vision_category_summary',
    category: 'text',
    modelConfig: AI_MODELS.LIFE_VISION_CATEGORY_SUMMARY,
    description: 'Merges Current Clarity + Clarity from Contrast',
    filePath: 'src/app/api/viva/merge-clarity/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key] - Combining Clarity Sources'],
  },
  {
    routePath: '/api/viva/ideal-state',
    routeName: 'Ideal State Generation',
    actionType: 'vision_generation',
    category: 'text',
    modelConfig: AI_MODELS.VISION_GENERATION,
    description: 'V3 Step 2: Generates ideal state prompts and processes user imagination',
    filePath: 'src/app/api/viva/ideal-state/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key]/imagination - Step 2: Unleash Imagination'],
  },
  {
    routePath: '/api/viva/blueprint',
    routeName: 'Blueprint Generation',
    actionType: 'blueprint_generation',
    category: 'text',
    modelConfig: AI_MODELS.BLUEPRINT_GENERATION,
    description: 'V3 Step 3: Generates Being/Doing/Receiving loops from ideal state',
    filePath: 'src/app/api/viva/blueprint/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key]/blueprint - Step 3: Being/Doing/Receiving Blueprint'],
  },
  {
    routePath: '/api/viva/final-assembly',
    routeName: 'Final Assembly',
    actionType: 'vision_generation',
    category: 'text',
    modelConfig: AI_MODELS.VISION_GENERATION,
    description: 'V3 Step 6: Generates forward, conclusion, and activation message',
    filePath: 'src/app/api/viva/final-assembly/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/final - Step 6: Final Polish & Activation'],
  },
  {
    routePath: '/api/viva/refine-category',
    routeName: 'Refine Category',
    actionType: 'vision_refinement',
    category: 'text',
    modelConfig: AI_MODELS.VISION_REFINEMENT,
    description: 'One-shot refinement endpoint for individual categories',
    filePath: 'src/app/api/viva/refine-category/route.ts',
    hasTokenTracking: true,
    usedBy: ['Legacy endpoint - not actively used in V3'],
  },
  // NOTE: Deprecated/removed endpoints (Nov 11, 2025)
  // - /api/vibe-assistant/refine-vision (deprecated)
  // - /api/vibe-assistant/generate-blueprint (deprecated)
  // - /api/vision/generate (deprecated)
  // - /api/vision/chat (deprecated)
  // - /api/assessment/ai-score (removed - never implemented, unused)
  {
    routePath: '/api/voice-profile/analyze',
    routeName: 'Voice Profile Analyzer',
    actionType: 'voice_profile_analysis',
    category: 'text',
    modelConfig: AI_MODELS.VIVA_VOICE_ANALYZER,
    description: 'Analyzes user writing samples to refine their VIVA voice profile',
    filePath: 'src/app/api/voice-profile/analyze/route.ts',
    hasTokenTracking: true,
    usedBy: ['/voice-profile/analyze - Voice Pattern Analysis'],
  },
  
  // ==========================================================================
  // AUDIO ROUTES
  // ==========================================================================
  {
    routePath: '/api/transcribe',
    routeName: 'Audio Transcription',
    actionType: 'transcription',
    category: 'audio',
    model: 'whisper-1',
    usesOverride: true,
    description: 'Transcribe audio files using OpenAI Whisper',
    filePath: 'src/app/api/transcribe/route.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/new/category/[key] - Audio Input Transcription', '/journal/new - Voice Journaling', 'RecordingTextarea Component - Voice Input'],
  },
  {
    routePath: '/lib/services/audioService.ts',
    routeName: 'Text-to-Speech',
    actionType: 'audio_generation',
    category: 'audio',
    model: 'tts-1',
    usesOverride: true,
    description: 'Generate audio from text using OpenAI TTS',
    filePath: 'src/lib/services/audioService.ts',
    hasTokenTracking: true,
    usedBy: ['/life-vision/[id]/audio-generate - Vision Audio Generation', '/life-vision/[id]/audio-sets - Audio Set Creation'],
  },
  
  // ==========================================================================
  // IMAGE ROUTES
  // ==========================================================================
  {
    routePath: '/lib/services/imageService.ts',
    routeName: 'Image Generation',
    actionType: 'image_generation',
    category: 'image',
    model: 'dall-e-3',
    usesOverride: true,
    description: 'Generate images using DALL-E 3',
    filePath: 'src/lib/services/imageService.ts',
    hasTokenTracking: true,
    usedBy: ['/vision-board/new - AI Image Generation', '/vision-board/[id] - Custom Board Images'],
  },
  
  // ==========================================================================
  // ADMIN ROUTES
  // ==========================================================================
  {
    routePath: '/api/admin/users/adjust-tokens',
    routeName: 'Admin Token Adjustment',
    actionType: 'admin_grant', // or admin_deduct
    category: 'admin',
    model: 'admin',
    description: 'Admin token grants and deductions',
    filePath: 'src/app/api/admin/users/adjust-tokens/route.ts',
    hasTokenTracking: true,
    usedBy: ['/admin/users - Manual Token Grants/Deductions'],
  },
  {
    routePath: '/api/vibration/scenes/generate',
    routeName: 'Scene Generation',
    actionType: 'viva_scene_generation',
    category: 'text',
    modelConfig: AI_MODELS.VIVA_SCENE_SUGGESTION,
    description: 'Generates cinematic scenes for a life category and logs vibrational events',
    filePath: 'src/app/api/vibration/scenes/generate/route.ts',
    hasTokenTracking: true,
    multipleCalls: 2,
    usedBy: ['/life-vision/new/category/[key]/scenes - Step 4: Creative Visualization Scenes', '/scenes/builder - Dynamic Scene Generation'],
  },
  {
    routePath: '/api/vibration/scenes/[id]',
    routeName: 'Scene Update & Analysis',
    actionType: 'vibrational_analysis',
    category: 'text',
    modelConfig: AI_MODELS.VIBRATIONAL_ANALYZER,
    description: 'Analyzes and updates vibrational alignment for edited scenes',
    filePath: 'src/app/api/vibration/scenes/[id]/route.ts',
    hasTokenTracking: true,
    usedBy: ['/scenes/builder - Scene Editing & Re-analysis'],
  },
  {
    routePath: '/api/vibration/dashboard/category',
    routeName: 'North Star Reflection',
    actionType: 'north_star_reflection',
    category: 'text',
    modelConfig: AI_MODELS.VIVA_NORTH_STAR_REFLECTION,
    description: 'Generates a North Star reflection summary for dashboard categories',
    filePath: 'src/app/api/vibration/dashboard/category/route.ts',
    hasTokenTracking: true,
    usedBy: ['/dashboard/north-star - AI-Generated Category Reflections'],
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all routes by category
 */
export function getRoutesByCategory(category: APIRouteConfig['category']): APIRouteConfig[] {
  return API_ROUTES_REGISTRY.filter(route => route.category === category)
}

/**
 * Get route by action type
 */
export function getRouteByActionType(actionType: string): APIRouteConfig | undefined {
  return API_ROUTES_REGISTRY.find(route => route.actionType === actionType)
}

/**
 * Get route by path
 */
export function getRouteByPath(path: string): APIRouteConfig | undefined {
  return API_ROUTES_REGISTRY.find(route => route.routePath === path)
}

/**
 * Get all routes that use a specific model
 */
export function getRoutesUsingModel(model: string): APIRouteConfig[] {
  return API_ROUTES_REGISTRY.filter(route => 
    route.modelConfig?.model === model || route.model === model
  )
}

/**
 * Get all routes that need token overrides
 */
export function getRoutesNeedingOverrides(): APIRouteConfig[] {
  return API_ROUTES_REGISTRY.filter(route => route.usesOverride === true)
}

/**
 * Get all routes without token tracking
 */
export function getRoutesWithoutTracking(): APIRouteConfig[] {
  return API_ROUTES_REGISTRY.filter(route => route.hasTokenTracking === false)
}

