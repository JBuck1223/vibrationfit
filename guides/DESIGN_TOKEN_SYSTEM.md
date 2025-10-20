# VibrationFit Design Token System Documentation

## Overview

The VibrationFit Design Token System is the foundational infrastructure that powers the `/design-system` showcase page and ensures consistent, brand-aligned design across the entire platform. This system provides a single source of truth for all design values, from colors and spacing to typography and component specifications.

## Architecture

The design system is organized into three main layers:

1. **Design Tokens** (`/src/lib/design-system/tokens.ts`) - Core design values
2. **Components** (`/src/lib/design-system/components.tsx`) - Reusable UI components
3. **Showcase** (`/src/app/design-system/page.tsx`) - Live demonstration and documentation

## Core Design Tokens

### Color System

The color system is built around VibrationFit's neon cyberpunk aesthetic with semantic meaning:

#### Primary Brand Colors
```typescript
primary: {
  50: '#39FF14',   // Electric Lime Green (main)
  100: '#00FF88',  // Neon Electric Green
  200: '#00CC44',  // Electric Forest
  500: '#39FF14',  // Primary Electric Lime
  600: '#00FF88',  // Neon Electric Green
  700: '#00CC44',  // Electric Forest Dark
}
```

#### Secondary Brand Colors
```typescript
secondary: {
  50: '#00FFFF',   // Neon Cyan
  100: '#06B6D4',  // Bright Cyan
  500: '#00FFFF',  // Neon Cyan (main)
  600: '#06B6D4',  // Bright Cyan Dark
  700: '#0F766E',  // Teal Darker
}
```

#### Accent Colors
```typescript
accent: {
  50: '#BF00FF',   // Neon Purple
  100: '#A855F7',  // Brighter Purple
  500: '#BF00FF',  // Neon Purple (main)
  600: '#A855F7',  // Brighter Purple Dark
  700: '#601B9F',  // Primary Purple
  800: '#B629D4',  // Violet
}
```

#### Energy Colors
```typescript
energy: {
  yellow: { 50: '#FFFF00', 500: '#FFFF00' },  // Neon Yellow
  orange: { 50: '#FF6600', 500: '#FF6600' },  // Neon Orange
  pink: { 50: '#FF0080', 500: '#FF0080' },    // Neon Pink
  red: { 50: '#FF3366', 500: '#FF0040', 600: '#FF0040' }, // Electric Red
}
```

#### Semantic Colors
```typescript
semantic: {
  success: '#39FF14',    // Electric Lime / Above Green Line
  info: '#00FFFF',       // Neon Cyan / Clarity / Info
  warning: '#FFFF00',    // Neon Yellow / Celebration / Win
  error: '#FF0040',      // Neon Red / Below Green Line
  premium: '#BF00FF',    // Neon Purple / Premium / AI Assistant
}
```

### Spacing System

Consistent spacing scale based on rem units:

```typescript
spacing: {
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
}
```

### Typography System

```typescript
typography: {
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
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

### Border Radius System

```typescript
borderRadius: {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',    // Fully rounded (pill shape)
}
```

### Shadow System

```typescript
shadows: {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Brand-specific neon glow effects
  primary: '0 4px 12px rgba(57, 255, 20, 0.3)',
  secondary: '0 4px 12px rgba(0, 255, 255, 0.3)',
  accent: '0 4px 12px rgba(191, 0, 255, 0.3)',
  neon: '0 0 20px rgba(57, 255, 20, 0.4)',
}
```

### Gradient System

```typescript
gradients: {
  primary: 'linear-gradient(135deg, #39FF14, #00FF88)',
  secondary: 'linear-gradient(135deg, #00FFFF, #06B6D4)',
  accent: 'linear-gradient(135deg, #BF00FF, #FF0080)',
  brand: 'linear-gradient(135deg, #39FF14, #00FFFF)',
  cosmic: 'linear-gradient(135deg, #BF00FF, #FF0080, #00FFFF)',
  energy: 'linear-gradient(135deg, #FF6600, #FFFF00)',
  neon: 'linear-gradient(135deg, #39FF14, #00FFFF)',
  electric: 'linear-gradient(135deg, #BF00FF, #FF0080)',
}
```

### Animation System

```typescript
durations: {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',    // Standard transition duration
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
}

easings: {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Z-Index System

```typescript
zIndex: {
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
}
```

### Component-Specific Tokens

```typescript
components: {
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
}
```

## Component System

The design system includes a comprehensive set of reusable components that implement the design tokens:

### Button Component
- **Variants**: `primary`, `secondary`, `accent`, `ghost`, `danger`, `outline`
- **Sizes**: `sm`, `md`, `lg`, `xl`
- **Features**: Loading states, hover animations, pill-shaped design
- **Special Buttons**: `GradientButton`, `AIButton` with mystical glow effects

### Card Component
- **Variants**: `default`, `elevated`, `outlined`
- **Features**: Hover lift animations, consistent padding, rounded corners

### Form Components
- **Input**: With label, error states, helper text
- **Textarea**: Multi-line input with validation
- **Features**: Focus states, error handling, accessibility

### Feedback Components
- **Badge**: Status indicators with semantic colors
- **ProgressBar**: Animated progress with gradient fills
- **Spinner**: Branded loading indicator with VibrationFit logo

### Layout Components
- **Container**: Responsive width containers
- **PageLayout**: Full-page layout wrapper
- **Footer**: Consistent footer styling

## Design System Showcase

The `/design-system` page serves as a comprehensive showcase that demonstrates:

1. **Color Palette**: All brand colors with hex values and usage guidelines
2. **Button System**: All variants, sizes, and interactive states
3. **Component Library**: Live examples of all available components
4. **Best Practices**: Do's and don'ts for consistent implementation
5. **Interactive Examples**: Hover states, loading states, and animations

## Usage Patterns

### Importing Components
```typescript
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  ProgressBar,
  colors,
  spacing,
  gradients 
} from '@/lib/design-system'
```

### Using Design Tokens
```typescript
// In component styles
const buttonStyle = {
  backgroundColor: colors.primary[500],
  padding: spacing[4],
  borderRadius: borderRadius.full,
  boxShadow: shadows.primary,
}
```

### Responsive Design
All components include responsive breakpoints and mobile-first design principles.

## Brand Alignment

The token system is specifically designed to support VibrationFit's brand identity:

- **"Above the Green Line"**: Primary green (#39FF14) represents success and alignment
- **"Below the Green Line"**: Red (#FF0040) represents contrast and awareness opportunities
- **AI/Mystical Features**: Purple (#BF00FF) represents premium AI features
- **Clarity & Flow**: Cyan (#00FFFF) represents information and calm energy
- **Celebration**: Yellow (#FFFF00) represents wins and actualized desires

## Technical Implementation

### TypeScript Support
All tokens are fully typed with TypeScript for better developer experience and type safety.

### CSS Custom Properties
The system can be extended to generate CSS custom properties for runtime theming.

### Performance Optimization
Components are built with React.forwardRef for optimal performance and accessibility.

### Accessibility
All components include proper ARIA attributes, keyboard navigation, and focus management.

## Maintenance and Updates

### Adding New Tokens
1. Add the token to the appropriate category in `tokens.ts`
2. Update the TypeScript types if needed
3. Add examples to the showcase page
4. Update this documentation

### Adding New Components
1. Create the component in `components.tsx`
2. Follow the existing patterns for variants and props
3. Add to the main export in `index.ts`
4. Create showcase examples in the design system page

### Version Control
The design system follows semantic versioning and maintains backward compatibility.

## Conclusion

The VibrationFit Design Token System provides a robust, scalable foundation for building consistent, beautiful, and brand-aligned interfaces. By centralizing all design decisions in a token-based system, the platform maintains visual consistency while enabling rapid development and easy maintenance.

The `/design-system` showcase page serves as both documentation and a living style guide, ensuring that developers can quickly understand and implement the design system correctly across all parts of the VibrationFit platform.
