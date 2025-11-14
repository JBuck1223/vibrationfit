# VibrationFit Header Design Guide
*The Perfect Header Template for All /ID Detail Pages*

---

## Overview

This guide provides the standardized approach for building beautiful, consistent headers across all VibrationFit detail pages (e.g., `/life-vision/[id]`, `/vision-board/[id]`, `/actualization-blueprints/[id]`).

**Reference Implementation:** `/src/app/life-vision/[id]/page.tsx`

---

## 1. Data Structure & Status Logic

### Interface Requirements

All version tables use `is_active` and `is_draft` boolean fields:

```typescript
interface VersionData {
  id: string
  user_id: string
  version_number: number
  // ... other fields ...
  is_active: boolean   // true = currently active version
  is_draft: boolean    // true = work in progress
  created_at: string
  updated_at: string
}
```

### Status Determination Logic

```typescript
// Determine display status based on is_active and is_draft
const getDisplayStatus = () => {
  // Explicitly check for true values (handle null/undefined)
  const isActive = versionData.is_active === true
  const isDraft = versionData.is_draft === true
  
  if (isActive && !isDraft) {
    return 'active'   // Active version (most recent complete)
  } else if (!isActive && isDraft) {
    return 'draft'    // Work in progress
  } else {
    return 'complete' // Historical completed version
  }
}

const displayStatus = getDisplayStatus()
```

**Status Rules:**
- **Active**: `is_active=true` AND `is_draft=false` → The current "live" version
- **Draft**: `is_active=false` AND `is_draft=true` → Work in progress, not yet complete
- **Complete**: `is_active=false` AND `is_draft=false` → Historical completed version

---

## 2. Header Structure

### Complete Header Template

```tsx
import { 
  Button, 
  VersionBadge, 
  StatusBadge, 
  CreatedDateBadge 
} from '@/lib/design-system/components'
import { useRouter } from 'next/navigation'

{/* Header Container */}
<div className="mb-8">
  {/* Gradient Border Wrapper */}
  <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
    
    {/* Inner Card with Gradient Background */}
    <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      
      <div className="relative z-10">
        
        {/* Title Section */}
        <div className="text-center mb-4">
          <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
            Your Page Title
          </h1>
        </div>
        
        {/* Version Info & Status Badges */}
        <div className="text-center mb-6">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
            
            {/* Version Circle Badge - Color matches status */}
            <VersionBadge 
              versionNumber={versionData.version_number} 
              status={displayStatus} 
            />
            
            {/* Created Date Badge */}
            <CreatedDateBadge createdAt={versionData.created_at} />
            
            {/* Status Badge - Active gets solid, others get subtle */}
            <StatusBadge 
              status={displayStatus} 
              subtle={displayStatus !== 'active'}
            />
            
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
          
          <Button
            onClick={() => router.push(`/your-feature/${versionData.id}/action`)}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
          >
            <Icon icon={YourIcon} size="sm" className="shrink-0" />
            <span>Action Name</span>
          </Button>
          
          {/* Add more action buttons as needed */}
          
        </div>
        
      </div>
    </div>
  </div>
</div>
```

---

## 3. Card Styling Specifications

### Outer Gradient Border

```tsx
<div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
```

**Purpose:** Creates a subtle neon border glow
- **Padding:** `p-[2px]` (2px border effect)
- **Border Radius:** `rounded-2xl` (16px)
- **Gradient:** Brand colors (green → teal → purple) at low opacity

### Inner Card

```tsx
<div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
```

**Purpose:** Main content container with elevated appearance
- **Responsive Padding:**
  - Mobile: `p-4` (16px)
  - Tablet: `md:p-6` (24px)
  - Desktop: `lg:p-8` (32px)
- **Border Radius:** `rounded-2xl` (16px)
- **Background:** Subtle gradient from green/teal to transparent
- **Shadow:** Deep elevation shadow

### Badge Container

```tsx
<div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
```

**Purpose:** Houses version, date, and status badges
- **Display:** `inline-flex` (auto-width, centered)
- **Wrap:** `flex-wrap` (responsive multi-line)
- **Gap:** `gap-2 md:gap-3` (8-12px between badges)
- **Padding:** `px-3 md:px-4 py-2 md:py-3`
- **Background:** Dark semi-transparent with blur
- **Border:** Subtle neutral border

---

## 4. Button Styling Specifications

### Action Button Pattern

```tsx
<Button
  onClick={() => router.push('/path')}
  variant="outline"
  size="sm"
  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
>
  <Icon icon={YourIcon} size="sm" className="shrink-0" />
  <span>Action Name</span>
</Button>
```

**Key Features:**
- **Variant:** `outline` (transparent with border)
- **Size:** `sm` (consistent compact size)
- **Responsive Text:** `text-xs md:text-sm`
- **Flex Layout:** Centers icon + text
- **Hover Effect:** `-translate-y-0.5` (lifts up 2px)
- **Transition:** `duration-300` (smooth animation)
- **Icon:** `shrink-0` prevents icon from shrinking

### Button Arrangement

```tsx
<div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
  {/* Buttons here */}
</div>
```

**Container Rules:**
- **Direction:** Horizontal by default
- **Wrap:** Wraps on mobile, single row on tablet+
- **Max Width:** `max-w-2xl` (640px) keeps buttons grouped
- **Center:** `mx-auto` centers the button group
- **Gap:** `gap-2 md:gap-4` (8-16px between buttons)

---

## 5. Version & Status Badge System

### Using StatusBadge Component

```tsx
import { StatusBadge } from '@/lib/design-system/components'

<StatusBadge 
  status={displayStatus}           // 'active' | 'draft' | 'complete'
  subtle={displayStatus !== 'active'}  // Active = solid, others = subtle
/>
```

**Badge Variants:**

| Status | Color | Style | Icon | When to Use |
|--------|-------|-------|------|-------------|
| **Active** | Bright Green `#39FF14` | Solid background | ✓ Checkmark | `is_active=true` AND `is_draft=false` |
| **Draft** | Neon Yellow `#FFFF00` | Subtle (20% opacity) | None | `is_active=false` AND `is_draft=true` |
| **Complete** | Blue `#3B82F6` | Subtle (20% opacity) | None | `is_active=false` AND `is_draft=false` |

**Props:**
- `status` (required): The status string ('active', 'draft', or 'complete')
- `subtle` (optional, default: `true`): Use transparent background
- `showIcon` (optional, default: `true`): Show checkmark for active
- `className` (optional): Additional Tailwind classes

### Using VersionBadge Component

```tsx
import { VersionBadge } from '@/lib/design-system/components'

<VersionBadge 
  versionNumber={versionData.version_number} 
  status={displayStatus} 
/>
```

**Features:**
- Displays version number in a colored circle
- Circle color automatically matches the status:
  - Active → Bright green
  - Draft → Yellow
  - Complete → Blue
- Size: 28px × 28px (w-7 h-7)
- Text: Bold, centered

### Using CreatedDateBadge Component

```tsx
import { CreatedDateBadge } from '@/lib/design-system/components'

<CreatedDateBadge 
  createdAt={versionData.created_at}
  showTime={true}  // default: true
/>
```

**Features:**
- Displays creation date and time
- Responsive:
  - Mobile: Date only
  - Desktop: Date + time
- Dark background with border
- Format: "MM/DD/YYYY at HH:MM AM/PM"

---

## 6. Typography Standards

### Page Title

```tsx
<h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
  The Life I Choose
</h1>
```

**Responsive Sizing:**
- Mobile: `text-xl` (20px)
- Tablet: `md:text-4xl` (36px)
- Desktop: `lg:text-5xl` (48px)
- **Weight:** `font-bold` (700)
- **Color:** `text-white`
- **Leading:** `leading-tight` for multi-line titles

### Section Headings (if needed)

```tsx
<h2 className="text-lg md:text-2xl font-semibold text-white mb-4">
  Section Title
</h2>
```

---

## 7. Spacing Guidelines

### Vertical Spacing

```tsx
{/* Header wrapper */}
<div className="mb-8">           {/* 32px below header */}

  {/* Title section */}
  <div className="text-center mb-4">  {/* 16px below title */}
  
  {/* Badge section */}
  <div className="text-center mb-6">  {/* 24px below badges */}
  
  {/* Buttons - no bottom margin */}
```

**Standard Margins:**
- Header container: `mb-8` (32px)
- Title to badges: `mb-4` (16px)
- Badges to buttons: `mb-6` (24px)

### Horizontal Spacing

```tsx
{/* Badge gaps */}
gap-2 md:gap-3     // 8-12px between badges

{/* Button gaps */}
gap-2 md:gap-4     // 8-16px between buttons
```

---

## 8. Import Requirements

### Required Components

```typescript
import { 
  Button, 
  VersionBadge, 
  StatusBadge, 
  CreatedDateBadge,
  Icon
} from '@/lib/design-system/components'
```

### Required Hooks

```typescript
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
```

---

## 9. Complete Working Example

Here's a full implementation for a hypothetical `/vision-board/[id]` page:

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Download, Edit3 } from 'lucide-react'
import { 
  Button, 
  VersionBadge, 
  StatusBadge, 
  CreatedDateBadge,
  Icon,
  Spinner,
  Card
} from '@/lib/design-system/components'

interface VisionBoardData {
  id: string
  user_id: string
  version_number: number
  title: string
  description: string
  is_active: boolean
  is_draft: boolean
  created_at: string
  updated_at: string
  // ... other fields
}

export default function VisionBoardDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [visionBoard, setVisionBoard] = useState<VisionBoardData | null>(null)

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      const { data, error } = await supabase
        .from('vision_board_versions')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()
      
      if (data) setVisionBoard(data)
      setLoading(false)
    }
    loadData()
  }, [params, supabase])

  // Determine display status
  const getDisplayStatus = () => {
    if (!visionBoard) return 'draft'
    
    const isActive = visionBoard.is_active === true
    const isDraft = visionBoard.is_draft === true
    
    if (isActive && !isDraft) return 'active'
    else if (!isActive && isDraft) return 'draft'
    else return 'complete'
  }

  const displayStatus = getDisplayStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner variant="primary" size="lg" />
      </div>
    )
  }

  if (!visionBoard) {
    return (
      <Card className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Not found</h2>
        <Button onClick={() => router.push('/vision-board')}>
          Back to Vision Board
        </Button>
      </Card>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Title */}
              <div className="text-center mb-4">
                <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                  {visionBoard.title}
                </h1>
              </div>
              
              {/* Badges */}
              <div className="text-center mb-6">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  <VersionBadge 
                    versionNumber={visionBoard.version_number} 
                    status={displayStatus} 
                  />
                  <CreatedDateBadge createdAt={visionBoard.created_at} />
                  <StatusBadge 
                    status={displayStatus} 
                    subtle={displayStatus !== 'active'}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
                <Button
                  onClick={() => router.push(`/vision-board/${visionBoard.id}/view`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Icon icon={Eye} size="sm" className="shrink-0" />
                  <span>View Board</span>
                </Button>
                
                <Button
                  onClick={() => router.push(`/vision-board/${visionBoard.id}/edit`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Icon icon={Edit3} size="sm" className="shrink-0" />
                  <span>Edit</span>
                </Button>
                
                <Button
                  onClick={() => router.push(`/vision-board/${visionBoard.id}/download`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Icon icon={Download} size="sm" className="shrink-0" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your page content */}
    </>
  )
}
```

---

## 10. Design Tokens Reference

### Colors Used

```typescript
// From @/lib/design-system/tokens
colors.primary[500]     // #39FF14 - Electric green
colors.secondary[500]   // #14B8A6 - Teal
colors.accent[500]      // #BF00FF - Purple
colors.semantic.warning // #FFFF00 - Yellow
colors.neutral[900]     // #111827 - Dark gray
colors.neutral[700]     // #374151 - Border gray
```

### Status Colors (Automatic)

The `StatusBadge` and `VersionBadge` components automatically apply:
- **Active**: `#39FF14` (Electric Green)
- **Draft**: `#FFFF00` (Neon Yellow)  
- **Complete**: `#3B82F6` (Blue 500)

---

## 11. Accessibility Considerations

✅ **Focus States:** All buttons have visible focus rings
✅ **Color Contrast:** Status badges meet WCAG AA standards
✅ **Semantic HTML:** Proper heading hierarchy (h1 → h2)
✅ **Responsive:** Works on all screen sizes
✅ **Touch Targets:** Buttons are minimum 44×44px on mobile

---

## 12. Common Mistakes to Avoid

❌ **Don't** hardcode status colors inline
✅ **Do** use `StatusBadge` and `VersionBadge` components

❌ **Don't** forget the `subtle` prop for non-active statuses
✅ **Do** use `subtle={displayStatus !== 'active'}`

❌ **Don't** use `if (vision.is_active)` without checking for `true`
✅ **Do** use `if (vision.is_active === true)` to handle null/undefined

❌ **Don't** use different gradient colors per page
✅ **Do** use the standard green/teal/purple gradient

❌ **Don't** skip responsive text sizing
✅ **Do** use `text-xl md:text-4xl lg:text-5xl` for titles

---

## 13. Customization Options

### Adjust Gradient Colors

```tsx
{/* Warmer gradient variant */}
<div className="bg-gradient-to-br from-[#FFB701]/30 via-[#FF6600]/20 to-[#BF00FF]/30">

{/* Cooler gradient variant */}
<div className="bg-gradient-to-br from-[#14B8A6]/30 via-[#00FFFF]/20 to-[#8B5CF6]/30">
```

### Different Button Layouts

```tsx
{/* Vertical stack on mobile */}
<div className="flex flex-col md:flex-row gap-2 md:gap-4">

{/* Grid layout */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
```

### Alternative Title Styles

```tsx
{/* Gradient text title */}
<h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-[#39FF14] to-[#14B8A6] bg-clip-text text-transparent">
  Gradient Title
</h1>
```

---

## 14. Testing Checklist

Before deploying a new header implementation:

- [ ] Test on mobile (320px - 640px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (1280px+)
- [ ] Verify Active status shows green + checkmark
- [ ] Verify Draft status shows yellow (no icon)
- [ ] Verify Complete status shows blue (no icon)
- [ ] Check button hover animations work
- [ ] Verify badge container wraps properly on mobile
- [ ] Test with long titles (30+ characters)
- [ ] Check keyboard navigation works
- [ ] Verify focus states are visible

---

## 15. Quick Reference

### Minimal Header (Copy-Paste Ready)

```tsx
<div className="mb-8">
  <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
    <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="relative z-10">
        
        <div className="text-center mb-4">
          <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
            Page Title
          </h1>
        </div>
        
        <div className="text-center mb-6">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
            <VersionBadge versionNumber={data.version_number} status={displayStatus} />
            <CreatedDateBadge createdAt={data.created_at} />
            <StatusBadge status={displayStatus} subtle={displayStatus !== 'active'} />
          </div>
        </div>

        <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
          {/* Your action buttons */}
        </div>
        
      </div>
    </div>
  </div>
</div>
```

---

## Related Documentation

- **Design System Components**: `/src/lib/design-system/components.tsx`
- **Design Tokens**: `/src/lib/design-system/tokens.ts`
- **Brand Kit**: `vibrationfit-brand-kit.html`
- **Design System Rules**: `VibrationFit Design System Rules.md`

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready

