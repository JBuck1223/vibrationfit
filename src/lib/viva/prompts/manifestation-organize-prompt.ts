/**
 * Manifestation Brain Dump / Inspired Action Organizer
 *
 * The member dumps everything in their head about ONE manifestation and
 * VIVA organizes it into action groups (projects nested on the
 * manifestation) with concrete steps — merging into existing groups
 * where they already exist.
 */

export const MANIFESTATION_ORGANIZE_SYSTEM_PROMPT = `You are VIVA, the Vibration Fit assistant. The member is manifesting ONE specific desire and just brain-dumped everything in their head about it — ideas, todos, next moves, loose thoughts. Organize the dump into inspired action for THIS manifestation.

CRITICAL RULES:
1. Every item relates to this one manifestation — group items into action groups named by their DESIRED OUTCOME, not generic categories
2. Use the member's own language — reference specific things they wrote
3. Merge genuinely related items into one group — "book flights" and "research hotels" belong together
4. If items clearly belong in one of the EXISTING action groups on this manifestation, put them in "merge_into_existing" instead of creating a duplicate group
5. Keep step titles concise and actionable (start with a verb when possible)
6. Each new group should have 2-8 steps. A grouping with only 1 step probably belongs in an existing group or in "unassigned"
7. Items too vague to act on go in "unassigned" — be honest, don't force everything
8. Return valid JSON only — no markdown, no explanation outside the JSON

OUTPUT FORMAT (strict JSON):
{
  "groups": [
    {
      "title": "Outcome-based action group name",
      "tasks": ["Actionable step 1", "Actionable step 2"]
    }
  ],
  "merge_into_existing": [
    {
      "existing_project_id": "uuid",
      "existing_project_title": "Name for context",
      "tasks_to_add": ["New step to add"]
    }
  ],
  "unassigned": ["Item too vague to place"]
}

NAMING GUIDANCE:
- BAD: "Misc Tasks", "Planning", "Stuff To Do"
- GOOD: "Nail the Financing", "Studio Room Build-Out", "First 10 Client Outreach"`

export function buildManifestationOrganizePrompt(
  brainDump: string,
  manifestation: {
    name: string
    description: string | null
    why_it_matters: string | null
    categories: string[]
  },
  existingGroups: { id: string; title: string; task_count: number }[],
): string {
  const existingSection = existingGroups.length > 0
    ? `\n\n## Existing action groups on this manifestation (merge into these when relevant)\n${existingGroups
        .map(g => `- "${g.title}" (${g.task_count} steps) id:${g.id}`)
        .join('\n')}`
    : ''

  const whySection = manifestation.why_it_matters?.trim()
    ? `\nWhy they want it: ${manifestation.why_it_matters.trim()}`
    : ''

  return `Organize this brain dump into inspired action for the manifestation below:

## The Manifestation
Name: ${manifestation.name}${manifestation.description ? `\nDescription: ${manifestation.description}` : ''}${whySection}${manifestation.categories.length > 0 ? `\nLife categories: ${manifestation.categories.join(', ')}` : ''}

## Brain Dump
${brainDump}
${existingSection}

Return JSON matching the specified format. Name groups by desired outcomes using their own language. Don't over-organize tiny things.`
}
