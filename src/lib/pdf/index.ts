// PDF Generation Library
// Main export file for VibrationFit PDF generation
// Path: /src/lib/pdf/index.ts

export { generateVisionPDF } from './generators/vision'
export type { VisionData as VisionPDFData, UserProfile as VisionUserProfile } from './generators/vision'

export { generateAssessmentPDF } from './generators/assessment'
export { AssessmentPDFGenerator } from './generators/assessment'
export type { 
  AssessmentData as AssessmentPDFData, 
  UserProfile as AssessmentUserProfile 
} from './generators/assessment'

export { 
  generateJournalPDF, 
  generateJournalCollectionPDF 
} from './generators/journal'
export { JournalPDFGenerator } from './generators/journal'
export type { 
  JournalEntryData as JournalPDFData, 
  UserProfile as JournalUserProfile 
} from './generators/journal'

export { BasePDFGenerator, PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './generators/base'

