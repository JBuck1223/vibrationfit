// VibrationFit Design System
// Design Tokens - Single source of truth for all design values

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#A8E5CE',   // Green Lighter
    100: '#5EC49A',  // Green Light  
    500: '#199D67',  // Primary Green
    600: '#15803D',  // Green Dark
    700: '#166534',  // Green Darker
  },
  
  // Secondary Brand Colors
  secondary: {
    50: '#CCFBF1',   // Teal Lighter
    100: '#2DD4BF',  // Teal Light
    500: '#14B8A6',  // Teal
    600: '#0D9488',  // Teal Dark
    700: '#0F766E',  // Teal Darker
  },
  
  // Accent Colors
  accent: {
    50: '#C4B5FD',   // Purple Lighter
    100: '#A78BFA',  // Purple Light
    500: '#8B5CF6',  // Accent Purple
    600: '#7C3AED',  // Button Purple
    700: '#601B9F',  // Primary Purple
    800: '#B629D4',  // Violet
  },
  
  // Energy Colors
  energy: {
    yellow: {
      50: '#FCD34D',  // Yellow Light
      500: '#FFB701', // Energy Yellow
    },
    red: {
      50: '#FEE2E2',  // Red Light
      500: '#EF4444', // Red Light
      600: '#D03739', // Vibrant Red
    },
  },
  
  // Neutral Colors
  neutral: {
    0: '#000000',    // Pure Black
    50: '#F9F9F9',   // Very Light Gray
    100: '#F3F4F6',  // Light Gray
    200: '#E5E7EB',  // Secondary Text
    300: '#D1D5DB',  // Border Light
    400: '#9CA3AF',  // Tertiary Text
    500: '#6B7280',  // Subtle Text
    600: '#4B5563',  // Disabled Text
    700: '#374151',  // Text Dark
    800: '#1F1F1F',  // Dark Gray
    900: '#111827',  // Darker Gray
  },
  
  // Semantic Colors
  semantic: {
    success: '#199D67',    // Aligned / Above Green Line
    info: '#14B8A6',       // Clarity / Info
    warning: '#FFB701',    // Celebration / Win
    error: '#D03739',      // Contrast / Below Green Line
    premium: '#8B5CF6',    // Premium / AI Assistant
  }
} as const

export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  // Brand-specific shadows
  primary: '0 4px 12px rgba(25, 157, 103, 0.25)',
  secondary: '0 4px 12px rgba(20, 184, 166, 0.25)',
  accent: '0 4px 12px rgba(139, 92, 246, 0.25)',
} as const

export const typography = {
  fontFamily: {
    sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['Courier New', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Brand-specific gradients
export const gradients = {
  primary: 'linear-gradient(135deg, #199D67, #5EC49A)',
  secondary: 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
  accent: 'linear-gradient(135deg, #601B9F, #8B5CF6)',
  brand: 'linear-gradient(135deg, #199D67, #14B8A6)',
  cosmic: 'linear-gradient(135deg, #601B9F, #B629D4, #2DD4BF)',
  energy: 'linear-gradient(135deg, #FFB701, #FCD34D)',
} as const

// Animation durations
export const durations = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
} as const

// Easing functions
export const easings = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
      xl: '3.5rem',
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem',
      xl: '1.25rem 2.5rem',
    },
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.25rem',
    },
  },
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
    borderRadius: '0.75rem',
  },
} as const

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  breakpoints,
  gradients,
  durations,
  easings,
  zIndex,
  components,
}
