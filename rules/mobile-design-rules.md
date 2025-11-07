# Mobile-First Design Rules for VibrationFit

## 🚨 CRITICAL MOBILE RULES - NEVER VIOLATE THESE 🚨

### **RULE #1: NO OFF-SCREEN FLOW**
- **NEVER** allow any component or element to flow off-screen on mobile
- **ALWAYS** ensure all content fits within mobile viewport (320px+)
- **ALWAYS** use `overflow-hidden` or `truncate` to prevent overflow
- **ALWAYS** test on smallest mobile screens

### **RULE #2: MOBILE-FIRST USER EXPERIENCE**
- **ALWAYS** prioritize mobile user experience over desktop
- **ALWAYS** use mobile-optimized button sizes (`size="sm"`)
- **ALWAYS** use mobile-friendly text sizes (`text-sm`, `text-xs`)
- **ALWAYS** ensure touch targets are at least 44px (iOS) / 48px (Android)

### **RULE #3: INTELLIGENT RESPONSIVE GRIDS**
- **ALWAYS** use responsive grids: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **ALWAYS** start with single column on mobile
- **ALWAYS** use proper gap spacing: `gap-4 md:gap-6`
- **ALWAYS** ensure cards stack vertically on mobile

## MANDATORY RULES - Follow These ALWAYS

### 1. Card Layout Rules
- **NEVER** use fixed widths or heights on cards
- **ALWAYS** use responsive grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **ALWAYS** ensure cards stack vertically on mobile
- **ALWAYS** use `gap-4` or `gap-6` for proper spacing

### 2. Button Rules
- **ALWAYS** use `size="sm"` for mobile-friendly buttons
- **ALWAYS** ensure buttons don't overflow containers
- **ALWAYS** use `flex-1` for equal-width buttons in rows
- **ALWAYS** stack buttons vertically on mobile when needed

### 3. Text and Content Rules
- **ALWAYS** use responsive text: `text-sm md:text-base` or `text-xs md:text-sm`
- **ALWAYS** truncate long text: `truncate` or `line-clamp-2`
- **ALWAYS** ensure content fits in mobile viewport

### 4. Icon Rules
- **ALWAYS** use `size="sm"` for icons in buttons
- **ALWAYS** ensure icons don't break button layouts
- **ALWAYS** test icon + text combinations on mobile

### 5. Container Rules
- **ALWAYS** use `Container` with proper sizing (`size="xl"` for standard pages)
- **NEVER** add padding to Container (PageLayout provides padding automatically)
- **ALWAYS** ensure content doesn't touch screen edges (PageLayout handles this)

### 6. Stack/Flex Rules
- **ALWAYS** use responsive flex direction: `flex-col md:flex-row`
- **ALWAYS** ensure items wrap properly: `flex-wrap`
- **ALWAYS** use proper gap spacing: `gap-2 md:gap-4`
- **PREFERENCE**: For ActionButtons - buttons should fit side-by-side on mobile when they fit, use `flex-row flex-wrap` to allow wrapping only when necessary (prevents overflow while maximizing horizontal space usage)

## MOBILE TESTING CHECKLIST
Before considering any component "complete":
- [ ] **CRITICAL: No elements flow off-screen on mobile**
- [ ] **CRITICAL: Mobile user experience is optimized (buttons, text)**
- [ ] **CRITICAL: Intelligent responsive grid implemented**
- [ ] Cards stack vertically on mobile
- [ ] Buttons fit within their containers
- [ ] Text doesn't overflow
- [ ] Icons are appropriately sized
- [ ] Content has proper margins/padding
- [ ] Grid layouts work on small screens
- [ ] No horizontal scrolling
- [ ] Touch targets are at least 44px

## COMMON MOBILE ANTI-PATTERNS TO AVOID
- ❌ Fixed widths without responsive variants
- ❌ Horizontal layouts that don't stack on mobile
- ❌ Buttons that overflow containers
- ❌ Text that doesn't truncate
- ❌ Icons that are too large for mobile
- ❌ Cards that don't stack properly
- ❌ Content that touches screen edges

## RESPONSIVE BREAKPOINTS TO USE
- Mobile: Default (no prefix)
- Tablet: `sm:` (640px+)
- Desktop: `md:` (768px+)
- Large: `lg:` (1024px+)

## EXAMPLE MOBILE-FIRST CARD
```tsx
<Card hover className="overflow-hidden">
  <Stack gap="sm">
    {/* Image - responsive aspect ratio */}
    <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800">
      <img className="w-full h-full object-cover" />
    </div>
    
    {/* Content - responsive text */}
    <div className="px-2">
      <h3 className="text-sm md:text-base font-semibold text-white truncate">
        Title
      </h3>
      <p className="text-xs text-neutral-400 line-clamp-2">
        Description
      </p>
    </div>
    
    {/* Actions - responsive buttons */}
    <div className="px-2 pb-2">
      <div className="flex gap-2">
        <Button size="sm" className="flex-1">
          <Icon icon={Plus} size="sm" />
          Action
        </Button>
        <Button variant="danger" size="sm" className="px-3">
          <Icon icon={Trash2} size="sm" />
        </Button>
      </div>
    </div>
  </Stack>
</Card>
```

## ENFORCEMENT
- **ALWAYS** read these rules before building any component
- **ALWAYS** verify mobile layout before considering complete
- **ALWAYS** use responsive classes and mobile-first approach
- **NEVER** assume components are mobile-ready without verification
