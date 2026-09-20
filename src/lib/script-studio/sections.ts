import type { ScriptSection } from './schema'

export function scriptSections(version?: { content: string; sections?: ScriptSection[] }): ScriptSection[] {
  return version?.sections?.length ? version.sections : [{ id: 'main', title: 'Full script', content: version?.content || '', locked: false }]
}
export function sectionText(sections: ScriptSection[]): string {
  return sections.map(section => section.content).join('\n\n')
}

/** Restore matching sections without replacing currently locked sections or their positions. */
export function restoreSections(current: ScriptSection[], historical: ScriptSection[]): ScriptSection[] {
  const locked = current.filter(section => section.locked)
  const result = historical.filter(section => !locked.some(item => item.id === section.id)).map(section => ({ ...section, locked: false }))
  for (const section of locked) result.splice(Math.min(current.findIndex(item => item.id === section.id), result.length), 0, section)
  return result
}
