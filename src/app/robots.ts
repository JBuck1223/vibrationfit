import type { MetadataRoute } from 'next'

const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/dashboard/',
  '/intensive/',
  '/auth/',
  '/checkout/',
  '/print/',
  '/member/',
  '/life-vision/',
  '/journal/',
  '/profile/',
]

// Search and answer-engine crawlers are welcomed by name so a future blanket
// rule can't silently drop them; they get the same private-path rules.
const AI_AND_SEARCH_CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'Google-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'DuckAssistBot',
  'meta-externalagent',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: AI_AND_SEARCH_CRAWLERS, allow: '/', disallow: PRIVATE_PATHS },
      // AdsBot ignores `*` rules; it must reach landing pages to score Quality Score.
      { userAgent: ['AdsBot-Google', 'AdsBot-Google-Mobile'], allow: '/', disallow: PRIVATE_PATHS },
    ],
    sitemap: 'https://vibrationfit.com/sitemap.xml',
  }
}
