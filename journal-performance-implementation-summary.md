# Journal Page Lightning-Fast Optimization

## Quick Wins (Do These First)

### 1. Pagination (Load 20 entries initially)
```typescript
// In src/app/journal/page.tsx
const [page, setPage] = useState(1)
const [hasMore, setHasMore] = useState(true)

async function fetchData(page = 1) {
  const supabase = createClient()
  const limit = 20
  const offset = (page - 1) * limit
  
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    
  return entries
}
```

### 2. Generate Thumbnails on Upload
When user uploads to `/journal/uploads/`, add to upload route:
```typescript
// In src/app/api/upload/route.ts
if (file.type.startsWith('image/')) {
  // Generate thumbnail
  const thumbnail = await sharp(buffer)
    .resize(400, 300, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()
  
  // Upload thumbnail
  const thumbKey = `${s3Key.replace(/\.(jpg|jpeg|png)$/, '')}-thumb.webp`
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: thumbKey,
    Body: thumbnail,
    ContentType: 'image/webp'
  }))
}
```

### 3. Use Thumbnails in Display
```typescript
// Convert full image URL to thumbnail
const getThumbnail = (url: string) => {
  if (url.includes('thumb.webp')) return url
  return url.replace(/\.(jpg|jpeg|png)$/, '-thumb.webp')
}

// Use in JSX
<Image src={getThumbnail(imageUrl)} />
```

### 4. Lazy Load Images
Already created `LazyJournalImage.tsx` - replace regular images with:
```tsx
<LazyJournalImage 
  src={getThumbnail(imageUrl)}
  alt="Journal image"
  width={200}
  height={200}
/>
```

## Implementation Steps

### Step 1: Add Pagination (5 min)
1. Add `page` and `hasMore` state
2. Update `fetchData` to use `.range()`
3. Add "Load More" button

### Step 2: Generate Thumbnails (10 min)
1. Update upload route to generate thumbnails
2. Upload both original and thumbnail to S3
3. Store both URLs in database

### Step 3: Lazy Load Images (5 min)
1. Import `LazyJournalImage` component
2. Replace regular `<Image>` with `<LazyJournalImage>`
3. Done!

## Expected Performance
- **Initial load**: 200ms (only 20 entries)
- **Images**: Load only when scrolled into view
- **Thumbnails**: 50KB vs 500KB for full images
- **Total page weight**: <500KB vs 5MB+ before

## Bonus: Infinite Scroll
Add when user scrolls near bottom:
```typescript
const loadMoreEntries = () => {
  if (!loading && hasMore) {
    setPage(page + 1)
  }
}

useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMoreEntries()
    }
  }
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [page, loading, hasMore])
```

