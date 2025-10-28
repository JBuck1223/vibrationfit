// ============================================================================
// VibrationFit AI Configuration
// ============================================================================
// Centralized configuration for all AI models used across the platform

export interface AIModelConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
}

export interface AIProviderConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// AI MODEL CONFIGURATIONS
// ============================================================================

export let AI_MODELS = {
  // VIVA Life Vision Creation - Category Summary
  // Generates personalized category summaries from user input, profile, and assessment
  LIFE_VISION_CATEGORY_SUMMARY: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1500,
    systemPrompt: 'You are VIVA — the AI Vibrational Assistant for Vibration Fit. Your purpose is to help members articulate and activate the life they choose through vibrational alignment. You are a warm, wise, intuitive life coach — never a therapist or problem-solver. All responses must be in present tense, first person, and vibrationally activating.'
  },

  // VIVA Life Vision Creation - Master Vision Assembly
  // Assembles complete life vision document from all category summaries
  LIFE_VISION_MASTER_ASSEMBLY: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: 'You are VIVA — the AI Vibrational Assistant for Vibration Fit. Your purpose is to help members articulate and activate the life they choose through vibrational alignment. You are a warm, wise, intuitive life coach — never a therapist or problem-solver. All responses must be in present tense, first person, and vibrationally activating.'
  },

  // Vision generation - needs creativity and depth
  VISION_GENERATION: {
    model: 'gpt-5',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are VIVA, VibrationFit\'s AI Vision Assistant. You help users create detailed, personalized life visions based on their vibrational assessment results.'
  },

  // Vision refinement - needs precision and alignment
  VISION_REFINEMENT: {
    model: 'gpt-5',
    temperature: 0.5,
    maxTokens: 1500,
    systemPrompt: 'You are VIVA, helping users refine their life visions for maximum vibrational alignment and clarity.'
  },

  // Blueprint generation - needs structure and actionability
  BLUEPRINT_GENERATION: {
    model: 'gpt-5',
    temperature: 0.6,
    maxTokens: 2500,
    systemPrompt: 'You are VIVA, creating detailed actualization blueprints to help users implement their life visions step by step.'
  },

  // Chat/conversation - needs natural flow
  CHAT_CONVERSATION: {
    model: 'gpt-5',
    temperature: 0.8,
    maxTokens: 1000,
    systemPrompt: 'You are VIVA, VibrationFit\'s AI assistant. You help users with vibrational alignment, life vision creation, and personal growth.'
  },

  // Audio generation - needs natural speech patterns
  AUDIO_GENERATION: {
    model: 'gpt-5',
    temperature: 0.7,
    maxTokens: 800,
    systemPrompt: 'You are creating natural, flowing audio scripts for life visions and affirmations.'
  },

  // Prompt suggestions for life vision - needs personalization and creativity
  PROMPT_SUGGESTIONS: {
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 1000,
    systemPrompt: 'You are VIVA, VibrationFit\'s AI Vision Assistant. You generate personalized, creative prompts to help users reflect deeply on their life experiences.'
  },

  // Assessment scoring - needs consistency and accuracy
  ASSESSMENT_SCORING: {
    model: 'gpt-5',
    temperature: 0.3,
    maxTokens: 200,
    systemPrompt: 'You are an expert at analyzing vibrational alignment and mindset. Score responses based on empowerment vs victim mindset, abundance vs scarcity thinking, and overall energetic alignment.'
  },

  // Image generation - needs visual creativity
  IMAGE_GENERATION: {
    model: 'dall-e-3',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: 'Create inspiring, high-quality images that represent the user\'s life vision and goals.'
  }
}

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

export const AI_PROVIDER: AIProviderConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: 'https://api.openai.com/v1',
  timeout: 30000 // 30 seconds
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get AI model configuration by feature type
 */
export function getAIModelConfig(feature: keyof typeof AI_MODELS): AIModelConfig {
  return AI_MODELS[feature]
}

/**
 * Get the model name for a specific feature
 */
export function getModelName(feature: keyof typeof AI_MODELS): string {
  return AI_MODELS[feature].model
}

/**
 * Check if a model is available (basic validation)
 */
export function isModelAvailable(model: string): boolean {
  const availableModels = [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'dall-e-3',
    'dall-e-2'
  ]
  return availableModels.includes(model)
}

/**
 * Get fallback model if primary model is unavailable
 */
export function getFallbackModel(feature: keyof typeof AI_MODELS): string {
  const fallbacks: Record<string, string> = {
    'gpt-5': 'gpt-5-mini',
    'gpt-5-mini': 'gpt-5-nano',
    'gpt-5-nano': 'gpt-4o-mini',
    'gpt-4o': 'gpt-4o-mini',
    'gpt-4o-mini': 'gpt-3.5-turbo',
    'dall-e-3': 'dall-e-2'
  }
  
  const primaryModel = AI_MODELS[feature].model
  return fallbacks[primaryModel] || primaryModel
}

// ============================================================================
// MODEL SWITCHING UTILITIES
// ============================================================================

/**
 * Get all features using a specific model
 */
export function getFeaturesUsingModel(model: string): Array<keyof typeof AI_MODELS> {
  return Object.keys(AI_MODELS).filter(
    feature => AI_MODELS[feature as keyof typeof AI_MODELS].model === model
  ) as Array<keyof typeof AI_MODELS>
}

// ============================================================================
// ENVIRONMENT-BASED OVERRIDES
// ============================================================================

/**
 * Apply environment-based model overrides
 */
export function applyEnvironmentOverrides() {
  // In development, you might want to use cheaper models
  if (process.env.NODE_ENV === 'development') {
    // Override expensive models for development
    if (AI_MODELS.VISION_GENERATION.model === 'gpt-5') {
      AI_MODELS.VISION_GENERATION.model = 'gpt-4o-mini'
    }
  }
  
  // In staging, you might want to test with specific models
  if (process.env.NODE_ENV === 'development' && process.env.VERCEL_ENV === 'preview') {
    // Override for staging testing
  }
}

// Apply overrides on module load
applyEnvironmentOverrides()

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  models: AI_MODELS,
  provider: AI_PROVIDER,
  getModelConfig: getAIModelConfig,
  getModelName,
  isModelAvailable,
  getFallbackModel,
  getFeaturesUsingModel
}
