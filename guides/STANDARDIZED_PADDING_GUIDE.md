# Standardized Padding Guide

## Card Padding

**Standard Card Component:**
```tsx
<Card variant="elevated">
  {/* Content */}
</Card>
```

**Padding (automatically applied by Card component):**
- **Mobile:** `p-6` (24px all around) - Built in
- **Desktop:** `md:p-8` (32px all around) - Built in
- ✅ No need to add padding classes manually

## Stack Inside Cards

**Stack in Card (no extra padding needed):**
```tsx
<Card variant="elevated">
  <Stack gap="md">
    {/* Content goes here */}
  </Stack>
</Card>
```

**If you need extra horizontal spacing (optional):**
```tsx
<Card variant="elevated">
  <Stack gap="md" className="px-4 md:px-6">
    {/* Add px-4 md:px-6 only if you want extra horizontal spacing */}
  </Stack>
</Card>
```

## Button Spacing at Card Bottom

Buttons at the bottom of cards should have matching padding above and below:

```tsx
<Card variant="elevated">
  <Stack gap="md">
    {/* Content */}
    
    {/* Add this spacing above button at bottom */}
    <div className="text-center pt-6 md:pt-8">
      <Button>CTA</Button>
    </div>
  </Stack>
</Card>
```

**Note:** Card already has built-in padding, so just add `pt-6 md:pt-8` above the button for equal spacing.

## Standard Spacing Values

### Responsive Padding Scale
```tsx
p-2    // 8px  - Minimal mobile padding
p-4    // 16px - Standard mobile padding  
p-6    // 24px - Card vertical padding (mobile)
p-8    // 32px - Card padding (desktop), Button spacing
p-12   // 48px - Section spacing
p-16   // 64px - Large section spacing
```

### Gap Between Elements (Stack/Grid)
```tsx
gap="xs"  // 8px (gap-2)
gap="sm"  // 16px (gap-4)
gap="md"  // 24px (gap-6)
gap="lg"  // 32px (gap-8)
gap="xl"  // 48px (gap-12)
```

## Best Practices

✅ **DO:**
- Use Card component as-is (padding is built-in)
- Use Stack `gap` prop for consistent vertical rhythm
- Add `pt-6 md:pt-8` above buttons at card bottom
- Only add `px-4 md:px-6` to Stack if you need extra horizontal spacing

❌ **DON'T:**
- Don't add custom padding classes to Card (it's already standardized)
- Don't use `p-4`, `p-6`, `p-10`, `p-12` directly on cards
- Don't add padding to Stack unless you specifically need extra horizontal spacing
- Don't use fixed padding without responsive variants

## Migration Checklist

For any new components:
- [ ] Card component used as-is (built-in padding: `py-6 md:p-8`)
- [ ] Stack inside cards has no extra padding (unless you need horizontal spacing)
- [ ] Buttons at bottom have `pt-6 md:pt-8` above them
- [ ] No inline `className="p-4"` or other non-standard padding

## Typography Components

**Heading Component (with semantic HTML and spacing):**
```tsx
import { Heading } from '@/lib/design-system/components'

<Heading level={1}>Hero Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection Title</Heading>
<Heading level={4}>Card Title</Heading>
```

**Text Component (responsive sizing):**
```tsx
import { Text } from '@/lib/design-system/components'

<Text size="xs">Caption text</Text>
<Text size="sm">Small text</Text>
<Text size="base">Body text</Text>
<Text size="lg">Large body text</Text>
<Text size="xl">XL body text</Text>
<Text size="2xl">XXL body text</Text>
```

**Title Component (for page/section titles):**
```tsx
import { Title } from '@/lib/design-system/components'

<Title level="hero">Hero Section</Title>
<Title level="section">Section</Title>
<Title level="card">Card Title</Title>
```

## Quick Reference

```tsx
// Card with content
<Card>
  <Stack gap="md">Content</Stack>
</Card>

// Card with Stack needing horizontal padding
<Card>
  <Stack gap="md" className="p-2 md:p-8">Content</Stack>
</Card>

// Card with button at bottom
<Card>
  <Stack gap="md" className="p-2 md:p-8 pb-6 md:pb-8">
    Content
    <div className="text-center pt-6 md:pt-8">
      <Button>CTA</Button>
    </div>
  </Stack>
</Card>

// Card with standardized typography
<Card>
  <Heading level={4}>Card Title</Heading>
  <Text size="base">Body content here...</Text>
</Card>
```

