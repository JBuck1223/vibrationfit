// Vision PDF Template - Beautiful, fast template-based generation
// Uses jsPDF directly for better performance and control
// Path: /src/lib/pdf/generators/templates/vision-template.ts

import { jsPDF } from 'jspdf'
import { PDF_COLORS, PDF_FONTS, LINE_HEIGHT, PDF_DIMENSIONS, setFillColor, setTextColor, setDrawColor } from '../base'
import { VISION_CATEGORIES, getVisionCategoryIcon } from '@/lib/design-system/vision-categories'
import { VisionData, UserProfile } from '../vision'

interface TemplateOptions {
  vision: VisionData
  userProfile?: UserProfile
  includeEmptySections?: boolean
}

export class VisionTemplatePDF {
  private doc: jsPDF
  private currentY: number = 0
  private margin: number = 20
  private contentWidth: number = 170
  private pageHeight: number = 297
  private pageWidth: number = 210
  private vision: VisionData
  private userProfile?: UserProfile
  private includeEmptySections: boolean

  constructor(options: TemplateOptions) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })
    this.vision = options.vision
    this.userProfile = options.userProfile
    this.includeEmptySections = options.includeEmptySections || false
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentY = this.margin
    
    // Set white background on first page
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')
    
    this.generate()
  }

  private generate(): void {
    this.addCoverPage()
    this.addTableOfContents()
    this.addVisionSections()
    this.addSummaryPage()
  }

  private addCoverPage(): void {
    // White background for better printing
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')

    // Gradient bar at top (simulated with rectangles)
    this.drawGradientBar(0, 0, this.pageWidth, 15, PDF_COLORS.primaryGreen, PDF_COLORS.secondaryTeal)
    
    // Add subtle background pattern
    this.drawSubtlePattern()

    // Title - use dark green for good contrast on white
    const centerY = this.pageHeight / 2
    this.doc.setFontSize(36)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.primaryGreen)
    
    const title = this.vision.title || 'The Life I Choose'
    const titleLines = this.doc.splitTextToSize(title, this.contentWidth)
    const titleHeight = titleLines.length * 36 * LINE_HEIGHT.title
    const titleY = centerY - titleHeight / 2 - 40
    
    this.doc.text(titleLines, this.pageWidth / 2, titleY, { align: 'center' })

    // Subtitle
    let currentY = titleY + titleHeight + 15
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Life Vision Document', this.pageWidth / 2, currentY, { align: 'center' })
    currentY += 25

    // Version badge
    this.drawVersionBadge(this.pageWidth / 2, currentY, this.vision.version_number, this.vision.status)
    currentY += 25

    // Completion progress
    if (this.vision.completion_percent !== undefined) {
      this.drawProgressBar(
        this.pageWidth / 2 - 40,
        currentY,
        80,
        6,
        this.vision.completion_percent,
        PDF_COLORS.primaryGreen
      )
      currentY += 15
      this.doc.setFontSize(14)
      setTextColor(this.doc, PDF_COLORS.mediumGray)
      this.doc.text(
        `${this.vision.completion_percent}% Complete`,
        this.pageWidth / 2,
        currentY,
        { align: 'center' }
      )
      currentY += 20
    }

    // User name
    if (this.userProfile?.first_name || this.userProfile?.full_name) {
      const userName = this.userProfile.first_name || this.userProfile.full_name || ''
      this.doc.setFontSize(12)
      setTextColor(this.doc, PDF_COLORS.mediumGray)
      this.doc.text(
        `Created by ${userName}`,
        this.pageWidth / 2,
        currentY,
        { align: 'center' }
      )
      currentY += 20
    }

    // Date at bottom
    this.doc.setFontSize(10)
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      `Generated on ${new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`,
      this.pageWidth / 2,
      this.pageHeight - 30,
      { align: 'center' }
    )
    
    // No page number on cover
    this.addPage()
  }

  private drawSubtlePattern(): void {
    // Add subtle geometric pattern for visual interest
    setFillColor(this.doc, PDF_COLORS.primaryGreen)
    this.doc.setGState(this.doc.GState({ opacity: 0.05 }))
    
    // Draw subtle dots in corners
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const x = this.margin + i * 40
        const y = this.margin + j * 80
        this.doc.circle(x, y, 1, 'F')
      }
    }
    
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
  }

  private addTableOfContents(): void {
    this.addPageTitle('Table of Contents', PDF_COLORS.primaryGreen)
    this.currentY += 15

    const categories = VISION_CATEGORIES.filter(cat => {
      if (this.includeEmptySections) return true
      const content = this.vision[cat.key as keyof VisionData] as string
      return content && content.trim().length > 0
    })

    this.doc.setFontSize(PDF_FONTS.body.size)
    this.doc.setFont('helvetica', 'normal')

    categories.forEach((category, index) => {
      this.checkPageBreak(12)

      // Category name with icon indicator
      setTextColor(this.doc, PDF_COLORS.pureBlack)
      const categoryName = `${(index + 1).toString().padStart(2, '0')}. ${category.label}`
      this.doc.text(categoryName, this.margin, this.currentY)

      // Dots
      const dotsX = this.pageWidth - this.margin - 20
      const dotsY = this.currentY
      this.drawDots(this.margin + 100, dotsY, dotsX - this.margin - 100, 1, PDF_COLORS.mediumGray)

      // Page number
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text(`${index + 3}`, this.pageWidth - this.margin, this.currentY, { align: 'right' })

      this.currentY += 10
    })

    this.addPage()
  }

  private addVisionSections(): void {
    const categories = VISION_CATEGORIES.filter(cat => {
      if (this.includeEmptySections) return true
      const content = this.vision[cat.key as keyof VisionData] as string
      return content && content.trim().length > 0
    })

    categories.forEach((category, index) => {
      // Always start sections on new page (unless first one)
      if (index > 0) {
        this.addPage()
      }
      
      this.checkPageBreak(80)
      
      // Divider
      this.drawDivider(PDF_COLORS.primaryGreen)
      this.currentY += 8

      // Section number and title
      const sectionNum = (index + 1).toString().padStart(2, '0')
      const sectionTitle = `${sectionNum}. ${category.label}`
      
      // Icon box
      const iconSize = 12
      setFillColor(this.doc, PDF_COLORS.primaryGreen)
      this.doc.roundedRect(this.margin, this.currentY - 8, iconSize, iconSize, 3, 3, 'F')
      
      // Title
      this.doc.setFontSize(PDF_FONTS.heading.size)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      
      const titleX = this.margin + iconSize + 8
      this.doc.text(sectionTitle, titleX, this.currentY)
      this.currentY += 8

      // Description
      if (category.description) {
        this.doc.setFontSize(PDF_FONTS.small.size)
        this.doc.setFont('helvetica', 'normal')
        setTextColor(this.doc, PDF_COLORS.lightGray)
        this.doc.text(category.description, titleX, this.currentY)
        this.currentY += 8
      }

      // Content
      const content = this.vision[category.key as keyof VisionData] as string
      this.currentY += 5

      if (content && content.trim().length > 0) {
        this.addFormattedText(content.trim(), PDF_COLORS.pureBlack, 5)
      } else {
        this.doc.setFontSize(PDF_FONTS.body.size)
        this.doc.setFont('helvetica', 'italic')
        setTextColor(this.doc, PDF_COLORS.lightGray)
        this.doc.text('[No content for this section]', this.margin + 5, this.currentY)
        this.currentY += 8
      }

      this.currentY += 15
    })
  }

  private addSummaryPage(): void {
    this.checkPageBreak(100)
    
    this.addPageTitle('Vision Summary', PDF_COLORS.primaryGreen)
    this.currentY += 15

    // Status badge
    const isComplete = this.vision.status === 'complete'
    this.drawStatusBadge(
      this.pageWidth / 2,
      this.currentY,
      isComplete ? '✓ Vision Complete' : 'Draft Version',
      isComplete ? PDF_COLORS.primaryGreen : PDF_COLORS.energyYellow
    )
    this.currentY += 20

    // Metadata box - light background for readability
    this.drawCard(this.margin, this.currentY, this.contentWidth, 70, PDF_COLORS.veryLightGray)
    const cardY = this.currentY + 5
    let cardCurrentY = cardY

    this.doc.setFontSize(PDF_FONTS.body.size)
    this.doc.setFont('helvetica', 'normal')

    // Version
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Version:', this.margin + 5, cardCurrentY)
    setTextColor(this.doc, PDF_COLORS.pureBlack)
    this.doc.text(this.vision.version_number.toString(), this.margin + 35, cardCurrentY)
    cardCurrentY += 8

    // Created
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Created:', this.margin + 5, cardCurrentY)
    setTextColor(this.doc, PDF_COLORS.pureBlack)
    const createdDate = new Date(this.vision.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    this.doc.text(createdDate, this.margin + 35, cardCurrentY)
    cardCurrentY += 8

    // Updated
    if (this.vision.updated_at) {
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text('Last Updated:', this.margin + 5, cardCurrentY)
      setTextColor(this.doc, PDF_COLORS.pureBlack)
      const updatedDate = new Date(this.vision.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      this.doc.text(updatedDate, this.margin + 35, cardCurrentY)
      cardCurrentY += 8
    }

    // Completion
    if (this.vision.completion_percent !== undefined) {
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text('Completion:', this.margin + 5, cardCurrentY)
      setTextColor(this.doc, PDF_COLORS.pureBlack)
      this.drawProgressBar(
        this.margin + 35,
        cardCurrentY - 3,
        60,
        4,
        this.vision.completion_percent,
        PDF_COLORS.primaryGreen
      )
      this.doc.text(`${this.vision.completion_percent}%`, this.margin + 100, cardCurrentY)
    }

    // Footer
    this.currentY = this.pageHeight - 25
    this.drawDivider(PDF_COLORS.mediumGray)
    this.currentY += 5
    
    this.doc.setFontSize(8)
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      'Generated by VibrationFit • vibrationfit.com',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    )
  }

  private addPageTitle(title: string, color: string): void {
    this.currentY = this.margin + 10
    this.doc.setFontSize(PDF_FONTS.title.size)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, color)
    this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' })
    
    // Underline
    this.drawDivider(color)
    this.currentY += 8
  }

  private addFormattedText(text: string, color: string, indent: number = 0): void {
    this.doc.setFontSize(PDF_FONTS.body.size)
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, color)

    // Clean up text: normalize whitespace but preserve paragraphs
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines in a row
      .trim()

    // Split into paragraphs
    const paragraphs = cleanedText.split(/\n\n+/)

    paragraphs.forEach((paragraph, paraIndex) => {
      // Split paragraph into lines that fit the page
      const maxWidth = this.contentWidth - indent
      const lines = this.doc.splitTextToSize(paragraph.trim(), maxWidth)

      lines.forEach((line: string, lineIndex: number) => {
        this.checkPageBreak(8)
        
        // Add paragraph spacing except for first line of first paragraph
        if (paraIndex > 0 && lineIndex === 0) {
          this.currentY += 4
        }
        
        this.doc.text(line, this.margin + indent, this.currentY)
        this.currentY += 6
      })
      
      // Space between paragraphs
      if (paraIndex < paragraphs.length - 1) {
        this.currentY += 2
      }
    })
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addPage()
    }
  }

  private addPage(): void {
    this.doc.addPage()
    this.currentY = this.margin
    
    // White background for clean printing
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')
    
    // Add subtle top border
    setFillColor(this.doc, PDF_COLORS.primaryGreen)
    this.doc.rect(0, 0, this.pageWidth, 3, 'F')
    
    // Add page number
    this.doc.setFontSize(8)
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    const pageNum = this.doc.getCurrentPageInfo().pageNumber
    this.doc.text(
      `Page ${pageNum}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    )
  }

  // Drawing helpers
  private drawDivider(color: string): void {
    setDrawColor(this.doc, color)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 3
  }

  private drawGradientBar(x: number, y: number, width: number, height: number, color1: string, color2: string): void {
    // Simulate gradient with multiple rectangles
    const steps = 20
    const stepWidth = width / steps
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(
        this.hexToRgb(color1)[0] * (1 - ratio) + this.hexToRgb(color2)[0] * ratio
      )
      const g = Math.round(
        this.hexToRgb(color1)[1] * (1 - ratio) + this.hexToRgb(color2)[1] * ratio
      )
      const b = Math.round(
        this.hexToRgb(color1)[2] * (1 - ratio) + this.hexToRgb(color2)[2] * ratio
      )
      this.doc.setFillColor(r, g, b)
      this.doc.rect(x + i * stepWidth, y, stepWidth, height, 'F')
    }
  }

  private drawVersionBadge(x: number, y: number, version: number, status: string): void {
    const badgeWidth = 60
    const badgeHeight = 12
    const badgeX = x - badgeWidth / 2
    
    setFillColor(this.doc, PDF_COLORS.darkGray)
    this.doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 3, 3, 'F')
    
    // Version text
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.text(`Version ${version}`, x, y + 6, { align: 'center' })
    
    // Status badge
    const statusColor = status === 'complete' ? PDF_COLORS.primaryGreen : PDF_COLORS.energyYellow
    this.doc.setFontSize(9)
    setTextColor(this.doc, statusColor)
    this.doc.text(status === 'complete' ? 'Complete' : 'Draft', x, y + 10.5, { align: 'center' })
  }

  private drawStatusBadge(x: number, y: number, text: string, color: string): void {
    const badgeWidth = 80
    const badgeHeight = 10
    const badgeX = x - badgeWidth / 2
    
    setFillColor(this.doc, color)
    this.doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 2, 2, 'F')
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.pureBlack)
    this.doc.text(text, x, y + 6.5, { align: 'center' })
  }

  private drawProgressBar(x: number, y: number, width: number, height: number, percentage: number, color: string): void {
    // Background
    setFillColor(this.doc, PDF_COLORS.darkGray)
    this.doc.roundedRect(x, y, width, height, 2, 2, 'F')
    
    // Fill
    const fillWidth = (width * percentage) / 100
    if (fillWidth > 0) {
      setFillColor(this.doc, color)
      this.doc.roundedRect(x, y, fillWidth, height, 2, 2, 'F')
    }
  }

  private drawCard(x: number, y: number, width: number, height: number, bgColor: string): void {
    setFillColor(this.doc, bgColor)
    this.doc.roundedRect(x, y, width, height, 3, 3, 'F')
    
    // Border
    setDrawColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(x, y, width, height, 3, 3, 'S')
  }

  private drawDots(x: number, y: number, width: number, dotSize: number, color: string): void {
    setFillColor(this.doc, color)
    const dotSpacing = 2
    const dots = Math.floor(width / dotSpacing)
    for (let i = 0; i < dots; i += 2) {
      this.doc.circle(x + i * dotSpacing, y - 1, dotSize / 2, 'F')
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : [0, 0, 0]
  }

  public download(filename?: string): void {
    const title = this.vision.title || 'Life Vision'
    const defaultFilename = `${title.replace(/[^a-z0-9]/gi, '_')}_V${this.vision.version_number}.pdf`
    this.doc.save(filename || defaultFilename)
  }
}

export function generateVisionPDFTemplate(
  vision: VisionData,
  userProfile?: UserProfile,
  includeEmptySections: boolean = false
): void {
  const generator = new VisionTemplatePDF({ vision, userProfile, includeEmptySections })
  generator.download()
}

