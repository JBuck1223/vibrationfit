import { z } from 'zod'
const internalHref = z
  .string()
  .max(600)
  .refine((v) => /^\/(?!\/)[a-zA-Z0-9/?=&_%.-]*$/.test(v))
const track = z.object({
  id: z.string().max(200),
  title: z.string().max(300),
  artist: z.string().max(300),
  url: z
    .string()
    .url()
    .max(3000)
    .refine((v) => v.startsWith('https://')),
  duration: z.number().finite().min(0),
  thumbnail: z.string().max(3000).optional(),
  sectionKey: z.string().max(100).optional(),
})
export const playbackSchema = z
  .object({
    tracks: z.array(track).min(1).max(100),
    currentIndex: z.number().int().min(0),
    currentTime: z.number().finite().min(0),
    duration: z.number().finite().min(0),
    setName: z.string().max(300),
    setIconKey: z.string().max(100),
    contentCategory: z.enum(['life_vision', 'story', 'music']),
    updatedAt: z.number().finite().min(0),
  })
  .refine((v) => v.currentIndex < v.tracks.length)
export type PlaybackCheckpoint = z.infer<typeof playbackSchema>
export interface Visit {
  id: string
  toolId: string
  href: string
  at: number
}
export interface Continuity {
  visits: Visit[]
  pinned: string[]
  dismissed: string[]
  playback: PlaybackCheckpoint | null
}
export const EMPTY_CONTINUITY: Continuity = {
  visits: [],
  pinned: [],
  dismissed: [],
  playback: null,
}
export const continuityAction = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('visit'),
    id: z.string().uuid(),
    toolId: z.string().max(60),
    href: internalHref,
    at: z.number().finite().min(0),
  }),
  z.object({
    type: z.literal('pin'),
    toolId: z.string().max(60),
    pinned: z.boolean(),
  }),
  z.object({ type: z.literal('dismiss'), id: z.string().max(200) }),
  z.object({ type: z.literal('playback'), checkpoint: playbackSchema }),
])
export type ContinuityAction = z.infer<typeof continuityAction>
export function normalizeContinuity(value: unknown): Continuity {
  const s = (
    value && typeof value === 'object' ? value : {}
  ) as Partial<Continuity>
  return {
    visits: Array.isArray(s.visits)
      ? s.visits
          .filter(
            (v) =>
              v &&
              typeof v.id === 'string' &&
              typeof v.toolId === 'string' &&
              internalHref.safeParse(v.href).success &&
              Number.isFinite(v.at),
          )
          .slice(-200)
      : [],
    pinned: Array.isArray(s.pinned)
      ? s.pinned.filter((v) => typeof v === 'string').slice(0, 6)
      : [],
    dismissed: Array.isArray(s.dismissed)
      ? s.dismissed.filter((v) => typeof v === 'string').slice(-50)
      : [],
    playback: playbackSchema.safeParse(s.playback).success ? s.playback! : null,
  }
}
export function applyContinuityAction(
  state: Continuity,
  action: ContinuityAction,
  now = Date.now(),
): Continuity {
  if (action.type === 'visit') {
    if (state.visits.some((v) => v.id === action.id)) return state
    const previous = state.visits.at(-1)
    if (previous?.href === action.href && now - previous.at < 60_000)
      return state
    return {
      ...state,
      visits: [
        ...state.visits,
        { id: action.id, toolId: action.toolId, href: action.href, at: now },
      ]
        .filter((v) => now - v.at < 30 * 86400_000)
        .slice(-200),
    }
  }
  if (action.type === 'pin')
    return {
      ...state,
      pinned: action.pinned
        ? [...new Set([...state.pinned, action.toolId])].slice(0, 6)
        : state.pinned.filter((id) => id !== action.toolId),
    }
  if (action.type === 'dismiss')
    return {
      ...state,
      dismissed: [...new Set([...state.dismissed, action.id])].slice(-50),
    }
  const checkpoint = {
    ...action.checkpoint,
    updatedAt: Math.min(action.checkpoint.updatedAt, now),
  }
  return !state.playback || checkpoint.updatedAt > state.playback.updatedAt
    ? { ...state, playback: checkpoint }
    : state
}
export function rankTools(
  state: Continuity,
  candidates: string[],
  now = Date.now(),
) {
  const scores = new Map<string, number>()
  for (const visit of state.visits) {
    const days = Math.max(0, (now - visit.at) / 86400_000)
    if (days <= 30)
      scores.set(
        visit.toolId,
        (scores.get(visit.toolId) ?? 0) + Math.exp(-days / 7),
      )
  }
  const pinned = state.pinned.filter((id) => candidates.includes(id))
  const sorted = candidates
    .filter((id) => !pinned.includes(id))
    .sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0))
  return [...pinned, ...sorted]
}
