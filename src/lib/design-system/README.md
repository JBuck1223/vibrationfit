# VibrationFit Design System

A comprehensive **neon cyberpunk** design system for building consistent, beautiful, and brand-aligned interfaces across the VibrationFit platform.

## ⚡ Design Philosophy

VibrationFit uses a **neon cyberpunk aesthetic** with:
- **Electric, vibrant colors** that glow against dark backgrounds
- **Pill-shaped buttons** with hover lift effects
- **Dark foundation** (black/dark gray) for maximum neon contrast
- **Mobile-first responsive design** across all components
- **Semantic color meanings** tied to the Green Line philosophy

## 🎨 Neon Cyberpunk Brand Colors

### Primary Colors - Electric Energy
- **Electric Lime (#39FF14)**: Primary brand color, growth, alignment, living "above the Green Line"
- **Neon Cyan (#00FFFF)**: Secondary brand color, clarity, flow, information states
- **Neon Purple (#BF00FF)**: Accent color, premium features, AI moments, mystical energy
- **Neon Yellow (#FFFF00)**: Energy color, celebrations, wins, actualized desires
- **Neon Red (#FF0040)**: Contrast color, alerts, "below Green Line" awareness moments

### Neutral Colors - Dark Foundation
- **Pure Black (#000000)**: Primary background, foundation for neon glow
- **Dark Gray (#1F1F1F)**: Card backgrounds, elevated surfaces
- **Medium Gray (#404040)**: Input backgrounds, subtle elements
- **Border Gray (#666666)**: Borders, dividers
- **Border Light (#333333)**: Subtle borders on dark backgrounds

## 🧩 Components

### Button (Neon Cyberpunk Style)

**Design Philosophy:**
- Always **pill-shaped** (`rounded-full`)
- Hover lifts up 2px with neon glow shadow
- 300ms smooth transitions
- Electric color variants

```tsx
import { Button } from '@/lib/design-system'

// Basic usage - Electric Lime primary
<Button>Primary Action</Button>

// With variants
<Button variant="primary">Primary (Electric Lime)</Button>
<Button variant="secondary">Secondary (Neon Cyan)</Button>
<Button variant="accent">Premium (Neon Purple)</Button>
<Button variant="ghost">Ghost (Subtle)</Button>
<Button variant="danger">Danger (Neon Red)</Button>

// With sizes (mobile-friendly)
<Button size="sm">Small (recommended for mobile)</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// With loading state
<Button loading>Loading...</Button>

// With icons
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Create New
</Button>
```

### Card
```tsx
import { Card } from '@/lib/design-system'

// Basic usage
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// With variants
<Card variant="default">Default card</Card>
<Card variant="elevated">Elevated card with shadow</Card>
<Card variant="outlined">Outlined card</Card>
```

### Form Elements
```tsx
import { Input, Textarea } from '@/lib/design-system'

// Input with label and validation
<Input 
  label="Vision Title"
  placeholder="Enter your vision title..."
  error="This field is required"
  helperText="Optional helper text"
/>

// Textarea
<Textarea 
  label="Description"
  placeholder="Describe your vision..."
  rows={4}
/>
```

### Badges
```tsx
import { Badge } from '@/lib/design-system'

// Status badges
<Badge variant="success">Complete</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="premium">Premium</Badge>
<Badge variant="neutral">Neutral</Badge>
```

### Progress Bar
```tsx
import { ProgressBar } from '@/lib/design-system'

<ProgressBar 
  value={65}
  max={100}
  label="Vision Completion"
  variant="primary"
  showLabel={true}
/>
```

### Loading Spinner
```tsx
import { Spinner } from '@/lib/design-system'

<Spinner size="md" variant="primary" />
```

### Layout Components
```tsx
import { PageLayout, Container } from '@/lib/design-system'

<PageLayout>
  <Container size="lg">
    <h1>Your content here</h1>
  </Container>
</PageLayout>
```

## 🎯 Design Tokens

### Colors
```tsx
import { colors } from '@/lib/design-system'

// Access neon brand colors
colors.primary[50]      // #39FF14 - Electric Lime (main)
colors.primary[100]     // #00FF88 - Neon Electric Green
colors.secondary[50]    // #00FFFF - Neon Cyan (main)
colors.accent[50]       // #BF00FF - Neon Purple (main)
colors.energy.yellow[50] // #FFFF00 - Neon Yellow
colors.energy.red[500]  // #FF0040 - Neon Red

// Semantic colors
colors.semantic.success  // #39FF14 - Electric Lime
colors.semantic.info     // #00FFFF - Neon Cyan
colors.semantic.warning  // #FFFF00 - Neon Yellow
colors.semantic.error    // #FF0040 - Neon Red
colors.semantic.premium  // #BF00FF - Neon Purple
```

### Spacing
```tsx
import { spacing } from '@/lib/design-system'

// Consistent spacing values
spacing[4]  // 1rem
spacing[6]  // 1.5rem
spacing[8]  // 2rem
```

### Gradients
```tsx
import { gradients } from '@/lib/design-system'

// Neon brand gradients
gradients.primary   // linear-gradient(135deg, #39FF14, #00FF88)
gradients.secondary // linear-gradient(135deg, #00FFFF, #06B6D4)
gradients.accent    // linear-gradient(135deg, #BF00FF, #FF0080)
gradients.brand     // linear-gradient(135deg, #39FF14, #00FFFF)
gradients.cosmic    // linear-gradient(135deg, #BF00FF, #FF0080, #00FFFF)
gradients.energy    // linear-gradient(135deg, #FF6600, #FFFF00)
gradients.neon      // linear-gradient(135deg, #39FF14, #00FFFF)
gradients.electric  // linear-gradient(135deg, #BF00FF, #FF0080)
```

### Neon Glow Effects
```tsx
import { shadows } from '@/lib/design-system'

// Neon glow shadows for cyberpunk aesthetic
shadows.primary   // 0 4px 12px rgba(57, 255, 20, 0.3) - Green glow
shadows.secondary // 0 4px 12px rgba(0, 255, 255, 0.3) - Cyan glow
shadows.accent    // 0 4px 12px rgba(191, 0, 255, 0.3) - Purple glow
shadows.neon      // 0 0 20px rgba(57, 255, 20, 0.4) - Intense glow

// Button glow effects
shadows.button       // 0 4px 14px rgba(0, 0, 0, 0.25)
shadows.buttonHover  // 0 6px 20px rgba(57, 255, 20, 0.3)
```

## 🚀 Usage Examples

### Complete Form
```tsx
import { 
  PageLayout, 
  Container, 
  Card, 
  Input, 
  Textarea, 
  Button, 
  ProgressBar 
} from '@/lib/design-system'

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
            
            <Textarea 
              label="Description"
              placeholder="Describe your vision..."
              rows={6}
            />
            
            <ProgressBar 
              value={75}
              label="Completion"
              variant="primary"
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

### Status Card with Neon Aesthetic
```tsx
import { Card, Badge, Button, ProgressBar } from '@/lib/design-system'

export function VisionCard({ vision }) {
  return (
    <Card className="hover:border-[#39FF14] hover:shadow-[0_4px_12px_rgba(57,255,20,0.3)] transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{vision.title}</h3>
        <Badge variant={vision.status === 'complete' ? 'success' : 'warning'}>
          {vision.status}
        </Badge>
      </div>
      
      <ProgressBar 
        value={vision.completion_percentage}
        variant="primary"
        showLabel={false}
      />
      
      <div className="flex gap-3 mt-4">
        <Button size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button size="sm" variant="ghost">
          View
        </Button>
      </div>
    </Card>
  )
}
```

## 📱 Responsive Design

All components are built with mobile-first responsive design:

```tsx
// Container sizes
<Container size="sm">   // max-width: 2xl
<Container size="md">   // max-width: 4xl
<Container size="lg">   // max-width: 6xl
<Container size="xl">    // max-width: 7xl
<Container size="full">  // max-width: full
```

## 🎨 Customization

### Extending Components
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

### Using Design Tokens in CSS
```css
/* Use neon brand colors in custom CSS */
.custom-element {
  background-color: theme('colors.primary.50');     /* Electric Lime */
  border-color: theme('colors.secondary.50');       /* Neon Cyan */
  box-shadow: theme('boxShadow.primary');           /* Green glow */
}

/* Cyberpunk neon glow effect */
.neon-glow {
  color: theme('colors.primary.50');
  text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
  box-shadow: theme('boxShadow.neon');
}
```

## 🔧 Installation

The design system is already integrated into your VibrationFit project. Simply import components as needed:

```tsx
import { Button, Card, Input } from '@/lib/design-system'
```

## 📖 Component Showcase

Visit `/design-system` to see all components in action with live examples and code snippets.

## 🎯 Best Practices

1. **Consistency**: Always use the design system components instead of custom styling
2. **Brand Colors**: Use semantic color variants (success, warning, error) for status indicators
3. **Accessibility**: All components include proper ARIA attributes and keyboard navigation
4. **Performance**: Components are optimized with proper memoization and lazy loading
5. **Responsive**: All components work seamlessly across all device sizes

## 🚀 Getting Started

1. Import the components you need
2. Use the design tokens for consistent spacing and colors
3. Follow the component examples above
4. Check the showcase page for inspiration
5. Maintain consistency across your entire platform

---

## 🎨 Quick Color Reference

| Color Name | Hex | Usage |
|------------|-----|-------|
| Electric Lime | `#39FF14` | Primary brand, success, "above Green Line" |
| Neon Cyan | `#00FFFF` | Secondary brand, info, clarity |
| Neon Purple | `#BF00FF` | Accent, premium features, AI |
| Neon Yellow | `#FFFF00` | Celebrations, wins, warnings |
| Neon Red | `#FF0040` | Alerts, "below Green Line" |
| Pure Black | `#000000` | Primary background |
| Dark Gray | `#1F1F1F` | Card backgrounds |

---

**VibrationFit Design System v1.0** - Neon Cyberpunk Aesthetic ⚡✨
