// VibrationFit Design System
// Design Tokens - Single source of truth for all design values
// Path: /src/lib/design-system/tokens.ts

export const colors = {
  // Primary Brand Colors - Neon Electric Green
  primary: {
    50: '#39FF14',   // Electric Lime Green (main)
    100: '#00FF88',  // Neon Electric Green
    200: '#00CC44',  // Electric Forest
    500: '#39FF14',  // Primary Electric Lime
    600: '#00FF88',  // Neon Electric Green
    700: '#00CC44',  // Electric Forest Dark
  },
  
  // Secondary Brand Colors - Neon Cyan
  secondary: {
    50: '#00FFFF',   // Neon Cyan
    100: '#06B6D4',  // Bright Cyan
    500: '#00FFFF',  // Neon Cyan (main)
    600: '#06B6D4',  // Bright Cyan Dark
    700: '#0F766E',  // Teal Darker
  },
  
  // Accent Colors - Neon Purple
  accent: {
    50: '#BF00FF',   // Neon Purple
    100: '#A855F7',  // Brighter Purple
    500: '#BF00FF',  // Neon Purple (main)
    600: '#A855F7',  // Brighter Purple Dark
    700: '#601B9F',  // Primary Purple
    800: '#B629D4',  // Violet
  },
  
  // Energy Colors - Neon Variants
  energy: {
    yellow: {
      50: '#FFFF00',  // Neon Yellow
      500: '#FFFF00', // Neon Yellow (main)
    },
    orange: {
      50: '#FF6600',  // Neon Orange
      500: '#FF6600', // Neon Orange (main)
    },
    pink: {
      50: '#FF0080',  // Neon Pink
      500: '#FF0080', // Neon Pink (main)
    },
    red: {
      50: '#FF3366',  // Electric Red
      500: '#FF0040', // Neon Red
      600: '#FF0040', // Neon Red (main)
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
    800: '#1F1F1F',  // Dark Gray (Cards)
    900: '#111827',  // Darker Gray
    // Special aliases for clarity
    cardBg: '#1F1F1F',
    inputBg: '#404040',
    border: '#666666',
    borderLight: '#333333',
  },
  
  // Semantic Colors - Neon Variants
  semantic: {
    success: '#39FF14',    // Electric Lime / Above Green Line
    info: '#00FFFF',       // Neon Cyan / Clarity / Info
    warning: '#FFFF00',    // Neon Yellow / Celebration / Win
    error: '#FF0040',      // Neon Red / Below Green Line
    premium: '#BF00FF',    // Neon Purple / Premium / AI Assistant
  }
} as const

export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
} as const

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Pill shape
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Brand-specific shadows - Neon Glow Effects
  primary: '0 4px 12px rgba(57, 255, 20, 0.3)',
  secondary: '0 4px 12px rgba(0, 255, 255, 0.3)',
  accent: '0 4px 12px rgba(191, 0, 255, 0.3)',
  neon: '0 0 20px rgba(57, 255, 20, 0.4)',
  
  // Button shadows (matching HTML brand kit)
  button: '0 4px 14px rgba(0, 0, 0, 0.25)',
  buttonHover: '0 6px 20px rgba(57, 255, 20, 0.3)',
} as const

export const typography = {
  fontFamily: {
    sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['Courier New', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
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
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const

// Brand-specific gradients - Neon Variants
export const gradients = {
  primary: 'linear-gradient(135deg, #39FF14, #00FF88)',
  secondary: 'linear-gradient(135deg, #00FFFF, #06B6D4)',
  accent: 'linear-gradient(135deg, #BF00FF, #FF0080)',
  brand: 'linear-gradient(135deg, #39FF14, #00FFFF)',
  cosmic: 'linear-gradient(135deg, #BF00FF, #FF0080, #00FFFF)',
  energy: 'linear-gradient(135deg, #FF6600, #FFFF00)',
  neon: 'linear-gradient(135deg, #39FF14, #00FFFF)',
  electric: 'linear-gradient(135deg, #BF00FF, #FF0080)',
  heroGlow: 'linear-gradient(135deg, rgba(57, 255, 20, 0.2), rgba(0, 255, 255, 0.1), rgba(191, 0, 255, 0.2))',
} as const

// Animation durations
export const durations = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',   // Standard button/card transitions
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
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px (mobile) / 48px (desktop)
      lg: '3rem',      // 48px (mobile) / 56px (desktop)
      xl: '3.5rem',    // 56px (mobile) / 64px (desktop)
    },
    padding: {
      sm: '0.5rem 1rem',           // Mobile
      smDesktop: '0.5rem 1.25rem', // Desktop
      md: '0.625rem 1.25rem',      // Mobile
      mdDesktop: '0.75rem 1.75rem',// Desktop
      lg: '0.75rem 1.5rem',        // Mobile
      lgDesktop: '1rem 2.5rem',    // Desktop
      xl: '0.875rem 2rem',         // Mobile
      xlDesktop: '1.25rem 3rem',   // Desktop
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
      sm: '1rem',       // Mobile
      md: '1.5rem',     // Tablet
      lg: '2rem',       // Desktop
    },
    borderRadius: '1rem',  // 16px (rounded-2xl)
    borderWidth: '2px',
  },
} as const

// Mobile-first container widths
export const containers = {
  sm: '48rem',    // 768px
  md: '64rem',    // 1024px
  lg: '80rem',    // 1280px
  xl: '88rem',    // 1408px (max-w-7xl)
  '2xl': '96rem', // 1536px
  full: '100%',
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
  containers,
}
