// Proxy image fetches to avoid CORS when client needs to get image bytes (e.g. fal.media URLs)
// GET /api/images/proxy?url=<encoded-image-url>

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'fal.media',
  'v3.fal.media',
  'storage.googleapis.com',
  'amazonaws.com',
  'supabase.co',
  'media.vibrationfit.com',
  'localhost',
  '127.0.0.1',
]

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith('.' + allowed))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let targetUrl: string
  try {
    targetUrl = decodeURIComponent(urlParam)
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 })
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json({ error: 'URL not allowed for proxy' }, { status: 403 })
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'image/*',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const contentType = res.headers.get('content-type') || 'image/png'
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Image proxy fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 502 }
    )
  }
}
