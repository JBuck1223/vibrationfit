/**
 * Vibration Fit Kids — the Life Compass.
 *
 * Not "the 12 life categories" taught as a list: 12 places on a map he
 * lives on, plus 3 truths he can act. One slice per week as a lens on
 * whatever the expedition already is. Act first, name second.
 *
 * Canonical kid names for the 12 (the map API mirrors these).
 */

import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'

export interface CompassSlice {
  key: LifeCategoryKey
  /** Kid name for the slice. */
  kid_name: string
  /** One-word job — what this slice does in a life. */
  job: string
  /** A body move that lives the slice before naming it. */
  body_move: string
}

export const COMPASS_SLICES: CompassSlice[] = [
  { key: 'fun', kid_name: 'Things I Love to Do', job: 'Play', body_move: 'Do your favorite move — the one that makes you laugh.' },
  { key: 'health', kid_name: 'My Amazing Body', job: 'Power', body_move: 'Ten explorer jumps, then feel your heart drum.' },
  { key: 'travel', kid_name: 'Places Near & Far', job: 'Go', body_move: 'Point to somewhere you have never been. March three steps toward it.' },
  { key: 'love', kid_name: 'People I Love', job: 'Warm', body_move: 'Give someone (or something) a real hug.' },
  { key: 'family', kid_name: 'My Family Story', job: 'Belong', body_move: 'Stand back to back with a family member. Feel the lean.' },
  { key: 'social', kid_name: 'My Friends & Community', job: 'Share', body_move: 'A high five, invented fresh — a handshake nobody else has.' },
  { key: 'home', kid_name: 'Where I Live', job: 'Nest', body_move: 'Touch the spot in the house you love most.' },
  { key: 'work', kid_name: 'What I Create', job: 'Make', body_move: 'Hold up today\u2019s artifact like a trophy.' },
  { key: 'money', kid_name: 'Counting & Sharing', job: 'Trade', body_move: 'Stack three coins, then trade one for a handshake.' },
  { key: 'stuff', kid_name: 'Things I Use & Make', job: 'Keep', body_move: 'Bring your favorite treasure and tell its story in one breath.' },
  { key: 'giving', kid_name: 'How I Help', job: 'Give', body_move: 'Do one secret helpful thing before dinner.' },
  { key: 'spirituality', kid_name: 'My Quiet Inside', job: 'Wonder', body_move: 'Close your eyes. Three slow breaths. What do you notice?' },
]

export function compassSlice(key: LifeCategoryKey): CompassSlice {
  return COMPASS_SLICES.find((s) => s.key === key) || COMPASS_SLICES[0]
}

/** One slice per week as a lens — rotates through the year deterministically. */
export function compassSliceForWeek(date = new Date()): CompassSlice {
  const jan1 = new Date(date.getFullYear(), 0, 1)
  const week = Math.floor((date.getTime() - jan1.getTime()) / (7 * 86_400_000))
  return COMPASS_SLICES[week % COMPASS_SLICES.length]
}

/**
 * The three truths — adult principle, kid sentence, daily move.
 * Named at existing lesson beats (choice point, Green Line check,
 * celebration close) — never a seventh lesson block.
 */
export interface CompassTruth {
  key: 'freedom' | 'joy' | 'expansion'
  adult: string
  kid_sentence: string
  daily_move: string
}

export const COMPASS_TRUTHS: CompassTruth[] = [
  {
    key: 'freedom',
    adult: 'The basis of life is freedom',
    kid_sentence: 'I get to choose.',
    daily_move: 'Name the lesson\u2019s choice point out loud when it happens.',
  },
  {
    key: 'joy',
    adult: 'The purpose of life is joy',
    kid_sentence: 'If it feels good, we\u2019re on the path.',
    daily_move: 'One-word Green Line check.',
  },
  {
    key: 'expansion',
    adult: 'The result of life is expansion',
    kid_sentence: 'I notice I can do more.',
    daily_move: 'Once a week: "I used to ____. Now I can ____."',
  },
]

/** Contrast stays information, never punishment. */
export const CONTRAST_LINE = 'That felt yuck. Now you know what you want instead.'
