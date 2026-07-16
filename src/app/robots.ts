import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
        ],
      },
    ],
    sitemap: 'https://vibrationfit.com/sitemap.xml',
  }
}
