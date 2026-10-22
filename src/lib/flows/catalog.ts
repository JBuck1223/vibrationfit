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

const WOBBLE_DRAFT = 'I’m having a wobble. Here’s what’s going on: '

export const FLOWS: FlowDefinition[] = [
  {
    id: 'talk-it-through',
    state: 'below',
    title: 'Talk It Through',
    bestFor: 'When something has you off center and you want to feel better and see it clearly.',
    promise: 'Name the wobble, find what’s underneath it, and turn it into something that supports you.',
    steps: [
      {
        id: 'capture',
        title: 'Get it out',
        body: 'Talk it through with VIVA, or write it down. Either way you’ll land on what feels truer now.',
        choices: [
          {
            id: 'viva',
            label: 'Talk it through',
            description: 'VIVA helps you name it and find a softer, truer thought.',
            href: () => `/viva?flow=talk-it-through&draft=${encodeURIComponent(WOBBLE_DRAFT)}`,
          },
          {
            id: 'journal',
            label: 'Write it down',
            description: 'Capture the wobble in your Journal, then choose what feels truer.',
            href: '/journal/new?tag=wobble',
          },
        ],
        doneWhen: ['journal_saved'],
      },
      {
        id: 'activate',
        title: 'Make it something you can return to',
        body: 'Turn the truer thought into an Incantation, a SparkQuery, or a short Story.',
        choices: [
          { id: 'incantation', label: 'Incantation', description: 'A few spoken lines to embody it.', href: storyCreateHref('incantation') },
          { id: 'spark_query', label: 'SparkQuery', description: 'Questions that point your mind at evidence.', href: storyCreateHref('spark_query') },
          { id: 'story', label: 'Story', description: 'A short story of the new reality.', href: storyCreateHref() },
        ],
        doneWhen: ['story_created'],
        optional: true,
      },
    ],
    completion: {
      headline: 'You turned a wobble into clarity.',
      body: 'What you found is saved where you can come back to it. That’s you choosing your next thought on purpose.',
    },
    nextFlowIds: ['return-to-vision'],
  },
  {
    id: 'return-to-vision',
    state: 'on',
    title: 'Return to My Vision',
    bestFor: 'When you’re okay but a little flat, unclear, or disconnected.',
    promise: 'Remember what you’re creating, notice what feels alive, and choose today on purpose.',
    steps: [
      {
        id: 'immerse',
        title: 'Listen to your Life Vision',
        body: 'Press play on your vision. Notice what feels alive, and what feels tight.',
        href: '/listen',
        doneWhen: ['vision_audio_played', 'vision_read'],
      },
      {
        id: 'refine',
        title: 'Let it evolve',
        body: 'If details feel expansive, add more. If they feel tight, broaden the language. Your vision is alive because you are.',
        href: '/life-vision/update',
        doneWhen: ['vision_updated'],
        optional: true,
      },
      {
        id: 'today',
        title: 'Choose today on purpose',
        body: 'Gratitude, your top three, and one fun or nourishing thing.',
        href: '/daily-paper/new',
        doneWhen: ['daily_paper_saved'],
      },
    ],
    completion: {
      headline: 'You’re reconnected and pointed somewhere.',
      body: 'Your vision is fresh in you, and today has a shape. Let it be easy.',
    },
    nextFlowIds: ['create-from-momentum'],
  },
  {
    id: 'create-from-momentum',
    state: 'above',
    title: 'Create from Momentum',
    bestFor: 'When you feel good and want to put that energy somewhere.',
    promise: 'Pick what feels most alive, move it forward, and capture the evidence.',
    needs: 'manifestation',
    steps: [
      {
        id: 'activate',
        title: 'Move it forward',
        body: 'Explore it with VIVA, or add an inspired action to today.',
        choices: [
          {
            id: 'viva',
            label: 'Explore with VIVA',
            description: 'Find the next inspired action, or create an activation for it.',
            href: (ctx: FlowContext) =>
              ctx.manifestationId ? `/viva?flow=create-from-momentum&manifestation=${ctx.manifestationId}&t=${Date.now()}` : '/viva?flow=create-from-momentum',
          },
          { id: 'paper', label: 'Add it to today', description: 'Put one aligned action on your Daily Paper.', href: '/daily-paper/new' },
          {
            id: 'manifestation',
            label: 'Open the manifestation',
            description: 'Add detail or a visual while it feels good.',
            href: (ctx: FlowContext) => (ctx.manifestationId ? `/manifestations/${ctx.manifestationId}` : '/manifestations'),
          },
        ],
        doneWhen: ['viva_action', 'daily_paper_saved', 'story_created', 'manifestation_touched'],
      },
      {
        id: 'evidence',
        title: 'Capture the evidence',
        body: 'Mark what’s arriving so it doesn’t slip by unnoticed.',
        choices: [
          {
            id: 'journal',
            label: 'Journal a win',
            description: 'Write what showed up and how it felt.',
            href: (ctx: FlowContext) => `/journal/new?tag=win${ctx.manifestationId ? `&manifestation=${ctx.manifestationId}` : ''}`,
          },
          { id: 'tribe', label: 'Share it with the Tribe', description: 'Let your people celebrate with you.', href: '/vibe-tribe/new?tag=win' },
          { id: 'abundance', label: 'Log abundance', description: 'Money or value that arrived.', href: '/abundance-tracker/new' },
        ],
        doneWhen: ['journal_saved', 'vibe_post_created', 'abundance_logged'],
      },
    ],
    completion: {
      headline: 'Momentum, meet motion.',
      body: 'You moved something forward and marked the evidence. Let it update what you expect next.',
    },
    nextFlowIds: ['return-to-vision'],
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
