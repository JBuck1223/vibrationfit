# Design System Reference Guide

**Last Updated:** January 18, 2025  
**For:** AI Agents working on VibrationFit UI

## Core Principle
Always reference `vibrationfit-brand-kit.html` for design patterns and visual style.

## Component Usage

### Buttons
**Import from:** `@/lib/design-system/components`

#### Standard Buttons
```tsx
import { Button } from '@/lib/design-system/components'

<Button variant="primary">Start Workout</Button>
<Button variant="secondary">Learn More</Button>
<Button variant="accent">Premium Feature</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="outline">Skip</Button>
<Button variant="danger">Delete</Button>
```

**Sizes:** `sm`, `md` (default), `lg`, `xl`

**When to use each variant:**
- `primary` - Main CTAs, "Start", "Save", "Create", success actions
- `secondary` - Supporting actions, info buttons, "Learn More", "View Details"
- `accent` - Premium features, special actions, celebrations
- `ghost` - Subtle actions within cards, inline options
- `outline` - Tertiary actions, cancel buttons
- `danger` - Delete, remove, destructive actions

#### Gradient Buttons (for hero sections and special moments)
```tsx
import { GradientButton } from '@/lib/design-system/components'

<GradientButton gradient="brand">Start Your Journey</GradientButton>
<GradientButton gradient="green">Complete Vision</GradientButton>
<GradientButton gradient="teal">View Progress</GradientButton>
<GradientButton gradient="purple">Upgrade Now</GradientButton>
<GradientButton gradient="cosmic">Transform</GradientButton>
```

#### AI Button (for AI Assistant features)
```tsx
import { AIButton } from '@/lib/design-system/components'

<AIButton>Ask AI Assistant</AIButton>
```

### Cards
```tsx
import { Card } from '@/lib/design-system/components'

<Card variant="default">...</Card>
<Card variant="elevated">...</Card>
<Card variant="outlined">...</Card>
```

**Card features:**
- 2rem (32px) padding by default
- 2px borders (#333)
- Hovers lift -4px with border color change to primary green
- Rounded corners (rounded-2xl = 16px)

### Other Components
```tsx
import { 
  Input, 
  Textarea, 
  Badge, 
  ProgressBar, 
  Spinner,
  Container,
  PageLayout,
  Footer 
} from '@/lib/design-system/components'
```

## Color System

### Brand Colors (use these exact hex values)
```css
Primary Green: #199D67    /* Growth, alignment, "above the Green Line" */
Secondary Teal: #14B8A6   /* Clarity, flow, calm energy */
Accent Purple: #8B5CF6    /* Premium, AI, mystical moments */
Energy Yellow: #FFB701    /* Celebration, wins, actualization */
Contrast Red: #D03739     /* Alerts, "below Green Line", warnings */
```

### Color Variants
```css
/* Primary Green Family */
#199D67 - Primary Green (main brand color)
#5EC49A - Green Light (hover states)
#A8E5CE - Green Lighter (backgrounds)

/* Teal Family */
#14B8A6 - Teal (secondary color)
#2DD4BF - Teal Light (hover)
#0D9488 - Teal Dark (active states)

/* Purple Family */
#601B9F - Primary Purple (premium base)
#8B5CF6 - Accent Purple (bright, main accent)
#7C3AED - Button Purple (active states)
#B629D4 - Violet (special accents)
#C4B5FD - Purple Lighter (backgrounds)

/* Energy Colors */
#D03739 - Vibrant Red (alerts)
#EF4444 - Red Light (warnings)
#FFB701 - Energy Yellow (celebrations)
#FCD34D - Yellow Light (highlights)

/* Neutrals */
#000000 - Pure Black (primary background)
#1F1F1F - Dark Gray (cards, elevated surfaces)
#404040 - Medium Gray (borders, dividers)
#666666 - Light Gray (disabled states)
#F9F9F9 - Very Light Gray (light mode if needed)
#FFFFFF - Pure White (text on dark backgrounds)
```

### Gradients
```css
/* Use these gradient combinations */
Green Energy: linear-gradient(135deg, #199D67, #5EC49A)
Clarity Flow: linear-gradient(135deg, #14B8A6, #2DD4BF)
Purple Power: linear-gradient(135deg, #601B9F, #8B5CF6)
Brand Harmony: linear-gradient(135deg, #199D67, #14B8A6)
Cosmic Journey: linear-gradient(135deg, #601B9F, #B629D4, #2DD4BF)
Dark Elevation: linear-gradient(180deg, #1F1F1F, #000000)
```

## Design Principles

### Button Design
- **Shape:** Always pill-shaped (`rounded-full` / 50px border-radius)
- **Hover:** Lift up 2px (`-translate-y-0.5`) with enhanced shadow
- **Active:** Press down to 0 (`translate-y-0`) with reduced shadow
- **Transition:** 300ms for smooth interactions (`duration-300`)
- **Shadow:** Start with `shadow-[0_4px_14px_rgba(0,0,0,0.25)]`
- **Hover Shadow:** Increase to `shadow-[0_6px_20px_rgba(color,0.4)]`
- **Padding:** Comfortable click targets (md: `py-3.5 px-7`)

### Card Design
- **Corners:** Large radius (`rounded-2xl` / 16px)
- **Padding:** Generous space (`p-8` / 32px)
- **Borders:** 2px solid borders (`border-2 border-[#333]`)
- **Hover:** Lift up 4px (`hover:-translate-y-1`) + border color to primary
- **Background:** Dark gray (`bg-[#1F1F1F]`) on black

### Spacing
- **Container padding:** `px-6` (24px horizontal)
- **Section spacing:** `mb-12` to `mb-16` (48-64px between sections)
- **Card gaps:** `gap-6` to `gap-8` (24-32px between cards)
- **Element spacing:** `space-y-4` (16px vertical rhythm)

### Typography
```tsx
// Headings
<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-3xl font-bold text-primary-500">Section Header</h2>
<h3 className="text-2xl font-semibold text-secondary-500">Subsection</h3>

// Body text
<p className="text-base text-neutral-300">Standard text</p>
<p className="text-sm text-neutral-400">Secondary text</p>
<p className="text-xs text-neutral-500">Caption text</p>
```

## Status & Feedback

### Status Indicators
```tsx
<Badge variant="success">Above Green Line</Badge>
<Badge variant="info">In Progress</Badge>
<Badge variant="warning">Below Green Line</Badge>
<Badge variant="error">Alert</Badge>
<Badge variant="premium">Premium</Badge>
```

### Loading States
```tsx
<Button loading>Saving...</Button>
<Spinner variant="primary" size="md" />
```

### Progress Tracking
```tsx
<ProgressBar 
  value={75} 
  variant="primary" 
  label="Vision Completion"
  showLabel 
/>
```

## Layout Patterns

### Page Structure
```tsx
import { PageLayout, Container, Footer } from '@/lib/design-system/components'

export default function Page() {
  return (
    <PageLayout>
      <Container size="xl" className="py-12">
        {/* Your content */}
      </Container>
      <Footer />
    </PageLayout>
  )
}
```

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

## Common Patterns

### Hero Section
```tsx
<div className="text-center py-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl">
  <h1 className="text-5xl font-bold mb-4">Hero Title</h1>
  <p className="text-xl text-white/90 mb-6">Subtitle</p>
  <GradientButton gradient="brand" size="lg">
    Get Started
  </GradientButton>
</div>
```

### Feature Card
```tsx
<Card variant="elevated">
  <div className="flex items-center gap-4 mb-4">
    <div className="w-12 h-12 bg-primary-500 rounded-xl" />
    <h3 className="text-xl font-semibold">Feature Title</h3>
  </div>
  <p className="text-neutral-300">Feature description...</p>
  <Button variant="ghost" className="mt-4">Learn More →</Button>
</Card>
```

### Status Alert
```tsx
<div className="bg-primary-500/10 p-6 rounded-xl border-l-4 border-primary-500">
  <div className="flex items-center gap-3 mb-2">
    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
      <span className="text-white text-sm">✓</span>
    </div>
    <span className="text-primary-500 font-semibold">Success!</span>
  </div>
  <p className="text-neutral-300 text-sm">Your vision has been saved.</p>
</div>
```

## Don'ts ❌

- Don't use squared corners on buttons (always use `rounded-full`)
- Don't use flat buttons without shadows
- Don't use colors outside the palette
- Don't use red for positive actions
- Don't overuse gradients (save for special moments)
- Don't ignore hover states
- Don't use low contrast combinations
- Don't use emojis in production UI (only in content)
- Don't use multiple button styles on the same page level

## Do's ✅

- Use pill-shaped buttons everywhere
- Apply consistent hover/active states
- Use gradients for hero sections and celebrations
- Keep borders at 2px for consistency
- Use the AI button for AI-related features only
- Stack buttons vertically on mobile
- Test all interactive states
- Use semantic color meanings
- Reference `vibrationfit-brand-kit.html` when unsure

## File References

- **Brand Kit:** `vibrationfit-brand-kit.html` (visual reference)
- **Components:** `/src/lib/design-system/components.tsx`
- **Tokens:** `/src/lib/design-system/tokens.ts`
- **Product Brief:** `PRODUCT_BRIEF.md`
- **Design Guide:** `VibrationFit Design System Guide.md`

## Questions to Ask Before Building

1. Is this a primary, secondary, or accent action? (determines button variant)
2. Does this feature involve AI? (use AIButton)
3. Is this a celebration moment? (use yellow/gradient)
4. Should this element lift on hover? (most interactive elements do)
5. What's the user's emotional state here? (determines color choice)
6. Is this "above" or "below" the Green Line? (determines green vs red)

