# Agent Quick Start - Building Pages Perfectly

## 🚀 One-Command Page Building

When building a new page, use this template and follow these rules:

```tsx
'use client'

import { Container, Card, Button, Spinner } from '@/lib/design-system/components'

export default function YourPage() {
  return (
    <Container size="xl">
      {/* Your content */}
    </Container>
  )
}
```

## ✅ The 3 Non-Negotiable Rules

1. **NO PageLayout** - GlobalLayout provides it automatically
2. **Container has NO padding** - Uses PageLayout's padding automatically  
3. **Mobile-first ALWAYS** - Responsive everything


## 📚 Full Guides - MUST READ

- **Complete Guide**: `docs/AGENT_PAGE_BUILDING_GUIDE.md`
- **Page Rules**: `rules/PAGE_BUILDING_RULES.md`
- **Mobile Rules**: `rules/mobile-design-rules.md`

---

**Remember**: Copy the template above, follow the 3 rules, make everything responsive. That's it!



