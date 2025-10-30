// PDF Generation API Route using Puppeteer
// Path: /src/app/api/pdf/vision/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow 60 seconds for PDF generation

interface VisionData {
  id: string
  user_id: string
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

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export async function GET(req: NextRequest) {
  try {
    // Get search params
    const searchParams = req.nextUrl.searchParams
    const visionId = searchParams.get('id')
    const preview = searchParams.get('preview') === 'true'
    const primary = searchParams.get('primary') || '00CC44'
    const accent = searchParams.get('accent') || '39FF14'
    const textColor = searchParams.get('text') || '1F1F1F'
    const bgColor = searchParams.get('bg') || 'FFFFFF'

    if (!visionId) {
      return NextResponse.json({ error: 'Vision ID is required' }, { status: 400 })
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch vision data
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Fetch user profile for name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const userName = (profile?.first_name && profile?.last_name) 
                     ? `${profile.first_name} ${profile.last_name}`
                     : profile?.first_name || profile?.last_name || 'User'
    const title = vision.title || 'My Life Vision'
    const createdDate = new Date(vision.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    // Filter categories with content
    const categoriesWithContent = VISION_CATEGORIES.filter(cat => {
      const content = vision[cat.key as keyof VisionData] as string
      return content && content.trim().length > 0
    })

    // Build HTML content
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: Letter;
      margin: 0.5in;
    }

    @media print {
      html, body {
        background: #fff;
        color: #111;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-size: 12pt;
        line-height: 1.6;
      }

      h1, h2, h3 { break-after: auto; }
      p { orphans: 2; widows: 2; margin: 8pt 0; }
    }

    html, body {
      background: ${bgColor};
      color: ${textColor};
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
    }

    main {
      max-width: 850px;
      margin: 0 auto;
      padding: 20pt;
    }

    .cover {
      text-align: center;
      height: calc(100vh - 1in);
      min-height: calc(100vh - 1in);
      max-height: calc(100vh - 1in);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40pt 20pt;
      box-sizing: border-box;
    }

    .cover-title {
      font-size: 48pt;
      font-weight: 700;
      color: #${primary};
      margin-bottom: 32pt;
    }

    .cover-by {
      font-size: 16pt;
      color: #${textColor};
      margin-bottom: 16pt;
    }

    .cover-date {
      font-size: 14pt;
      color: #${textColor};
      margin-bottom: 32pt;
    }

    .cover-info {
      font-size: 12pt;
      color: #${textColor};
      line-height: 2;
    }
    
    .version-badge {
      display: inline-block;
      padding: 6pt 16pt;
      background-color: #${primary};
      color: ${bgColor === 'FFFFFF' ? '#fff' : '#fff'};
      border-radius: 50px;
      font-weight: 600;
      font-size: 11pt;
    }

    h2 {
      font-size: 18pt;
      margin: 0 0 12pt;
      color: #${primary};
      border-bottom: 3px solid #${accent};
      padding-bottom: 8pt;
      page-break-after: avoid;
    }

    .mute {
      color: #64748b;
      font-size: 10pt;
    }

    .section-content {
      line-height: 1.8;
      margin-top: 12pt;
    }

    section {
      margin-bottom: 40pt;
      page-break-inside: auto;
    }
    
    .toc {
      padding: 20pt 0 20pt;
      page-break-before: always;
      page-break-after: auto;
      page-break-inside: avoid;
      min-height: 0;
    }
    
    .toc h2 {
      page-break-after: avoid;
    }
    
    .toc-item {
      margin-bottom: 12pt;
      display: flex;
      align-items: center;
      gap: 12pt;
    }
    
    .toc-number {
      width: 24pt;
      height: 24pt;
      border-radius: 50%;
      background-color: #${primary};
      color: ${bgColor === 'FFFFFF' ? '#fff' : '#fff'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 11pt;
      flex-shrink: 0;
    }
    
    .toc-text {
      flex: 0 0 auto;
      color: #${textColor};
      margin-right: 8pt;
      white-space: nowrap;
    }
    
    .toc-dots {
      flex: 1 1 auto;
      color: #ccc;
      overflow: hidden;
      white-space: nowrap;
      text-align: left;
      font-size: 8pt;
      letter-spacing: 2pt;
      min-width: 0;
      border-bottom: 1px dotted #ccc;
      margin: 0 8pt 4pt 0;
      height: 1px;
      align-self: center;
    }
    
    .toc-page {
      color: #666;
      font-size: 10pt;
      flex-shrink: 0;
      min-width: 24pt;
      text-align: right;
    }
  </style>
</head>
<body>
  <main>
    <header class="cover" style="page-break-after: always; page-break-inside: avoid;">
      <h1 class="cover-title">The Life I Choose</h1>
      <div class="cover-by"><strong>By ${escapeHtml(userName)}</strong></div>
      <div class="cover-date">Created ${createdDate}</div>
      
      ${vision.version_number > 1 ? `
        <div style="display: inline-block; margin-top: 16pt;">
          <span class="version-badge">Version ${vision.version_number}</span>
        </div>
      ` : ''}
    </header>

    <!-- Table of Contents -->
    <section class="toc">
      <h2 style="font-size: 24pt; margin-bottom: 24pt; color: #${primary}; border-bottom: 2px solid #${accent}; padding-bottom: 12pt;">
        Table of Contents
      </h2>
      <div style="padding-top: 8pt;">
        ${categoriesWithContent.map((category, index) => {
          // Page numbers will be calculated dynamically after rendering
          return `
          <div class="toc-item">
            <div class="toc-number">${index + 1}</div>
            <div class="toc-text">${escapeHtml(category.label)}</div>
            <div class="toc-dots"></div>
            <div class="toc-page" data-category="${category.key}">...</div>
          </div>
        `
        }).join('')}
      </div>
    </section>

    ${categoriesWithContent.map((category) => {
      const content = vision[category.key as keyof VisionData] as string
      if (!content || !content.trim()) return ''

      const paragraphs = content.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      if (paragraphs.length === 0) return ''

      return `
      <section style="margin-bottom: 40pt;">
        <h2>${escapeHtml(category.label)}</h2>
        <div class="section-content">
          ${paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </div>
      </section>
      `
    }).join('')}

  </main>
</body>
</html>`

    // If preview mode, add JavaScript to calculate and display page numbers
    if (preview) {
      const htmlWithPageNumbers = html.replace(
        '</body>',
        `
        <script>
          (function() {
            window.addEventListener('load', function() {
              setTimeout(function() {
                const sections = Array.from(document.querySelectorAll('section > h2'));
                const tocItems = Array.from(document.querySelectorAll('.toc-item'));
                
                const pageHeightPoints = 720;
                const coverPageHeight = pageHeightPoints;
                const tocPageHeight = pageHeightPoints;
                
                sections.forEach(function(h2) {
                  const box = h2.getBoundingClientRect();
                  const categoryText = h2.textContent || '';
                  
                  let elementTop = box.top + window.pageYOffset;
                  elementTop -= (coverPageHeight + tocPageHeight);
                  
                  let pageNum = 3;
                  if (elementTop > 0) {
                    pageNum = Math.floor(elementTop / pageHeightPoints) + 3;
                    pageNum = Math.max(3, pageNum);
                  }
                  
                  tocItems.forEach(function(item) {
                    const tocText = item.querySelector('.toc-text')?.textContent || '';
                    if (tocText === categoryText) {
                      const pageElement = item.querySelector('.toc-page');
                      if (pageElement) {
                        pageElement.textContent = String(pageNum);
                      }
                    }
                  });
                });
              }, 300);
            });
          })();
        </script>
        </body>`
      )
      
      return new NextResponse(htmlWithPageNumbers, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })
      
      const page = await browser.newPage()

    // Set HTML content and wait for it to load
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })

    // Wait a bit for layout to settle
    await new Promise(resolve => setTimeout(resolve, 500))

    // Calculate actual page numbers for TOC by finding positions of section headings
    // We need to account for PDF page dimensions: Letter size with 0.5in margins
    const tocPageNumbers = await page.evaluate(() => {
      const tocItems = Array.from(document.querySelectorAll('.toc-item'))
      const sections = Array.from(document.querySelectorAll('section > h2'))
      const pageNumbers: Record<string, number> = {}
      
      // Letter page: 11in height, 0.5in margins = 10in usable = 720 points
      const pageHeightPoints = 720 // 10 inches * 72 points per inch
      const coverPageHeight = pageHeightPoints
      const tocPageHeight = pageHeightPoints
      
      // Get bounding boxes for all section headings relative to document
      sections.forEach((h2) => {
        const box = h2.getBoundingClientRect()
        const categoryText = h2.textContent || ''
        
        // Get element's position relative to document top
        let elementTop = box.top + window.pageYOffset
        
        // Account for cover page (page 1) and TOC (page 2)
        // Content sections start after cover + TOC
        elementTop -= (coverPageHeight + tocPageHeight)
        
        // Calculate which page this section starts on (page 3, 4, 5, etc.)
        if (elementTop > 0) {
          const pageNum = Math.floor(elementTop / pageHeightPoints) + 3
          pageNumbers[categoryText] = Math.max(3, pageNum)
        } else {
          pageNumbers[categoryText] = 3
        }
      })
      
      return pageNumbers
    })

    // Update TOC with actual page numbers
    if (Object.keys(tocPageNumbers).length > 0) {
      await page.evaluate((pageNumbers) => {
        const tocItems = Array.from(document.querySelectorAll('.toc-item'))
        tocItems.forEach((item) => {
          const categoryText = item.querySelector('.toc-text')?.textContent || ''
          const pageElement = item.querySelector('.toc-page')
          if (pageElement && categoryText in pageNumbers) {
            pageElement.textContent = String(pageNumbers[categoryText])
          }
        })
      }, tocPageNumbers)
    }

    // Generate PDF (Puppeteer will handle page numbers in its footer template)
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width: 100%; text-align: center; font-size: 10pt; color: #666; padding: 0 20pt;"><span class="pageNumber"></span></div>',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.75in',
        left: '0.5in'
      }
    })

    // Close browser
    await browser.close()

    // Return PDF as response
    const filename = `life-vision-v${vision.version_number}.pdf`
    return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
