# FileUpload Component Documentation

**Last Updated:** November 19, 2025  
**Status:** Active  
**Component Path:** `src/components/FileUpload.tsx`  
**Examples:** `src/components/FileUpload.examples.tsx`

## Overview

The `FileUpload` component is a fully-featured file upload component with support for drag-and-drop, progress tracking, validation, and multiple UI modes. It can work as both a controlled and uncontrolled component.

## Key Features

✅ **Drag and Drop Support** - Beautiful drag-and-drop zone with visual feedback  
✅ **Upload Progress** - Built-in progress bar for upload tracking  
✅ **File Validation** - Size, type, and count validation  
✅ **Controlled/Uncontrolled** - Works both ways for flexibility  
✅ **Multiple UI Modes** - Button, drag-drop zone, or custom trigger  
✅ **Rich Previews** - Image, video, and audio file previews  
✅ **Custom Styling** - Extensive customization options  
✅ **Loading States** - Built-in loading indicators  
✅ **Error Handling** - Clear error messaging  

## Basic Usage

```tsx
import { FileUpload } from '@/components/FileUpload'

function MyComponent() {
  const handleUpload = (files: File[]) => {
    // Handle file upload
    console.log('Selected files:', files)
  }

  return (
    <FileUpload
      accept="image/*"
      multiple
      maxFiles={5}
      maxSize={10}
      onUpload={handleUpload}
      label="Upload Images"
    />
  )
}
```

## Props API

### Core Props (Backward Compatible)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accept` | `string` | `'image/*'` | File type filter (e.g., `"image/*"`, `"video/*"`, `".pdf,.doc"`) |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `maxFiles` | `number` | `5` | Maximum number of files allowed |
| `maxSize` | `number` | `500` | Maximum file size in MB |
| `onUpload` | `(files: File[]) => void` | **Required** | Callback when files are selected |
| `disabled` | `boolean` | `false` | Disable the upload component |
| `label` | `string` | `'Upload Files'` | Button label text |

### Enhanced Features

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dragDrop` | `boolean` | `false` | Enable drag-and-drop zone |
| `showProgress` | `boolean` | `false` | Show upload progress bar |
| `uploadProgress` | `number` | `0` | Progress value (0-100) |
| `isUploading` | `boolean` | `false` | Show uploading state |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'outline'` | `'secondary'` | Button style variant |
| `customTrigger` | `React.ReactNode` | `undefined` | Custom trigger element |

### Controlled Component Mode

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `File[]` | `undefined` | Controlled files array |
| `onChange` | `(files: File[]) => void` | `undefined` | Controlled change handler |

### Preview Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showPreviews` | `boolean` | `true` | Show file previews |
| `previewSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Preview thumbnail size |

### Styling

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Wrapper className |
| `dropZoneClassName` | `string` | `''` | Drop zone className |

### Custom Messages

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dragDropText` | `string` | `'Click to upload or drag and drop'` | Main drag-drop text |
| `dragDropSubtext` | `string` | `undefined` | Secondary drag-drop text |

## Usage Patterns

### 1. Drag and Drop Zone

Perfect for vision board, journal entries, or any feature where users upload media files.

```tsx
<FileUpload
  dragDrop
  accept="image/*,video/*"
  multiple
  maxFiles={10}
  maxSize={50}
  onUpload={handleUpload}
  dragDropText="Drop your files here or click to browse"
  dragDropSubtext="Supports images and videos up to 50MB"
/>
```

### 2. With Upload Progress

Show real-time upload progress to users.

```tsx
const [progress, setProgress] = useState(0)
const [uploading, setUploading] = useState(false)

const handleUpload = async (files: File[]) => {
  setUploading(true)
  // Your upload logic with progress tracking
  setProgress(50) // Update as needed
}

return (
  <FileUpload
    accept="image/*"
    onUpload={handleUpload}
    showProgress
    uploadProgress={progress}
    isUploading={uploading}
  />
)
```

### 3. Controlled Component

For complex forms or state management needs.

```tsx
const [files, setFiles] = useState<File[]>([])

return (
  <FileUpload
    value={files}
    onChange={setFiles}
    onUpload={async (files) => {
      // Upload logic
      await uploadToS3(files)
    }}
    accept="image/*"
    multiple
  />
)
```

### 4. Custom Trigger Button

Use your own button or UI element.

```tsx
<FileUpload
  accept="image/*"
  onUpload={handleUpload}
  customTrigger={
    <Button variant="primary" size="lg">
      <Sparkles className="w-5 h-5 mr-2" />
      Choose Your Photos
    </Button>
  }
/>
```

### 5. Single File Upload (Vision Board Style)

```tsx
const [file, setFile] = useState<File | null>(null)

return (
  <FileUpload
    dragDrop
    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
    multiple={false}
    maxFiles={1}
    maxSize={10}
    value={file ? [file] : []}
    onChange={(files) => setFile(files[0] || null)}
    onUpload={handleUpload}
    dragDropText="Click to upload or drag and drop"
    dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
    previewSize="lg"
  />
)
```

## Validation

The component automatically validates:

1. **File count** - Ensures `files.length <= maxFiles`
2. **File size** - Ensures each file is under `maxSize` MB
3. **File type** - Validates against `accept` prop
4. **Single file mode** - When `multiple={false}`, only accepts one file

Validation errors are displayed in a styled error box below the upload area.

## File Type Patterns

Common `accept` values:

```tsx
// Images only
accept="image/*"

// Specific image formats
accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"

// Videos only
accept="video/*"

// Audio only
accept="audio/*"

// Multiple media types
accept="image/*,video/*,audio/*"

// Documents
accept=".pdf,.doc,.docx"

// Any file
accept="*"
```

## Styling & Customization

### Custom Wrapper Styling

```tsx
<FileUpload
  className="my-8 max-w-md mx-auto"
  // ... other props
/>
```

### Custom Drop Zone Styling

```tsx
<FileUpload
  dragDrop
  dropZoneClassName="border-purple-500 hover:border-purple-400 bg-purple-900/10"
  // ... other props
/>
```

### Preview Sizes

- `sm` - 40x40px (compact lists)
- `md` - 48x48px (default, balanced)
- `lg` - 64x64px (featured uploads)

## Integration Examples

### Journal Entry Integration

```tsx
const [files, setFiles] = useState<File[]>([])
const [uploading, setUploading] = useState(false)
const [progress, setProgress] = useState(0)

const handleUpload = async (newFiles: File[]) => {
  setUploading(true)
  try {
    const urls = await uploadMultipleUserFiles(
      newFiles,
      'journal',
      (p) => setProgress(p)
    )
    console.log('Uploaded:', urls)
  } finally {
    setUploading(false)
  }
}

return (
  <FileUpload
    dragDrop
    accept="image/*,video/*,audio/*"
    multiple
    maxFiles={10}
    maxSize={100}
    value={files}
    onChange={setFiles}
    onUpload={handleUpload}
    showProgress
    uploadProgress={progress}
    isUploading={uploading}
    dragDropText="Upload images, videos, or audio files"
    dragDropSubtext="Up to 10 files, max 100MB each"
  />
)
```

### Vision Board Integration

```tsx
const [file, setFile] = useState<File | null>(null)

const handleUpload = async (files: File[]) => {
  if (files[0]) {
    const url = await uploadUserFile(files[0], 'vision-board')
    setFormData(prev => ({ ...prev, image_url: url }))
  }
}

return (
  <FileUpload
    dragDrop
    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
    multiple={false}
    maxFiles={1}
    maxSize={10}
    value={file ? [file] : []}
    onChange={(files) => setFile(files[0] || null)}
    onUpload={handleUpload}
    previewSize="lg"
  />
)
```

## Accessibility

- ✅ Keyboard accessible (click trigger focuses hidden input)
- ✅ Screen reader friendly (semantic HTML)
- ✅ Clear error messages
- ✅ Visual feedback for drag states
- ✅ Disabled state support

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Drag and drop API supported
- ✅ File API supported
- ⚠️ HEIC/HEIF format support varies by browser

## Migration Guide

### From Native Input to FileUpload

**Before:**
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }}
  className="hidden"
/>
<button onClick={() => fileInputRef.current?.click()}>
  Upload
</button>
```

**After:**
```tsx
<FileUpload
  accept="image/*"
  multiple
  maxFiles={5}
  maxSize={10}
  onUpload={handleFiles}
  label="Upload"
/>
```

### From Custom Drag-Drop to FileUpload

**Before:**
```tsx
<div
  onClick={() => inputRef.current?.click()}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  className="border-2 border-dashed..."
>
  Drop files here
</div>
<input ref={inputRef} type="file" className="hidden" />
```

**After:**
```tsx
<FileUpload
  dragDrop
  onUpload={handleFiles}
  dragDropText="Drop files here"
/>
```

## Performance Considerations

1. **File Preview URLs** - Component automatically creates object URLs for previews. These are cleaned up when files are removed.

2. **Large File Validation** - Validation happens synchronously before upload, preventing unnecessary network requests.

3. **Controlled Mode** - When using controlled mode, ensure you're not causing unnecessary re-renders by memoizing callbacks.

```tsx
const handleChange = useCallback((files: File[]) => {
  setFiles(files)
}, [])
```

## Known Limitations

1. **HEIC/HEIF Support** - Browser support varies. Consider using a conversion library for universal support.

2. **Progress Tracking** - The component displays progress but doesn't track uploads internally. You must manage upload logic and progress externally.

3. **File Type Validation** - Client-side only. Always validate on server.

## Related Components

- `UploadProgress` - Standalone progress indicator
- `AIImageGenerator` - AI image generation (complementary to upload)
- `RecordingTextarea` - Audio recording component

## See Also

- [S3 Storage Presigned URLs](/docs/storage/S3_PRESIGNED_URLS.md)
- [Upload Progress Component](/docs/ui-components/UPLOAD_PROGRESS.md)
- [Vision Board Implementation](/docs/features/VISION_BOARD.md)
- [Journal Entry System](/docs/features/JOURNAL_SYSTEM.md)



