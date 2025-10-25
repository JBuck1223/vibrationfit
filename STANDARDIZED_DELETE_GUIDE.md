# Standardized Delete & Action Components Guide

This guide shows how to implement the standardized delete functionality and action buttons across your entire VibrationFit site.

## 🎯 Components Created

### 1. `DeleteConfirmationDialog` Component
**Location**: `src/components/DeleteConfirmationDialog.tsx`

A beautiful, reusable delete confirmation popup that matches your design system.

**Features**:
- Consistent visual design across all pages
- Customizable item type ("Creation", "Item", "Entry", etc.)
- Loading states with disabled buttons
- Proper accessibility and keyboard navigation

### 2. `ActionButtons` Component  
**Location**: `src/components/ActionButtons.tsx`

Standardized View/Delete button pair for list cards.

**Features**:
- Consistent styling and behavior
- Responsive design (full-width on mobile, inline on desktop)
- Customizable variants and sizes
- Optional labels for icon-only buttons

### 3. `useDeleteItem` Hook
**Location**: `src/hooks/useDeleteItem.ts`

Reusable logic for handling delete operations.

**Features**:
- Complete delete workflow (S3 cleanup + database deletion)
- User stats updates
- Error handling and success callbacks
- Loading states and confirmation management

## 🚀 Implementation Guide

### Step 1: Import Components

```tsx
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'
import { ActionButtons } from '@/components/ActionButtons'
import { useDeleteItem } from '@/hooks/useDeleteItem'
```

### Step 2: Replace Delete State with Hook

**Before**:
```tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
const [deleting, setDeleting] = useState(false)
const [itemToDelete, setItemToDelete] = useState<any>(null)
```

**After**:
```tsx
const {
  showDeleteConfirm,
  deleting,
  itemToDelete,
  initiateDelete,
  confirmDelete,
  cancelDelete
} = useDeleteItem({
  onSuccess: () => {
    // Update local state to remove deleted item
    setItems(prevItems => prevItems.filter(i => i.id !== itemToDelete?.id))
  },
  onError: (error) => {
    alert(`Failed to delete item: ${error.message}`)
  },
  itemType: 'Creation' // or 'Item', 'Entry', etc.
})
```

### Step 3: Replace Delete Functions

**Before**:
```tsx
const handleDeleteItem = async (itemId: string) => {
  if (!confirm('Are you sure?')) return
  // ... complex delete logic
}
```

**After**:
```tsx
const handleDeleteItem = (itemId: string) => {
  const item = items.find(i => i.id === itemId)
  if (item) {
    initiateDelete(item)
  }
}
```

### Step 4: Replace Action Buttons

**Before**:
```tsx
<div className="flex gap-2">
  <Button asChild>
    <Link href={`/item/${item.id}`}>View</Link>
  </Button>
  <Button variant="danger" onClick={() => handleDelete(item.id)}>
    Delete
  </Button>
</div>
```

**After**:
```tsx
<ActionButtons
  viewHref={`/item/${item.id}`}
  onDelete={() => handleDeleteItem(item.id)}
  size="sm"
  variant="ghost"
  deleteVariant="danger"
/>
```

### Step 5: Replace Delete Dialog

**Before**:
```tsx
{showDeleteConfirm && (
  <div className="fixed inset-0 bg-black/50...">
    {/* Complex dialog JSX */}
  </div>
)}
```

**After**:
```tsx
<DeleteConfirmationDialog
  isOpen={showDeleteConfirm}
  onClose={cancelDelete}
  onConfirm={confirmDelete}
  itemName={itemToDelete?.name || ''}
  itemType="Creation"
  isLoading={deleting}
  loadingText="Deleting..."
/>
```

## 📱 Pages to Update

### High Priority (Most Used)
1. **`/vision-board`** ✅ Already updated
2. **`/vision-board/gallery`** - Image gallery cards
3. **`/life-vision`** - Vision version cards
4. **`/journal`** - Journal entry cards

### Medium Priority
5. **`/profile`** - Any deletable items
6. **Admin pages** - Any management interfaces

### Low Priority
7. **Other list views** - As they're created

## 🎨 Customization Options

### DeleteConfirmationDialog Props
```tsx
interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType?: string // "Creation", "Item", "Entry", etc.
  isLoading?: boolean
  loadingText?: string // "Deleting...", "Removing...", etc.
}
```

### ActionButtons Props
```tsx
interface ActionButtonsProps {
  viewHref: string
  onDelete: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  className?: string
  showLabels?: boolean // Hide text labels for icon-only buttons
  deleteVariant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
}
```

### useDeleteItem Options
```tsx
interface UseDeleteItemOptions {
  onSuccess?: () => void // Called after successful deletion
  onError?: (error: Error) => void // Called on deletion failure
  itemType?: string // For logging/debugging
}
```

## 🔧 Advanced Usage

### Custom Delete Logic
If you need custom delete logic (different table, different cleanup), you can still use the dialog and buttons but provide your own delete function:

```tsx
const customDelete = async (item: any) => {
  // Your custom delete logic
  await customDeleteFunction(item)
}

const {
  showDeleteConfirm,
  deleting,
  itemToDelete,
  initiateDelete,
  confirmDelete: originalConfirmDelete,
  cancelDelete
} = useDeleteItem({
  onSuccess: () => setItems(prev => prev.filter(i => i.id !== itemToDelete?.id))
})

const confirmDelete = async () => {
  if (!itemToDelete) return
  setDeleting(true)
  try {
    await customDelete(itemToDelete)
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setDeleting(false)
    setShowDeleteConfirm(false)
    setItemToDelete(null)
  }
}
```

### Icon-Only Buttons
For compact layouts, hide labels:

```tsx
<ActionButtons
  viewHref={`/item/${item.id}`}
  onDelete={() => handleDeleteItem(item.id)}
  showLabels={false}
  size="sm"
/>
```

## ✅ Benefits

1. **Consistency**: Same look and feel across all pages
2. **Maintainability**: Update once, applies everywhere
3. **Accessibility**: Built-in keyboard navigation and ARIA labels
4. **Mobile-First**: Responsive design that works on all devices
5. **Error Handling**: Consistent error handling and user feedback
6. **Performance**: Optimized with proper loading states

## 🚀 Next Steps

1. **Test the current implementation** on `/vision-board`
2. **Update `/vision-board/gallery`** next (similar structure)
3. **Create a migration checklist** for other pages
4. **Document any custom variations** needed for specific pages

This standardization will make your entire site feel cohesive and professional! 🎉
