const CDN_ORIGIN = 'https://media.vibrationfit.com/'

/**
 * CloudFront sends no CORS headers, so anything that reads CDN audio data
 * (Web Audio, waveform decoding) goes through the same-origin /cdn-media rewrite.
 */
export function sameOriginMediaUrl(url: string) {
  return url.startsWith(CDN_ORIGIN) ? `/cdn-media/${url.slice(CDN_ORIGIN.length)}` : url
}
