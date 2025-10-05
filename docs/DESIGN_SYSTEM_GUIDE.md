# VibrationFit Design System Guide
**Quick Reference for Making Changes**

---

## 🎨 How to Change Colors

### **Global Color Changes**

**File:** `/src/lib/design-system/tokens.ts`

```typescript
export const colors = {
  // Change these values to update colors site-wide
  primary: {
    500: '#199D67',  // Main green - CTAs, success states
    600: '#147A50',  // Darker green - hover states
    // ... etc
  },
  secondary: {
    500: '#14B8A6',  // Teal - info, links
    // ... etc
  },
  accent: {
    500: '#8B5CF6',  // Purple - premium features
    // ... etc
  }
}
```

**What happens when you change these:**
- ALL buttons, cards, text, and components update automatically
- No need to touch individual pages
- Changes apply to entire site instantly

### **Example: Make the Primary Green Lighter**

```typescript
// Before
primary: {
  500: '#199D67',
}

// After (lighter green)
primary: {
  500: '#5EC49A',  // Now all primary buttons/text are lighter
}
```

---

## 🔘 How to Change Button Styles

### **Global Button Changes**

**File:** `/src/lib/design-system/components.tsx`

Find the `Button` component and modify the `variants` object:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600",
        // ↑ Change these classes to modify all primary buttons
        
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
        // ↑ Change these classes to modify all secondary buttons
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
        // ↑ Change padding/text size for all buttons of this size
      }
    }
  }
)
```

### **Example: Make All Buttons More Rounded**

```typescript
// Find the base button classes (first argument)
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg...",
  //                                          ↑ change this
  
  // Change from rounded-lg to rounded-full
  "inline-flex items-center justify-center rounded-full...",
)
```

---

## 📏 How to Change Spacing

### **Global Spacing**

**File:** `/src/lib/design-system/tokens.ts`

```typescript
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '1rem',     // 16px
  md: '1.5rem',   // 24px
  lg: '2rem',     // 32px
  xl: '3rem',     // 48px
  '2xl': '4rem',  // 64px
}
```

### **Container Width**

**File:** `/src/lib/design-system/components.tsx`

```typescript
export const Container: React.FC<ContainerProps> = ({ 
  children, 
  size = 'default',
  className 
}) => {
  const sizes = {
    sm: 'max-w-3xl',      // Small container (768px)
    default: 'max-w-7xl', // Default (1280px)
    lg: 'max-w-[1400px]', // Large (1400px)
    full: 'max-w-full',   // Full width
  }
  // ...
}
```

---

## 🎯 How to Add a New Component

### **Step 1: Add to `/src/lib/design-system/components.tsx`**

```typescript
// Example: Adding a Badge component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'info', 
  children,
  className,
  ...props 
}) => {
  const variants = {
    success: 'bg-primary-100 text-primary-700 border-primary-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

### **Step 2: Export It**

```typescript
// At the bottom of components.tsx
export { Badge }
```

### **Step 3: Use It Anywhere**

```typescript
import { Badge } from '@/lib/design-system/components'

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

---

## 📱 How to Update a Single Page

### **Example: Changing Dashboard Colors**

**File:** `/src/app/dashboard/page.tsx`

```typescript
// Change card backgrounds
<Card className="bg-neutral-800">  
//                ↑ Change this class
  
// Change text colors
<h2 className="text-primary-500">
//              ↑ Change to text-secondary-500, text-accent-500, etc.

// Change button variants
<Button variant="primary">    // or "secondary", "accent", "ghost"
<Button size="lg">            // or "sm", "md"
```

---

## 🎨 Common Changes Cheat Sheet

### **Change Button Color Globally**
```typescript
// File: /src/lib/design-system/components.tsx
primary: "bg-primary-500 hover:bg-primary-600"
//          ↑ Change these
```

### **Change Text Color Globally**
```typescript
// File: /src/lib/design-system/tokens.ts
primary: {
  500: '#199D67',  // ← Change this hex value
}
```

### **Change Card Background Globally**
```typescript
// File: /src/lib/design-system/components.tsx
<div className="bg-neutral-900 border border-neutral-800">
//              ↑ Change these classes
```

### **Change Container Width**
```typescript
// File: /src/lib/design-system/components.tsx
const sizes = {
  default: 'max-w-7xl',  // ← Change this (max-w-6xl, max-w-full, etc.)
}
```

### **Change Font Globally**
```typescript
// File: tailwind.config.ts
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  //     ↑ Add or change fonts here
}
```

---

## 🔍 Where to Find Things

| What You Want to Change | File Location |
|-------------------------|---------------|
| **Colors** | `/src/lib/design-system/tokens.ts` |
| **Buttons** | `/src/lib/design-system/components.tsx` |
| **Cards** | `/src/lib/design-system/components.tsx` |
| **Inputs** | `/src/lib/design-system/components.tsx` |
| **Spacing** | `/src/lib/design-system/tokens.ts` |
| **Typography** | `/src/lib/design-system/tokens.ts` |
| **Dashboard** | `/src/app/dashboard/page.tsx` |
| **Homepage** | `/src/app/page.tsx` |
| **Vision Pages** | `/src/app/vision/*.tsx` |
| **Auth Pages** | `/src/app/auth/*/page.tsx` |

---

## 🎯 Quick Tasks

### **Task: Make All Primary Buttons Larger**
1. Open `/src/lib/design-system/components.tsx`
2. Find the `Button` component
3. Change the `size` default: `size = 'lg'` (instead of `'md'`)
4. Done! All buttons are now larger by default

### **Task: Change the Success Color from Green to Blue**
1. Open `/src/lib/design-system/tokens.ts`
2. Change `primary: { 500: '#199D67' }` to `primary: { 500: '#3B82F6' }`
3. Done! All success states, CTAs, and primary elements are now blue

### **Task: Add More Spacing Between Cards**
1. Open the page with cards (e.g., `/src/app/dashboard/page.tsx`)
2. Find `<div className="grid gap-6">` 
3. Change to `gap-8` or `gap-10`
4. Done! More space between cards

### **Task: Make the Site Feel More Modern**
1. Open `/src/lib/design-system/components.tsx`
2. Find `Card` component
3. Add `backdrop-blur-lg bg-neutral-900/50` to the className
4. Cards now have a glassmorphism effect!

---

## 🚨 Important Rules

### **DO:**
✅ Make changes in `/src/lib/design-system/` for global updates  
✅ Use design system components (`Button`, `Card`, etc.) in all pages  
✅ Use color tokens (`text-primary-500`) instead of hard-coded colors  
✅ Test changes on multiple pages after updating the design system  

### **DON'T:**
❌ Hard-code colors in individual pages (use tokens instead)  
❌ Create custom buttons/cards when design system has them  
❌ Use Tailwind classes like `bg-[#199D67]` (use `bg-primary-500`)  
❌ Forget to check the design system preview at `/design-system`  

---

## 🎨 Design System Preview

**Visit:** `http://localhost:3000/design-system` (or `vibrationfit.com/design-system`)

This page shows:
- All colors with their values
- All button variants and sizes
- All card styles
- All input types
- Typography examples
- Spacing examples

**Use this page to:**
- See changes in real-time
- Test new components
- Share with designers
- Reference available options

---

## 💡 Pro Tips

### **Tip 1: Use VS Code Search**
Press `Cmd/Ctrl + Shift + F` and search for:
- `bg-primary-500` to find all uses of primary color
- `Button variant="primary"` to find all primary buttons
- `className="text-` to find all text color usage

### **Tip 2: Tailwind IntelliSense**
Install the "Tailwind CSS IntelliSense" VS Code extension for:
- Auto-complete for Tailwind classes
- Hover to see color previews
- Class name suggestions

### **Tip 3: Component Preview**
After making changes, run:
```bash
npm run dev
```
Then visit `/design-system` to see all components with your changes applied.

### **Tip 4: Git Branches for Experiments**
Before making big design changes:
```bash
git checkout -b design-experiment
# Make your changes
# If you like them: git merge into main
# If not: git checkout main (changes discarded)
```

---

## 📚 Resources

- **VibrationFit Brand Kit:** See `VibrationFit Brand Kit & Color Guidelines.html`
- **Product Brief:** See `PRODUCT_BRIEF.md`
- **Tailwind Docs:** https://tailwindcss.com/docs
- **React Docs:** https://react.dev

---

## 🆘 Troubleshooting

### **Problem: Changes Don't Appear**
1. Make sure dev server is running (`npm run dev`)
2. Hard refresh the browser (`Cmd/Ctrl + Shift + R`)
3. Clear browser cache
4. Restart dev server

### **Problem: Colors Look Wrong**
1. Check `/src/lib/design-system/tokens.ts` for correct hex values
2. Make sure you're using token names (e.g., `bg-primary-500`) not custom colors
3. Verify Tailwind config includes your custom colors

### **Problem: Component Doesn't Accept a Prop**
1. Check the TypeScript interface for that component
2. Look at examples in `/design-system` page
3. Check if you're using the correct prop name (e.g., `variant` not `type`)

---

**Last Updated:** October 2025  
**For Help:** Review this guide or check the design system preview page