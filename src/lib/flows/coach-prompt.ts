/**
 * When a member opens VIVA from a guided flow, the page sends
 * `userIntent: "flow:<flowId>"`. This tells VIVA what the member chose to do
 * so the conversation serves that path. Empty for any other intent.
 */

const FLOW_PROMPTS: Record<string, string> = {
  'talk-it-through': `## GUIDED FLOW: TALK IT THROUGH
The member chose this from "I'm having a wobble". They want to feel better and see it clearly.
1. Help them name what happened and the thought or meaning underneath it. Brief, warm, no lecturing.
2. Find a softer, truer thought they can actually believe. Let it be theirs; offer, don't impose.
3. When something lands, offer to save it: save_journal_entry with journal_tag wobble, wobble_summary, clarity, chosen_truth.
4. Then offer one activation to rehearse the new thought: an incantation, a SparkQuery set, or a short activation story. Create it only after they say yes.
Do not rush to step 3; the relief matters more than the artifact.`,
  'create-from-momentum': `## GUIDED FLOW: CREATE FROM MOMENTUM
The member chose this from "I'm feeling great". They want to put good energy somewhere.
Help them find one inspired (not forced) next move for what feels most alive, and offer one concrete action: add it to today's Daily Paper, add a project or asset to the manifestation, or create an activation. Keep it light and energizing.`,
}

export function buildFlowPrompt(userIntent: unknown): string {
  if (typeof userIntent !== 'string' || !userIntent.startsWith('flow:')) return ''
  return FLOW_PROMPTS[userIntent.slice('flow:'.length)] ?? ''
}
