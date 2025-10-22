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
  VIVAButton,
  Icon,
  Select,
  Badge,
  Input,
  Textarea,
  PageLayout,
  
  // Feedback Components
  Spinner,
  ProgressBar,
  
  // Media Components
  Video,
  
  // Overlay Components
  Modal,
  
  // Specialized Cards
  ItemListCard,
  PricingCard,
  
  // Navigation Components
  Sidebar,
  MobileBottomNav,
  SidebarLayout,
} from './components'

// Legacy alias for backward compatibility
export { VIVAButton as AIButton } from './components'

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