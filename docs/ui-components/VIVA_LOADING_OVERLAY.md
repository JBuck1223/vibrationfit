# VIVALoadingOverlay Component

**Last Updated:** December 17, 2024  
**Component Location:** `@/lib/design-system/components`  
**Status:** ✅ Production Ready

---

## Overview

The `VIVALoadingOverlay` is a beautiful, branded full-screen loading overlay that displays when VIVA is processing AI operations. It features:

- ✅ VibrationFit branded spinner with logo
- ✅ Cycling animated messages
- ✅ Three bouncing dots (primary, secondary, accent colors)
- ✅ Gradient progress bar
- ✅ Estimated time display
- ✅ Backdrop blur effect
- ✅ Mobile-responsive
- ✅ Customizable messages and cycle duration

---

## Basic Usage

```tsx
import { VIVALoadingOverlay } from '@/lib/design-system/components'

export default function MyPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  
  return (
    <div className="relative">
      {/* Your content */}
      <Card>
        <Button onClick={() => setIsProcessing(true)}>
          Process with VIVA
        </Button>
      </Card>
      
      {/* Loading overlay */}
      <VIVALoadingOverlay isVisible={isProcessing} />
    </div>
  )
}
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | `boolean` | **required** | Controls overlay visibility |
| `messages` | `string[]` | See below | Array of messages to cycle through |
| `cycleDuration` | `number` | `3000` | Milliseconds between message changes |
| `estimatedTime` | `string` | `"This usually takes 15-30 seconds"` | Time estimate shown to user |
| `showProgressBar` | `boolean` | `true` | Whether to show the gradient progress bar |
| `size` | `'sm' \| 'md' \| 'lg'` | `'lg'` | Size of spinner and text |
| `progress` | `number` | `undefined` | Manual progress value (0-100). If provided, overrides auto-calculation |
| `estimatedDuration` | `number` | `undefined` | Estimated duration in milliseconds. Enables auto-progress calculation |
| `className` | `string` | `''` | Additional CSS classes |

### Default Messages

```typescript
[
  "VIVA is bringing your vision to life...",
  "Crafting your perfect experience...",
  "Channeling creative energy...",
  "Putting finishing touches..."
]
```

**Message Cycling Behavior:**
- Messages cycle through **once** at the specified `cycleDuration` interval
- The **final message stays on screen** until completion
- Example: With 4 messages at 4000ms each = 12 seconds of cycling, then final message holds
- Adjust timing by changing number of messages or `cycleDuration`

---

## Examples

### Custom Messages

```tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  messages={[
    "VIVA is merging your clarity statements...",
    "Weaving together your insights...",
    "Creating your unified vision...",
    "Putting finishing touches..."
  ]}
  cycleDuration={4000}
  estimatedTime="Usually takes 10-20 seconds"
/>
```

### Fast Cycling Messages

```tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  messages={[
    "Analyzing your input...",
    "Generating blueprint...",
    "Finalizing..."
  ]}
  cycleDuration={2000} // 2 seconds per message
/>
```

### Without Progress Bar

```tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  showProgressBar={false}
  estimatedTime="Just a moment..."
/>
```

### Smaller Size (for embedded contexts)

```tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  size="sm"
  messages={["Processing..."]}
/>
```

### With Real Progress Tracking

```tsx
const [isProcessing, setIsProcessing] = useState(false)
const [progress, setProgress] = useState(0)

const handleProcess = async () => {
  setIsProcessing(true)
  setProgress(0)
  
  try {
    const response = await fetch('/api/viva/process', {...})
    
    // API completed - slide to 100%
    setProgress(100)
    
    // Wait briefly to show completion, then hide
    await new Promise(resolve => setTimeout(resolve, 600))
  } finally {
    setIsProcessing(false)
    setProgress(0)
  }
}

return (
  <VIVALoadingOverlay
    isVisible={isProcessing}
    progress={progress}
    estimatedDuration={15000} // 15 seconds
    messages={["Processing your data..."]}
  />
)
```

### Auto-Calculating Progress

```tsx
// Progress bar fills automatically based on estimatedDuration
<VIVALoadingOverlay
  isVisible={isProcessing}
  estimatedDuration={20000} // 20 seconds
  messages={["Generating blueprint..."]}
/>

// Progress will automatically:
// - Start at 0% when overlay appears
// - Fill to 95% over 20 seconds
// - Complete to 100% when you set progress={100}
```

---

## Use Cases in Life Vision Flow

### Step 1: Clarity (Merge Clarity)

```tsx
// /life-vision/new/category/[key]/page.tsx
const [vivaProgress, setVivaProgress] = useState(0)

const handleProcessWithVIVA = async () => {
  setIsProcessing(true)
  setVivaProgress(0)
  
  try {
    const response = await fetch('/api/viva/merge-clarity', {
      method: 'POST',
      body: JSON.stringify({...})
    })
    
    // API complete - slide to 100%
    setVivaProgress(100)
    
    // ... handle response
    
    // Wait briefly to show 100% completion
    await new Promise(resolve => setTimeout(resolve, 600))
  } finally {
    setIsProcessing(false)
    setVivaProgress(0)
  }
}

return (
  <Container size="xl">
    <Stack gap="lg">
      {/* Your content */}
      
      <VIVALoadingOverlay
        isVisible={isProcessing}
        messages={[
          "VIVA is merging your clarity statements...",
          "Weaving together your insights...",
          "Creating your unified vision..."
        ]}
        cycleDuration={4000}
        estimatedTime="Usually takes 10-20 seconds"
        estimatedDuration={15000}
        progress={vivaProgress}
      />
    </Stack>
  </Container>
)
```

### Step 3: Blueprint Generation

```tsx
// /life-vision/new/category/[key]/blueprint/page.tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  messages={[
    "VIVA is analyzing your ideal state...",
    "Generating Being/Doing/Receiving loops...",
    "Crafting your personalized blueprint..."
  ]}
  cycleDuration={4000}
  estimatedTime="Usually takes 15-25 seconds"
  estimatedDuration={20000}
  progress={vivaProgress}
/>
```

### Step 4: Scene Generation

```tsx
// /life-vision/new/category/[key]/scenes/page.tsx
<VIVALoadingOverlay
  isVisible={isGenerating}
  messages={[
    "VIVA is creating your visualization scenes...",
    "Painting vivid pictures of your vision...",
    "Weaving sensory details into reality..."
  ]}
  estimatedTime="Usually takes 20-30 seconds"
/>
```

### Step 5: Master Vision Assembly

```tsx
// /life-vision/new/assembly/page.tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  messages={[
    "VIVA is assembling your complete vision...",
    "Weaving together all 12 life categories...",
    "Creating unified vibrational alignment...",
    "Polishing your master vision document..."
  ]}
  cycleDuration={4000} // Slower for longer process
  estimatedTime="Usually takes 30-45 seconds"
/>
```

### Step 6: Final Polish (Forward/Conclusion)

```tsx
// /life-vision/new/final/page.tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  messages={[
    "VIVA is crafting your opening and closing...",
    "Setting the perfect tone for your vision...",
    "Creating your activation message..."
  ]}
  estimatedTime="Usually takes 15-20 seconds"
/>
```

---

## Design Details

### Visual Features

- **Backdrop**: `bg-black/80` with `backdrop-blur-sm`
- **Spinner**: Branded VibrationFit logo spinner
- **Bouncing Dots**: 
  - Primary green (`#199D67`)
  - Secondary teal (`#14B8A6`)
  - Accent purple (`#8B5CF6`)
- **Progress Bar**: Gradient from primary → secondary → accent
- **Typography**: Responsive text sizes (lg on desktop, base on mobile)

### Accessibility

- ✅ High contrast text on dark background
- ✅ Semantic HTML
- ✅ Screen reader friendly (overlay announces processing state)
- ✅ Prevents interaction with underlying content via z-index

### Performance

- ✅ Only renders when `isVisible={true}`
- ✅ Resets message index when overlay appears
- ✅ Cleans up interval on unmount
- ✅ No layout shift (absolute positioning)

### Progress Bar Behavior

The progress bar has three modes:

1. **Auto-Progress Mode** (when `estimatedDuration` is provided):
   - Starts at **0%** when overlay appears
   - Fills smoothly to **95%** over the estimated duration using **easeOutCubic** easing
   - **Easing behavior**: Moves quickly at first, then slows down toward the end (feels like continuous steady progress)
   - Stops at 95% to indicate waiting for completion
   - When you set `progress={100}`, slides to 100%
   - Uses smooth 500ms CSS transitions with 50ms update intervals
   - **Works even when `progress` prop is passed** (as long as `progress < 100`)

2. **Manual Progress Mode** (when `progress` prop is provided):
   - Displays exact progress value you provide (0-100)
   - Updates smoothly with CSS transitions
   - Overrides auto-calculation
   - Still maintains 5% minimum width for visibility (except at 100%)

3. **No Progress Mode** (default, neither prop provided):
   - Shows animated pulsing gradient bar
   - No percentage tracking
   - Purely visual loading indicator

**Why easeOutCubic?**  
The easing curve makes the bar move **fast initially** (50% progress in first ~20% of time), then **gradually slows** as it approaches 95%. This creates the perception of continuous steady progress throughout the entire operation, rather than feeling slow at the end.

**How auto-progress works with manual override:**
- Auto-progress runs continuously from 0% → 95%
- When your API completes, set `progress={100}` to override and slide to completion
- The progress bar always has a **fixed 320px width** (`w-80`) that never changes regardless of text length

**Recommended Pattern:**
```tsx
// Use estimatedDuration for auto-progress
// Set progress={100} when API completes
// Wait 600ms to show completion animation
// Then hide overlay

setVivaProgress(100)
await new Promise(resolve => setTimeout(resolve, 600))
setIsProcessing(false)
```

---

## Migration from VIVAActionCard

### Before (Old Pattern)

```tsx
{isProcessing && vivaStage && (
  <VIVAActionCard stage={vivaStage} message={vivaMessage} />
)}
```

### After (New Pattern)

```tsx
<VIVALoadingOverlay
  isVisible={isProcessing}
  messages={[
    "VIVA is processing...",
    "Creating your vision...",
    "Almost done..."
  ]}
/>
```

**Benefits of Migration:**
1. ✅ More polished UI (full overlay vs inline card)
2. ✅ Better UX (blocks interaction during processing)
3. ✅ Consistent branding across all flows
4. ✅ Animated cycling messages
5. ✅ Progress indication

---

## Related Components

- `Spinner` - Standalone spinner (used inside overlay)
- `Modal` - For dialogs and confirmations
- `Card` - For content containers

---

## Files Modified

- ✅ `src/lib/design-system/components.tsx` - Added component
- ✅ `src/lib/design-system/index.ts` - Exported component
- ✅ `docs/ui-components/VIVA_LOADING_OVERLAY.md` - This file

---

## Questions?

Refer to:
- **Design System Guide**: `docs/design-system/VibrationFit Design System Guide.md`
- **Brand Kit**: `vibrationfit-brand-kit.html`
- **Component Source**: `src/lib/design-system/components.tsx` (search for `VIVALoadingOverlay`)

---

**Ready to use in production!** 🚀

