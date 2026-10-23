/**
 * The Green Line flows. Each one stitches existing tools into a short path
 * named for an outcome, not a feature. Members can skip, leave, or repeat.
 */

import { storyCreateHref } from '@/lib/stories/types'
import type { ArrivalState, FeelingOption, FlowContext, FlowDefinition, FlowStep } from './types'

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
  {
    id: 'settle-first',
    state: 'below',
    title: 'Settle First',
    bestFor: 'When it all feels like too much and your mind won\u2019t slow down.',
    promise: 'Calm your body before you think anything through. A few minutes of guided breathing, then talk it out only if you want to.',
    steps: [
      {
        id: 'breathe',
        title: 'Breathe and settle',
        body: 'Pick a short breath-paced meditation and let your body slow down. Two to five minutes is plenty.',
        href: '/meditations',
        doneWhen: ['meditation_completed'],
      },
      {
        id: 'talk',
        title: 'Talk it through, if you want',
        body: 'Now that you\u2019re calmer, VIVA can help you see what was underneath it. Or stop here; settling is enough.',
        href: vivaHref('talk-it-through', 'I just took a few minutes to settle. Here\u2019s what was overwhelming me: '),
        doneWhen: ['journal_saved'],
        optional: true,
      },
    ],
    completion: {
      headline: 'You gave yourself room to breathe.',
      body: 'Calm first, clarity second. Everything looks different from a settled place.',
    },
    nextFlowIds: ['rise-above'],
  },
  {
    id: 'let-it-out',
    state: 'below',
    title: 'Let It Out',
    bestFor: 'When you\u2019re frustrated or angry and need somewhere for it to go.',
    promise: 'Write it all out with no filter, then find a softer thought and make an Incantation you can return to.',
    steps: [
      {
        id: 'write',
        title: 'Let it all out',
        body: 'Write everything in your Journal, no filter, no fixing. Getting it out is the point.',
        href: '/journal/new?tag=wobble',
        doneWhen: ['journal_saved'],
      },
      {
        id: 'soften',
        title: 'Find a softer thought',
        body: 'With the charge out, VIVA helps you find a thought that feels a little better, and turns it into an Incantation.',
        choices: [
          {
            id: 'viva',
            label: 'Find it with VIVA',
            description: 'VIVA helps you soften it and makes the Incantation.',
            href: vivaHref('let-it-out', 'I just let it all out in my journal. Help me find a softer thought about this: '),
          },
          { id: 'incantation', label: 'Write an Incantation', description: 'Go straight to the Incantation studio.', href: storyCreateHref('incantation') },
        ],
        doneWhen: ['incantation_created'],
      },
    ],
    completion: {
      headline: 'You let it out and found your footing.',
      body: 'The charge is out, and you have words to come back to when it rises again.',
    },
    nextFlowIds: ['rise-above'],
  },
  {
    id: 'lean-on-your-people',
    state: 'below',
    title: 'Lean on Your People',
    bestFor: 'When you don\u2019t want to carry this alone.',
    promise: 'Share your wobble with the Vibe Tribe, people who get it, then talk it through with VIVA if you want to.',
    steps: [
      {
        id: 'share',
        title: 'Share it with the Tribe',
        body: 'Post your wobble or ask for support. The Tribe holds the vision for you when it feels shaky.',
        href: '/vibe-tribe/new?tag=wobble',
        doneWhen: ['vibe_post_created'],
      },
      {
        id: 'talk',
        title: 'Talk it through, if you want',
        body: 'While the Tribe responds, VIVA can help you see it more clearly.',
        href: vivaHref('talk-it-through', 'I just shared a wobble with the Tribe. Here\u2019s what\u2019s going on: '),
        doneWhen: ['journal_saved'],
        optional: true,
      },
    ],
    completion: {
      headline: 'You reached out. That takes strength.',
      body: 'Your people have you. Check back on your post; support is on its way.',
    },
    nextFlowIds: ['settle-first'],
  },
  {
    id: 'choose-today',
    state: 'on',
    title: 'Choose Today on Purpose',
    bestFor: 'When you feel scattered and want your day to have a shape.',
    promise: 'Gratitude, your top three, and one fun or nourishing thing. A simple page that turns a scattered day into a chosen one.',
    steps: [
      {
        id: 'paper',
        title: 'Write today\u2019s Daily Paper',
        body: 'Start with gratitude, choose your top three, and add one thing that\u2019s just for joy.',
        href: '/daily-paper/new',
        doneWhen: ['daily_paper_saved'],
      },
    ],
    completion: {
      headline: 'Today has a shape now.',
      body: 'You chose where your attention goes. Let the rest be easy.',
    },
    nextFlowIds: ['rise-above'],
  },
  {
    id: 'celebrate-arriving',
    state: 'above',
    title: 'Celebrate What\u2019s Arriving',
    bestFor: 'When something good just showed up and you want to mark it.',
    promise: 'Capture the evidence so it doesn\u2019t slip by, and share it with your people if you like.',
    steps: [
      {
        id: 'capture',
        title: 'Capture the evidence',
        body: 'Write the win, or log the money or value that arrived. Evidence updates what you expect next.',
        choices: [
          { id: 'journal', label: 'Journal the win', description: 'What showed up, and how it felt.', href: '/journal/new?tag=win' },
          { id: 'abundance', label: 'Log abundance', description: 'Money or value that arrived.', href: '/abundance-tracker/new' },
        ],
        doneWhen: ['journal_saved', 'abundance_logged'],
      },
      {
        id: 'share',
        title: 'Share it with the Tribe',
        body: 'Let your people celebrate with you.',
        href: '/vibe-tribe/new?tag=win',
        doneWhen: ['vibe_post_created'],
        optional: true,
      },
    ],
    completion: {
      headline: 'You noticed it. That\u2019s how more comes.',
      body: 'The evidence is saved. Let it raise what you expect next.',
    },
    nextFlowIds: ['celebrate-and-expand'],
  },
]

/** "What's it like right now?" — each feeling starts one path. */
export const FEELINGS: FeelingOption[] = [
  { id: 'joyful', state: 'above', label: 'Grateful and joyful', flowId: 'celebrate-and-expand' },
  { id: 'arrived', state: 'above', label: 'Something good just arrived', flowId: 'celebrate-arriving' },
  { id: 'above-unsure', state: 'above', label: 'Not sure, just good', flowId: null },
  { id: 'want-more', state: 'on', label: 'Fine, but I want to feel better', flowId: 'rise-above' },
  { id: 'scattered', state: 'on', label: 'Scattered and unfocused', flowId: 'choose-today' },
  { id: 'on-unsure', state: 'on', label: 'Not sure', flowId: null },
  { id: 'overwhelmed', state: 'below', label: 'Overwhelmed or anxious', flowId: 'settle-first' },
  { id: 'sad', state: 'below', label: 'Sad, hurt or heavy', flowId: 'talk-it-through' },
  { id: 'frustrated', state: 'below', label: 'Frustrated or angry', flowId: 'let-it-out' },
  { id: 'lonely', state: 'below', label: 'Alone, I need support', flowId: 'lean-on-your-people' },
  { id: 'below-unsure', state: 'below', label: 'Not sure what I\u2019m feeling', flowId: null },
]

export function feelingsForState(state: ArrivalState): FeelingOption[] {
  return FEELINGS.filter((f) => f.state === state)
}

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
