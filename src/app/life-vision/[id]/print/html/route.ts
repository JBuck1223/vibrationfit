// Print Route Handler - Returns raw HTML for PDF generation
// Path: /src/app/life-vision/[id]/print/html/route.ts

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export const dynamic = 'force-dynamic'

interface VisionData {
  id: string
  user_id: string
  title?: string
  version_number: number
  is_draft: boolean
  is_active: boolean
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

interface UserProfile {
  first_name?: string
  full_name?: string
  email?: string
}

async function getVisionById(id: string): Promise<{ vision: VisionData; userProfile?: UserProfile } | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', id)
      .single()

    if (visionError || !vision) {
      return null
    }

    if (user && vision.user_id !== user.id) {
      return null
    }

    let userProfile: UserProfile | undefined
    if (vision.user_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, full_name, email')
        .eq('user_id', vision.user_id)
        .single()
      
      userProfile = profile || undefined
    }

    return { vision: vision as VisionData, userProfile }
  } catch (error) {
    return null
  }
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await getVisionById(id)
  
  if (!data) {
    return new Response('Vision not found', { status: 404 })
  }

  // Get color parameters from query string
  const url = new URL(request.url)
  const primary = `#${url.searchParams.get('primary') || '199D67'}`
  const secondary = `#${url.searchParams.get('secondary') || '14B8A6'}`
  const accent = `#${url.searchParams.get('accent') || '8B5CF6'}`
  const textColor = `#${url.searchParams.get('text') || '1F1F1F'}`
  const bgColor = `#${url.searchParams.get('bg') || 'FFFFFF'}`

  const { vision, userProfile } = data
  const title = vision.title || 'The Life I Choose'
  const userName = userProfile?.first_name || userProfile?.full_name || ''
  const createdDate = new Date(vision.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const categoriesWithContent = VISION_CATEGORIES.filter(cat => {
    const content = vision[cat.key as keyof VisionData] as string
    return content && content.trim().length > 0
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} - Vision Document</title>
  <style>
    /* US Letter with 0.5" margins */
    @page {
      size: Letter;
      margin: 0.5in !important;
    }

    @media print {
      @page {
        size: Letter;
        margin: 0.5in !important;
      }
      
      html, body {
        background: #fff !important;
        color: #111 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Remove header/footer that browsers add */
      body::before,
      body::after {
        display: none !important;
      }
      
      body {
        font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        hyphens: auto;
      }

      h1, h2, h3 { break-after: avoid-page; }
      section { break-inside: avoid; }
      p { orphans: 2; widows: 2; margin: 8pt 0; }
      article { break-inside: auto; }
      
      /* Ensure no extra margins on printed content - remove screen padding for print */
      main {
        margin: 0 !important;
        padding: 0 !important;
      }
    }

    html, body {
      background: ${bgColor};
      color: ${textColor};
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      font-size: 12pt;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      hyphens: auto;
      padding: 0;
    }
    main {
      padding: 0 48px;
      max-width: 100%;
    }
    @media (max-width: 768px) {
      main {
        padding: 0 24px;
      }
    }
    h1, h2, h3 {
      break-after: avoid-page;
      color: ${primary};
    }
    h1 {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 16pt;
      font-weight: 600;
      margin-top: 18pt;
      margin-bottom: 6pt;
    }
    section {
      break-inside: avoid;
      margin: 0 0 14pt;
    }
    article {
      break-inside: auto;
    }
    p {
      margin: 8pt 0;
      orphans: 3;
      widows: 3;
    }
    .cover {
      text-align: center;
      margin: 40pt 0 20pt;
    }
    .cover-title {
      font-size: 36pt;
      font-weight: 700;
      color: ${primary};
      margin-bottom: 12pt;
    }
    .cover-subtitle {
      font-size: 14pt;
      color: ${secondary};
      margin-bottom: 20pt;
    }
    .cover-divider {
      width: 60px;
      height: 2px;
      background: ${secondary};
      margin: 0 auto 24pt;
    }
    .cover-badge {
      display: inline-block;
      padding: 8pt 16pt;
      background: ${!vision.is_draft && vision.is_active ? primary : (!vision.is_draft ? primary : '#FFB701')}15;
      border: 2px solid ${!vision.is_draft && vision.is_active ? primary : (!vision.is_draft ? primary : '#FFB701')};
      border-radius: 50px;
      margin: 12pt 0;
      font-size: 11pt;
      font-weight: 600;
      color: ${!vision.is_draft && vision.is_active ? primary : (!vision.is_draft ? primary : '#FFB701')};
    }
    .cover-meta {
      margin-top: 24pt;
      font-size: 11pt;
      color: #64748b;
    }
    .mute {
      color: #64748b;
      font-size: 10pt;
    }
    .section-content {
      line-height: 1.8;
      margin-top: 12pt;
    }
  </style>
</head>
<body>
  <main>
    <!-- Full Cover Page -->
    <header class="cover" style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 class="cover-title">${escapeHtml(title)}</h1>
      <div class="cover-subtitle">Life Vision Document</div>
      <div class="cover-divider"></div>
      
      <div class="cover-badge">
        Version ${vision.version_number} • ${!vision.is_draft ? (vision.is_active ? 'Active' : 'Complete') : 'Draft'}
      </div>
      
      ${userName ? `
      <div class="cover-meta">Created by ${escapeHtml(userName)}</div>
      ` : ''}
      <div class="cover-meta">${createdDate}</div>
      <div class="cover-meta" style="margin-top: 40pt; font-size: 9pt; letter-spacing: 2px;">
        VIBRATIONFIT
      </div>
    </header>

    <!-- Vision Sections -->
    ${categoriesWithContent.map((category) => {
      const content = vision[category.key as keyof VisionData] as string
      if (!content || !content.trim()) return ''
      
      // Remove empty paragraphs and filter content
      const paragraphs = content.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      if (paragraphs.length === 0) return ''
      
      return `
      <section style="page-break-inside: avoid; margin-bottom: 32pt;">
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

    <!-- Summary Page -->
    <section style="page-break-before: always; margin-top: 40pt;">
      <h2 style="font-size: 20pt; margin-bottom: 12pt; color: ${accent};">
        Vision Summary
      </h2>
      <div class="section-content">
        <p style="margin-bottom: 8pt;">
          <strong style="color: ${secondary};">Version:</strong> ${vision.version_number}
        </p>
        <p style="margin-bottom: 8pt;">
          <strong style="color: ${secondary};">Status:</strong>
          <span style="color: ${!vision.is_draft ? primary : '#FFB701'}; font-weight: 600;">
            ${!vision.is_draft ? (vision.is_active ? 'Active' : 'Complete') : 'Draft'}
          </span>
        </p>
        <p style="margin-bottom: 8pt;">
          <strong style="color: ${secondary};">Created:</strong> ${createdDate}
        </p>
        ${vision.updated_at ? `
        <p style="margin-bottom: 8pt;">
          <strong style="color: ${secondary};">Last Updated:</strong>
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

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

