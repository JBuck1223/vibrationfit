# VibrationFit Design System
## Comprehensive Overview & Documentation

**Version:** 2.0  
**Last Updated:** December 2024  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Library](#component-library)
7. [Design Tokens](#design-tokens)
8. [Usage Guidelines](#usage-guidelines)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)
11. [Implementation](#implementation)
12. [Best Practices](#best-practices)

---

## 🎯 Overview

The VibrationFit Design System is a comprehensive, mobile-first design system built for conscious creation and personal transformation. It embodies a neon cyberpunk aesthetic while maintaining accessibility and usability across all devices.

### **Core Principles**
- **Mobile-First**: All components designed for mobile, enhanced for desktop
- **Brand-Aligned**: Every element reflects VibrationFit's mission of conscious creation
- **Accessible**: WCAG AA compliant with proper ARIA attributes
- **Consistent**: Single source of truth for all design decisions
- **Scalable**: Modular components that grow with the platform

### **Architecture**
```
/src/lib/design-system/
├── components.tsx     # 50+ reusable components
├── tokens.ts         # Design tokens (colors, spacing, etc.)
├── index.ts          # Main exports
├── vision-categories.ts # Vision category definitions
└── README.md         # Component documentation

/src/app/design-system/
└── page.tsx          # Live showcase & documentation
```

---

## 🎨 Brand Identity

### **Mission**
VibrationFit empowers conscious creation through personalized transformation journeys, helping users live "above the Green Line" of alignment and success.

### **Visual Identity**
- **Aesthetic**: Neon cyberpunk meets conscious wellness
- **Mood**: Electric, transformative, empowering
- **Tone**: Modern, mystical, motivational
- **Feel**: High-energy yet calming, futuristic yet grounded

### **Brand Voice**
- **"Above the Green Line"**: Success, alignment, growth
- **"Below the Green Line"**: Awareness opportunities, contrast moments
- **"Actualize"**: Complete, achieve, manifest (not "finish")
- **"Vision"**: Goals, dreams, aspirations (not "plans")

---

## 🌈 Color System

### **Primary Brand Colors**

#### **Primary Green (#39FF14)**
- **Meaning**: Growth, alignment, "above the Green Line"
- **Usage**: Primary CTAs, success states, main actions
- **Variants**: 
  - `#39FF14` - Electric Lime Green (main)
  - `#00FF88` - Neon Electric Green
  - `#00CC44` - Electric Forest

#### **Secondary Teal (#00FFFF)**
- **Meaning**: Clarity, flow, calm energy
- **Usage**: Information, links, secondary actions
- **Variants**:
  - `#00FFFF` - Neon Cyan (main)
  - `#06B6D4` - Bright Cyan
  - `#0F766E` - Teal Dark

#### **Accent Purple (#BF00FF)**
- **Meaning**: Premium features, AI, mystical moments
- **Usage**: Premium features, VIVA AI assistant, special actions
- **Variants**:
  - `#BF00FF` - Neon Purple (main)
  - `#A855F7` - Brighter Purple
  - `#601B9F` - Primary Purple
  - `#B629D4` - Violet

### **Energy Colors**

#### **Energy Yellow (#FFFF00)**
- **Meaning**: Celebration, wins, actualized desires
- **Usage**: Success celebrations, achievements, highlights

#### **Vibrant Red (#FF0040)**
- **Meaning**: Contrast, "below Green Line", awareness
- **Usage**: Alerts, warnings, contrast moments (not failure)

### **Neutral Colors**
- **Pure Black (#000000)**: Primary background
- **Dark Gray (#1F1F1F)**: Card backgrounds, elevated surfaces
- **Medium Gray (#404040)**: Input backgrounds, borders
- **Light Gray (#666666)**: Disabled states, subtle elements
- **Pure White (#FFFFFF)**: Text on dark backgrounds

### **Semantic Colors**
```typescript
semantic: {
  success: '#39FF14',    // Above Green Line
  info: '#00FFFF',       // Clarity, information
  warning: '#FFFF00',    // Celebration, energy
  error: '#FF0040',      // Below Green Line
  premium: '#BF00FF',    // AI, premium features
}
```

---

## ✍️ Typography

### **Font Family**
```typescript
fontFamily: {
  sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['Courier New', 'monospace'],
}
```

### **Font Sizes**
- **xs**: 12px - Captions, fine print
- **sm**: 14px - Small text, labels
- **base**: 16px - Body text (default)
- **lg**: 18px - Large body text
- **xl**: 20px - Small headings
- **2xl**: 24px - Section headings
- **3xl**: 30px - Page headings
- **4xl**: 36px - Large headings
- **5xl**: 48px - Hero headings
- **6xl**: 60px - Display headings

### **Font Weights**
- **normal**: 400 - Body text
- **medium**: 500 - Emphasized text
- **semibold**: 600 - Headings
- **bold**: 700 - Strong emphasis

### **Line Heights**
- **tight**: 1.25 - Headings
- **snug**: 1.375 - Subheadings
- **normal**: 1.5 - Body text
- **relaxed**: 1.625 - Large text
- **loose**: 2 - Spacious text

---

## 📏 Spacing & Layout

### **Spacing Scale**
```typescript
spacing: {
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

### **Container Sizes**
- **sm**: 768px (max-w-3xl)
- **md**: 1024px (max-w-5xl)
- **default**: 1280px (max-w-7xl)
- **lg**: 1408px (max-w-[1400px])
- **xl**: 1600px (max-w-[1600px])
- **full**: 100% (max-w-full)

### **Border Radius**
- **sm**: 2px - Small elements
- **base**: 4px - Default
- **md**: 6px - Medium elements
- **lg**: 8px - Large elements
- **xl**: 12px - Extra large
- **2xl**: 16px - Cards (default)
- **3xl**: 24px - Large cards
- **full**: 9999px - Pill shapes (buttons)

---

## 🧩 Component Library

### **Layout Primitives**

#### **Stack**
Vertical layout with consistent gaps
```tsx
<Stack gap="md" align="center">
  <h1>Title</h1>
  <p>Content</p>
</Stack>
```

#### **Inline**
Horizontal layout that stacks on mobile
```tsx
<Inline gap="sm" justify="between">
  <Button>Cancel</Button>
  <Button>Save</Button>
</Inline>
```

#### **Grid**
Responsive grid with auto-wrapping
```tsx
<Grid minWidth="300px" gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</Grid>
```

#### **TwoColumn**
Two-column layout that stacks on mobile
```tsx
<TwoColumn gap="lg">
  <div>Left content</div>
  <div>Right content</div>
</TwoColumn>
```

#### **Container**
Page width container with responsive padding
```tsx
<Container size="xl">
  <h1>Page content</h1>
</Container>
```

### **UI Components**

#### **Button**
Pill-shaped buttons with hover effects
```tsx
// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="accent">Premium Feature</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="outline">Tertiary Action</Button>
<Button variant="danger">Destructive Action</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
```

#### **Card**
Elevated containers with hover effects
```tsx
// Variants
<Card variant="default">Default card</Card>
<Card variant="elevated">Elevated with shadow</Card>
<Card variant="outlined">Outlined only</Card>
<Card variant="glass">Glassmorphism effect</Card>

// With hover
<Card hover>Hover to lift</Card>
```

#### **Input & Textarea**
Form elements with validation states
```tsx
<Input 
  label="Vision Title"
  placeholder="Enter your vision..."
  error="This field is required"
  helperText="Optional helper text"
/>

<Textarea 
  label="Description"
  placeholder="Describe your vision..."
  rows={4}
/>
```

#### **Badge**
Status indicators with semantic colors
```tsx
<Badge variant="success">Above Green Line</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="error">Below Green Line</Badge>
<Badge variant="premium">Premium Feature</Badge>
<Badge variant="info">Information</Badge>
```

#### **Select**
Dropdown with consistent styling
```tsx
<Select
  label="Choose Category"
  options={[
    { value: 'career', label: 'Career' },
    { value: 'health', label: 'Health' }
  ]}
  placeholder="Select a category..."
/>
```

### **Feedback Components**

#### **Spinner**
Branded loading indicator
```tsx
<Spinner size="md" variant="primary" />
<Spinner size="lg" variant="branded" /> // With VibrationFit logo
```

#### **ProgressBar**
Animated progress indicator
```tsx
<ProgressBar 
  value={75}
  max={100}
  variant="primary"
  label="Vision Completion"
  showLabel={true}
/>
```

### **Specialized Components**

#### **VIVAButton**
Special button for AI features
```tsx
<VIVAButton size="lg">
  <Sparkles className="w-4 h-4 mr-2" />
  Ask VIVA Assistant
</VIVAButton>
```

#### **Video**
S3-optimized video player with engagement tracking
```tsx
<Video
  src="https://media.vibrationfit.com/videos/intro.mp4"
  poster="https://media.vibrationfit.com/images/poster.jpg"
  variant="hero"
  onMilestoneReached={(milestone) => console.log(milestone)}
  trackingId="intro-video"
/>
```

#### **Modal**
Accessible modal with overlay
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Vision"
  size="lg"
>
  <p>Modal content here</p>
</Modal>
```

### **Navigation Components**

#### **Sidebar**
Collapsible navigation with token balance
```tsx
<Sidebar 
  navigation={customNavigation}
  isAdmin={false}
/>
```

#### **MobileBottomNav**
Mobile navigation with slideout drawer
```tsx
<MobileBottomNav 
  navigation={customNavigation}
  isAdmin={false}
/>
```

#### **SidebarLayout**
Complete layout wrapper
```tsx
<SidebarLayout isAdmin={false}>
  <h1>Page content</h1>
</SidebarLayout>
```

---

## 🎨 Design Tokens

### **Shadows**
```typescript
shadows: {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  
  // Brand-specific neon glow effects
  primary: '0 4px 12px rgba(57, 255, 20, 0.3)',
  secondary: '0 4px 12px rgba(0, 255, 255, 0.3)',
  accent: '0 4px 12px rgba(191, 0, 255, 0.3)',
  neon: '0 0 20px rgba(57, 255, 20, 0.4)',
}
```

### **Gradients**
```typescript
gradients: {
  primary: 'linear-gradient(135deg, #39FF14, #00FF88)',
  secondary: 'linear-gradient(135deg, #00FFFF, #06B6D4)',
  accent: 'linear-gradient(135deg, #BF00FF, #FF0080)',
  brand: 'linear-gradient(135deg, #39FF14, #00FFFF)',
  cosmic: 'linear-gradient(135deg, #BF00FF, #FF0080, #00FFFF)',
  energy: 'linear-gradient(135deg, #FF6600, #FFFF00)',
}
```

### **Animation Durations**
```typescript
durations: {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',    // Standard transitions
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
}
```

### **Z-Index Scale**
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

---

## 📱 Responsive Design

### **Breakpoints**
- **sm**: 640px - Mobile landscape
- **md**: 768px - Tablet
- **lg**: 1024px - Desktop
- **xl**: 1280px - Large desktop
- **2xl**: 1536px - Extra large

### **Mobile-First Guidelines**

#### **Grid Rules**
- ❌ **NEVER** use `minWidth > 350px` for mobile compatibility
- ✅ **USE** `minWidth="300px"` or smaller for mobile-first grids
- ✅ **USE** `minWidth="200px"` for category cards and small items

#### **Text Size Rules**
- ❌ **NEVER** use fixed large text without responsive variants
- ✅ **ALWAYS** use responsive text: `text-xl md:text-4xl`
- ✅ **MOBILE**: `text-sm`, `text-base`, `text-lg`, `text-xl` (max)
- ✅ **DESKTOP**: `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`

#### **Spacing Rules**
- ❌ **NEVER** use fixed large spacing on mobile
- ✅ **ALWAYS** use responsive spacing: `mx-2 md:mx-4`
- ✅ **MOBILE**: `mx-1`, `mx-2`, `mx-3`, `mx-4` (max)
- ✅ **DESKTOP**: `mx-4`, `mx-6`, `mx-8`, `mx-12`

#### **Padding Rules**
- ❌ **NEVER** use excessive padding on mobile
- ✅ **ALWAYS** use responsive padding: `p-4 md:p-8`
- ✅ **MOBILE**: `p-2`, `p-4`, `p-6` (max)
- ✅ **DESKTOP**: `p-6`, `p-8`, `p-12`, `p-16`

### **Testing Checklist**
- ✅ Test on iPhone SE (375px width) - smallest common mobile
- ✅ Test on iPhone 12/13/14 (390px width) - standard mobile
- ✅ Test on iPad (768px width) - tablet breakpoint
- ✅ Test on desktop (1200px+ width) - desktop experience

---

## ♿ Accessibility

### **WCAG AA Compliance**
- **Color Contrast**: All text meets WCAG AA standards
- **Focus Management**: Visible focus indicators on all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and semantic HTML

### **ARIA Attributes**
```tsx
// Modal example
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Create Vision" // Automatically creates aria-labelledby
  role="dialog"
  aria-modal="true"
>
```

### **Semantic HTML**
- Proper heading hierarchy (h1 → h2 → h3)
- Semantic form elements with labels
- Descriptive alt text for images
- Proper list structures

### **Focus Management**
- Focus trapping in modals
- Focus restoration after interactions
- Skip links for keyboard users
- Logical tab order

---

## 🚀 Implementation

### **Installation**
The design system is already integrated into your VibrationFit project:

```tsx
// Import components
import { 
  Button, 
  Card, 
  Input, 
  Badge,
  PageLayout,
  Container 
} from '@/lib/design-system'

// Import tokens
import { 
  colors, 
  spacing, 
  gradients 
} from '@/lib/design-system'
```

### **Basic Usage**
```tsx
import { PageLayout, Container, Card, Button, Input } from '@/lib/design-system'

export default function VisionForm() {
  return (
    <PageLayout>
      <Container size="md">
        <Card>
          <h1 className="text-2xl font-bold mb-6">Create Vision</h1>
          
          <div className="space-y-6">
            <Input 
              label="Vision Title"
              placeholder="Enter your vision title..."
            />
            
            <div className="flex gap-3">
              <Button>Save Draft</Button>
              <Button variant="secondary">Preview</Button>
            </div>
          </div>
        </Card>
      </Container>
    </PageLayout>
  )
}
```

### **Custom Styling**
```tsx
import { Button } from '@/lib/design-system'
import { cn } from '@/lib/utils'

// Add custom classes
<Button className="w-full">Full Width Button</Button>

// Combine with custom styling
<Button className={cn("custom-class", "another-class")}>
  Custom Button
</Button>
```

---

## ✅ Best Practices

### **DO's**
- ✅ **Use design system components** instead of custom styling
- ✅ **Follow mobile-first responsive patterns**
- ✅ **Use semantic color variants** (success, warning, error)
- ✅ **Maintain consistent spacing** using the spacing scale
- ✅ **Test on multiple devices** and screen sizes
- ✅ **Use proper ARIA attributes** for accessibility
- ✅ **Follow the brand voice** and terminology

### **DON'Ts**
- ❌ **Don't hard-code colors** - use design tokens
- ❌ **Don't create custom buttons** when design system has them
- ❌ **Don't ignore hover states** - all interactive elements should have them
- ❌ **Don't use low contrast** color combinations
- ❌ **Don't forget mobile testing** - always test on small screens
- ❌ **Don't skip accessibility** - include proper ARIA attributes
- ❌ **Don't use multiple button styles** on the same page level

### **Component Guidelines**

#### **Buttons**
- Always use pill-shaped (`rounded-full`)
- Include hover lift effects (`hover:-translate-y-0.5`)
- Use appropriate variants for context
- Maintain consistent padding and sizing

#### **Cards**
- Use consistent border radius (`rounded-2xl`)
- Include hover effects for interactive cards
- Maintain proper padding (`p-6 md:p-8`)
- Use appropriate variants for context

#### **Forms**
- Always include labels for inputs
- Provide helpful error messages
- Use consistent validation states
- Maintain proper spacing between fields

#### **Navigation**
- Keep navigation consistent across pages
- Include proper active states
- Ensure mobile navigation is accessible
- Maintain token balance display

---

## 🔧 Maintenance

### **Adding New Components**
1. Create component in `/src/lib/design-system/components.tsx`
2. Follow existing patterns for variants and props
3. Add to main export in `/src/lib/design-system/index.ts`
4. Create showcase examples in `/design-system` page
5. Update this documentation

### **Updating Design Tokens**
1. Modify values in `/src/lib/design-system/tokens.ts`
2. Test changes across all components
3. Update showcase page if needed
4. Document changes in this overview

### **Version Control**
- Follow semantic versioning
- Maintain backward compatibility
- Document breaking changes
- Test thoroughly before releases

---

## 📚 Resources

### **Live Showcase**
- **URL**: `/design-system`
- **Features**: Interactive examples, code snippets, responsive testing

### **Documentation**
- **Component Guide**: `/src/lib/design-system/README.md`
- **Design Guide**: `/docs/DESIGN_SYSTEM_GUIDE.md`
- **Brand Kit**: `vibrationfit-brand-kit.html`

### **External Resources**
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

## 🎯 Conclusion

The VibrationFit Design System provides a comprehensive, scalable foundation for building consistent, beautiful, and accessible interfaces. By following these guidelines and using the provided components, you can create experiences that align with the VibrationFit brand while maintaining high standards for usability and accessibility.

**Remember**: The design system is a living document. As the platform grows, continue to refine and expand these guidelines to serve the evolving needs of conscious creators worldwide.

---

**VibrationFit Design System v2.0** - Built for conscious creation ✨

*"Above the Green Line" - Living in alignment with your highest vision*
