// ============================================================================
// AI Action Labels and Icons
// ============================================================================
// Centralized labels and icons for all AI actions in token tracking

export const ACTION_LABELS: Record<string, string> = {
  // Life Vision Generation
  'vision_generation': 'Vision Generation',
  'vision_refinement': 'Vision Refinement',
  'blueprint_generation': 'Blueprint Generation',
  'life_vision_category_summary': 'Category Summary',
  'life_vision_master_assembly': 'Master Vision Assembly',
  'final_assembly': 'Final Assembly',
  'merge_clarity': 'Merge Clarity Statements',
  
  // VIVA Chat & Prompts
  'chat_conversation': 'VIVA Chat',
  'prompt_suggestions': 'Prompt Suggestions',
  
  // Analysis & Insights
  'vibrational_analysis': 'Vibrational Analysis',
  'voice_profile_analysis': 'Voice Profile Analysis',
  'north_star_reflection': 'North Star Reflection',
  'frequency_flip': 'Frequency Flip',
  
  // Media Generation
  'audio_generation': 'Audio Generation',
  'image_generation': 'Image Generation',
  'viva_scene_generation': 'Scene Generation',
  'transcription': 'Audio Transcription',
  'vision_board_ideas': 'Vision Board Ideas',
  
  // Admin Actions
  'admin_grant': 'Admin Token Grant',
  'admin_deduct': 'Admin Token Deduction',
  'subscription_grant': 'Subscription Token Grant',
  'trial_grant': 'Trial Token Grant',
  'token_pack_purchase': 'Token Pack Purchase',
  
  // Legacy/Unused
  'assessment_scoring': 'Assessment Scoring',
}

// Lucide React icon names for each action type
export const ACTION_ICONS: Record<string, string> = {
  // Life Vision Generation
  'vision_generation': 'Target',
  'vision_refinement': 'Sparkles',
  'blueprint_generation': 'FileText',
  'life_vision_category_summary': 'FileEdit',
  'life_vision_master_assembly': 'Book',
  'final_assembly': 'Palette',
  'merge_clarity': 'Merge',
  
  // VIVA Chat & Prompts
  'chat_conversation': 'MessageSquare',
  'prompt_suggestions': 'Lightbulb',
  
  // Analysis & Insights
  'vibrational_analysis': 'BarChart3',
  'voice_profile_analysis': 'Mic',
  'north_star_reflection': 'Star',
  'frequency_flip': 'RefreshCw',
  
  // Media Generation
  'audio_generation': 'Music',
  'image_generation': 'Image',
  'viva_scene_generation': 'Video',
  'transcription': 'Mic2',
  'vision_board_ideas': 'Pin',
  
  // Admin Actions
  'admin_grant': 'Plus',
  'admin_deduct': 'Minus',
  'subscription_grant': 'Gift',
  'trial_grant': 'Zap',
  'token_pack_purchase': 'CreditCard',
  
  // Legacy/Unused
  'assessment_scoring': 'BarChart3',
}

export const ACTION_CATEGORIES: Record<string, string[]> = {
  'Vision Creation': [
    'vision_generation',
    'vision_refinement',
    'blueprint_generation',
    'life_vision_category_summary',
    'life_vision_master_assembly',
    'final_assembly',
    'merge_clarity',
  ],
  'VIVA Assistant': [
    'chat_conversation',
    'prompt_suggestions',
    'north_star_reflection',
  ],
  'Analysis & Insights': [
    'vibrational_analysis',
    'voice_profile_analysis',
    'frequency_flip',
  ],
  'Media Generation': [
    'audio_generation',
    'image_generation',
    'viva_scene_generation',
    'transcription',
    'vision_board_ideas',
  ],
  'Token Management': [
    'admin_grant',
    'admin_deduct',
    'subscription_grant',
    'trial_grant',
    'token_pack_purchase',
  ],
}

/**
 * Get human-readable label for an action type
 */
export function getActionLabel(actionType: string): string {
  return ACTION_LABELS[actionType] || actionType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Get Lucide icon name for an action type
 */
export function getActionIcon(actionType: string): string {
  return ACTION_ICONS[actionType] || 'Cpu'
}

/**
 * Get category for an action type
 */
export function getActionCategory(actionType: string): string | null {
  for (const [category, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(actionType)) {
      return category
    }
  }
  return null
}

/**
 * Get all unique action types from usage records
 */
export function getUniqueActionTypes(usage: Array<{ action_type: string }>): string[] {
  return Array.from(new Set(usage.map(r => r.action_type))).sort((a, b) => {
    return getActionLabel(a).localeCompare(getActionLabel(b))
  })
}

