// Vision PDF Template - Beautiful, modern design optimized for printing
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
    // Clean white background
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')

    // Elegant color block at top
    this.drawGradientBar(0, 0, this.pageWidth, 60, PDF_COLORS.primaryGreen, PDF_COLORS.secondaryTeal)
    
    // Decorative accent shapes (subtle, print-friendly)
    this.drawPrintFriendlyAccents()

    // Title area
    const centerY = this.pageHeight / 2
    
    // Main title with professional styling
    this.doc.setFontSize(40)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.primaryGreen)
    
    const title = this.vision.title || 'The Life I Choose'
    const titleLines = this.doc.splitTextToSize(title, this.contentWidth - 20)
    const titleHeight = titleLines.length * 40 * LINE_HEIGHT.title
    const titleY = centerY - titleHeight / 2 - 40
    
    this.doc.text(titleLines, this.pageWidth / 2, titleY, { align: 'center' })

    // Elegant subtitle
    let currentY = titleY + titleHeight + 18
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Life Vision Document', this.pageWidth / 2, currentY, { align: 'center' })
    
    // Decorative line under subtitle
    setDrawColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.setLineWidth(0.5)
    const lineWidth = 60
    this.doc.line(
      this.pageWidth / 2 - lineWidth / 2,
      currentY + 4,
      this.pageWidth / 2 + lineWidth / 2,
      currentY + 4
    )
    currentY += 25

    // Version badge with elegant design
    this.drawElegantVersionBadge(this.pageWidth / 2, currentY, this.vision.version_number, this.vision.status)
    currentY += 28

    // Beautiful progress indicator
    if (this.vision.completion_percent !== undefined) {
      this.drawStyledProgressBar(
        this.pageWidth / 2 - 50,
        currentY,
        100,
        7,
        this.vision.completion_percent
      )
      currentY += 15
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.primaryGreen)
      this.doc.text(
        `${this.vision.completion_percent}% Complete`,
        this.pageWidth / 2,
        currentY,
        { align: 'center' }
      )
      currentY += 20
    }

    // User attribution with style
    if (this.userProfile?.first_name || this.userProfile?.full_name) {
      const userName = this.userProfile.first_name || this.userProfile.full_name || ''
      
      // Small decorative element
      const circleSize = 2
      setFillColor(this.doc, PDF_COLORS.accentPurple)
      this.doc.circle(this.pageWidth / 2, currentY, circleSize, 'F')
      
      this.doc.setFontSize(13)
      this.doc.setFont('helvetica', 'normal')
      setTextColor(this.doc, PDF_COLORS.darkGray)
      this.doc.text(
        `Created by ${userName}`,
        this.pageWidth / 2,
        currentY + 8,
        { align: 'center' }
      )
    }

    // Footer with date
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      this.pageWidth / 2,
      this.pageHeight - 30,
      { align: 'center' }
    )
    
    // Branding
    this.doc.setFontSize(9)
    setTextColor(this.doc, PDF_COLORS.lightGray)
    this.doc.text(
      'VibrationFit',
      this.pageWidth / 2,
      this.pageHeight - 20,
      { align: 'center' }
    )
    
    this.addPage()
  }

  private drawPrintFriendlyAccents(): void {
    // Subtle geometric shapes that print well
    setDrawColor(this.doc, PDF_COLORS.primaryGreenLighter)
    this.doc.setLineWidth(0.3)
    this.doc.setGState(this.doc.GState({ opacity: 0.3 }))
    
    // Corner decorations
    this.doc.circle(this.pageWidth - 15, 15, 8, 'S')
    this.doc.circle(15, this.pageHeight - 15, 8, 'S')
    
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
  }

  private addTableOfContents(): void {
    // Clean white background
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')
    
    // Page header
    this.currentY = this.margin + 10
    this.drawPageHeader('Table of Contents', PDF_COLORS.primaryGreen)
    this.currentY += 18

    const categories = VISION_CATEGORIES.filter(cat => {
      if (this.includeEmptySections) return true
      const content = this.vision[cat.key as keyof VisionData] as string
      return content && content.trim().length > 0
    })

    categories.forEach((category, index) => {
      this.checkPageBreak(14)

      // Number in colored circle
      const circleSize = 7
      const circleX = this.margin + circleSize / 2
      
      setFillColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.circle(circleX, this.currentY - 2, circleSize / 2, 'F')
      
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.pureWhite)
      this.doc.text(
        (index + 1).toString(),
        circleX,
        this.currentY + 1,
        { align: 'center' }
      )

      // Category name
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      setTextColor(this.doc, PDF_COLORS.darkGray)
      this.doc.text(category.label, this.margin + circleSize + 8, this.currentY)

      // Professional dots
      const dotsStartX = this.margin + 90
      const dotsEndX = this.pageWidth - this.margin - 12
      this.drawProfessionalDots(dotsStartX, this.currentY - 1, dotsEndX - dotsStartX)

      // Page number
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.primaryGreen)
      this.doc.text(`${index + 3}`, this.pageWidth - this.margin, this.currentY, { align: 'right' })

      this.currentY += 11
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
      if (index > 0) {
        this.addPage()
      }
      
      this.checkPageBreak(100)
      
      // Beautiful section header
      this.drawSectionHeader(index + 1, category.label, category.description)
      this.currentY += 12

      // Content in professional card
      const content = this.vision[category.key as keyof VisionData] as string
      if (content && content.trim()) {
        this.drawPrintFriendlyContentCard(content)
      } else if (this.includeEmptySections) {
        this.drawEmptyStateCard(category.label)
      }
    })
  }

  private drawPageHeader(title: string, color: string): void {
    // Title with accent bar
    setFillColor(this.doc, color)
    this.doc.rect(this.margin, this.currentY - 3, 35, 3, 'F')
    
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, color)
    this.doc.text(title, this.margin, this.currentY + 8)
    
    // Subtle line underneath
    setDrawColor(this.doc, color)
    this.doc.setLineWidth(0.3)
    this.doc.line(this.margin, this.currentY + 12, this.pageWidth - this.margin, this.currentY + 12)
    
    this.currentY += 15
  }

  private drawSectionHeader(number: number, title: string, description?: string): void {
    // Colored header bar with white space
    const headerHeight = 32
    const headerY = this.currentY
    
    // Gradient background bar
    this.drawGradientBar(
      0,
      headerY - 5,
      this.pageWidth,
      headerHeight,
      PDF_COLORS.primaryGreen,
      PDF_COLORS.secondaryTeal
    )
    
    // Section number in white circle
    const badgeSize = 18
    const badgeX = this.margin + 5
    const badgeY = headerY + 3
    
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.circle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 'F')
    
    // Add subtle shadow effect
    this.doc.setGState(this.doc.GState({ opacity: 0.2 }))
    setFillColor(this.doc, PDF_COLORS.pureBlack)
    this.doc.circle(badgeX + badgeSize / 2 + 0.5, badgeY + badgeSize / 2 + 0.5, badgeSize / 2, 'F')
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
    
    // Number text
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.primaryGreen)
    this.doc.text(
      number.toString().padStart(2, '0'),
      badgeX + badgeSize / 2,
      badgeY + badgeSize / 2 + 3.5,
      { align: 'center' }
    )
    
    // Section title
    this.doc.setFontSize(19)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.text(title, this.margin + badgeSize + 15, headerY + 8)
    
    // Description if available
    if (description) {
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setGState(this.doc.GState({ opacity: 0.9 }))
      this.doc.text(description, this.margin + badgeSize + 15, headerY + 16)
      this.doc.setGState(this.doc.GState({ opacity: 1 }))
    }
    
    this.currentY += headerHeight + 5
  }

  private drawPrintFriendlyContentCard(content: string): void {
    const cardPadding = 10
    const cardX = this.margin
    const cardWidth = this.contentWidth
    
    // Calculate content height
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(content, cardWidth - (cardPadding * 2))
    const textHeight = lines.length * 11 * 1.5
    const cardHeight = textHeight + (cardPadding * 2) + 5
    
    // Check if we need a new page
    if (this.currentY + cardHeight > this.pageHeight - this.margin - 20) {
      this.addPage()
    }
    
    const cardY = this.currentY
    
    // Card background - very light gray for print
    setFillColor(this.doc, '#FAFAFA')
    this.doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'F')
    
    // Subtle border
    setDrawColor(this.doc, PDF_COLORS.primaryGreenLighter)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'S')
    
    // Accent strip on left
    setFillColor(this.doc, PDF_COLORS.primaryGreen)
    this.doc.rect(cardX, cardY, 3, cardHeight, 'F')
    
    // Content text
    setTextColor(this.doc, PDF_COLORS.darkGray)
    
    let textY = cardY + cardPadding + 8
    lines.forEach((line: string) => {
      if (textY + 10 > cardY + cardHeight - cardPadding) return // Safety check
      this.doc.text(line, cardX + cardPadding + 5, textY)
      textY += 11 * 1.5
    })
    
    this.currentY += cardHeight + 15
  }

  private drawEmptyStateCard(categoryLabel: string): void {
    const cardHeight = 40
    const cardX = this.margin
    const cardWidth = this.contentWidth
    const cardY = this.currentY
    
    // Light background with subtle border
    setFillColor(this.doc, '#F9F9F9')
    this.doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'F')
    
    // Subtle border (solid since jsPDF doesn't support dashed)
    setDrawColor(this.doc, PDF_COLORS.lightGray)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'S')
    
    // Empty state text
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'italic')
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      `No ${categoryLabel.toLowerCase()} vision defined yet`,
      this.pageWidth / 2,
      cardY + cardHeight / 2 + 2,
      { align: 'center' }
    )
    
    this.currentY += cardHeight + 15
  }

  private addSummaryPage(): void {
    this.addPage()
    
    // Page header
    this.currentY = this.margin + 10
    this.drawPageHeader('Vision Summary', PDF_COLORS.accentPurple)
    this.currentY += 15

    // Summary card
    const cardX = this.margin
    const cardWidth = this.contentWidth
    const cardHeight = 100
    
    setFillColor(this.doc, '#FAFAFA')
    this.doc.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 4, 4, 'F')
    
    setDrawColor(this.doc, PDF_COLORS.accentPurple)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 4, 4, 'S')
    
    let cardCurrentY = this.currentY + 12

    // Version
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Version:', cardX + 8, cardCurrentY)
    
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, PDF_COLORS.darkGray)
    this.doc.text(`${this.vision.version_number}`, cardX + 30, cardCurrentY)
    cardCurrentY += 10

    // Status
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Status:', cardX + 8, cardCurrentY)
    
    const statusColor = this.vision.status === 'complete' ? PDF_COLORS.primaryGreen : PDF_COLORS.energyYellow
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, statusColor)
    this.doc.text(
      this.vision.status.charAt(0).toUpperCase() + this.vision.status.slice(1),
      cardX + 30,
      cardCurrentY
    )
    cardCurrentY += 10

    // Created date
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.text('Created:', cardX + 8, cardCurrentY)
    
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, PDF_COLORS.darkGray)
    const createdDate = new Date(this.vision.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    this.doc.text(createdDate, cardX + 30, cardCurrentY)
    cardCurrentY += 10

    // Updated date
    if (this.vision.updated_at) {
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text('Last Updated:', cardX + 8, cardCurrentY)
      
      this.doc.setFont('helvetica', 'normal')
      setTextColor(this.doc, PDF_COLORS.darkGray)
      const updatedDate = new Date(this.vision.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      this.doc.text(updatedDate, cardX + 30, cardCurrentY)
      cardCurrentY += 10
    }

    // Completion progress
    if (this.vision.completion_percent !== undefined) {
      cardCurrentY += 5
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text('Progress:', cardX + 8, cardCurrentY)
      
      this.drawStyledProgressBar(
        cardX + 30,
        cardCurrentY - 3,
        80,
        5,
        this.vision.completion_percent
      )
      
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.primaryGreen)
      this.doc.text(`${this.vision.completion_percent}%`, cardX + 115, cardCurrentY)
    }

    // Footer with inspirational note
    this.currentY = this.pageHeight - 50
    
    // Decorative quote box
    const quoteHeight = 30
    setFillColor(this.doc, PDF_COLORS.primaryGreenLighter)
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, quoteHeight, 3, 3, 'F')
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
    
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'italic')
    setTextColor(this.doc, PDF_COLORS.darkGray)
    this.doc.text(
      '"The future belongs to those who believe in the beauty of their dreams."',
      this.pageWidth / 2,
      this.currentY + quoteHeight / 2,
      { align: 'center', maxWidth: this.contentWidth - 20 }
    )
    
    // Final footer
    this.currentY = this.pageHeight - 15
    setDrawColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.setLineWidth(0.3)
    this.doc.line(this.margin, this.currentY - 5, this.pageWidth - this.margin, this.currentY - 5)
    
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      'Generated by VibrationFit • vibrationfit.com',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    )
  }

  private drawElegantVersionBadge(x: number, y: number, version: number, status: string): void {
    const badgeWidth = 100
    const badgeHeight = 16
    const badgeX = x - badgeWidth / 2
    
    // Background with gradient
    const statusColor = status === 'complete' ? PDF_COLORS.primaryGreen : PDF_COLORS.energyYellow
    setFillColor(this.doc, statusColor)
    this.doc.setGState(this.doc.GState({ opacity: 0.15 }))
    this.doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 3, 3, 'F')
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
    
    // Border
    setDrawColor(this.doc, statusColor)
    this.doc.setLineWidth(1)
    this.doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 3, 3, 'S')
    
    // Version text
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.darkGray)
    this.doc.text(`Version ${version}`, x - 20, y + 10)
    
    // Status dot
    const dotSize = 2
    setFillColor(this.doc, statusColor)
    this.doc.circle(x + 18, y + 7, dotSize, 'F')
    
    // Status text
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, statusColor)
    this.doc.text(status === 'complete' ? 'Complete' : 'Draft', x + 23, y + 10)
  }

  private drawStyledProgressBar(x: number, y: number, width: number, height: number, percentage: number): void {
    // Background with subtle border
    setFillColor(this.doc, '#F0F0F0')
    this.doc.roundedRect(x, y, width, height, 2, 2, 'F')
    
    setDrawColor(this.doc, PDF_COLORS.lightGray)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, 'S')
    
    // Fill - gradient effect
    const fillWidth = (width * percentage) / 100
    if (fillWidth > 0) {
      this.drawGradientBar(x, y, fillWidth, height, PDF_COLORS.primaryGreen, PDF_COLORS.secondaryTeal)
    }
  }

  private drawProfessionalDots(x: number, y: number, width: number): void {
    setDrawColor(this.doc, PDF_COLORS.lightGray)
    this.doc.setLineWidth(0.3)
    const dotSpacing = 2
    const dots = Math.floor(width / dotSpacing)
    for (let i = 0; i < dots; i += 2) {
      this.doc.circle(x + i * dotSpacing, y, 0.4, 'F')
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 15) {
      this.addPage()
    }
  }

  private addPage(): void {
    this.doc.addPage()
    this.currentY = this.margin
    
    // Clean white background
    setFillColor(this.doc, PDF_COLORS.pureWhite)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')
    
    // Subtle top accent bar
    setFillColor(this.doc, PDF_COLORS.primaryGreen)
    this.doc.rect(0, 0, this.pageWidth, 2, 'F')
    
    // Page number with style
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    const pageNum = this.doc.getCurrentPageInfo().pageNumber
    
    // Center page number with dots
    const pageText = `${pageNum}`
    const textWidth = this.doc.getTextWidth(pageText)
    const dotSpacing = 15
    
    setFillColor(this.doc, PDF_COLORS.primaryGreen)
    this.doc.circle(this.pageWidth / 2 - dotSpacing, this.pageHeight - 12, 1, 'F')
    this.doc.text(pageText, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
    this.doc.circle(this.pageWidth / 2 + dotSpacing, this.pageHeight - 12, 1, 'F')
  }

  // Drawing helpers
  private drawGradientBar(x: number, y: number, width: number, height: number, color1: string, color2: string): void {
    // Simulate gradient with multiple rectangles for smooth transition
    const steps = 30
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
      this.doc.rect(x + i * stepWidth, y, stepWidth + 0.1, height, 'F')
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
