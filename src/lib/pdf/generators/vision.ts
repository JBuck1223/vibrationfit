// Vision PDF Generator
// Exports types and main function - actual generation in ./templates/vision-template.ts
// Path: /src/lib/pdf/generators/vision.ts

export interface VisionData {
  id: string
  title?: string
  version_number: number
  status: 'draft' | 'complete' | string
  completion_percent?: number
  forward: string
  fun: string
  travel: string
  home: string
  family: string
  love: string
  health: string
  money: string
  work: string
  social: string
  stuff: string
  giving: string
  spirituality: string
  conclusion: string
  created_at: string
  updated_at?: string
}

export interface UserProfile {
  first_name?: string
  full_name?: string
  email?: string
}

// Convenience function to generate and download Vision PDF
// Uses server-side Puppeteer for high-quality PDF generation
export async function generateVisionPDF(
  vision: VisionData,
  userProfile?: UserProfile,
  includeEmptySections: boolean = false
): Promise<void> {
  // Use server-side Puppeteer via API for crisp vector text and professional pagination
  const { downloadVisionPDF } = await import('../download-vision-pdf')
  await downloadVisionPDF(vision.id)
}
