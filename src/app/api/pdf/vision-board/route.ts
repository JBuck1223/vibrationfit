// Vision Board PDF Generation API Route using Puppeteer
// Path: /src/app/api/pdf/vision-board/route.ts
// Generates a grid-based PDF of vision board items with images

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Allow 2 minutes for PDF with many images

interface VisionBoardItem {
  id: string
  user_id: string
  name: string
  description?: string
  image_url?: string
  actualized_image_url?: string
  categories: string[]
  status: 'active' | 'actualized' | 'inactive'
  created_at: string
  actualized_at?: string
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

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#16A34A' // green-600
    case 'actualized': return '#8B5CF6' // purple-500
    case 'inactive': return '#6B7280' // gray-500
    default: return '#6B7280'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active'
    case 'actualized': return 'Actualized'
    case 'inactive': return 'Inactive'
    default: return status
  }
}

function getCategoryLabel(key: string): string {
  const category = VISION_CATEGORIES.find(c => c.key === key)
  return category?.label || key
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const preview = searchParams.get('preview') === 'true'
    
    // Filter params
    const categoriesParam = searchParams.get('categories') // comma-separated or 'all'
    const statusesParam = searchParams.get('statuses') // comma-separated or 'all'
    
    // Layout params
    const paperSize = searchParams.get('paperSize') || 'letter-landscape' // letter-landscape, letter-portrait, a4-landscape, a4-portrait
    const imageRatio = searchParams.get('imageRatio') || '16:9' // 16:9, 4:3, 1:1, 9:16
    const columns = parseInt(searchParams.get('columns') || '4')
    const showDescriptions = searchParams.get('showDescriptions') !== 'false'
    const showCategories = searchParams.get('showCategories') !== 'false'
    const groupByStatus = searchParams.get('groupByStatus') === 'true'
    const showHeader = searchParams.get('showHeader') !== 'false'
    const showItemNames = searchParams.get('showItemNames') !== 'false'
    const roundedCorners = searchParams.get('roundedCorners') !== 'false'
    const showBadges = searchParams.get('showBadges') !== 'false'
    const outputFormat = searchParams.get('format') || 'pdf' // pdf or image
    const pageIndex = parseInt(searchParams.get('page') || '0') // For multi-page image downloads

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch vision board items
    let query = supabase
      .from('vision_board_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: items, error: itemsError } = await query

    if (itemsError) {
      console.error('Error fetching vision board items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Apply filters
    let filteredItems = items || []
    
    // Category filter
    if (categoriesParam && categoriesParam !== 'all') {
      const selectedCategories = categoriesParam.split(',')
      filteredItems = filteredItems.filter(item => 
        item.categories?.some((cat: string) => selectedCategories.includes(cat))
      )
    }
    
    // Status filter
    if (statusesParam && statusesParam !== 'all') {
      const selectedStatuses = statusesParam.split(',')
      filteredItems = filteredItems.filter(item => 
        selectedStatuses.includes(item.status)
      )
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const userName = profile?.first_name 
      ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
      : 'User'

    // Calculate stats
    const totalItems = filteredItems.length
    const activeItems = filteredItems.filter(i => i.status === 'active').length
    const actualizedItems = filteredItems.filter(i => i.status === 'actualized').length
    const inactiveItems = filteredItems.filter(i => i.status === 'inactive').length

    // Group items if needed
    let groupedItems: { status: string; items: VisionBoardItem[] }[] = []
    if (groupByStatus) {
      const statusOrder = ['active', 'actualized', 'inactive']
      groupedItems = statusOrder
        .map(status => ({
          status,
          items: filteredItems.filter(i => i.status === status)
        }))
        .filter(group => group.items.length > 0)
    }

    // Determine dimensions based on format
    let pageWidth: string
    let pageHeight: string
    let pageCSS: string
    let viewportWidth: number
    let viewportHeight: number
    
    if (outputFormat === 'image') {
      // Image dimensions based on aspect ratio
      const baseWidth = 1920 // HD width
      switch (imageRatio) {
        case '4:3':
          viewportWidth = baseWidth
          viewportHeight = Math.round(baseWidth * 3 / 4)
          pageWidth = `${viewportWidth}px`
          pageHeight = `${viewportHeight}px`
          break
        case '1:1':
          viewportWidth = baseWidth
          viewportHeight = baseWidth
          pageWidth = `${viewportWidth}px`
          pageHeight = `${viewportHeight}px`
          break
        case '9:16':
          viewportWidth = 1080 // Portrait width
          viewportHeight = 1920
          pageWidth = `${viewportWidth}px`
          pageHeight = `${viewportHeight}px`
          break
        case '16:9':
        default:
          viewportWidth = baseWidth
          viewportHeight = Math.round(baseWidth * 9 / 16)
          pageWidth = `${viewportWidth}px`
          pageHeight = `${viewportHeight}px`
          break
      }
      pageCSS = `@page { size: ${pageWidth} ${pageHeight}; margin: 0; }`
    } else {
      // PDF dimensions based on paper size
      switch (paperSize) {
        case 'letter-portrait':
          pageWidth = '8.5in'
          pageHeight = '11in'
          viewportWidth = 816
          viewportHeight = 1056
          pageCSS = '@page { size: Letter portrait; margin: 0.4in; }'
          break
        case 'a4-landscape':
          pageWidth = '297mm'
          pageHeight = '210mm'
          viewportWidth = 1123
          viewportHeight = 794
          pageCSS = '@page { size: A4 landscape; margin: 10mm; }'
          break
        case 'a4-portrait':
          pageWidth = '210mm'
          pageHeight = '297mm'
          viewportWidth = 794
          viewportHeight = 1123
          pageCSS = '@page { size: A4 portrait; margin: 10mm; }'
          break
        case 'letter-landscape':
        default:
          pageWidth = '11in'
          pageHeight = '8.5in'
          viewportWidth = 1056
          viewportHeight = 816
          pageCSS = '@page { size: Letter landscape; margin: 0.4in; }'
          break
      }
    }

    const isLandscape = outputFormat === 'image' 
      ? (imageRatio === '16:9' || imageRatio === '4:3')
      : paperSize.includes('landscape')
    const effectiveColumns = Math.min(columns, isLandscape ? 5 : 3)
    
    // Calculate items per page for images
    const rowsPerImage = imageRatio === '9:16' ? 4 : imageRatio === '1:1' ? 3 : 2
    const itemsPerImage = effectiveColumns * rowsPerImage

    // Build item grid HTML
    const buildItemCard = (item: VisionBoardItem) => {
      const imageUrl = (item.status === 'actualized' && item.actualized_image_url) 
        ? item.actualized_image_url 
        : item.image_url
      
      const categories = (item.categories || [])
        .slice(0, 2)
        .map((cat: string) => getCategoryLabel(cat))
        .join(', ')

      return `
        <div class="item-card">
          <div class="item-image-container">
            ${imageUrl 
              ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}" class="item-image" />`
              : `<div class="item-image-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>`
            }
            ${showBadges ? `
            <div class="status-badge" style="background-color: ${getStatusColor(item.status)}">
              ${getStatusLabel(item.status)}
            </div>
            ` : ''}
          </div>
          ${showItemNames ? `
          <div class="item-content">
            <h3 class="item-name">${escapeHtml(item.name)}</h3>
            ${showDescriptions && item.description 
              ? `<p class="item-description">${escapeHtml(item.description.slice(0, 80))}${item.description.length > 80 ? '...' : ''}</p>` 
              : ''
            }
            ${showCategories && categories 
              ? `<div class="item-categories">${escapeHtml(categories)}</div>` 
              : ''
            }
          </div>
          ` : ''}
        </div>
      `
    }

    const buildItemsGrid = (items: VisionBoardItem[]) => {
      if (items.length === 0) return '<p class="no-items">No items to display</p>'
      return `
        <div class="items-grid" style="grid-template-columns: repeat(${effectiveColumns}, 1fr);">
          ${items.map(item => buildItemCard(item)).join('')}
        </div>
      `
    }

    const buildGroupedContent = () => {
      return groupedItems.map(group => `
        <div class="status-group">
          <h2 class="group-title" style="color: ${getStatusColor(group.status)}">
            ${getStatusLabel(group.status)} (${group.items.length})
          </h2>
          ${buildItemsGrid(group.items)}
        </div>
      `).join('')
    }

    const createdDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    // Build HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vision Board - ${escapeHtml(userName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${preview ? '' : pageCSS}

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FFFFFF;
      color: #1F1F1F;
      font-size: ${preview ? '12px' : '10pt'};
      line-height: 1.4;
      ${preview ? 'width: 100%; height: 100%; margin: 0; padding: 0;' : ''}
    }

    .page {
      ${preview 
        ? `width: 100%; min-height: 100%; padding: 20px;` 
        : `width: ${pageWidth}; ${outputFormat === 'image' ? `height: ${pageHeight}; max-height: ${pageHeight}; overflow: hidden;` : `min-height: ${pageHeight};`} padding: ${outputFormat === 'image' ? '20px' : '0.4in'};`
      }
      background: #FFFFFF;
      box-sizing: border-box;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #199D67;
    }

    .header-left h1 {
      font-size: 22pt;
      font-weight: 700;
      color: #199D67;
      margin-bottom: 4px;
    }

    .header-left .subtitle {
      font-size: 10pt;
      color: #6B7280;
    }

    .header-right {
      text-align: right;
    }

    .header-right .user-name {
      font-size: 11pt;
      font-weight: 600;
      color: #1F1F1F;
    }

    .header-right .date {
      font-size: 9pt;
      color: #6B7280;
    }

    /* Stats bar */
    .stats-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      padding: 10px 16px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .stat-label {
      font-size: 9pt;
      color: #6B7280;
    }

    .stat-value {
      font-size: 10pt;
      font-weight: 600;
      color: #1F1F1F;
    }

    /* Items grid */
    .items-grid {
      display: grid;
      gap: 12px;
    }

    .item-card {
      background: ${showItemNames ? '#FFFFFF' : 'transparent'};
      border: ${showItemNames ? '1px solid #E5E7EB' : 'none'};
      border-radius: ${roundedCorners ? '8px' : '0'};
      overflow: hidden;
      break-inside: avoid;
    }

    .item-image-container {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      background: ${showItemNames ? '#F3F4F6' : 'transparent'};
      ${!showItemNames ? `border-radius: ${roundedCorners ? '8px' : '0'};` : ''}
    }

    .item-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      ${!showItemNames ? `border-radius: ${roundedCorners ? '8px' : '0'};` : ''}
    }

    .item-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${showItemNames ? '#F3F4F6' : '#E5E7EB'};
      ${!showItemNames ? `border-radius: ${roundedCorners ? '8px' : '0'};` : ''}
    }

    .status-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 2px 8px;
      border-radius: ${roundedCorners ? '12px' : '2px'};
      font-size: 7pt;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .item-content {
      padding: 8px 10px;
    }

    .item-name {
      font-size: 9pt;
      font-weight: 600;
      color: #1F1F1F;
      margin-bottom: 2px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .item-description {
      font-size: 7pt;
      color: #6B7280;
      margin-bottom: 4px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .item-categories {
      font-size: 7pt;
      color: #199D67;
      font-weight: 500;
    }

    /* Status groups */
    .status-group {
      margin-bottom: 20px;
    }

    .group-title {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #E5E7EB;
    }

    .no-items {
      text-align: center;
      color: #9CA3AF;
      padding: 40px;
      font-style: italic;
    }

    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 8pt;
      color: #9CA3AF;
    }

    .footer img {
      height: 20px;
      margin-bottom: 4px;
    }

    @media print {
      .page {
        padding: 0;
      }
      
      .item-card {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    ${showHeader ? `
    <header class="header">
      <div class="header-left">
        <h1>Vision Board</h1>
        <div class="subtitle">Conscious Creations & Manifestations</div>
      </div>
      <div class="header-right">
        <div class="user-name">${escapeHtml(userName)}</div>
        <div class="date">${createdDate}</div>
      </div>
    </header>

    <div class="stats-bar">
      <div class="stat">
        <div class="stat-dot" style="background: #1F1F1F;"></div>
        <span class="stat-label">Total:</span>
        <span class="stat-value">${totalItems}</span>
      </div>
      <div class="stat">
        <div class="stat-dot" style="background: #16A34A;"></div>
        <span class="stat-label">Active:</span>
        <span class="stat-value">${activeItems}</span>
      </div>
      <div class="stat">
        <div class="stat-dot" style="background: #8B5CF6;"></div>
        <span class="stat-label">Actualized:</span>
        <span class="stat-value">${actualizedItems}</span>
      </div>
      <div class="stat">
        <div class="stat-dot" style="background: #6B7280;"></div>
        <span class="stat-label">Inactive:</span>
        <span class="stat-value">${inactiveItems}</span>
      </div>
    </div>
    ` : ''}

    ${groupByStatus ? buildGroupedContent() : buildItemsGrid(filteredItems)}

    ${showHeader ? `
    <footer class="footer">
      <img src="https://media.vibrationfit.com/site-assets/brand/logo/black-bar-top-of-vfit.png" alt="VibrationFit" />
      <div>Generated by VibrationFit</div>
    </footer>
    ` : ''}
  </div>
</body>
</html>`

    // If preview mode, return HTML
    if (preview) {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    // Launch Puppeteer for PDF generation
    console.log('[Vision Board PDF] Launching Puppeteer...')
    
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security'
        ],
        timeout: 60000
      })
      console.log('[Vision Board PDF] Browser launched')
    } catch (launchError) {
      console.error('[Vision Board PDF] Failed to launch Puppeteer:', launchError)
      throw new Error(`Failed to launch PDF browser: ${launchError instanceof Error ? launchError.message : 'Unknown error'}`)
    }

    let page
    try {
      page = await browser.newPage()

      // Set viewport based on format
      await page.setViewport({ width: viewportWidth, height: viewportHeight })

      // Set content and wait for images to load
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 90000 
      })
      console.log('[Vision Board PDF] HTML content loaded')

      // Generate output based on format
      if (outputFormat === 'image') {
        // Generate PNG image with exact dimensions
        console.log('[Vision Board] Generating image...', { viewportWidth, viewportHeight, imageRatio })
        
        // Set exact viewport for the image
        await page.setViewport({ 
          width: viewportWidth, 
          height: viewportHeight,
          deviceScaleFactor: 1
        })
        
        // Re-set content after viewport change
        await page.setContent(html, { 
          waitUntil: 'networkidle0',
          timeout: 90000 
        })
        
        const imageBuffer = await page.screenshot({
          type: 'png',
          clip: {
            x: 0,
            y: 0,
            width: viewportWidth,
            height: viewportHeight
          },
          omitBackground: false,
        })
        console.log('[Vision Board] Image generated, size:', imageBuffer.length, 'bytes')

        await browser.close()

        const ratioLabel = imageRatio.replace(':', 'x')
        const filename = `Vision-Board-${ratioLabel}-${new Date().toISOString().split('T')[0]}.png`
        return new NextResponse(Buffer.from(imageBuffer), {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      }

      // Generate PDF
      const pdfFormat = paperSize.includes('a4') ? 'A4' : 'Letter'
      const pdfBuffer = await page.pdf({
        format: pdfFormat,
        landscape: isLandscape,
        printBackground: true,
        margin: {
          top: '0.4in',
          right: '0.4in',
          bottom: '0.4in',
          left: '0.4in'
        }
      })
      console.log('[Vision Board PDF] PDF generated, size:', pdfBuffer.length, 'bytes')

      await browser.close()

      // Return PDF
      const filename = `Vision-Board-${new Date().toISOString().split('T')[0]}.pdf`
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (pdfError) {
      console.error('[Vision Board PDF] Error:', pdfError)
      if (browser) {
        try { await browser.close() } catch (e) { /* ignore */ }
      }
      throw pdfError
    }

  } catch (error) {
    console.error('[Vision Board PDF] Generation error:', error)
    return NextResponse.json(
      { error: 'PDF generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
