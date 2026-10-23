import { getIndexablePages } from '@/content/seo/registry'
import { pageToMarkdown } from '@/content/seo/markdown'

export const dynamic = 'force-static'

export function GET() {
  const body = getIndexablePages().map(pageToMarkdown).join('\n\n---\n\n')
  return new Response(`# Vibration Fit — full guide content\n\n${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
