// VibrationFit Design System
// Main export file for easy importing

export * from './tokens'
export * from './components'

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

// Utility function
export { cn } from '../utils'
