import { getIndexablePages, pageUrl, SITE_URL } from '@/content/seo/registry'

// llms.txt (https://llmstxt.org): a plain index of the site for answer engines.
export const dynamic = 'force-static'

export function GET() {
  const pages = getIndexablePages()
  const lines = [
    '# Vibration Fit',
    '',
    '> Vibration Fit is a conscious creation platform: build a Life Vision across 12 areas of life, keep a living vision board, journal, speak affirmations, listen to personalized audios and practice daily with VIVA. Tagline: Conscious Creation on Autopilot.',
    '',
    'Founded by Jordan and Vanessa Buckingham. Free to start with a Free Activation; Vision Pro membership continues every 28 days.',
    '',
    '## Guides',
    '',
    ...pages.map(page => `- [${page.h1}](${pageUrl(page)}): ${page.definition.text} Markdown: ${pageUrl(page)}.md`),
    '',
    '## Key pages',
    '',
    `- [Home](${SITE_URL}/): What Vibration Fit is and how it works`,
    `- [Free Activation](${SITE_URL}/free-activation/start): Start free`,
    `- [Emotional Guidance Scale](${SITE_URL}/framework/emotional-guidance-scale): A map of emotions from despair to joy, and how to climb it one better-feeling thought at a time`,
    `- [Contact](${SITE_URL}/contact)`,
    '',
    '## Optional',
    '',
    `- [Full content](${SITE_URL}/llms-full.txt): Every guide in one Markdown file`,
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
