// Base PDF Generator Utility
// Provides core PDF generation functionality following VibrationFit design system
// Path: /src/lib/pdf/generators/base.ts

import { jsPDF } from 'jspdf'

// VibrationFit Brand Colors (from design system rules)
export const PDF_COLORS = {
  // Primary Brand Colors
  primaryGreen: '#199D67',
  primaryGreenLight: '#5EC49A',
  primaryGreenLighter: '#A8E5CE',
  
  // Secondary Teal
  secondaryTeal: '#14B8A6',
  tealLight: '#2DD4BF',
  tealDark: '#0D9488',
  
  // Accent Purple
  primaryPurple: '#601B9F',
  accentPurple: '#8B5CF6',
  buttonPurple: '#7C3AED',
  violet: '#B629D4',
  purpleLighter: '#C4B5FD',
  
  // Energy Colors
  vibrantRed: '#D03739',
  redLight: '#EF4444',
  energyYellow: '#FFB701',
  yellowLight: '#FCD34D',
  
  // Neutrals
  pureBlack: '#000000',
  darkGray: '#1F1F1F',
  mediumGray: '#404040',
  lightGray: '#666666',
  veryLightGray: '#F9F9F9',
  pureWhite: '#FFFFFF',
} as const

// Convert hex to RGB for jsPDF
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0]
}

// Helper to set color
function setColor(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex)
  doc.setDrawColor(r, g, b)
  doc.setTextColor(r, g, b)
  doc.setFillColor(r, g, b)
}

// Helper to set text color only
function setTextColor(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex)
  doc.setTextColor(r, g, b)
}

// Helper to set fill color only
function setFillColor(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex)
  doc.setFillColor(r, g, b)
}

// Helper to set draw color only
function setDrawColor(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex)
  doc.setDrawColor(r, g, b)
}

// Export helper functions for use in generators
export { setColor, setTextColor, setFillColor, setDrawColor }

// PDF Dimensions (A4)
export const PDF_DIMENSIONS = {
  width: 210, // mm
  height: 297, // mm
  margin: 20, // mm
  contentWidth: 170, // width - (margin * 2)
} as const

// Typography
export const PDF_FONTS = {
  title: {
    size: 24,
    style: 'bold' as const,
  },
  heading: {
    size: 18,
    style: 'bold' as const,
  },
  subheading: {
    size: 14,
    style: 'bold' as const,
  },
  body: {
    size: 11,
    style: 'normal' as const,
  },
  small: {
    size: 9,
    style: 'normal' as const,
  },
} as const

// Line height multipliers
export const LINE_HEIGHT = {
  title: 1.2,
  heading: 1.3,
  body: 1.5,
  small: 1.4,
} as const

// Base PDF generator class
export class BasePDFGenerator {
  protected doc: jsPDF
  protected currentY: number
  protected pageHeight: number
  protected pageWidth: number
  protected margin: number
  protected contentWidth: number

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    })
    
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = PDF_DIMENSIONS.margin
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentY = this.margin
    
    // Set default font
    this.doc.setFont('helvetica', 'normal')
  }

  // Add new page if needed
  protected checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addPage()
    }
  }

  // Add new page
  protected addPage(): void {
    this.doc.addPage()
    this.currentY = this.margin
  }

  // Add title
  protected addTitle(text: string, color: string = PDF_COLORS.primaryGreen): void {
    this.checkPageBreak(15)
    this.doc.setFontSize(PDF_FONTS.title.size)
    this.doc.setFont('helvetica', PDF_FONTS.title.style)
    setTextColor(this.doc, color)
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += (lines.length * PDF_FONTS.title.size * LINE_HEIGHT.title) + 8
  }

  // Add heading
  protected addHeading(text: string, color: string = PDF_COLORS.secondaryTeal): void {
    this.checkPageBreak(12)
    this.doc.setFontSize(PDF_FONTS.heading.size)
    this.doc.setFont('helvetica', PDF_FONTS.heading.style)
    setTextColor(this.doc, color)
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += (lines.length * PDF_FONTS.heading.size * LINE_HEIGHT.heading) + 6
  }

  // Add subheading
  protected addSubheading(text: string, color: string = PDF_COLORS.accentPurple): void {
    this.checkPageBreak(10)
    this.doc.setFontSize(PDF_FONTS.subheading.size)
    this.doc.setFont('helvetica', PDF_FONTS.subheading.style)
    setTextColor(this.doc, color)
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += (lines.length * PDF_FONTS.subheading.size * LINE_HEIGHT.body) + 4
  }

  // Add body text
  protected addBodyText(
    text: string,
    color: string = PDF_COLORS.pureWhite,
    indent: number = 0
  ): void {
    if (!text || text.trim() === '') return
    
    this.doc.setFontSize(PDF_FONTS.body.size)
    this.doc.setFont('helvetica', PDF_FONTS.body.style)
    setTextColor(this.doc, color)
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth - indent)
    this.checkPageBreak(lines.length * PDF_FONTS.body.size * LINE_HEIGHT.body)
    
    this.doc.text(lines, this.margin + indent, this.currentY)
    this.currentY += (lines.length * PDF_FONTS.body.size * LINE_HEIGHT.body) + 3
  }

  // Add small text
  protected addSmallText(text: string, color: string = PDF_COLORS.lightGray): void {
    this.checkPageBreak(8)
    this.doc.setFontSize(PDF_FONTS.small.size)
    this.doc.setFont('helvetica', PDF_FONTS.small.style)
    setTextColor(this.doc, color)
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += (lines.length * PDF_FONTS.small.size * LINE_HEIGHT.small) + 2
  }

  // Add horizontal line
  protected addHorizontalLine(color: string = PDF_COLORS.mediumGray): void {
    this.checkPageBreak(5)
    setDrawColor(this.doc, color)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 5
  }

  // Add spacer
  protected addSpacer(height: number = 5): void {
    this.currentY += height
  }

  // Add divider section
  protected addDivider(color: string = PDF_COLORS.primaryGreen): void {
    this.checkPageBreak(10)
    this.addSpacer(3)
    setFillColor(this.doc, color)
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 2, 'F')
    this.currentY += 8
  }

  // Add colored box/panel
  protected addBox(
    content: string,
    backgroundColor: string = PDF_COLORS.darkGray,
    textColor: string = PDF_COLORS.pureWhite,
    padding: number = 5
  ): void {
    const textHeight = this.doc.getTextDimensions(content, {
      maxWidth: this.contentWidth - (padding * 2),
      fontSize: PDF_FONTS.body.size,
    }).h
    
    const boxHeight = textHeight + (padding * 2)
    this.checkPageBreak(boxHeight + 5)
    
    // Draw background
    setFillColor(this.doc, backgroundColor)
    this.doc.roundedRect(
      this.margin,
      this.currentY,
      this.contentWidth,
      boxHeight,
      2,
      2,
      'F'
    )
    
    // Add text
    this.doc.setFontSize(PDF_FONTS.body.size)
    setTextColor(this.doc, textColor)
    const lines = this.doc.splitTextToSize(content, this.contentWidth - (padding * 2))
    this.doc.text(lines, this.margin + padding, this.currentY + padding + PDF_FONTS.body.size)
    this.currentY += boxHeight + 5
  }

  // Get final PDF as blob URL
  protected getBlobUrl(): string {
    const blob = this.doc.output('blob')
    return URL.createObjectURL(blob)
  }

  // Download PDF
  public download(filename: string): void {
    this.doc.save(filename)
  }

  // Get PDF data URL
  public getDataUrl(): string {
    return this.doc.output('dataurlstring')
  }

  // Get PDF blob
  public getBlob(): Blob {
    return this.doc.output('blob')
  }

  // Get PDF buffer
  public getBuffer(): ArrayBuffer {
    return this.doc.output('arraybuffer')
  }
}

