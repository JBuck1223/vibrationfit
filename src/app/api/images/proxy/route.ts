import { allowedMediaUrl, fetchMedia, inertMediaHeaders } from '@/lib/security/media-fetch'
// Proxy image fetches to avoid CORS when client needs to get image bytes (e.g. fal.media URLs)
// GET /api/images/proxy?url=<encoded-image-url>

import { NextRequest, NextResponse } from 'next/server'

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

  if (!allowedMediaUrl(targetUrl)) {
    return NextResponse.json({ error: 'URL not allowed for proxy' }, { status: 403 })
  }

  try {
    const res = await fetchMedia(targetUrl)

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': contentType,
      ...(res.headers.get('content-encoding') ? { 'Content-Encoding': res.headers.get('content-encoding')! } : {}),
        ...inertMediaHeaders,
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
