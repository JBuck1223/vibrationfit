# Responsive Grid Unification Proposal

## Question: Can all layout components be replaced with one responsive Grid?

## Current Components Analysis

| Component | Implementation | Can Grid Replace? |
|-----------|---------------|-------------------|
| **Stack** | `flex flex-col` | ✅ Yes - Grid with `cols={1}` or flex mode |
| **Inline** | `flex flex-row` | ✅ Yes - Grid with `mode="flex"` or auto columns |
| **TwoColumn** | `flex-col md:flex-row` with 50/50 | ✅ Yes - Grid with `responsiveCols={{mobile: 1, desktop: 2}}` |
| **FourColumn** | `grid-cols-2 md:grid-cols-4` | ✅ Yes - Grid with `responsiveCols={{mobile: 2, desktop: 4}}` |
| **Switcher** | `flex-col md:flex-row` | ✅ Yes - Grid with `responsiveCols={{mobile: 1, desktop: 'auto'}}` |
| **Grid** | CSS Grid (current) | ✅ Base component |

## Proposed Unified Grid Component

```tsx
interface UnifiedGridProps {
  // Layout Mode
  mode?: 'grid' | 'flex-col' | 'flex-row'  // Default: 'grid'
  
  // Fixed Columns (current)
  cols?: number
  
  // Responsive Columns (new)
  responsiveCols?: {
    mobile?: number | 'auto'
    tablet?: number | 'auto'  
    desktop?: number | 'auto'
  }
  
  // Auto-fit (current)
  minWidth?: string
  
  // Flexbox-specific (when mode includes flex)
  direction?: 'row' | 'column'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  align?: 'start' | 'center' | 'end' | 'stretch'
  wrap?: boolean
  
  // Gap (existing)
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  
  // Children
  children: React.ReactNode
}
```

## Migration Examples

### Stack → Grid
```tsx
// Before
<Stack gap="md" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// After
<Grid mode="flex-col" gap="md" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Grid>
```

### Inline → Grid
```tsx
// Before
<Inline gap="sm" justify="between">
  <Button>Cancel</Button>
  <Button>Save</Button>
</Inline>

// After
<Grid mode="flex-row" gap="sm" justify="between">
  <Button>Cancel</Button>
  <Button>Save</Button>
</Grid>
```

### TwoColumn → Grid
```tsx
// Before
<TwoColumn gap="lg">
  <div>Left</div>
  <div>Right</div>
</TwoColumn>

// After
<Grid responsiveCols={{mobile: 1, desktop: 2}} gap="lg">
  <div>Left</div>
  <div>Right</div>
</Grid>
```

### FourColumn → Grid
```tsx
// Before
<FourColumn gap="md">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
  <Card>4</Card>
</FourColumn>

// After
<Grid responsiveCols={{mobile: 2, desktop: 4}} gap="md">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
  <Card>4</Card>
</Grid>
```

### Switcher → Grid
```tsx
// Before
<Switcher gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Switcher>

// After
<Grid responsiveCols={{mobile: 1, desktop: 'auto'}} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

## Benefits

1. ✅ **Single API** - One component to learn instead of 6
2. ✅ **Consistency** - All layouts use the same gap/align/justify props
3. ✅ **Flexibility** - Can handle any layout pattern
4. ✅ **Maintenance** - One component to maintain
5. ✅ **Less confusion** - No "which component should I use?"

## Considerations

### Potential Downsides

1. **Semantic clarity**
   - `<Stack>` is more readable than `<Grid mode="flex-col">`
   - `<TwoColumn>` clearly expresses intent

2. **Backward compatibility**
   - Breaking change for existing code
   - Migration effort required

3. **Complexity**
   - One component doing everything might be harder to understand
   - More props to learn

### Alternative: Keep Wrapper Components

Keep Stack, Inline, TwoColumn as **convenience wrappers** around Grid:

```tsx
// Stack is just a Grid preset
export const Stack = (props) => (
  <Grid mode="flex-col" {...props} />
)

// Inline is just a Grid preset  
export const Inline = (props) => (
  <Grid mode="flex-row" wrap {...props} />
)

// TwoColumn is just a Grid preset
export const TwoColumn = ({ reverse, ...props }) => (
  <Grid 
    responsiveCols={{mobile: 1, desktop: 2}}
    className={reverse ? 'flex-col-reverse md:flex-row-reverse' : ''}
    {...props} 
  />
)
```

This gives:
- ✅ Unified implementation (all use Grid internally)
- ✅ Semantic component names (Stack, Inline remain)
- ✅ Backward compatible (no breaking changes)
- ✅ Single source of truth

## Recommendation

**Option: Keep wrapper components but unify the implementation**

1. Make Grid the core engine
2. Have Stack, Inline, TwoColumn, etc. be thin wrappers
3. Deprecate Switcher and FourColumn (replace with Grid directly)
4. Document that all layouts use Grid under the hood

This gives the best of both worlds:
- ✅ Simpler implementation (one engine)
- ✅ Semantic clarity (nice component names)
- ✅ No breaking changes
- ✅ Easier maintenance

