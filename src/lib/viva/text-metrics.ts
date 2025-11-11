/**
 * Text Metrics Utilities
 * 
 * Utilities for measuring text density, word/character counts, and computing
 * target length ranges to preserve input richness in AI-generated outputs.
 * 
 * Used throughout the Life Vision V3 system to ensure outputs scale appropriately
 * with input detail level.
 */

/**
 * Estimates word count in a text string
 * Splits on whitespace and filters empty strings
 */
export function estimateWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length
}

/**
 * Estimates character count in a text string (excluding leading/trailing whitespace)
 */
export function estimateCharCount(text: string): number {
  if (!text) {
    return 0
  }
  
  return text.trim().length
}

/**
 * Options for computing target length ranges
 */
export interface TargetLengthOptions {
  /** Minimum ratio of output to input (default: 0.9 = 90%) */
  minRatio?: number
  /** Maximum ratio of output to input (default: 1.1 = 110%) */
  maxRatio?: number
}

/**
 * Result of target length computation
 */
export interface TargetLengthRange {
  minChars: number
  maxChars: number
  minWords: number
  maxWords: number
  inputChars: number
  inputWords: number
}

/**
 * Computes target length range based on source text
 * 
 * Default preserves 90-110% of input length to maintain richness
 * without excessive compression or expansion
 * 
 * @param sourceText - The original input text
 * @param options - Min/max ratio options (defaults: 0.9 - 1.1)
 * @returns Target length ranges in characters and words
 * 
 * @example
 * const range = computeTargetLengthRange(userInput)
 * // Use in prompt: "Target length: ${range.minChars}-${range.maxChars} characters"
 */
export function computeTargetLengthRange(
  sourceText: string,
  options: TargetLengthOptions = {}
): TargetLengthRange {
  const { minRatio = 0.9, maxRatio = 1.1 } = options
  
  const inputChars = estimateCharCount(sourceText)
  const inputWords = estimateWordCount(sourceText)
  
  // Compute ranges
  const minChars = Math.floor(inputChars * minRatio)
  const maxChars = Math.ceil(inputChars * maxRatio)
  const minWords = Math.floor(inputWords * minRatio)
  const maxWords = Math.ceil(inputWords * maxRatio)
  
  return {
    minChars,
    maxChars,
    minWords,
    maxWords,
    inputChars,
    inputWords
  }
}

/**
 * Counts distinct ideas in text using heuristics
 * 
 * Heuristics used:
 * - Line breaks (each line may be a distinct thought)
 * - Bullet points (-, *, •, numbers)
 * - Coordinating conjunctions that join ideas ("and", "also", "plus")
 * - Sentence starts with contextual words (when, where, what, with, while)
 * 
 * This is approximate but useful for gauging content density
 */
export function countDistinctIdeas(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }
  
  let ideaCount = 0
  
  // Split into lines
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  ideaCount += lines.length
  
  // Count bullet points (various formats)
  const bulletMatches = text.match(/^[\s]*[-*•]\s+/gm) || []
  ideaCount += bulletMatches.length
  
  // Count numbered lists
  const numberedMatches = text.match(/^[\s]*\d+[.)]\s+/gm) || []
  ideaCount += numberedMatches.length
  
  // Count coordinating conjunctions that join distinct ideas
  const conjunctionMatches = text.match(/\b(and|also|plus|additionally|furthermore)\s+/gi) || []
  ideaCount += conjunctionMatches.length
  
  // Count sentences that start with contextual words (often introduce new ideas)
  const contextualStarts = text.match(/\b(when|where|what|with|while|during|after|before)\s+\w+/gi) || []
  ideaCount += contextualStarts.length
  
  // Return at least 1 if there's any content
  return Math.max(1, ideaCount)
}

/**
 * Computes combined text from multiple sources
 * Useful for aggregating clarity, contrast, profile, assessment, etc.
 */
export function combineTextSources(...sources: (string | null | undefined)[]): string {
  return sources
    .filter(source => source && source.trim().length > 0)
    .join('\n\n')
}

/**
 * Computes density metrics for a text
 * Higher density = more ideas per character
 */
export interface DensityMetrics {
  chars: number
  words: number
  ideas: number
  ideasPerChar: number
  ideasPerWord: number
  wordsPerIdea: number
  density: 'low' | 'medium' | 'high' | 'very_high'
}

/**
 * Analyzes text density
 * 
 * Density levels:
 * - Low: < 0.5 ideas per 100 characters
 * - Medium: 0.5 - 1.0 ideas per 100 characters
 * - High: 1.0 - 2.0 ideas per 100 characters
 * - Very High: > 2.0 ideas per 100 characters
 */
export function analyzeDensity(text: string): DensityMetrics {
  const chars = estimateCharCount(text)
  const words = estimateWordCount(text)
  const ideas = countDistinctIdeas(text)
  
  const ideasPerChar = chars > 0 ? ideas / chars : 0
  const ideasPerWord = words > 0 ? ideas / words : 0
  const wordsPerIdea = ideas > 0 ? words / ideas : 0
  
  // Calculate density level (ideas per 100 chars)
  const ideasPer100Chars = ideasPerChar * 100
  
  let density: 'low' | 'medium' | 'high' | 'very_high'
  if (ideasPer100Chars < 0.5) {
    density = 'low'
  } else if (ideasPer100Chars < 1.0) {
    density = 'medium'
  } else if (ideasPer100Chars < 2.0) {
    density = 'high'
  } else {
    density = 'very_high'
  }
  
  return {
    chars,
    words,
    ideas,
    ideasPerChar,
    ideasPerWord,
    wordsPerIdea,
    density
  }
}

/**
 * Formats density metrics as a human-readable string for prompt injection
 */
export function formatDensityForPrompt(metrics: DensityMetrics): string {
  return `Input richness: ~${metrics.chars} characters, ${metrics.ideas} distinct ideas (${metrics.density} density)`
}

/**
 * Computes per-category richness data for master vision assembly
 * Returns data structure suitable for prompt injection
 */
export interface CategoryRichnessData {
  inputChars: number
  minChars: number
  maxChars: number
  ideaCount: number
  density: 'low' | 'medium' | 'high' | 'very_high'
}

export function computeCategoryRichness(
  ...textSources: (string | null | undefined)[]
): CategoryRichnessData {
  const combined = combineTextSources(...textSources)
  const range = computeTargetLengthRange(combined)
  const density = analyzeDensity(combined)
  
  return {
    inputChars: range.inputChars,
    minChars: range.minChars,
    maxChars: range.maxChars,
    ideaCount: density.ideas,
    density: density.density
  }
}

/**
 * Formats category richness data for prompt injection
 */
export function formatCategoryRichnessForPrompt(
  categoryName: string,
  richness: CategoryRichnessData
): string {
  return `Category: ${categoryName}
- Input richness: ~${richness.inputChars} characters, ${richness.ideaCount} distinct ideas
- Target output: ${richness.minChars}-${richness.maxChars} characters
- Density: ${richness.density}
- Required coverage: include ALL major ideas and themes mentioned`
}

