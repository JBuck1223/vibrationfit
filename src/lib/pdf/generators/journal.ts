// Journal PDF Generator
// Generates beautiful PDFs of Journal Entries following VibrationFit design system
// Path: /src/lib/pdf/generators/journal.ts

import { 
  BasePDFGenerator, 
  PDF_COLORS, 
  PDF_FONTS, 
  LINE_HEIGHT,
  setFillColor,
  setTextColor,
  setDrawColor
} from './base'

export interface JournalEntryData {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  entry_type?: string
  categories?: string[]
  image_urls?: string[]
  created_at: string
  updated_at?: string
}

export interface UserProfile {
  first_name?: string
  full_name?: string
  email?: string
}

export class JournalPDFGenerator extends BasePDFGenerator {
  private entries: JournalEntryData[]
  private userProfile?: UserProfile
  private title: string = 'Journal Entries'

  constructor(
    entries: JournalEntryData | JournalEntryData[],
    userProfile?: UserProfile,
    title?: string
  ) {
    super('portrait')
    this.entries = Array.isArray(entries) ? entries : [entries]
    this.userProfile = userProfile
    if (title) this.title = title
    this.generate()
  }

  private generate(): void {
    if (this.entries.length === 1) {
      this.generateSingleEntry()
    } else {
      this.generateMultipleEntries()
    }
    this.addFooter()
  }

  private generateSingleEntry(): void {
    const entry = this.entries[0]
    
    // Cover/title page for single entry
    this.addCoverPage(entry)
    
    // Content page
    this.addPage()
    this.addEntryContent(entry)
  }

  private generateMultipleEntries(): void {
    // Cover page
    this.addCoverPage()
    
    // Table of contents
    if (this.entries.length > 3) {
      this.addPage()
      this.addTableOfContents()
    }
    
    // Entries
    this.entries.forEach((entry, index) => {
      if (index > 0) {
        this.addPage()
      }
      this.addEntryContent(entry, index + 1)
    })
  }

  private addCoverPage(entry?: JournalEntryData): void {
    // Background
    setFillColor(this.doc, PDF_COLORS.pureBlack)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')

    // Top border
    setFillColor(this.doc, PDF_COLORS.accentPurple)
    this.doc.rect(0, 0, this.pageWidth, 8, 'F')

    const centerY = this.pageHeight / 2

    // Title
    this.doc.setFontSize(entry ? 24 : 28)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, entry ? PDF_COLORS.accentPurple : PDF_COLORS.secondaryTeal)
    
    const titleText = entry ? entry.title : this.title
    const titleLines = this.doc.splitTextToSize(titleText, this.contentWidth)
    const titleY = centerY - (titleLines.length * (entry ? 24 : 28) * LINE_HEIGHT.title) / 2 - 20
    
    this.doc.text(titleLines, this.margin, titleY)
    let currentY = titleY + (titleLines.length * (entry ? 24 : 28) * LINE_HEIGHT.title) + 15

    // Subtitle
    if (entry) {
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'normal')
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text('Journal Entry', this.margin, currentY)
      currentY += 15

      // Date
      const entryDate = new Date(entry.date || entry.created_at)
      this.doc.setFontSize(12)
      setTextColor(this.doc, PDF_COLORS.lightGray)
      this.doc.text(
        entryDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
        this.margin,
        currentY
      )
      currentY += 10

      // Entry type badge if available
      if (entry.entry_type) {
        setFillColor(this.doc, PDF_COLORS.darkGray)
        const badgeWidth = 60
        const badgeHeight = 10
        this.doc.roundedRect(this.margin, currentY, badgeWidth, badgeHeight, 2, 2, 'F')
        
        this.doc.setFontSize(9)
        setTextColor(this.doc, PDF_COLORS.accentPurple)
        this.doc.text(
          entry.entry_type.toUpperCase(),
          this.margin + badgeWidth / 2,
          currentY + badgeHeight / 2 + 1,
          { align: 'center' }
        )
        currentY += 15
      }
    } else {
      // Multiple entries - show count
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'normal')
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text(
        `${this.entries.length} Entries`,
        this.pageWidth / 2,
        currentY,
        { align: 'center' }
      )
      currentY += 20
    }

    // User name if available
    if (this.userProfile?.first_name || this.userProfile?.full_name) {
      const userName = this.userProfile.first_name || this.userProfile.full_name || ''
      this.doc.setFontSize(11)
      setTextColor(this.doc, PDF_COLORS.lightGray)
      this.doc.text(
        `By ${userName}`,
        this.pageWidth / 2,
        this.pageHeight - 40,
        { align: 'center' }
      )
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
      this.pageHeight - 25,
      { align: 'center' }
    )
  }

  private addTableOfContents(): void {
    this.addTitle('Table of Contents', PDF_COLORS.accentPurple)
    this.addSpacer(10)

    this.entries.forEach((entry, index) => {
      this.checkPageBreak(10)
      
      const date = new Date(entry.date || entry.created_at)
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      
      const title = entry.title || `Entry ${index + 1}`
      
      this.doc.setFontSize(PDF_FONTS.body.size)
      this.doc.setFont('helvetica', 'normal')
      setTextColor(this.doc, PDF_COLORS.pureWhite)
      this.doc.text(title, this.margin, this.currentY)
      
      setTextColor(this.doc, PDF_COLORS.lightGray)
      this.doc.text(dateStr, this.pageWidth - this.margin - 30, this.currentY)
      
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text(
        `${index + 3}`, // +3 because cover page and toc page, then first entry
        this.pageWidth - this.margin,
        this.currentY,
        { align: 'right' }
      )
      
      this.currentY += 8
    })
  }

  private addEntryContent(entry: JournalEntryData, entryNumber?: number): void {
    // Entry header
    this.addDivider(PDF_COLORS.accentPurple)
    
    if (entryNumber) {
      this.doc.setFontSize(PDF_FONTS.small.size)
      setTextColor(this.doc, PDF_COLORS.mediumGray)
      this.doc.text(`Entry ${entryNumber}`, this.margin, this.currentY)
      this.currentY += 5
    }

    // Title
    this.addHeading(entry.title || 'Untitled Entry', PDF_COLORS.accentPurple)
    
    // Date and metadata
    const entryDate = new Date(entry.date || entry.created_at)
    this.doc.setFontSize(PDF_FONTS.small.size)
    setTextColor(this.doc, PDF_COLORS.lightGray)
    this.doc.text(
      entryDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      this.margin,
      this.currentY
    )
    this.currentY += 6

    // Entry type badge
    if (entry.entry_type) {
      setFillColor(this.doc, PDF_COLORS.darkGray)
      const badgeWidth = 50
      const badgeHeight = 8
      this.doc.roundedRect(this.margin, this.currentY, badgeWidth, badgeHeight, 2, 2, 'F')
      
      this.doc.setFontSize(8)
      setTextColor(this.doc, PDF_COLORS.accentPurple)
      this.doc.text(
        entry.entry_type.toUpperCase(),
        this.margin + badgeWidth / 2,
        this.currentY + badgeHeight / 2 + 1,
        { align: 'center' }
      )
      this.currentY += badgeHeight + 8
    }

    // Categories if available
    if (entry.categories && entry.categories.length > 0) {
      this.doc.setFontSize(PDF_FONTS.small.size)
      setTextColor(this.doc, PDF_COLORS.secondaryTeal)
      this.doc.text(
        `Categories: ${entry.categories.join(', ')}`,
        this.margin,
        this.currentY
      )
      this.currentY += 6
    }

    // Content
    this.addSpacer(5)
    this.addBodyText(entry.content, PDF_COLORS.pureWhite)

    // Image placeholder if images exist
    if (entry.image_urls && entry.image_urls.length > 0) {
      this.addSpacer(5)
      this.doc.setFontSize(PDF_FONTS.small.size)
      setTextColor(this.doc, PDF_COLORS.mediumGray)
      this.doc.text(
        `[${entry.image_urls.length} image(s) attached - not included in PDF]`,
        this.margin + 5,
        this.currentY
      )
      this.currentY += 6
    }
  }

  private addFooter(): void {
    this.currentY = this.pageHeight - 30
    this.addHorizontalLine(PDF_COLORS.mediumGray)
    
    this.doc.setFontSize(8)
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      'Generated by VibrationFit • Conscious Creation Journal',
      this.pageWidth / 2,
      this.currentY + 3,
      { align: 'center' }
    )
    
    if (this.entries.length === 1) {
      this.doc.text(
        `Entry ID: ${this.entries[0].id}`,
        this.pageWidth / 2,
        this.currentY + 7,
        { align: 'center' }
      )
    }
  }

  public download(): void {
    if (this.entries.length === 1) {
      const entry = this.entries[0]
      const date = new Date(entry.date || entry.created_at)
        .toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\//g, '-')
      const title = entry.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)
      const filename = `Journal_${date}_${title}.pdf`
      super.download(filename)
    } else {
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\//g, '-')
      const filename = `Journal_Entries_${date}.pdf`
      super.download(filename)
    }
  }
}

// Convenience function for single entry
export async function generateJournalPDF(
  entry: JournalEntryData,
  userProfile?: UserProfile
): Promise<void> {
  const generator = new JournalPDFGenerator(entry, userProfile)
  generator.download()
}

// Convenience function for multiple entries
export async function generateJournalCollectionPDF(
  entries: JournalEntryData[],
  userProfile?: UserProfile,
  title?: string
): Promise<void> {
  const generator = new JournalPDFGenerator(entries, userProfile, title)
  generator.download()
}

