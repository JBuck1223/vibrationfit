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
    const primary = searchParams.get('primary') || '199D67'
    const accent = searchParams.get('accent') || '8B5CF6'
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
      .select('first_name, full_name')
      .eq('user_id', user.id)
      .single()

    const userName = profile?.full_name || profile?.first_name || 'User'
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

      h1, h2, h3 { break-after: avoid-page; }
      section { break-inside: avoid; }
      p { orphans: 2; widows: 2; margin: 8pt 0; }
      article { break-inside: auto; }
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
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40pt 20pt;
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

    .cover-divider {
      width: 60px;
      height: 2px;
      background: #${accent};
      margin: 32pt auto;
    }

    .cover-footer {
      position: absolute;
      bottom: 24pt;
      left: 0;
      right: 0;
      font-size: 9pt;
      color: #64748b;
      text-align: center;
    }

    h2 {
      font-size: 18pt;
      margin: 0 0 12pt;
      color: #${primary};
      border-bottom: 2px solid #${accent};
      padding-bottom: 8pt;
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
    }
    
    section:not(:first-child) {
      margin-top: 40pt;
    }
    
    @media print {
      @page {
        @bottom-center {
          content: counter(page);
          font-size: 10pt;
          color: #666;
        }
      }
    }
  </style>
</head>
<body>
  <main>
    <header class="cover" style="page-break-after: always; position: relative;">
      <h1 class="cover-title">The Life I Choose</h1>
      <div class="cover-by">By ${escapeHtml(userName)}</div>
      <div class="cover-date">Created ${createdDate}</div>
      
      <div class="cover-info">
        Version ${vision.version_number}<br>
        ID: ${vision.id.substring(0, 8)}...
      </div>
      
      <div class="cover-divider"></div>
      
      <div class="cover-footer">VIBRATIONFIT</div>
    </header>

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
        ${category.description ? `
        <div class="mute">${escapeHtml(category.description)}</div>
        ` : ''}
        <div class="section-content">
          ${paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </div>
      </section>
      `
    }).join('')}

    <section style="page-break-before: always; margin-top: 40pt;">
      <h2 style="font-size: 20pt; margin-bottom: 12pt; color: #${accent};">
        Vision Summary
      </h2>
      <div class="section-content">
        <p style="margin-bottom: 8pt;">
          <strong style="color: #${primary};">Version:</strong> ${vision.version_number}
        </p>
        <p style="margin-bottom: 8pt;">
          <strong style="color: #${primary};">Status:</strong>
          <span style="color: ${vision.status === 'complete' ? '#' + primary : '#FFB701'}; font-weight: 600;">
            ${vision.status === 'complete' ? 'Complete' : 'Draft'}
          </span>
        </p>
        <p style="margin-bottom: 8pt;">
          <strong style="color: #${primary};">Created:</strong> ${createdDate}
        </p>
        ${vision.updated_at ? `
        <p style="margin-bottom: 8pt;">
          <strong style="color: #${primary};">Last Updated:</strong>
          ${new Date(vision.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
        ` : ''}
      </div>
      
      <div style="margin-top: 40pt; padding-top: 24pt; border-top: 1px solid #e5e7eb; text-align: center;">
        <div style="font-style: italic; margin-bottom: 24pt; font-size: 14pt;">
          "The future belongs to those who believe in the beauty of their dreams."
        </div>
        <div class="mute" style="font-size: 9pt; letter-spacing: 1px;">
          Generated by VibrationFit • vibrationfit.com
        </div>
      </div>
    </section>
  </main>
</body>
</html>`

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

    // Generate PDF with page numbers
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width: 100%; text-align: center; font-size: 10pt; color: #666; margin: 0 auto;"><span class="pageNumber"></span></div>',
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
