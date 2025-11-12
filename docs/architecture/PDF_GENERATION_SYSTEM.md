# PDF Generation System

A comprehensive PDF generation system for VibrationFit that follows the design system and creates beautiful, branded PDFs of user content.

## Overview

This system provides professional PDF generation capabilities for:
- **Life Visions** - Complete vision documents with all categories
- **Vibration Assessments** - Assessment results with scores and category breakdowns
- **Journal Entries** - Individual or collections of journal entries

All PDFs follow the VibrationFit brand colors, typography, and design principles from the design system.

## Architecture

### Core Components

```
src/lib/pdf/
├── index.ts                    # Main exports
└── generators/
    ├── base.ts                 # Base PDF generator class
    ├── vision.ts               # Vision PDF generator
    ├── assessment.ts           # Assessment PDF generator
    └── journal.ts              # Journal PDF generator
```

### Base Generator (`base.ts`)

The `BasePDFGenerator` class provides:
- PDF document management (A4 format)
- Typography helpers (titles, headings, body text)
- Color management using VibrationFit brand colors
- Layout helpers (spacing, dividers, boxes)
- Page break management

**Key Features:**
- Automatic page breaks when content exceeds page height
- Brand color helpers (hex to RGB conversion)
- Consistent typography using design system tokens
- Responsive spacing and margins

### Vision PDF Generator (`vision.ts`)

Generates comprehensive PDFs of Life Visions including:

**Features:**
- Cover page with version number and status
- Table of contents
- All 14 vision categories (Forward, Fun, Travel, Home, Family, Love, Health, Money, Work, Social, Stuff, Giving, Spirituality, Conclusion)
- Summary page with completion percentage
- User personalization (if profile available)
- Option to include/exclude empty sections

**Usage:**
```typescript
import { generateVisionPDF } from '@/lib/pdf'

await generateVisionPDF(visionData, userProfile, includeEmptySections)
```

### Assessment PDF Generator (`assessment.ts`)

Generates detailed assessment reports including:

**Features:**
- Cover page with overall score and status ("Above/Below the Green Line")
- Overview section with dates and completion status
- Category scores with visual progress bars
- Detailed response breakdown (if responses available)
- Color-coded scores (green for above, red for below)

**Usage:**
```typescript
import { generateAssessmentPDF } from '@/lib/pdf'

await generateAssessmentPDF(assessmentData, userProfile)
```

### Journal PDF Generator (`journal.ts`)

Generates PDFs of journal entries:

**Features:**
- Single entry or collection of entries
- Cover page with entry/collection title
- Table of contents (for collections)
- Entry metadata (date, type, categories)
- Formatted content with proper spacing

**Usage:**
```typescript
import { generateJournalPDF, generateJournalCollectionPDF } from '@/lib/pdf'

// Single entry
await generateJournalPDF(entryData, userProfile)

// Multiple entries
await generateJournalCollectionPDF(entriesArray, userProfile, 'My Journal Collection')
```

## Brand Colors

All PDFs use the official VibrationFit brand colors:

- **Primary Green:** `#199D67` - Main brand color, "Above the Green Line"
- **Secondary Teal:** `#14B8A6` - Supporting color, clarity
- **Accent Purple:** `#8B5CF6` - Premium features, special moments
- **Energy Yellow:** `#FFB701` - Celebrations, wins
- **Contrast Red:** `#D03739` - "Below the Green Line", alerts
- **Neutrals:** Pure black background, dark gray cards, white text

## Integration Points

### Vision Pages

✅ **Updated Pages:**
- `/life-vision/[id]` - Vision detail page
- `/life-vision` - Vision list page
- `/life-vision/[id]/experiment` - Experiment view page

All buttons now use the new PDF generator.

### Assessment Pages

✅ **Updated Pages:**
- `/assessment/[id]` - Assessment detail page

Download button now generates beautiful PDF instead of JSON export.

## Technical Details

### Dependencies

```json
{
  "jspdf": "^2.x.x",
  "@types/jspdf": "^2.x.x"
}
```

### File Structure

The system uses jsPDF for PDF generation, which works entirely client-side. No server-side processing required.

### Performance

- PDFs are generated on-demand in the browser
- No server load - all processing is client-side
- Fast generation times (typically < 1 second)

### Error Handling

All PDF generators include:
- Try-catch error handling
- User-friendly error messages
- Fallback behavior for missing data

## Design System Compliance

✅ **Follows all design system rules:**
- Uses exact brand hex colors
- Consistent typography (sizes, weights, line heights)
- Proper spacing and margins
- Brand voice and terminology
- Color meanings (green = above, red = below)

## Future Enhancements

Potential improvements:
- Add images to PDFs (vision board items, journal photos)
- Enhanced charts and graphs for assessments
- Customizable PDF templates
- PDF preview before download
- Batch PDF generation
- Email PDF functionality

## Example Output

All PDFs include:
1. Professional cover page
2. Table of contents (when applicable)
3. Well-formatted content sections
4. Consistent branding throughout
5. Footer with VibrationFit branding
6. Automatic page breaks for long content

## Usage Examples

### Vision PDF
```typescript
// In a React component
const handleDownloadPDF = async () => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, full_name')
    .eq('user_id', user.id)
    .single()
  
  await generateVisionPDF(vision, profile || undefined, false)
}
```

### Assessment PDF
```typescript
const handleDownloadAssessment = async () => {
  // Convert assessment data to PDF format
  const pdfData = {
    id: assessment.id,
    user_id: assessment.user_id,
    overall_percentage: assessment.overall_percentage,
    status: assessment.status,
    created_at: assessment.created_at.toISOString(),
    category_scores: [...], // formatted scores
    responses: [...] // if available
  }
  
  await generateAssessmentPDF(pdfData, userProfile)
}
```

## Notes

- PDFs are generated client-side using jsPDF
- No images are currently included (placeholders for future enhancement)
- All text is properly formatted and readable
- Colors are accurately represented using RGB conversion
- PDFs follow A4 standard format for printing compatibility

