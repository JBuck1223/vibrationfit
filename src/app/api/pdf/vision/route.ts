// PDF Generation API Route using Puppeteer
// Path: /src/app/api/pdf/vision/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { launchBrowser } from '@/lib/pdf/browser'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow 60 seconds for PDF generation

interface VisionData {
  id: string
  user_id: string
  household_id?: string | null
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
      .single()

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Permission check - use service client to bypass RLS recursion
    const serviceSupabase = createServiceClient()
    
    if (vision.household_id) {
      // For household visions, check if user is a household member
      const { data: membership, error: memberError } = await serviceSupabase
        .from('household_members')
        .select('id')
        .eq('household_id', vision.household_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      
      console.log('Household permission check:', { 
        householdId: vision.household_id, 
        userId: user.id, 
        hasMembership: !!membership,
        error: memberError 
      })
      
      if (!membership && !memberError) {
        return NextResponse.json({ error: 'Not a household member' }, { status: 403 })
      }
    } else {
      // For personal visions, check if user is the creator
      if (vision.user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized for this vision' }, { status: 403 })
      }
    }

    // Get calculated version number using database function
    const { data: versionData, error: versionError } = await supabase
      .rpc('get_vision_version_number', { p_vision_id: visionId })
    
    const versionNumber = versionData || 1 // Fallback to 1 if function fails
    console.log('Vision version number:', versionNumber, 'from function get_vision_version_number')

    const isHouseholdVision = !!vision.household_id
    let userName = 'User'
    let title = 'The Life I Choose'

    // Fetch names from user_accounts (name lives on user_accounts, not user_profiles)
    if (isHouseholdVision) {
      title = 'The Life We Choose'
      
      // Get household members - use service client to bypass RLS
      const { data: members, error: membersError } = await serviceSupabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', vision.household_id)
        .eq('status', 'active')
      
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id)
        
        const { data: accounts } = await serviceSupabase
          .from('user_accounts')
          .select('id, first_name, last_name, full_name')
          .in('id', userIds)
        
        if (accounts && accounts.length > 0) {
          const names = accounts
            .map(a => a.first_name || '')
            .filter(Boolean)
          
          if (names.length === 1) {
            userName = names[0]
          } else if (names.length === 2) {
            userName = `${names[0]} & ${names[1]}`
          } else if (names.length > 2) {
            const lastMember = names[names.length - 1]
            const otherMembers = names.slice(0, -1).join(', ')
            userName = `${otherMembers}, & ${lastMember}`
          }
        }
      }
    } else {
      // Personal vision - get creator's account
      const { data: account } = await serviceSupabase
        .from('user_accounts')
        .select('first_name, last_name, full_name')
        .eq('id', vision.user_id)
        .single()
      
      if (account?.full_name) {
        userName = account.full_name
      } else if (account?.first_name) {
        userName = account.first_name
      } else if (account?.last_name) {
        userName = account.last_name
      }
    }
    
    console.log('[PDF] Generation starting:', { 
      id: vision.id, 
      isHousehold: isHouseholdVision, 
      title, 
      userName,
      preview 
    })
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
      <h1 class="cover-title">${escapeHtml(title)}</h1>
      <div class="cover-version">VERSION ${versionNumber}</div>
      <div class="cover-by"><strong>${isHouseholdVision ? 'By:' : 'Created by:'}</strong> ${escapeHtml(userName)}</div>
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

    // Launch browser for PDF generation
    console.log('[PDF] Launching browser...')
    
    let browser
    try {
      browser = await launchBrowser()
      console.log('[PDF] Browser launched successfully')
    } catch (launchError) {
      console.error('[PDF] Failed to launch browser:', launchError)
      throw new Error(`Failed to launch PDF browser: ${launchError instanceof Error ? launchError.message : 'Unknown error'}`)
    }

    let page
    try {
      page = await browser.newPage()
      console.log('[PDF] New page created')

      // Set viewport to Letter size for accurate measurements
      await page.setViewport({
        width: 816,  // 8.5 inches * 96 DPI
        height: 1056, // 11 inches * 96 DPI  
      })
      console.log('[PDF] Viewport set')

      // Set HTML content and wait for it to load
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      })
      console.log('[PDF] HTML content loaded')

      // Generate PDF (Puppeteer will handle page numbers in its footer template)
      console.log('[PDF] Generating PDF buffer...')
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
      console.log('[PDF] PDF generated successfully, size:', pdfBuffer.length, 'bytes')

      // Close browser
      await browser.close()
      console.log('[PDF] Browser closed')

      // Return PDF as response
      const filenameTitle = isHouseholdVision ? 'The-Life-We-Choose' : 'The-Life-I-Choose'
      const filename = `${filenameTitle}-V${versionNumber}.pdf`
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (pdfError) {
      console.error('[PDF] Error during PDF generation:', pdfError)
      // Make sure to close browser even if there's an error
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error('[PDF] Error closing browser:', closeError)
        }
      }
      throw pdfError
    }

  } catch (error) {
    console.error('PDF generation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'PDF generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
