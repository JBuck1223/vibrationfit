# PDF Generation Architecture

## Overview

The PDF generation system uses **jsPDF** to create beautiful, template-based PDFs directly from your data (no HTML rendering, no canvas capture). It's fast and produces clean output.

## File Structure

```
src/lib/pdf/
├── index.ts                          # Main exports (entry point)
├── generators/
│   ├── base.ts                       # Base utilities (colors, fonts, helpers)
│   ├── vision.ts                     # Vision PDF entry point → calls template
│   ├── assessment.ts                 # Assessment PDF generator
│   ├── journal.ts                    # Journal PDF generator
│   ├── templates/
│   │   └── vision-template.ts        # ⭐ Main template (creates beautiful PDFs)
│   ├── vision-react-pdf.ts           # (Old approach - can be removed)
│   └── vision-react.tsx              # (Old React component - can be removed)
```

## How It Works

### 1. Entry Point (`src/lib/pdf/index.ts`)
This exports all PDF generators:
```typescript
export { generateVisionPDF } from './generators/vision'
```

### 2. Vision PDF Generator (`src/lib/pdf/generators/vision.ts`)
The `generateVisionPDF()` function is called from your UI:
```typescript
export async function generateVisionPDF(
  vision: VisionData,
  userProfile?: UserProfile,
  includeEmptySections: boolean = false
): Promise<void> {
  // Uses fast template-based generation
  const { generateVisionPDFTemplate } = await import('./templates/vision-template')
  generateVisionPDFTemplate(vision, userProfile, includeEmptySections)
}
```

### 3. Template System (`src/lib/pdf/generators/templates/vision-template.ts`)
This is where the magic happens! The template:

**Creates a jsPDF document:**
```typescript
this.doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true,
})
```

**Builds pages step by step:**
```typescript
private generate(): void {
  this.addCoverPage()           // Page 1: Beautiful cover
  this.addTableOfContents()     // Page 2: Table of contents
  this.addVisionSections()      // Pages 3+: Each category on its own page
  this.addSummaryPage()         // Last page: Summary
}
```

**Uses drawing methods for layout:**
- `this.doc.text()` - Add text
- `this.doc.rect()` - Draw rectangles/boxes
- `this.doc.roundedRect()` - Draw cards with rounded corners
- `this.doc.line()` - Draw dividers
- `this.doc.setFontSize()` / `setFont()` - Typography
- `setFillColor()`, `setTextColor()`, `setDrawColor()` - Colors

**Smart page breaks:**
```typescript
private checkPageBreak(requiredSpace: number): void {
  if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
    this.addPage()  // Automatically creates new page
  }
}
```

## Usage in Your App

### Where It's Called

**1. Vision Detail Page** (`src/app/life-vision/[id]/page.tsx`):
```typescript
import { generateVisionPDF } from '@/lib/pdf'

const downloadVisionPDF = useCallback(async () => {
  if (!vision) return
  try {
    await generateVisionPDF(vision, userProfile || undefined, false)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Failed to generate PDF. Please try again.')
  }
}, [vision, userProfile])
```

**2. Vision List Page** (`src/app/life-vision/page.tsx`):
```typescript
<Button onClick={async () => {
  const { generateVisionPDF } = await import('@/lib/pdf')
  await generateVisionPDF(activeVision, profile || undefined, false)
}}>
  Download PDF
</Button>
```

## Template Features

### 📄 Cover Page (`addCoverPage()`)
- Gradient header bar
- Title and subtitle
- Version badge
- Progress bar
- User name
- Generation date

### 📑 Table of Contents (`addTableOfContents()`)
- Lists all vision categories
- Shows page numbers
- Dotted lines connecting entries to pages

### 📝 Vision Sections (`addVisionSections()`)
- **Each category on its own page**
- Section number and title
- Category description
- Formatted content with paragraph breaks
- Proper text wrapping

### 📊 Summary Page (`addSummaryPage()`)
- Status badge
- Metadata card (version, dates, completion)
- Progress visualization

## Design System Integration

### Colors (from `base.ts`)
```typescript
PDF_COLORS = {
  primaryGreen: '#199D67',
  secondaryTeal: '#14B8A6',
  accentPurple: '#8B5CF6',
  // ... etc
}
```

### Typography
```typescript
PDF_FONTS = {
  title: { size: 24, style: 'bold' },
  heading: { size: 18, style: 'bold' },
  body: { size: 11, style: 'normal' },
  // ...
}
```

## Key Advantages

✅ **Fast** - Direct PDF generation, no HTML rendering
✅ **Clean** - White backgrounds, proper page breaks
✅ **Beautiful** - Matches your design system
✅ **Printable** - Optimized for printing
✅ **Maintainable** - Template-based, easy to modify

## How to Modify

Want to change the PDF design? Edit `src/lib/pdf/generators/templates/vision-template.ts`:

- **Change colors?** Modify the `setTextColor()` / `setFillColor()` calls
- **Change layout?** Adjust positioning in `addCoverPage()`, `addTableOfContents()`, etc.
- **Add elements?** Use jsPDF drawing methods (rect, circle, line, etc.)
- **Change fonts?** Modify `PDF_FONTS` in `base.ts` or use `setFontSize()`

## Example: Adding a Logo

```typescript
private addCoverPage(): void {
  // ... existing code ...
  
  // Add logo (if you have image data)
  const logoData = 'data:image/png;base64,...'
  this.doc.addImage(logoData, 'PNG', this.pageWidth / 2 - 20, 50, 40, 40)
}
```

## Data Flow

```
User clicks "Download PDF"
    ↓
Button handler calls generateVisionPDF(visionData, userProfile)
    ↓
vision.ts → imports and calls generateVisionPDFTemplate()
    ↓
VisionTemplatePDF constructor creates jsPDF document
    ↓
Template builds pages: cover → TOC → sections → summary
    ↓
doc.save(filename) downloads the PDF to user's computer
```

That's it! The template system gives you full control over the PDF layout while keeping it fast and beautiful.

