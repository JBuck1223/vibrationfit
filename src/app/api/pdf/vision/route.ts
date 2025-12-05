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
    const primary = searchParams.get('primary') || '000000'
    const accent = searchParams.get('accent') || '9CA3AF'
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

    // Get calculated version number using database function
    const { data: versionData, error: versionError } = await supabase
      .rpc('get_vision_version_number', { p_vision_id: visionId })
    
    const versionNumber = versionData || 1 // Fallback to 1 if function fails
    console.log('Vision version number:', versionNumber, 'from function get_vision_version_number')

    // Fetch user profile for name (get active profile)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (profileError) {
      console.warn('Failed to fetch user profile for PDF:', profileError.message)
      console.log('Attempted to fetch profile for user_id:', user.id)
    }
    
    console.log('Profile data:', profile)

    // Get user name from profile, or fall back to email
    let userName = 'User'
    if (profile?.first_name && profile?.last_name) {
      userName = `${profile.first_name} ${profile.last_name}`
    } else if (profile?.first_name) {
      userName = profile.first_name
    } else if (profile?.last_name) {
      userName = profile.last_name
    } else if (user.email) {
      // Extract name from email as last resort (e.g., "john.doe@example.com" -> "John Doe")
      const emailName = user.email.split('@')[0]
      userName = emailName
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }
    
    console.log('PDF Generation - User name:', userName, '(from profile:', !!profile, ', email:', !!user.email, ')')
    const title = 'The Life I Choose' // Fixed title for all PDFs
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
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

    * {
      box-sizing: border-box;
    }

    html, body {
      background: #${bgColor};
      color: #${textColor};
      margin: 0;
      padding: 0;
      width: 100%;
      overflow-x: hidden;
    }

    body {
      font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      width: 100%;
      position: relative;
    }

    @media (max-width: 600px) {
      body {
        font-size: 11pt;
      }
      
      h2 {
        font-size: 16pt;
      }
      
      main {
        padding: 15pt;
      }

      .cover-version {
        font-size: 14pt;
        color: #666666;
        margin-top: 4pt;
        margin-bottom: 0;
        letter-spacing: 0.10em;
      }

      .cover-by {
        font-size: 12pt;
        white-space: nowrap;
        margin-top: 16pt;
      }

      .cover-date {
        font-size: 11pt;
        white-space: nowrap;
        margin-top: 16pt;
      }
    }

    main {
      max-width: 850px;
      margin: 0 auto;
      padding: 0;
      width: 100%;
      position: relative;
      overflow-x: hidden;
    }

    .cover {
      text-align: center;
      min-height: 300pt;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20pt;
      box-sizing: border-box;
      page-break-inside: avoid;
      overflow: hidden;
    }

    @media (min-width: 601px) {
      .cover {
        min-height: 720pt;
        height: 720pt;
        max-height: 720pt;
        padding: 40pt 20pt;
        page-break-after: always;
      }
    }

    @media print {
      .cover {
        page-break-after: always;
      }
      
      section:first-of-type {
        margin-top: 0;
        padding-top: 0;
      }
    }

    .cover-title {
      font-size: 22pt;
      font-weight: 700;
      color: #${primary};
      margin-bottom: 0;
      line-height: 1.25;
      word-spacing: -0.03em;
    }

    @media (min-width: 601px) {
      .cover-title {
        font-size: 48pt;
        line-height: 1.1;
        word-spacing: normal;
      }
    }

    .cover-version {
      font-size: 14pt;
      color: #666666;
      margin-top: 4pt;
      margin-bottom: 0;
      letter-spacing: 0.10em;
    }

    @media (min-width: 601px) {
      .cover-version {
        font-size: 16pt;
        margin-top: 6pt;
      }
    }

    .cover-by {
      font-size: 12pt;
      color: #${textColor};
      margin-top: 16pt;
      margin-bottom: 0;
      white-space: nowrap;
    }

    @media (min-width: 601px) {
      .cover-by {
        font-size: 16pt;
        margin-top: 32pt;
      }
    }

    .cover-date {
      font-size: 11pt;
      color: #${textColor};
      margin-top: 16pt;
      margin-bottom: 0;
      white-space: nowrap;
    }

    @media (min-width: 601px) {
      .cover-date {
        font-size: 14pt;
        margin-top: 32pt;
      }
    }

    .cover-info {
      font-size: 12pt;
      color: #${textColor};
      line-height: 2;
    }

    .cover-logo {
      margin-top: 24pt;
    }

    @media (min-width: 601px) {
      .cover-logo {
        margin-top: 48pt;
      }
    }

    h2 {
      font-size: 18pt;
      margin: 0 0 12pt;
      color: #${primary};
      border-bottom: 3px solid #${accent};
      padding-bottom: 8pt;
      page-break-after: avoid;
      width: 100%;
      box-sizing: border-box;
    }

    .mute {
      color: #64748b;
      font-size: 10pt;
    }

    .section-content {
      line-height: 1.8;
      margin-top: 12pt;
      text-align: justify;
      width: 100%;
      box-sizing: border-box;
    }

    .section-content p {
      text-align: justify;
      width: 100%;
      margin: 8pt 0;
      box-sizing: border-box;
    }

    section {
      margin-bottom: 40pt;
      padding: 0 20pt;
      page-break-inside: auto;
      width: 100%;
      box-sizing: border-box;
    }

    section:first-of-type {
      margin-top: 20pt;
      padding-top: 0;
    }
  </style>
</head>
<body>
  <main>
    <header class="cover">
      <h1 class="cover-title">The Life I Choose</h1>
      <div class="cover-version">VERSION ${versionNumber}</div>
      <div class="cover-by"><strong>By:</strong> ${escapeHtml(userName)}</div>
      <div class="cover-date"><strong>Created:</strong> ${createdDate}</div>
      <div class="cover-logo">
        <img src="https://media.vibrationfit.com/site-assets/brand/logo/black-bar-top-of-vfit.png" alt="VibrationFit" style="max-width: 300px; width: 100%; height: auto;" />
      </div>
    </header>${categoriesWithContent.map((category) => {
      const content = vision[category.key as keyof VisionData] as string
      if (!content || !content.trim()) return ''

      const paragraphs = content.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      if (paragraphs.length === 0) return ''

      return `<section style="margin-bottom: 40pt;">
<h2>${escapeHtml(category.label)}</h2>
<div class="section-content">
${paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
</div>
</section>`
    }).join('')}
  </main>
</body>
</html>`

    // If preview mode, return HTML as-is (no TOC page numbers in preview)
    if (preview) {
      return new NextResponse(html, {
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

    // Set viewport to Letter size for accurate measurements
    await page.setViewport({
      width: 816,  // 8.5 inches * 96 DPI
      height: 1056, // 11 inches * 96 DPI  
    })

    // Set HTML content and wait for it to load
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })


    // Generate PDF (Puppeteer will handle page numbers in its footer template)
    const pdfBuffer = await page.pdf({
      format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; text-align: center; font-size: 10pt; color: #666; padding: 0 20pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
          <span class="pageNumber"></span>
        </div>
      `,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    })

    // Close browser
    await browser.close()

    // Return PDF as response
    const filename = `The-Life-I-Choose-V${versionNumber}.pdf`
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
