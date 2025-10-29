// Assessment PDF Generator
// Generates beautiful PDFs of Vibration Assessments following VibrationFit design system
// Path: /src/lib/pdf/generators/assessment.ts

import { 
  BasePDFGenerator, 
  PDF_COLORS, 
  PDF_FONTS, 
  LINE_HEIGHT,
  setFillColor,
  setTextColor,
  setDrawColor
} from './base'

export interface AssessmentData {
  id: string
  user_id: string
  overall_percentage?: number
  status: string
  created_at: string
  completed_at?: string
  responses?: AssessmentResponse[]
  category_scores?: CategoryScore[]
}

export interface AssessmentResponse {
  id: string
  question_id: string
  question_text?: string
  response_value: number
  category?: string
}

export interface CategoryScore {
  category: string
  score: number
  percentage: number
}

export interface UserProfile {
  first_name?: string
  full_name?: string
  email?: string
}

export class AssessmentPDFGenerator extends BasePDFGenerator {
  private assessment: AssessmentData
  private userProfile?: UserProfile

  constructor(assessment: AssessmentData, userProfile?: UserProfile) {
    super('portrait')
    this.assessment = assessment
    this.userProfile = userProfile
    this.generate()
  }

  private generate(): void {
    this.addCoverPage()
    this.addOverviewSection()
    
    if (this.assessment.category_scores && this.assessment.category_scores.length > 0) {
      this.addCategoryScores()
    }
    
    if (this.assessment.responses && this.assessment.responses.length > 0) {
      this.addDetailedResponses()
    }
    
    this.addFooter()
  }

  private addCoverPage(): void {
    // Background
    setFillColor(this.doc, PDF_COLORS.pureBlack)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')

    // Top border
    setFillColor(this.doc, PDF_COLORS.secondaryTeal)
    this.doc.rect(0, 0, this.pageWidth, 8, 'F')

    const centerY = this.pageHeight / 2

    // Title
    this.doc.setFontSize(28)
    this.doc.setFont('helvetica', 'bold')
    setTextColor(this.doc, PDF_COLORS.secondaryTeal)
    const titleLines = this.doc.splitTextToSize('Vibration Assessment', this.contentWidth)
    const titleY = centerY - (titleLines.length * 28 * LINE_HEIGHT.title) / 2 - 30
    
    this.doc.text(titleLines, this.margin, titleY)
    let currentY = titleY + (titleLines.length * 28 * LINE_HEIGHT.title) + 15

    // Overall score (large and prominent)
    if (this.assessment.overall_percentage !== undefined) {
      const score = this.assessment.overall_percentage
      const isAboveGreenLine = score >= 50
      
      // Score circle/box
      const scoreSize = 60
      const scoreX = (this.pageWidth - scoreSize) / 2
      
      setFillColor(this.doc, isAboveGreenLine ? PDF_COLORS.primaryGreen : PDF_COLORS.vibrantRed)
      this.doc.circle(
        this.pageWidth / 2,
        currentY + scoreSize / 2,
        scoreSize / 2,
        'F'
      )
      
      // Score text
      this.doc.setFontSize(32)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.pureWhite)
      this.doc.text(
        `${score}%`,
        this.pageWidth / 2,
        currentY + scoreSize / 2 + 8,
        { align: 'center' }
      )
      
      // Status label
      currentY += scoreSize + 15
      this.doc.setFontSize(14)
      setTextColor(this.doc, isAboveGreenLine ? PDF_COLORS.primaryGreen : PDF_COLORS.vibrantRed)
      this.doc.text(
        isAboveGreenLine ? 'Above the Green Line' : 'Below the Green Line',
        this.pageWidth / 2,
        currentY,
        { align: 'center' }
      )
    }

    // User info
    if (this.userProfile?.first_name || this.userProfile?.full_name) {
      const userName = this.userProfile.first_name || this.userProfile.full_name || ''
      currentY += 25
      this.doc.setFontSize(11)
      setTextColor(this.doc, PDF_COLORS.lightGray)
      this.doc.text(
        `Assessment for ${userName}`,
        this.pageWidth / 2,
        currentY,
        { align: 'center' }
      )
    }

    // Date
    const dateCompleted = this.assessment.completed_at 
      ? new Date(this.assessment.completed_at)
      : new Date(this.assessment.created_at)
    
    this.doc.setFontSize(10)
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      `Completed on ${dateCompleted.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`,
      this.pageWidth / 2,
      this.pageHeight - 30,
      { align: 'center' }
    )

    this.addPage()
  }

  private addOverviewSection(): void {
    this.addTitle('Assessment Overview', PDF_COLORS.primaryGreen)
    this.addSpacer(10)

    // Overall Score Box
    if (this.assessment.overall_percentage !== undefined) {
      const score = this.assessment.overall_percentage
      const isAboveGreenLine = score >= 50
      
      setFillColor(this.doc, isAboveGreenLine ? PDF_COLORS.primaryGreen : PDF_COLORS.vibrantRed)
      const boxHeight = 25
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'F')
      
      this.doc.setFontSize(20)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.pureWhite)
      this.doc.text(
        `Overall Score: ${score}%`,
        this.margin + 5,
        this.currentY + boxHeight / 2 + 3
      )
      
      this.currentY += boxHeight + 10
    }

    // Status
    this.addSubheading('Status', PDF_COLORS.secondaryTeal)
    this.addBodyText(this.assessment.status || 'Unknown', PDF_COLORS.pureWhite)

    // Dates
    this.addSubheading('Assessment Dates', PDF_COLORS.secondaryTeal)
    this.addBodyText(
      `Started: ${new Date(this.assessment.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      PDF_COLORS.pureWhite
    )
    
    if (this.assessment.completed_at) {
      this.addBodyText(
        `Completed: ${new Date(this.assessment.completed_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        PDF_COLORS.pureWhite
      )
    }

    this.addPage()
  }

  private addCategoryScores(): void {
    if (!this.assessment.category_scores || this.assessment.category_scores.length === 0) {
      return
    }

    this.addTitle('Category Scores', PDF_COLORS.primaryGreen)
    this.addSpacer(10)

    this.assessment.category_scores.forEach((category) => {
      this.checkPageBreak(25)
      
      // Category name
      this.addSubheading(category.category, PDF_COLORS.secondaryTeal)
      
      // Score bar visualization
      const barWidth = this.contentWidth
      const barHeight = 8
      const percentage = category.percentage
      const isAboveGreenLine = percentage >= 50
      
      // Background bar
      setFillColor(this.doc, PDF_COLORS.darkGray)
      this.doc.roundedRect(this.margin, this.currentY, barWidth, barHeight, 2, 2, 'F')
      
      // Filled bar
      const filledWidth = (barWidth * percentage) / 100
      setFillColor(this.doc, isAboveGreenLine ? PDF_COLORS.primaryGreen : PDF_COLORS.vibrantRed)
      this.doc.roundedRect(this.margin, this.currentY, filledWidth, barHeight, 2, 2, 'F')
      
      // Percentage text
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      setTextColor(this.doc, PDF_COLORS.pureWhite)
      this.doc.text(
        `${percentage}%`,
        this.margin + filledWidth + 5,
        this.currentY + barHeight / 2 + 2
      )
      
      this.currentY += barHeight + 12
    })

    this.addPage()
  }

  private addDetailedResponses(): void {
    if (!this.assessment.responses || this.assessment.responses.length === 0) {
      return
    }

    this.addTitle('Detailed Responses', PDF_COLORS.primaryGreen)
    this.addSpacer(10)

    // Group by category if available
    const responsesByCategory = this.groupResponsesByCategory()

    if (responsesByCategory.size > 0) {
      responsesByCategory.forEach((responses, category) => {
        this.checkPageBreak(30)
        this.addSubheading(category || 'Other Questions', PDF_COLORS.accentPurple)
        
        responses.forEach((response) => {
          this.checkPageBreak(20)
          
          if (response.question_text) {
            this.doc.setFontSize(PDF_FONTS.body.size)
            this.doc.setFont('helvetica', 'normal')
            setTextColor(this.doc, PDF_COLORS.pureWhite)
            const questionLines = this.doc.splitTextToSize(
              `Q: ${response.question_text}`,
              this.contentWidth - 10
            )
            this.doc.text(questionLines, this.margin + 5, this.currentY)
            this.currentY += questionLines.length * PDF_FONTS.body.size * LINE_HEIGHT.body + 2
          }
          
          // Response value
          this.doc.setFontSize(PDF_FONTS.small.size)
          setTextColor(this.doc, PDF_COLORS.secondaryTeal)
          this.doc.text(
            `Response: ${response.response_value}`,
            this.margin + 10,
            this.currentY
          )
          this.currentY += 8
          
          this.addSpacer(3)
        })
      })
    } else {
      // No categories, just list all responses
      this.assessment.responses.forEach((response, index) => {
        this.checkPageBreak(25)
        
        this.doc.setFontSize(PDF_FONTS.body.size)
        this.doc.setFont('helvetica', 'normal')
        setTextColor(this.doc, PDF_COLORS.pureWhite)
        
        const questionText = response.question_text || `Question ${index + 1}`
        const questionLines = this.doc.splitTextToSize(
          `Q${index + 1}: ${questionText}`,
          this.contentWidth - 10
        )
        this.doc.text(questionLines, this.margin + 5, this.currentY)
        this.currentY += questionLines.length * PDF_FONTS.body.size * LINE_HEIGHT.body + 3
        
        // Response value
        this.doc.setFontSize(PDF_FONTS.small.size)
        setTextColor(this.doc, PDF_COLORS.secondaryTeal)
        this.doc.text(
          `Response: ${response.response_value}`,
          this.margin + 10,
          this.currentY
        )
        this.currentY += 10
      })
    }
  }

  private groupResponsesByCategory(): Map<string, AssessmentResponse[]> {
    const grouped = new Map<string, AssessmentResponse[]>()
    
    if (!this.assessment.responses) return grouped
    
    this.assessment.responses.forEach((response) => {
      const category = response.category || 'Other'
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(response)
    })
    
    return grouped
  }

  private addFooter(): void {
    this.currentY = this.pageHeight - 30
    this.addHorizontalLine(PDF_COLORS.mediumGray)
    
    this.doc.setFontSize(8)
    setTextColor(this.doc, PDF_COLORS.mediumGray)
    this.doc.text(
      'Generated by VibrationFit • vibrationfit.com',
      this.pageWidth / 2,
      this.currentY + 3,
      { align: 'center' }
    )
    
    this.doc.text(
      `Assessment ID: ${this.assessment.id}`,
      this.pageWidth / 2,
      this.currentY + 7,
      { align: 'center' }
    )
  }

  public download(): void {
    const date = new Date(this.assessment.completed_at || this.assessment.created_at)
      .toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    
    const filename = `Vibration_Assessment_${date}.pdf`
    super.download(filename)
  }
}

// Convenience function
export async function generateAssessmentPDF(
  assessment: AssessmentData,
  userProfile?: UserProfile
): Promise<void> {
  const generator = new AssessmentPDFGenerator(assessment, userProfile)
  generator.download()
}

