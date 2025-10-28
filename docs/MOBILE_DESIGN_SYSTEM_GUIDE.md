# VibrationFit Mobile Design System Guide

**Complete reference for mobile-first design patterns, utilities, and best practices.**

> **⚠️ CRITICAL**: Always follow the [Mobile Design Rules](../../rules/mobile-design-rules.md) - these rules are mandatory and non-negotiable.

---

## 📱 Quick Start

```tsx
import { 
  useIsMobile, 
  useBreakpoint, 
  getResponsiveGrid,
  getResponsiveText 
} from '@/lib/design-system/mobile-utils'
import { Button, Card, Grid } from '@/lib/design-system/components'

// Detect mobile
const isMobile = useIsMobile()

// Responsive grid
<Grid className={getResponsiveGrid(1, 2, 3, 4)}>
  <Card>...</Card>
</Grid>

// Responsive text
<h1 className={getResponsiveText('xl', '4xl')}>Title</h1>
```

---

## 🎯 Core Principles

### 1. Mobile-First
- **Always design for mobile first**, then enhance for desktop
- Mobile styles are the base (no prefix)
- Desktop styles use `md:` prefix (768px+)

### 2. No Off-Screen Flow
- **NEVER** allow content to overflow horizontally
- Always use `overflow-hidden` or `truncate` for long content
- Test on 375px (iPhone SE) minimum

### 3. Touch-Friendly
- Minimum touch target: **44px** (iOS) / **48px** (Android)
- Use generous spacing between interactive elements
- Buttons should be easy to tap with thumb

---

## 🛠️ Hooks & Utilities

### Viewport Detection Hooks

#### `useIsMobile()`
Detects if viewport is mobile (< 768px)

```tsx
const isMobile = useIsMobile()

if (isMobile) {
  return <MobileLayout />
}
return <DesktopLayout />
```

#### `useIsTablet()`
Detects if viewport is tablet (768px - 1023px)

```tsx
const isTablet = useIsTablet()
```

#### `useIsDesktop()`
Detects if viewport is desktop (>= 1024px)

```tsx
const isDesktop = useIsDesktop()
```

#### `useBreakpoint()`
Returns current breakpoint name

```tsx
const breakpoint = useBreakpoint()
// Returns: 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

#### `useViewportWidth()`
Returns current viewport width in pixels

```tsx
const width = useViewportWidth()
```

#### `useIsTouchDevice()`
Detects if device supports touch

```tsx
const isTouch = useIsTouchDevice()

if (isTouch) {
  // Show touch-optimized UI
}
```

#### `useMediaQuery(query)`
Generic media query hook

```tsx
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
const isNarrow = useMediaQuery('(max-width: 600px)')
```

### Utility Functions

#### `getResponsiveText(mobile, desktop)`
Generate responsive text size classes

```tsx
const textClasses = getResponsiveText('sm', 'lg')
// Returns: "text-sm md:text-lg"

<h1 className={getResponsiveText('xl', '4xl')}>Title</h1>
```

#### `getResponsiveSpacing(mobile, desktop, property)`
Generate responsive spacing classes

```tsx
const padding = getResponsiveSpacing('4', '8', 'p')
// Returns: "p-4 md:p-8"

const gap = getResponsiveSpacing('4', '6', 'gap')
// Returns: "gap-4 md:gap-6"
```

#### `getResponsiveGrid(mobile, tablet, desktop, large)`
Generate responsive grid classes

```tsx
const gridClasses = getResponsiveGrid(1, 2, 3, 4)
// Returns: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

<Grid className={getResponsiveGrid(1, 2, 3)}>
  {/* Cards */}
</Grid>
```

#### `responsiveValue(mobile, desktop, width?)`
Get responsive value based on viewport

```tsx
const itemsPerPage = responsiveValue(4, 12)
const padding = responsiveValue('16px', '32px')
```

#### `useResponsiveValue(mobile, desktop)`
Hook version of responsiveValue

```tsx
const itemsPerPage = useResponsiveValue(4, 12)
```

---

## 📐 Breakpoints

```tsx
import { BREAKPOINTS } from '@/lib/design-system/mobile-utils'

{
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
  '2xl': 1536 // Extra large
}
```

### Usage in Tailwind

```tsx
// Mobile-first approach
<div className="
  text-sm          // Mobile: 14px
  md:text-base     // Tablet+: 16px
  lg:text-lg       // Desktop+: 18px
">
```

---

## 🎨 Component Patterns

### Responsive Card Grid

```tsx
import { Grid, Card } from '@/lib/design-system/components'
import { getResponsiveGrid } from '@/lib/design-system/mobile-utils'

<Grid className={getResponsiveGrid(1, 2, 3, 4)}>
  <Card>
    <h3 className="text-sm md:text-base font-semibold">Title</h3>
    <p className="text-xs md:text-sm text-neutral-400">Description</p>
  </Card>
</Grid>
```

### Responsive Button Group

```tsx
import { Button, Inline } from '@/lib/design-system/components'

// Automatically stacks on mobile
<Inline gap="sm" className="flex-col md:flex-row">
  <Button size="sm" className="w-full md:w-auto">Primary</Button>
  <Button variant="ghost" size="sm" className="w-full md:w-auto">Secondary</Button>
</Inline>
```

### Responsive Typography

```tsx
import { getResponsiveText } from '@/lib/design-system/mobile-utils'

<h1 className={getResponsiveText('2xl', '5xl')}>
  Page Title
</h1>

<p className={getResponsiveText('sm', 'base')}>
  Body text that scales appropriately
</p>
```

### Conditional Mobile/Desktop Rendering

```tsx
import { useIsMobile } from '@/lib/design-system/mobile-utils'

function ResponsiveComponent() {
  const isMobile = useIsMobile()
  
  if (isMobile) {
    return <MobileNav />
  }
  
  return <DesktopNav />
}
```

### Responsive Container

```tsx
import { Container } from '@/lib/design-system/components'

// Automatically responsive padding: px-4 sm:px-6 lg:px-8
<Container size="xl">
  {/* Content */}
</Container>
```

---

## ✅ Mobile Checklist

Before considering a component complete:

- [ ] **No horizontal overflow** - Test on 375px width
- [ ] **Touch targets ≥ 44px** - All buttons/links meet minimum
- [ ] **Responsive text sizes** - No fixed large text on mobile
- [ ] **Responsive spacing** - Padding/margins scale appropriately
- [ ] **Responsive grids** - Cards stack on mobile
- [ ] **Buttons stack** - Horizontal button groups stack on mobile
- [ ] **Text truncation** - Long text doesn't overflow
- [ ] **Proper padding** - Content doesn't touch screen edges
- [ ] **Fast interactions** - Smooth scrolling, no lag
- [ ] **Readable fonts** - Minimum 14px on mobile

---

## 🚫 Common Anti-Patterns

### ❌ Bad: Fixed Widths
```tsx
// Don't use fixed widths without responsive variants
<div className="w-96">  // ❌ 384px fixed width
```

### ✅ Good: Responsive Widths
```tsx
<div className="w-full md:w-96">  // ✅ Responsive
```

### ❌ Bad: Fixed Large Text
```tsx
<h1 className="text-5xl">  // ❌ Too large on mobile
```

### ✅ Good: Responsive Text
```tsx
<h1 className="text-2xl md:text-5xl">  // ✅ Scales
```

### ❌ Bad: Fixed Grid
```tsx
<div className="grid grid-cols-4">  // ❌ 4 columns on mobile
```

### ✅ Good: Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-4">  // ✅ Stacks on mobile
```

### ❌ Bad: Fixed Padding
```tsx
<div className="p-12">  // ❌ Too much padding on mobile
```

### ✅ Good: Responsive Padding
```tsx
<div className="p-4 md:p-12">  // ✅ Scales appropriately
```

---

## 📱 Device Testing

Test on these viewport widths:

```tsx
import { DEVICE_WIDTHS } from '@/lib/design-system/mobile-utils'

{
  iphoneSE: 375,    // Smallest common mobile
  iphone12: 390,    // Standard mobile
  iphonePro: 428,   // Large mobile
  ipad: 768,        // Tablet
  desktop: 1280,    // Desktop
}
```

### Browser DevTools Testing

1. **Chrome DevTools**: 
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test at 375px, 390px, 428px, 768px

2. **Firefox DevTools**:
   - Open DevTools (F12)
   - Click responsive design mode
   - Test viewports

3. **Safari** (iOS Simulator):
   - Xcode → Window → Devices and Simulators
   - Test on iPhone SE, iPhone 12, iPad

---

## 🎯 Touch Targets

```tsx
import { TOUCH_TARGETS } from '@/lib/design-system/mobile-utils'

{
  minimum: 44,      // iOS minimum (Apple HIG)
  recommended: 48,  // Android minimum (Material Design)
  comfortable: 56,  // Comfortable for easy tapping
}
```

### Button Size Guidelines

```tsx
// ✅ Good: Meets minimum touch target
<Button size="sm">  // 44px+ height on mobile

// ❌ Bad: Too small
<button className="h-8">  // 32px - too small for mobile
```

### Spacing Between Touch Targets

- **Minimum**: 8px (2 units) between interactive elements
- **Recommended**: 16px (4 units) for comfortable tapping

---

## 🔧 Advanced Patterns

### Safe Area Insets (iOS Notched Devices)

```tsx
import { safeAreaInsets } from '@/lib/design-system/mobile-utils'

// Add padding that respects iOS safe areas
<div className={safeAreaInsets.getPadding('bottom')}>
  Fixed bottom navigation
</div>
```

### Dynamic Component Sizing

```tsx
import { useViewportWidth } from '@/lib/design-system/mobile-utils'

function DynamicComponent() {
  const width = useViewportWidth()
  const columns = width < 768 ? 1 : width < 1024 ? 2 : 3
  
  return <Grid className={`grid-cols-${columns}`}>...</Grid>
}
```

### Conditional Features

```tsx
import { useIsDesktop } from '@/lib/design-system/mobile-utils'

function FeatureComponent() {
  const isDesktop = useIsDesktop()
  
  return (
    <div>
      <StandardFeatures />
      {isDesktop && <AdvancedFeatures />}
    </div>
  )
}
```

---

## 📚 Component-Specific Guidelines

### Buttons
- Use `size="sm"` on mobile for 44px+ touch target
- Stack vertically on mobile: `flex-col md:flex-row`
- Full-width on mobile: `w-full md:w-auto`

### Cards
- Responsive padding: `p-6 md:p-8`
- Stack in single column on mobile
- Use `overflow-hidden` to prevent content overflow

### Forms
- Full-width inputs on mobile
- Larger touch targets for checkboxes/radios
- Stack form fields vertically on mobile

### Navigation
- Hamburger menu on mobile
- Full-width mobile menu
- Sticky header with safe area padding

### Tables
- Hide less important columns on mobile
- Allow horizontal scroll with indicator
- Stack table rows as cards on mobile

---

## 🎨 Design Tokens

Mobile-specific tokens from `tokens.ts`:

```tsx
components: {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px (mobile) / 48px (desktop)
      lg: '3rem',      // 48px (mobile) / 56px (desktop)
    }
  },
  card: {
    padding: {
      mobile: '1.5rem',        // 24px
      desktop: '2rem',         // 32px
    }
  }
}
```

---

## 🚀 Performance Tips

1. **Use CSS for responsiveness** - Avoid JavaScript-based responsive logic when possible
2. **Lazy load mobile-only components** - Don't load desktop components on mobile
3. **Optimize images** - Use responsive images with `srcset`
4. **Test on real devices** - Emulators don't catch all issues
5. **Monitor performance** - Use Lighthouse mobile audits

---

## 🛡️ Rule Enforcement

### Pre-configured Rule Classes

Use these pre-configured classes that follow the mobile design rules:

```tsx
import { mobileRuleClasses } from '@/lib/design-system/mobile-utils'

// Card padding (Rule #4)
<Card className={mobileRuleClasses.cardPadding}>

// Responsive text (Rule #2)
<h1 className={mobileRuleClasses.heading}>Title</h1>

// Responsive grid (Rule #3)
<div className={mobileRuleClasses.cardGrid}>

// Stack on mobile (Rule #6)
<div className={mobileRuleClasses.stackOnMobile}>
```

### Validate Component Compliance

```tsx
import { validateMobileRules } from '@/lib/design-system/mobile-utils'
import { useRef, useEffect } from 'react'

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (ref.current) {
      const validation = validateMobileRules(ref.current)
      if (!validation.isValid) {
        console.error('Mobile rule violations:', validation.errors)
      }
      if (validation.warnings.length > 0) {
        console.warn('Mobile warnings:', validation.warnings)
      }
    }
  }, [])
  
  return <div ref={ref}>...</div>
}
```

### Generate Rule-Compliant Classes

```tsx
import { getMobileRuleClasses } from '@/lib/design-system/mobile-utils'

const classes = getMobileRuleClasses({
  text: { mobile: 'sm', desktop: 'lg' },
  spacing: { mobile: '4', desktop: '8', property: 'p' },
  grid: { mobile: 1, tablet: 2, desktop: 3 },
  flex: { mobile: 'col', desktop: 'row' }
})

<div className={classes}>...</div>
```

---

## 📖 References

- **[Mobile Design Rules](../../rules/mobile-design-rules.md)** - **MANDATORY RULES - READ FIRST**
- [Design System Components](../src/lib/design-system/components.tsx)
- [Design Tokens](../src/lib/design-system/tokens.ts)
- [Mobile Utilities](../src/lib/design-system/mobile-utils.ts)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)

---

## 🚨 Critical Reminders

1. **ALWAYS** read [mobile-design-rules.md](../../rules/mobile-design-rules.md) before building
2. **NEVER allow content to flow off-screen on mobile** (Rule #1)
3. **ALWAYS ensure touch targets are ≥ 44px** (Rule #2)
4. **ALWAYS use responsive grids** starting with 1 column on mobile (Rule #3)
5. **Test on 375px viewport** before considering complete

**Remember**: Mobile-first means mobile is not an afterthought—it's the foundation. Design for the smallest screen first, then enhance for larger screens.

