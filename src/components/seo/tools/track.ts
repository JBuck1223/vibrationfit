type Gtag = (command: 'event', name: string, params: Record<string, unknown>) => void

/** GA4 event for free-tool interaction on SEO pages (no-op when gtag is absent). */
export function trackToolUse(tool: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  gtag?.('event', 'seo_tool_use', { tool, page_path: window.location.pathname, ...params })
}
