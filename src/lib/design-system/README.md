# VibrationFit Design System

A comprehensive design system for building consistent, beautiful, and brand-aligned interfaces across the VibrationFit platform.

## 🎨 Brand Colors

### Primary Colors
- **Primary Green (#199D67)**: Growth, alignment, living "above the Green Line"
- **Secondary Teal (#14B8A6)**: Clarity, flow, calm energy
- **Accent Purple (#8B5CF6)**: Premium features, mystical moments
- **Energy Yellow (#FFB701)**: Celebrations, wins, actualized desires
- **Vibrant Red (#D03739)**: Contrast moments, awareness opportunities

### Neutral Colors
- **Pure Black (#000000)**: Primary background
- **Dark Gray (#1F1F1F)**: Card backgrounds, elevated surfaces
- **Medium Gray (#404040)**: Borders, dividers, input backgrounds
- **Light Gray (#666666)**: Disabled states, subtle elements

## 🧩 Components

### Button
```tsx
import { Button } from '@/lib/design-system'

// Basic usage
<Button>Primary Action</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="accent">Premium</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// With sizes
<Button size="sm">Small</Button>
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

// Access brand colors
colors.primary[500]    // #199D67
colors.secondary[500]  // #14B8A6
colors.accent[500]     // #8B5CF6
colors.semantic.success // #199D67
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

// Brand gradients
gradients.primary   // linear-gradient(135deg, #199D67, #5EC49A)
gradients.secondary // linear-gradient(135deg, #14B8A6, #2DD4BF)
gradients.accent    // linear-gradient(135deg, #601B9F, #8B5CF6)
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

### Status Card
```tsx
import { Card, Badge, Button, ProgressBar } from '@/lib/design-system'

export function VisionCard({ vision }) {
  return (
    <Card className="hover:border-primary-500 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{vision.title}</h3>
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
/* Use brand colors in custom CSS */
.custom-element {
  background-color: theme('colors.primary.500');
  border-color: theme('colors.secondary.500');
  box-shadow: theme('boxShadow.primary');
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

**VibrationFit Design System v1.0** - Built for conscious creation ✨
