// VibrationFit Design System v2
// Enhanced mobile-first design system with layout primitives
// All components are rebuilt and approved through the design system page

// Export the enhanced design system
export * from './components'
export * from './tokens'

// Re-export commonly used components with shorter names
export {
  // Layout Primitives
  Stack,
  Inline,
  Grid,
  Switcher,
  Cover,
  Frame,
  Container,
  TwoColumn,
  FourColumn,
  
  // UI Components
  Card,
  Button,
  GradientButton,
  AIButton,
  Icon,
  Select,
  Badge,
  Input,
  Textarea,
  PageLayout,
  
  // Feedback Components
  Spinner,
  ProgressBar,
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

// Re-export vision categories
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
export { cn } from '@/lib/utils'