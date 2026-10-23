/**
 * Public social handles on a member profile. Members type a handle or paste
 * a link; we keep a clean handle (or a full URL for website) and build the
 * link when showing it.
 */

export const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', base: 'https://instagram.com/', placeholder: '@yourname' },
  { id: 'tiktok', label: 'TikTok', base: 'https://www.tiktok.com/@', placeholder: '@yourname' },
  { id: 'youtube', label: 'YouTube', base: 'https://youtube.com/@', placeholder: '@yourchannel' },
  { id: 'facebook', label: 'Facebook', base: 'https://facebook.com/', placeholder: 'your.name' },
  { id: 'linkedin', label: 'LinkedIn', base: 'https://linkedin.com/in/', placeholder: 'your-name' },
  { id: 'x', label: 'X', base: 'https://x.com/', placeholder: '@yourname' },
  { id: 'website', label: 'Website', base: '', placeholder: 'yoursite.com' },
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['id']
export type SocialLinks = Partial<Record<SocialPlatform, string>>

const HOSTS: Partial<Record<SocialPlatform, RegExp>> = {
  instagram: /instagram\.com\/([^/?#]+)/i,
  tiktok: /tiktok\.com\/@?([^/?#]+)/i,
  youtube: /youtube\.com\/(?:@|c\/|channel\/|user\/)?([^/?#]+)/i,
  facebook: /facebook\.com\/([^/?#]+)/i,
  linkedin: /linkedin\.com\/in\/([^/?#]+)/i,
  x: /(?:x|twitter)\.com\/([^/?#]+)/i,
}

/** A clean value to store, or null when empty or unusable. */
export function cleanSocial(platform: SocialPlatform, raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let value = raw.trim()
  if (!value) return null
  if (platform === 'website') {
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`
    try {
      const url = new URL(value)
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString().slice(0, 200) : null
    } catch {
      return null
    }
  }
  const fromUrl = HOSTS[platform]?.exec(value)
  if (fromUrl) value = fromUrl[1]
  value = value.replace(/^@/, '').trim()
  return /^[A-Za-z0-9._-]{1,60}$/.test(value) ? value : null
}

export function cleanSocialLinks(input: unknown): SocialLinks {
  const out: SocialLinks = {}
  if (!input || typeof input !== 'object') return out
  for (const { id } of SOCIAL_PLATFORMS) {
    const v = cleanSocial(id, (input as Record<string, unknown>)[id])
    if (v) out[id] = v
  }
  return out
}

export function socialHref(platform: SocialPlatform, value: string): string {
  if (platform === 'website') return value
  const base = SOCIAL_PLATFORMS.find((p) => p.id === platform)?.base ?? ''
  return `${base}${encodeURIComponent(value)}`
}

/** What to show next to the icon: @handle, or the site's host. */
export function socialDisplay(platform: SocialPlatform, value: string): string {
  if (platform === 'website') {
    try {
      return new URL(value).host.replace(/^www\./, '')
    } catch {
      return value
    }
  }
  return platform === 'facebook' || platform === 'linkedin' ? value : `@${value}`
}
