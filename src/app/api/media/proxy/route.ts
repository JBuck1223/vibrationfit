// Proxy media fetches to avoid CORS when client needs to download audio/video bytes
// GET /api/media/proxy?url=<encoded-url>

import { request as httpsRequest } from 'node:https'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  'mureka.ai',
  'cdn.mureka.ai',
  'api.mureka.ai',
  'amazonaws.com',
  'supabase.co',
  'media.vibrationfit.com',
  'fal.media',
  'v3.fal.media',
  'storage.googleapis.com',
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

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

// node:https, not Next's patched fetch. A patched fetch joins in-flight
// downloads of the same URL and never returns while that stream is stuck.
function probeRemote(targetUrl: string): Promise<{
  status: number
  contentDisposition: string | null
  contentType: string | null
}> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(targetUrl, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      timeout: 8000,
    }, (res) => {
      res.resume()
      resolve({
        status: res.statusCode || 0,
        contentDisposition: headerValue(res.headers['content-disposition']),
        contentType: headerValue(res.headers['content-type']),
      })
    })
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error('Probe timed out'))
    })
    req.end()
  })
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

  // Availability check only. Streaming a full WAV through this route fails in
  // the browser (net::ERR_FAILED), so callers download those files directly.
  if (request.nextUrl.searchParams.get('probe') === '1') {
    try {
      const probeRes = await probeRemote(targetUrl)
      const available = probeRes.status >= 200 && probeRes.status < 300
      if (!available) {
        return NextResponse.json({ available: false }, { status: 404 })
      }
      return NextResponse.json({
        available: true,
        contentDisposition: probeRes.contentDisposition,
        contentType: probeRes.contentType,
      })
    } catch (error) {
      console.error('Media proxy probe error:', error)
      return NextResponse.json({ available: false }, { status: 502 })
    }
  }

  try {
    const res = await fetch(targetUrl, { cache: 'no-store' })

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
      'Cache-Control': 'private, max-age=3600',
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
