import { allowedMediaUrl, fetchMedia, inertMediaHeaders } from '@/lib/security/media-fetch'
// Proxy media fetches to avoid CORS when client needs to download audio/video bytes
// GET /api/media/proxy?url=<encoded-url>

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

  // Availability check only. Streaming a full WAV through this route fails in
  // the browser (net::ERR_FAILED), so callers download those files directly.
  if (request.nextUrl.searchParams.get('probe') === '1') {
    try {
      const probeRes = await fetchMedia(targetUrl, true)
      const available = probeRes.status >= 200 && probeRes.status < 300
      if (!available) {
        return NextResponse.json({ available: false }, { status: 404 })
      }
      return NextResponse.json({
        available: true,
        contentDisposition: probeRes.headers.get('content-disposition'),
        contentType: probeRes.headers.get('content-type'),
      })
    } catch (error) {
      console.error('Media proxy probe error:', error)
      return NextResponse.json({ available: false }, { status: 502 })
    }
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
    const contentLength = res.headers.get('content-length')

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      ...(res.headers.get('content-encoding') ? { 'Content-Encoding': res.headers.get('content-encoding')! } : {}),
      ...inertMediaHeaders,
    }
    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    // Stream the response body directly instead of buffering in memory
    return new NextResponse(res.body, { headers })
  } catch (error) {
    console.error('Media proxy fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 502 }
    )
  }
}
