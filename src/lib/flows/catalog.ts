/**
 * The Green Line flows. Each one stitches existing tools into a short path
 * named for an outcome, not a feature. Members can skip, leave, or repeat.
 */

import { storyCreateHref } from '@/lib/stories/types'
import type { ArrivalState, FlowContext, FlowDefinition, FlowStep } from './types'

export const ARRIVAL_STATES: { state: ArrivalState; label: string; greenLine: string; tint: string; color: string }[] = [
  { state: 'above', label: 'I’m feeling great — I want to build on this', greenLine: 'Above the Green Line', tint: 'rgba(57,255,20,0.16)', color: '#39FF14' },
  { state: 'on', label: 'I’m okay, but I want some clarity', greenLine: 'On the Green Line', tint: 'rgba(0,255,255,0.12)', color: '#00FFFF' },
  { state: 'below', label: 'I’m having a wobble — I need support', greenLine: 'Below the Green Line', tint: 'rgba(191,0,255,0.16)', color: '#D58BFF' },
]

const vivaHref = (flowId: string, draft: string) => () =>
  `/viva?flow=${flowId}&draft=${encodeURIComponent(draft)}`

export const FLOWS: FlowDefinition[] = [
  {
    id: 'celebrate-and-expand',
    state: 'above',
    title: 'Celebrate & Expand',
    bestFor: 'When good things are happening and you want to savor them and build on them.',
    promise: 'Talk about everything that\u2019s going right, then turn that feeling into a Story or a Manifestation you can come back to.',
    steps: [
      {
        id: 'share',
        title: 'Talk about the awesome stuff',
        body: 'Go on a rampage of appreciation with VIVA and milk the good feeling, or write it straight into your Journal. Either way it gets saved as a win.',
        choices: [
          {
            id: 'viva',
            label: 'Rampage of Appreciation',
            description: 'Celebrate it out loud with VIVA and let the good feeling build.',
            href: vivaHref('celebrate-and-expand', 'Let\u2019s do a rampage of appreciation. Here\u2019s what I\u2019m loving right now: '),
          },
          { id: 'journal', label: 'Write it in my Journal', description: 'Capture the win and how it feels.', href: '/journal/new?tag=win' },
        ],
        doneWhen: ['journal_saved'],
      },
      {
        id: 'capture',
        title: 'Capture the clarity and the feeling',
        body: 'Turn this moment into something you can return to: a Story that holds the feeling, or a Manifestation for what it\u2019s pointing you toward.',
        choices: [
          { id: 'story', label: 'Create a Story', description: 'An activation story of this reality.', href: storyCreateHref() },
          { id: 'manifestation', label: 'Add a Manifestation', description: 'Give what you\u2019re calling in a home.', href: '/manifestations/new' },
        ],
        doneWhen: ['story_created', 'manifestation_created'],
      },
    ],
    completion: {
      headline: 'You captured the good stuff.',
      body: 'This feeling is saved where you can step back into it any time. Let it raise what you expect next.',
    },
    nextFlowIds: ['rise-above'],
  },
  {
    id: 'rise-above',
    state: 'on',
    title: 'Rise Above',
    bestFor: 'When you\u2019re okay, but you\u2019d like to feel a whole lot better.',
    promise: 'Let VIVA help you shift way above the Green Line, capture it, and leave with one inspired action or a manifestation that juices you up.',
    steps: [
      {
        id: 'shift',
        title: 'Shift with VIVA',
        body: 'Talk with VIVA until you feel the lift. When it lands, VIVA saves it to your Journal.',
        href: vivaHref('rise-above', 'I\u2019m feeling okay, but I want to feel way better. Here\u2019s where I am: '),
        doneWhen: ['journal_saved'],
      },
      {
        id: 'act',
        title: 'Take it somewhere',
        body: 'Choose one inspired action for today, or add a manifestation that gets you excited.',
        choices: [
          { id: 'action', label: 'An inspired action', description: 'Put one aligned move on today\u2019s Daily Paper.', href: '/daily-paper/new' },
          { id: 'manifestation', label: 'A manifestation', description: 'Add something that juices you up.', href: '/manifestations/new' },
        ],
        doneWhen: ['daily_paper_saved', 'manifestation_created', 'viva_action'],
      },
    ],
    completion: {
      headline: 'You lifted yourself up.',
      body: 'You chose a better-feeling place, wrote it down, and gave it somewhere to go. That\u2019s deliberate creating.',
    },
    nextFlowIds: ['celebrate-and-expand'],
  },
  {
    id: 'talk-it-through',
    state: 'below',
    title: 'Talk It Through',
    bestFor: 'When something has you off center and you want to feel better and see it clearly.',
    promise: 'Talk it through with VIVA, capture what you find in your Journal, and turn it into an Alignment Kit: a Story, an Incantation and a SparkQuery.',
    steps: [
      {
        id: 'talk',
        title: 'Talk it through with VIVA',
        body: 'Name what happened and what\u2019s underneath it. When something truer lands, VIVA captures the conversation in your Journal.',
        href: vivaHref('talk-it-through', 'I\u2019m having a wobble. Here\u2019s what\u2019s going on: '),
        doneWhen: ['journal_saved'],
      },
      {
        id: 'story',
        title: 'Turn it into a Story',
        body: 'A short story of the truer reality, to rehearse it. VIVA can make it for you, or use the Story studio.',
        href: storyCreateHref(),
        doneWhen: ['story_created'],
      },
      {
        id: 'incantation',
        title: 'Make an Incantation',
        body: 'A few spoken lines to embody the new thought.',
        href: storyCreateHref('incantation'),
        doneWhen: ['incantation_created'],
      },
      {
        id: 'spark-query',
        title: 'Make a SparkQuery',
        body: 'Questions that point your mind at evidence of what you want.',
        href: storyCreateHref('spark_query'),
        doneWhen: ['spark_query_created'],
      },
    ],
    completion: {
      headline: 'You turned a wobble into an Alignment Kit.',
      body: 'Your Story, Incantation and SparkQuery are ready whenever you want to step back into the truer thought.',
    },
    nextFlowIds: ['rise-above'],
  },
]

export function getFlow(id: string | null | undefined): FlowDefinition | null {
  return FLOWS.find((f) => f.id === id) ?? null
}

export function flowsForState(state: ArrivalState): FlowDefinition[] {
  return FLOWS.filter((f) => f.state === state)
}

export function resolveHref(href: FlowStep['href'] | undefined, ctx: FlowContext): string | null {
  if (!href) return null
  return typeof href === 'function' ? href(ctx) : href
}

/** The next unfinished, unskipped step after `fromId` (or the first one). */
export function nextStepId(flow: FlowDefinition, steps: Record<string, { done_at?: string; skipped_at?: string }>, fromId?: string | null): string | null {
  const start = fromId ? flow.steps.findIndex((s) => s.id === fromId) + 1 : 0
  for (let i = Math.max(0, start); i < flow.steps.length; i++) {
    const record = steps[flow.steps[i].id]
    if (!record?.done_at && !record?.skipped_at) return flow.steps[i].id
  }
  return null
}
