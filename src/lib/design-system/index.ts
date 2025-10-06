// VibrationFit Design System
// Main export file for easy importing

export * from './tokens'
export * from './components'
export * from './vision-categories'

// Re-export commonly used components with shorter names
export {
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  ProgressBar,
  Spinner,
  Container,
  PageLayout,
} from './components'

// Re-export design tokens
export {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  durations,
  easings,
  zIndex,
  gradients,
  breakpoints,
  components,
} from './tokens'

// Vision categories
export {
  VISION_CATEGORIES,
  getVisionCategory,
  getVisionCategoryLabel,
  getVisionCategoryIcon,
  getVisionCategoryDescription,
  getOrderedVisionCategories,
  getVisionCategoryKeys,
  isValidVisionCategory,
  type VisionCategory
} from './vision-categories'

// Utility function
export { cn } from '../utils'
