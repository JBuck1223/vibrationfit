# PDF Generation System - File Structure

## Active Files (In Use)

### Core Files
- **`index.ts`** - Main exports, entry point for all PDF generators
- **`generators/base.ts`** - Base utilities (colors, fonts, helpers, BasePDFGenerator class)
- **`generators/vision.ts`** - Vision PDF entry point (exports types + `generateVisionPDF()` function)
- **`generators/templates/vision-template.ts`** - ⭐ **Main Vision PDF template** (fast, beautiful generation)

### Other Generators
- **`generators/assessment.ts`** - Assessment PDF generator
- **`generators/journal.ts`** - Journal PDF generator

## Removed Files (No Longer Used)

✅ **Deleted:**
- `generators/vision-react-pdf.ts` - Old React/html2canvas approach (slow, quality issues)
- `generators/vision-react.tsx` - React component for old approach

## How It Works

```
User clicks "Download PDF"
    ↓
generateVisionPDF(visionData, userProfile)
    ↓
vision.ts → imports vision-template.ts
    ↓
VisionTemplatePDF class:
  - Creates jsPDF document
  - Builds pages using template methods
  - Saves PDF
```

## File Purposes

| File | Purpose | Status |
|------|---------|--------|
| `vision.ts` | Type exports + entry function | ✅ Active |
| `templates/vision-template.ts` | Actual PDF generation | ✅ Active |
| `base.ts` | Shared utilities | ✅ Active |
| `assessment.ts` | Assessment PDFs | ✅ Active |
| `journal.ts` | Journal PDFs | ✅ Active |
| `vision-react-pdf.ts` | Old React approach | ❌ Deleted |
| `vision-react.tsx` | Old React component | ❌ Deleted |

## To Modify PDFs

Edit **`generators/templates/vision-template.ts`**:
- Change layout: modify `addCoverPage()`, `addVisionSections()`, etc.
- Change colors: update `setTextColor()` / `setFillColor()` calls
- Change typography: modify font sizes/weights
- Add elements: use jsPDF drawing methods

