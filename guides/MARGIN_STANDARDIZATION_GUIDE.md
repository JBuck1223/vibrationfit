# Margin Standardization Guide

## Core Principle

**Components DO NOT have built-in margins.** Spacing is controlled by **PARENT containers** using the `gap` prop.

---

## 1. Stack Component (Vertical Spacing)

Use `<Stack>` to create vertical spacing between components:

```tsx
import { Stack, Card, Button } from '@/lib/design-system'

<Stack gap="md">
  <Card>
    <Heading level={2}>Title</Heading>
    <Text>Content</Text>
  </Card>
  
  <Card>
    <Heading level={2}>Another Card</Heading>
    <Text>More content</Text>
  </Card>
</Stack>
```

### Stack Gap Values

| Gap Value | Pixels | Use Case |
|-----------|--------|----------|
| `xs` | 8px | Tight spacing, related items |
| `sm` | 16px | Small sections, lists |
| `md` | 24px | **Default** - standard spacing |
| `lg` | 32px | Large sections, distinct areas |
| `xl` | 48px | Major sections, hero areas |

---

## 2. Inline Component (Horizontal Spacing)

Use `<Inline>` for horizontal spacing:

```tsx
import { Inline, Button } from '@/lib/design-system'

<Inline gap="md">
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</Inline>
```

### Inline Gap Values

Same as Stack: `xs`, `sm`, `md`, `lg`

---

## 3. Heading Components Exception

**Heading components HAVE built-in bottom margins** because headings are always followed by content:

```tsx
import { Heading } from '@/lib/design-system'

// Automatic bottom margin included
<Heading level={1}>Hero Title</Heading>  // mb-4 md:mb-6
<Heading level={2}>Section Title</Heading>  // mb-3 md:mb-4
<Heading level={3}>Subsection Title</Heading>  // mb-2 md:mb-3
<Heading level={4}>Card Title</Heading>  // mb-2
```

### Heading Margin Values

| Level | Mobile | Desktop | Use Case |
|-------|--------|---------|----------|
| 1 (Hero) | 16px (mb-4) | 24px (md:mb-6) | Page titles |
| 2 (Section) | 12px (mb-3) | 16px (md:mb-4) | Major sections |
| 3 (Subsection) | 8px (mb-2) | 12px (md:mb-3) | Subsections |
| 4 (Card) | 8px (mb-2) | 8px (mb-2) | Card titles |

---

## 4. Components WITHOUT Margins

These components have **no built-in margins**:

✅ **Card** - No margin
✅ **Button** - No margin
✅ **Badge** - No margin
✅ **Icon** - No margin
✅ **Input/Textarea** - No margin
✅ **Text** - No margin
✅ **Container** - No margin
✅ **Grid** - No margin (uses gap prop)

---

## 5. Best Practices

### ✅ DO: Use Stack for Spacing

```tsx
// CORRECT - Control spacing with Stack
<Stack gap="md">
  <Card>
    <Heading level={2}>Title</Heading>
    <Text>Content</Text>
  </Card>
  <Button variant="primary">CTA</Button>
</Stack>
```

### ❌ DON'T: Add Margins to Components

```tsx
// WRONG - Don't add margin classes
<Card className="mb-8">
  <Heading level={2}>Title</Heading>
  <Text>Content</Text>
</Card>

<Button variant="primary" className="mt-4">CTA</Button>
```

### ✅ DO: Nest Stacks for Hierarchical Spacing

```tsx
// CORRECT - Nested Stack for different spacing levels
<Stack gap="lg">
  <Heading level={1}>Page Title</Heading>
  
  <Stack gap="md">
    <Heading level={2}>Section</Heading>
    <Card>Content</Card>
  </Stack>
  
  <Stack gap="md">
    <Heading level={2}>Another Section</Heading>
    <Card>More content</Card>
  </Stack>
</Stack>
```

---

## 6. Spacing Between Major Sections

For spacing between major sections on a page:

```tsx
import { Stack } from '@/lib/design-system'

export default function Page() {
  return (
    <Stack gap="xl">  {/* Large gap between major sections */}
      
      {/* Hero Section */}
      <section>
        <Stack gap="lg">
          <Heading level={1}>Title</Heading>
          <Text>Content</Text>
        </Stack>
      </section>
      
      {/* Feature Section */}
      <section>
        <Stack gap="lg">
          <Heading level={2}>Features</Heading>
          <Grid>
            {/* Cards with Stack gap controls their internal spacing */}
          </Grid>
        </Stack>
      </section>
      
      {/* Pricing Section */}
      <section>
        {/* ... */}
      </section>
      
    </Stack>
  )
}
```

---

## 7. Responsive Spacing

Stack and Inline are responsive by default, but spacing values are consistent across breakpoints. Use responsive patterns if needed:

```tsx
<Stack gap="sm" className="md:gap-md">
  {/* Tighter on mobile, standard on desktop */}
</Stack>
```

---

## 8. When to Override Heading Margins

If you need to override Heading's built-in margin:

```tsx
// Remove default margin
<Heading level={2} className="mb-0">Custom Title</Heading>

// Or use custom margin
<Heading level={2} className="mb-8">Larger Spacing</Heading>
```

---

## Summary

1. **Components = No margins** (except Heading)
2. **Stack/Inline = Controlled spacing** via `gap` prop
3. **Heading = Automatic bottom margins** for typography
4. **Parent controls spacing**, not the component itself

This ensures consistent spacing throughout your application without fighting with component margin defaults.

