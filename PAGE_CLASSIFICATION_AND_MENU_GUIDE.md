# VibrationFit Page Classification & Menu System Guide

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Production Master System

---

## 🎯 Overview

This guide documents the **centralized page classification and menu system** for VibrationFit. All page classifications and navigation menus are now defined in a single source of truth, eliminating duplication and ensuring consistency across the application.

---

## 📁 File Structure

```
src/lib/navigation/
├── page-classifications.ts   # Page type definitions (USER, ADMIN, PUBLIC)
├── menu-definitions.ts       # Navigation menu structures
└── index.ts                  # Centralized exports
```

---

## 🏗️ Architecture

### **Single Source of Truth**

All page classifications and navigation menus are defined in:
- `src/lib/navigation/page-classifications.ts` - Page routes and types
- `src/lib/navigation/menu-definitions.ts` - Menu items and navigation structures

### **Components Using This System**

- ✅ `src/components/GlobalLayout.tsx` - Layout routing
- ✅ `src/components/Header.tsx` - Public header navigation
- ✅ `src/components/Sidebar.tsx` - Sidebar navigation (user/admin)
- ✅ `src/app/sitemap/page.tsx` - Sitemap display (can be updated)

---

## 📋 Page Classifications

### **Page Types**

Pages are classified into three types:

1. **USER** - Core app functionality for logged-in users
2. **ADMIN** - Admin panel and management tools
3. **PUBLIC** - Marketing, auth, and public utilities

### **How Page Type is Determined**

```typescript
import { getPageType } from '@/lib/navigation'

const pageType = getPageType('/dashboard')        // 'USER'
const pageType = getPageType('/auth/login')        // 'PUBLIC'
const pageType = getPageType('/admin/users')      // 'ADMIN'
const pageType = getPageType('/life-vision/123')  // 'USER' (matches /life-vision/[id])
```

### **Dynamic Route Matching**

The system handles dynamic routes automatically:

- `/life-vision/[id]` matches `/life-vision/abc-123`
- `/profile/[id]/edit` matches `/profile/xyz-456/edit`
- `/assessment/[id]` matches `/assessment/789`

**Pattern**: Dynamic segments `[id]` are converted to regex pattern `[^/]+` for matching.

---

## 📊 Page Classification Reference

### **USER Pages** (47 pages)

#### Dashboard & Analytics
- `/dashboard`
- `/dashboard/activity`
- `/dashboard/tokens`
- `/dashboard/token-history`
- `/dashboard/add-tokens`
- `/dashboard/storage`
- `/dashboard/vibe-assistant-usage`
- `/viva`

#### Life Vision System
- `/life-vision`
- `/life-vision/new`
- `/life-vision/create-with-viva`
- `/life-vision/[id]` (dynamic)
- `/life-vision/[id]/audio`
- `/life-vision/[id]/audio-generate`
- `/life-vision/[id]/audio-sets`
- `/life-vision/[id]/audio-sets/[audioSetId]` (dynamic)
- `/life-vision/[id]/experiment`
- `/life-vision/[id]/refine`
- `/life-vision/new/assembly`
- `/life-vision/new/category/[key]` (dynamic)

#### Vision Board & Gallery
- `/vision-board`
- `/vision-board/new`
- `/vision-board/gallery`
- `/vision-board/[id]` (dynamic)

#### Journal System
- `/journal`
- `/journal/new`
- `/journal/[id]` (dynamic)
- `/journal/[id]/edit` (dynamic)

#### Profile & Account
- `/profile`
- `/profile/edit`
- `/profile/new`
- `/profile/[id]` (dynamic)
- `/profile/[id]/edit` (dynamic)
- `/account/settings`

#### Vibration Assessment
- `/assessment`
- `/assessment/[id]/in-progress` (dynamic)
- `/assessment/[id]/results` (dynamic)
- `/assessment/[id]` (dynamic)
- `/assessment/history`
- `/assessment/results`

#### Actualization Blueprints
- `/actualization-blueprints`
- `/actualization-blueprints/[id]` (dynamic)

#### Activation Intensive
- `/intensive`
- `/intensive/dashboard`
- `/intensive/intake`
- `/intensive/calibration`
- `/intensive/builder`
- `/intensive/schedule-call`
- `/intensive/call-prep`
- `/intensive/refine-vision`
- `/intensive/activation-protocol`
- `/intensive/activate`
- `/intensive/check-email`

#### Billing
- `/billing`

### **ADMIN Pages** (8 pages)

- `/admin/users`
- `/admin/ai-models`
- `/admin/token-usage`
- `/admin/assets`
- `/admin/audio-mixer`
- `/sitemap`
- `/design-system`
- `/design-system/component/[componentName]` (dynamic)

### **PUBLIC Pages** (15 pages)

#### Marketing
- `/`
- `/pricing`
- `/pricing-hormozi`

#### Authentication
- `/auth/login`
- `/auth/signup`
- `/auth/verify`
- `/auth/setup-password`
- `/auth/logout`
- `/auth/callback`
- `/auth/auto-login`

#### Checkout & Success
- `/checkout`
- `/billing/success`

#### Public Utilities
- `/support`
- `/vision/build`

#### Development/Testing
- `/debug/email`
- `/test-recording`
- `/experiment`
- `/experiment/design-system`
- `/experiment/design-system/component/[componentName]` (dynamic)
- `/experiment/old-home`

**Total: 70 pages**

---

## 🍔 Menu System

### **Navigation Menus**

The system provides four main navigation menus:

1. **`userNavigation`** - Main sidebar for logged-in users
2. **`adminNavigation`** - Admin panel sidebar
3. **`mobileNavigation`** - Mobile bottom bar (key items only)
4. **`headerAccountMenu`** - Account dropdown in public header

### **Menu Structure**

```typescript
interface NavItem {
  name: string           // Display name
  href: string          // Route path
  icon: LucideIcon      // Icon component
  badge?: string        // Optional badge (e.g., "NEW")
  children?: NavItem[] // Submenu items
  hasDropdown?: boolean     // Shows dropdown arrow
  requiresAuth?: boolean
  requiresAdmin?: boolean
  description?: string // Tooltip/description
}
```

### **User Navigation Menu**

**Location**: `src/lib/navigation/menu-definitions.ts`

**Items**:
1. Dashboard
2. Profile (dropdown)
   - View Profile
   - Edit Profile
   - New Profile
3. Life Vision (dropdown)
   - My Visions
   - Create Vision
   - Create with VIVA
4. Assessment (dropdown)
   - Take Assessment
   - View Results
5. Vision Board (dropdown)
   - My Vision Board
   - Gallery
   - New Item
6. Journal (dropdown)
   - My Journal
   - New Entry
7. VIVA (dropdown)
   - Chat with VIVA
   - Create Life Vision
8. Activity
9. Token Tracking (dropdown)
   - Token Balance
   - Token History
   - Buy Tokens
10. Storage (dropdown)
    - Storage Usage
11. Billing
12. Support

### **Admin Navigation Menu**

**Items**:
1. Admin Dashboard
2. User Management
3. AI Models (dropdown)
   - AI Models
4. Token Analytics
5. Design System
6. Sitemap

### **Mobile Navigation**

**Key items only** (bottom bar):
1. Vision (`/life-vision`)
2. Board (`/vision-board`)
3. Journal (`/journal`)
4. VIVA (`/viva`)
5. More (opens drawer with all other items)

---

## 🔧 Usage Examples

### **1. Determine Page Type in Component**

```typescript
import { getPageType, requiresAuth } from '@/lib/navigation'

function MyComponent() {
  const pathname = usePathname()
  const pageType = getPageType(pathname)
  
  // Check if auth required
  if (requiresAuth(pathname)) {
    // Redirect to login
  }
}
```

### **2. Use Navigation Menus**

```typescript
import { userNavigation, isNavItemActive } from '@/lib/navigation'

function Sidebar() {
  const pathname = usePathname()
  
  return (
    <nav>
      {userNavigation.map((item) => {
        const isActive = isNavItemActive(item, pathname)
        // Render nav item
      })}
    </nav>
  )
}
```

### **3. Filter Navigation by Requirements**

```typescript
import { getFilteredNavigation, userNavigation } from '@/lib/navigation'

const filteredNav = getFilteredNavigation(userNavigation, {
  user: {
    isAuthenticated: true,
    isAdmin: false
  }
})
```

### **4. Find Navigation Item**

```typescript
import { findNavItemByHref, userNavigation } from '@/lib/navigation'

const profileItem = findNavItemByHref(userNavigation, '/profile')
// Returns the Profile nav item or null
```

---

## 📐 Layout System Integration

### **GlobalLayout.tsx**

```typescript
import { getPageType } from '@/lib/navigation'

export function GlobalLayout({ children }) {
  const pathname = usePathname()
  const pageType = getPageType(pathname)
  
  if (pageType === 'USER' || pageType === 'ADMIN') {
    return <SidebarLayout isAdmin={pageType === 'ADMIN'}>
      {children}
    </SidebarLayout>
  }
  
  return <Header><Footer>{children}</Footer></Header>
}
```

### **Sidebar.tsx**

```typescript
import { userNavigation, adminNavigation, isNavItemActive } from '@/lib/navigation'

export function Sidebar({ isAdmin = false }) {
  const navigation = isAdmin ? adminNavigation : userNavigation
  // Render navigation items
}
```

### **Header.tsx**

```typescript
import { getPageType, headerAccountMenu } from '@/lib/navigation'

export function Header() {
  const pageType = getPageType(pathname)
  
  // Only show on PUBLIC pages
  if (pageType !== 'PUBLIC') return null
  
  // Use headerAccountMenu for dropdown
}
```

---

## ➕ Adding a New Page

### **Step 1: Add to Page Classifications**

Edit `src/lib/navigation/page-classifications.ts`:

```typescript
export const PAGE_CLASSIFICATIONS = {
  USER: [
    // ... existing pages
    '/my-new-page',        // Static route
    '/my-new-page/[id]',   // Dynamic route
  ],
  // ...
}
```

### **Step 2: Add to Navigation Menu (if needed)**

Edit `src/lib/navigation/menu-definitions.ts`:

```typescript
export const userNavigation: NavItem[] = [
  {
    name: 'My New Feature',
    href: '/my-new-page',
    icon: Star,
    description: 'Description of feature',
  },
]
```

### **Step 3: Create the Page File**

```typescript
// src/app/my-new-page/page.tsx
export default function MyNewPage() {
  return <div>My New Page</div>
}
```

The system will automatically:
- ✅ Route it correctly based on classification
- ✅ Show appropriate layout (sidebar/header)
- ✅ Include in navigation menus
- ✅ Handle active state highlighting

---

## 🔍 Helper Functions

### **Page Type Helpers**

```typescript
// Get page type
getPageType(pathname: string): PageType

// Check if auth required
requiresAuth(pathname: string): boolean

// Check if admin required
requiresAdmin(pathname: string): boolean

// Get all pages of a type
getPagesByType(type: PageType): readonly string[]

// Get total page count
getTotalPageCount(): number
```

### **Navigation Helpers**

```typescript
// Check if nav item is active (including children)
isNavItemActive(item: NavItem, pathname: string): boolean

// Find nav item by href
findNavItemByHref(items: NavItem[], href: string): NavItem | null

// Filter navigation by auth/admin requirements
getFilteredNavigation(
  items: NavItem[],
  options: { user?: { isAuthenticated: boolean; isAdmin?: boolean } }
): NavItem[]
```

---

## ✅ Benefits of This System

1. **Single Source of Truth** - All classifications in one place
2. **Type Safety** - TypeScript ensures consistency
3. **No Duplication** - Define once, use everywhere
4. **Easy Updates** - Change in one file, updates everywhere
5. **Automatic Matching** - Dynamic routes handled automatically
6. **Helper Functions** - Utilities for common operations
7. **Scalable** - Easy to add new pages/menus

---

## 🐛 Troubleshooting

### **Page Not Showing Correct Layout**

**Problem**: Page shows wrong layout (sidebar vs header)

**Solution**: 
1. Check if page is in `PAGE_CLASSIFICATIONS`
2. Verify route pattern matches (including dynamic segments)
3. Check `getPageType()` returns expected type

### **Navigation Item Not Active**

**Problem**: Active state not highlighting correctly

**Solution**:
1. Use `isNavItemActive()` helper function
2. Ensure href matches exactly (including leading slash)
3. Check for nested routes (should use `startsWith` logic)

### **Dynamic Route Not Matching**

**Problem**: `/life-vision/123` not matching `/life-vision/[id]`

**Solution**:
1. Verify pattern uses `[id]` syntax
2. Check `matchesRoute()` function handles your pattern
3. Test with `getPageType('/life-vision/test-id')`

---

## 📚 Related Documentation

- **Master Site Architecture**: `MASTER_SITE_ARCHITECTURE.md`
- **Sitemap**: `SITEMAP.md`
- **Design System**: `VibrationFit Design System Guide.md`

---

## 🔄 Migration Notes

### **Before (Old System)**

```typescript
// Duplicated in GlobalLayout.tsx, Header.tsx, etc.
const pageClassifications = {
  USER: ['/dashboard', '/profile', ...],
  ADMIN: [...],
  PUBLIC: [...]
}
```

### **After (New System)**

```typescript
// Single definition in page-classifications.ts
import { getPageType } from '@/lib/navigation'
const pageType = getPageType(pathname)
```

### **Migration Status**

- ✅ `GlobalLayout.tsx` - Migrated
- ✅ `Header.tsx` - Migrated
- ✅ `Sidebar.tsx` - Migrated
- ⏳ `sitemap/page.tsx` - Can be updated (optional)
- ⏳ `Footer.tsx` - Can be updated (optional)

---

**Maintained By**: Development Team  
**Last Review**: January 2025  
**Next Review**: When adding major features or restructuring navigation

