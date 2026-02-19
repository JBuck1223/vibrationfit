// HTML-based Vision PDF Template
// Creates beautiful PDFs using HTML/CSS for full design control
// Path: /src/lib/pdf/generators/templates/vision-html-template.ts

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { VisionData, UserProfile } from '../vision'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export async function generateVisionPDFFromHTML(
  vision: VisionData,
  userProfile?: UserProfile,
  includeEmptySections: boolean = false
): Promise<void> {
  // Create a temporary container element
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '794px' // A4 width at 96dpi (210mm)
  container.style.backgroundColor = '#FFFFFF'
  
  // Generate and inject HTML
  container.innerHTML = generateVisionHTML(vision, userProfile, includeEmptySections)
  
  // Append to body (temporarily)
  document.body.appendChild(container)
  
  try {
    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Capture each page
    const pages = container.querySelectorAll('.page')
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement
      
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 794,
        height: Math.min(page.scrollHeight, 1123), // Max A4 height
        onclone: (clonedDoc) => {
          // Fix any color issues in cloned document
          const clonedPages = clonedDoc.querySelectorAll('.page')
          const clonedPage = clonedPages[i] as HTMLElement
          if (clonedPage) {
            // Force white background
            clonedPage.style.backgroundColor = '#FFFFFF'
            
            // Fix any oklab/oklch colors to RGB
            const allElements = clonedPage.querySelectorAll('*')
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement
              const computed = window.getComputedStyle(htmlEl)
              
              // Replace any problematic color functions
              if (computed.color && (computed.color.includes('oklab') || computed.color.includes('oklch'))) {
                // Fallback to nearest equivalent
                htmlEl.style.color = computed.color.startsWith('rgb') ? computed.color : '#1F1F1F'
              }
              
              if (computed.backgroundColor && (computed.backgroundColor.includes('oklab') || computed.backgroundColor.includes('oklch'))) {
                htmlEl.style.backgroundColor = computed.backgroundColor.startsWith('rgb') ? computed.backgroundColor : '#FFFFFF'
              }
            })
          }
        },
      })
      
      const imgData = canvas.toDataURL('image/png', 0.95)
      
      if (i > 0) {
        doc.addPage()
      }
      
      // Calculate dimensions to fit A4
      const imgWidth = 210 // A4 width in mm
      const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 297) // Max A4 height
      
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
    }
    
    const title = vision.title || 'Life Vision'
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_V${vision.version_number}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

function generateVisionHTML(
  vision: VisionData,
  userProfile?: UserProfile,
  includeEmptySections: boolean = false
): string {
  const categories = VISION_CATEGORIES.filter(cat => {
    if (includeEmptySections) return true
    const content = vision[cat.key as keyof VisionData] as string
    return content && content.trim().length > 0
  })

  const title = vision.title || 'The Life I Choose'
  const userName = userProfile?.first_name || userProfile?.full_name || ''
  const createdDate = new Date(vision.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Vision Document</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #1F1F1F;
      background: #FFFFFF;
      font-size: 14px;
    }
    
    .page {
      width: 794px;
      min-height: 1123px; /* A4 height at 96dpi */
      padding: 0;
      margin: 0;
      background: white;
      page-break-after: always;
      position: relative;
      display: block;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Cover Page */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 1123px;
      background: linear-gradient(135deg, #199D67 0%, #14B8A6 100%);
      position: relative;
      padding: 150px 113px;
      text-align: center;
    }
    
    .cover::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 227px;
      background: linear-gradient(135deg, #199D67 0%, #14B8A6 100%);
    }
    
    .cover-content {
      position: relative;
      z-index: 1;
      background: white;
      padding: 227px 151px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 605px;
    }
    
    .cover-title {
      font-size: 48px;
      font-weight: 700;
      color: #199D67;
      margin-bottom: 20px;
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-size: 20px;
      color: #14B8A6;
      margin-bottom: 40px;
      font-weight: 400;
    }
    
    .cover-divider {
      width: 60px;
      height: 2px;
      background: #14B8A6;
      margin: 0 auto 40px;
    }
    
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      background: ${!vision.is_draft ? '#199D67' : '#FFB701'}15;
      border: 2px solid ${!vision.is_draft ? '#199D67' : '#FFB701'};
      border-radius: 50px;
      margin-bottom: 30px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .cover-badge .version {
      color: #199D67;
      font-weight: 700;
    }
    
    .cover-badge .status {
      color: ${!vision.is_draft ? '#199D67' : '#FFB701'};
    }
    
    .cover-progress {
      margin: 30px 0;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #F0F0F0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #199D67 0%, #14B8A6 100%);
      border-radius: 4px;
      transition: width 0.3s;
    }
    
    .cover-author {
      margin-top: 40px;
      font-size: 14px;
      color: #404040;
    }
    
    .cover-date {
      margin-top: 20px;
      font-size: 12px;
      color: #666666;
    }
    
    .cover-brand {
      margin-top: 40px;
      font-size: 11px;
      color: #999999;
      letter-spacing: 1px;
    }
    
    /* Table of Contents */
    .toc-page {
      padding: 113px 76px;
    }
    
    .toc-title {
      font-size: 36px;
      font-weight: 700;
      color: #199D67;
      margin-bottom: 38px;
      padding-bottom: 10px;
      border-bottom: 3px solid #199D67;
    }
    
    .toc-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px dotted #DDD;
    }
    
    .toc-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #14B8A6;
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
      margin-right: 15px;
    }
    
    .toc-label {
      flex: 1;
      font-size: 14px;
      color: #1F1F1F;
    }
    
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #DDD;
      margin: 0 15px;
      height: 1px;
    }
    
    .toc-page-num {
      font-weight: 600;
      color: #14B8A6;
      font-size: 13px;
    }
    
    /* Section Pages */
    .section-page {
      padding: 95px 76px;
    }
    
    .section-header {
      background: linear-gradient(135deg, #199D67 0%, #14B8A6 100%);
      padding: 57px 76px;
      margin: -95px -76px 76px -76px;
      color: white;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .section-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: white;
      color: #199D67;
      border-radius: 50%;
      font-size: 18px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .section-title-group {
      flex: 1;
    }
    
    .section-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .section-description {
      font-size: 13px;
      opacity: 0.95;
      font-weight: 400;
    }
    
    .section-content {
      background: #FAFAFA;
      padding: 76px;
      border-radius: 8px;
      border-left: 4px solid #199D67;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-top: 57px;
      line-height: 1.8;
      font-size: 14px;
      color: #1F1F1F;
      white-space: pre-wrap;
    }
    
    .section-content.empty {
      border-left-color: #DDD;
      color: #666;
      font-style: italic;
      text-align: center;
      padding: 113px 76px;
    }
    
    /* Summary Page */
    .summary-page {
      padding: 113px 76px;
    }
    
    .summary-title {
      font-size: 36px;
      font-weight: 700;
      color: #8B5CF6;
      margin-bottom: 38px;
      padding-bottom: 10px;
      border-bottom: 3px solid #8B5CF6;
    }
    
    .summary-card {
      background: #FAFAFA;
      padding: 76px;
      border-radius: 8px;
      border: 2px solid #8B5CF6;
      margin-bottom: 76px;
    }
    
    .summary-row {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #EEE;
    }
    
    .summary-row:last-child {
      border-bottom: none;
    }
    
    .summary-label {
      font-weight: 700;
      color: #14B8A6;
      min-width: 100px;
      font-size: 13px;
    }
    
    .summary-value {
      color: #1F1F1F;
      font-size: 13px;
    }
    
    .summary-progress {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-top: 15px;
    }
    
    .summary-progress-bar {
      flex: 1;
      height: 8px;
      background: #F0F0F0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .summary-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #199D67 0%, #14B8A6 100%);
      border-radius: 4px;
    }
    
    .summary-progress-text {
      font-weight: 700;
      color: #199D67;
      font-size: 13px;
      min-width: 50px;
    }
    
    .summary-footer {
      margin-top: 151px;
      padding-top: 76px;
      border-top: 1px solid #EEE;
      text-align: center;
    }
    
    .summary-quote {
      background: rgba(25, 157, 103, 0.08);
      padding: 57px;
      border-radius: 8px;
      border-left: 4px solid #199D67;
      font-style: italic;
      font-size: 14px;
      color: #1F1F1F;
      margin-bottom: 57px;
      line-height: 1.8;
    }
    
    .summary-branding {
      font-size: 10px;
      color: #999;
      letter-spacing: 1px;
    }
    
    /* Page Numbers */
    .page-number {
      position: absolute;
      bottom: 57px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: #999;
    }
    
    @media print {
      .page {
        page-break-after: always;
      }
      .page:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover">
    <div class="cover-content">
      <h1 class="cover-title">${escapeHtml(title)}</h1>
      <p class="cover-subtitle">Life Vision Document</p>
      <div class="cover-divider"></div>
      
      <div class="cover-badge">
        <span class="version">V${vision.version_number}</span>
        <span class="status">${!vision.is_draft ? (vision.is_active ? 'Active' : 'Complete') : 'Draft'}</span>
      </div>
      
      ${vision.completion_percent !== undefined ? `
      <div class="cover-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${vision.completion_percent}%"></div>
        </div>
        <div style="text-align: center; font-weight: 600; color: #199D67; font-size: 13px;">
          ${vision.completion_percent}% Complete
        </div>
      </div>
      ` : ''}
      
      ${userName ? `<p class="cover-author">Created by ${escapeHtml(userName)}</p>` : ''}
      <p class="cover-date">${createdDate}</p>
      <p class="cover-brand">VIBRATIONFIT</p>
    </div>
  </div>
  
  <!-- Table of Contents -->
  <div class="page toc-page">
    <h1 class="toc-title">Table of Contents</h1>
    ${categories.map((category, index) => {
      const pageNum = index + 3 // Cover (1) + TOC (2) + sections start at 3
      return `
      <div class="toc-item">
        <span class="toc-number">${index + 1}</span>
        <span class="toc-label">${escapeHtml(category.label)}</span>
        <span class="toc-dots"></span>
        <span class="toc-page-num">${pageNum}</span>
      </div>
      `
    }).join('')}
  </div>
  
  <!-- Section Pages -->
  ${categories.map((category, index) => {
    const content = vision[category.key as keyof VisionData] as string
    const hasContent = content && content.trim().length > 0
    
    return `
    <div class="page section-page">
      <div class="section-header">
        <div class="section-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="section-title-group">
          <h2 class="section-title">${escapeHtml(category.label)}</h2>
          ${category.description ? `<p class="section-description">${escapeHtml(category.description)}</p>` : ''}
        </div>
      </div>
      
      ${hasContent ? `
      <div class="section-content">
${escapeHtml(content)}
      </div>
      ` : includeEmptySections ? `
      <div class="section-content empty">
        No ${category.label.toLowerCase()} vision defined yet
      </div>
      ` : ''}
    </div>
    `
  }).join('')}
  
  <!-- Summary Page -->
  <div class="page summary-page">
    <h1 class="summary-title">Vision Summary</h1>
    
    <div class="summary-card">
      <div class="summary-row">
        <span class="summary-label">Version:</span>
        <span class="summary-value">${vision.version_number}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Status:</span>
        <span class="summary-value" style="color: ${!vision.is_draft ? '#199D67' : '#FFB701'}; font-weight: 600;">
          ${!vision.is_draft ? (vision.is_active ? 'Active' : 'Complete') : 'Draft'}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Created:</span>
        <span class="summary-value">${createdDate}</span>
      </div>
      ${vision.updated_at ? `
      <div class="summary-row">
        <span class="summary-label">Last Updated:</span>
        <span class="summary-value">${new Date(vision.updated_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}</span>
      </div>
      ` : ''}
      ${vision.completion_percent !== undefined ? `
      <div class="summary-row">
        <span class="summary-label">Progress:</span>
        <div class="summary-progress">
          <div class="summary-progress-bar">
            <div class="summary-progress-fill" style="width: ${vision.completion_percent}%"></div>
          </div>
          <span class="summary-progress-text">${vision.completion_percent}%</span>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="summary-footer">
      <div class="summary-quote">
        "The future belongs to those who believe in the beauty of their dreams."
      </div>
      <p class="summary-branding">Generated by Vibration Fit • vibrationfit.com</p>
    </div>
  </div>
</body>
</html>
  `
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

