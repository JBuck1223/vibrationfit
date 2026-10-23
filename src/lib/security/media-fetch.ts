import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { request } from 'node:https'
import { Readable } from 'node:stream'

const allowedHosts = ['mureka.ai', 'amazonaws.com', 'supabase.co', 'media.vibrationfit.com', 'fal.media', 'storage.googleapis.com']
export function allowedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch { return false }
}
const blocked = new BlockList()
for (const [network, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as const) blocked.addSubnet(network, prefix, 'ipv4')
const globalV6 = new BlockList()
globalV6.addSubnet('2000::', 3, 'ipv6')
blocked.addSubnet('2001::', 23, 'ipv6')
blocked.addSubnet('2001:db8::', 32, 'ipv6')
blocked.addSubnet('2002::', 16, 'ipv6')
export function publicAddress(address: string): boolean {
  const family = isIP(address)
  return family === 4 ? !blocked.check(address, 'ipv4') : family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6')
}

/** Resolve, validate, then pin the socket lookup; validate each redirect afresh. */
export async function fetchMedia(urlString: string, probe = false, redirects = 0): Promise<Response> {
  if (!allowedMediaUrl(urlString) || redirects > 3) throw new Error('Media URL not allowed')
  const url = new URL(urlString)
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('Media address not allowed')
  const selected = addresses[0]
  const incoming = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
    const req = request(url, {
      method: 'GET', timeout: 30000,
      headers: { 'Accept-Encoding': 'identity', ...(probe ? { Range: 'bytes=0-0' } : {}) },
      lookup: (_hostname, options, callback) => {
        if (typeof options === 'object' && options.all) callback(null, [selected])
        else callback(null, selected.address, selected.family)
      },
    }, resolve)
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('Media request timed out')))
    req.end()
  })
  const status = incoming.statusCode || 502
  if ([301,302,303,307,308].includes(status)) {
    const location = incoming.headers.location
    incoming.destroy()
    if (!location) throw new Error('Missing redirect location')
    return fetchMedia(new URL(location, url).href, probe, redirects + 1)
  }
  const headers = new Headers()
  for (const name of ['content-type','content-length','content-disposition','content-encoding']) {
    const value = incoming.headers[name]
    if (typeof value === 'string') headers.set(name, value)
  }
  if (probe || status === 204 || status === 304) {
    incoming.destroy()
    return new Response(null, { status, headers })
  }
  return new Response(Readable.toWeb(incoming) as ReadableStream<Uint8Array>, { status, headers })
}

// Even mislabeled HTML/SVG cannot execute in the application's origin.
export const inertMediaHeaders = {
  'Content-Security-Policy': "sandbox; default-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Content-Disposition': 'attachment',
  'Cache-Control': 'private, max-age=3600',
}
