import * as tokens from '../../tokens'

/**
 * GLOBAL STATUS BADGE SYSTEM
 * Standardized status styling across all iterative features
 * Uses VibrationFit design tokens for consistency
 */

// Status color constants for consistent theming
export const STATUS_COLORS = {
  active: {
    // Electric Lime Green - "Above the Green Line"
    bg: tokens.colors.primary[500],        // #39FF14
    text: tokens.colors.neutral[0],        // Black
    border: tokens.colors.primary[500],
    bgSubtle: 'rgba(57, 255, 20, 0.2)',
    textSubtle: tokens.colors.primary[500],
    borderSubtle: 'rgba(57, 255, 20, 0.3)',
  },
  draft: {
    // Neon Yellow - Work in Progress / Celebration
    // Use label="IN PROGRESS" prop to display "IN PROGRESS" instead of "DRAFT"
    bg: tokens.colors.semantic.warning,     // #FFFF00
    text: tokens.colors.neutral[0],         // Black
    border: tokens.colors.semantic.warning,
    bgSubtle: 'rgba(255, 255, 0, 0.2)',
    textSubtle: '#FFFF00',                  // Neon Yellow
    borderSubtle: 'rgba(255, 255, 0, 0.3)',
  },
  complete: {
    // Blue - Completed/Finished state
    bg: '#3B82F6',                   // Blue 500
    text: '#FFFFFF',                 // White
    border: '#3B82F6',
    bgSubtle: 'rgba(59, 130, 246, 0.2)',
    textSubtle: '#60A5FA',           // Blue 400
    borderSubtle: 'rgba(59, 130, 246, 0.3)',
  },
  paused: {
    // Neon Orange - Paused state
    bg: tokens.colors.energy.orange[500],   // #FF6600
    text: '#FFFFFF',                        // White
    border: tokens.colors.energy.orange[500],
    bgSubtle: 'rgba(255, 102, 0, 0.2)',
    textSubtle: '#FF6600',                  // Neon Orange
    borderSubtle: 'rgba(255, 102, 0, 0.3)',
  },
  archived: {
    // Neutral Gray - Archived/Inactive
    bg: tokens.colors.neutral[600],         // #4B5563
    text: '#FFFFFF',                        // White
    border: tokens.colors.neutral[600],
    bgSubtle: 'rgba(75, 85, 99, 0.2)',
    textSubtle: tokens.colors.neutral[400], // #9CA3AF
    borderSubtle: 'rgba(75, 85, 99, 0.3)',
  },
} as const

export type StatusType = keyof typeof STATUS_COLORS

