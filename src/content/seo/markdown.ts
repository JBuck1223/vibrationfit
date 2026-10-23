import type { SeoPage } from './types'
import { pageUrl } from './registry'

/** Clean Markdown twin of a landing page, for AI crawlers and llms-full.txt. */
export function pageToMarkdown(page: SeoPage): string {
  const lines: string[] = [
    `# ${page.h1}`,
    '',
    `> ${page.answer}`,
    '',
    `Source: ${pageUrl(page)}`,
    `Last updated: ${page.dateModified}`,
    '',
    `**${page.definition.term}:** ${page.definition.text}`,
    '',
    page.heroSub,
    '',
    `## ${page.steps.heading}`,
    '',
  ]
  if (page.steps.intro) lines.push(page.steps.intro, '')
  page.steps.items.forEach((step, index) => {
    lines.push(`### ${index + 1}. ${step.title}`, '', step.body, '')
  })
  if (page.examples) {
    lines.push(`## ${page.examples.heading}`, '')
    if (page.examples.intro) lines.push(page.examples.intro, '')
    for (const group of page.examples.groups) {
      lines.push(`### ${group.title}`, '', ...group.items.map(item => `- ${item}`), '')
    }
  }
  lines.push(`## ${page.founderNote.heading}`, '', ...page.founderNote.paragraphs.flatMap(p => [p, '']))
  lines.push('## Frequently asked questions', '')
  for (const faq of page.faqs) {
    lines.push(`### ${faq.question}`, '', faq.answer, '')
  }
  lines.push('---', '', `Vibration Fit — Conscious Creation on Autopilot. Start free: https://vibrationfit.com/free-activation/start`)
  return lines.join('\n')
}
