# Journal Page Performance Optimization

## Current Issues
- Loading all entries at once (`SELECT *` without limit)
- Loading full-size images immediately
- No pagination
- Blocks UI until all data is fetched

## Solutions

### 1. Pagination (Load 20 entries at a time)
```typescript
// Initial load
SELECT * FROM journal_entries 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20 
OFFSET 0

// Next page
LIMIT 20 OFFSET 20
```

### 2. Generate Thumbnails on Upload
When a file is uploaded to `/journal/uploads/`, generate:
- Original: `/user-uploads/{userId}/journal/uploads/{filename}.{ext}`
- Thumbnail: `/user-uploads/{userId}/journal/uploads/thumbnails/{filename}-thumb.webp`
- Size: 400x300px, WebP format for fast loading

### 3. Lazy Load Images
Use Intersection Observer to load images only when they're about to be visible:
```typescript
const imgRef = useRef()
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        // Load full image
        setLoadFullImage(true)
      }
    },
    { threshold: 0.1 }
  )
  observer.observe(imgRef.current)
}, [])
```

### 4. Skeleton Loaders
Show placeholders while content loads:
```tsx
<Card>
  <div className="animate-pulse">
    <div className="h-32 bg-gray-700 rounded mb-4" />
    <div className="h-6 bg-gray-700 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-700 rounded w-full" />
  </div>
</Card>
```

### 5. Virtual Scrolling (For 100+ entries)
Use `react-window` or `react-virtual` to only render visible items:
```tsx
import { FixedSizeList } from 'react-window'
```

## Implementation Order
1. ✅ Add pagination (loads 20 entries initially)
2. ✅ Implement lazy loading with Intersection Observer
3. ✅ Add skeleton loaders
4. ⏳ Generate thumbnails on upload
5. ⏳ Virtual scrolling for large lists

