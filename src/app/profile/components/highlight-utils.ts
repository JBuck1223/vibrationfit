/**
 * Utility for highlighting missing/incomplete fields in profile sections
 * Uses Energy Yellow (#FFFF00) from the design system for visibility
 */

// Highlight style for missing fields - uses Contrast Red from design system (#FF0040)
export const getHighlightClass = (fieldName: string, highlightedField?: string | null) => {
  if (highlightedField === fieldName) {
    return '!border-[#FF0040] !border-2'
  }
  return ''
}

// Type for the highlightedField prop
export interface HighlightableProps {
  highlightedField?: string | null
}
