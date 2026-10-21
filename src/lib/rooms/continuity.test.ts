import {
  userNavigationGroups,
  userNavigationPrimary,
} from '../navigation/menu-definitions'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyContinuityAction,
  EMPTY_CONTINUITY,
  normalizeContinuity,
  rankTools,
  continuityAction,
} from './continuity'
import { ROOM_TOOLS, toolForHref, roomForHref } from './catalog'
const now = 1_800_000_000_000
const visit = {
  type: 'visit' as const,
  id: 'f2cf4d81-c0b1-47de-8ec0-45af98432734',
  toolId: 'journal',
  href: '/journal/abc',
  at: now,
}
test('retried navigation does not inflate usage; newer visits retain the exact path', () => {
  const first = applyContinuityAction(EMPTY_CONTINUITY, visit, now)
  assert.equal(applyContinuityAction(first, visit, now + 1000).visits.length, 1)
  assert.equal(
    applyContinuityAction(first, { ...visit, id: 'retry' }, now + 1000).visits
      .length,
    1,
  )
  const next = applyContinuityAction(
    first,
    { ...visit, id: 'next', href: '/journal/other' },
    now + 2000,
  )
  assert.equal(next.visits.at(-1)?.href, '/journal/other')
  assert.equal(EMPTY_CONTINUITY.visits.length, 0)
})
test('pins win over frequency, recent visits win over old visits, unknown pins are omitted', () => {
  const s = {
    ...EMPTY_CONTINUITY,
    pinned: ['viva', 'unknown'],
    visits: [
      { ...visit, at: now - 20 * 86400000 },
      { ...visit, id: 'new', toolId: 'audio', at: now },
    ],
  }
  assert.deepEqual(rankTools(s, ['journal', 'audio', 'viva'], now), [
    'viva',
    'audio',
    'journal',
  ])
})
test('pinning is idempotent and capped at six; unpinning restores adaptive order', () => {
  let state = EMPTY_CONTINUITY
  for (const toolId of ['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    state = applyContinuityAction(
      state,
      { type: 'pin', toolId, pinned: true },
      now,
    )
  assert.equal(state.pinned.length, 6)
  assert.equal(
    applyContinuityAction(
      state,
      { type: 'pin', toolId: 'a', pinned: true },
      now,
    ).pinned.length,
    6,
  )
  assert.equal(
    applyContinuityAction(
      state,
      { type: 'pin', toolId: 'a', pinned: false },
      now,
    ).pinned.includes('a'),
    false,
  )
})
test('older device playback cannot overwrite a newer checkpoint', () => {
  const checkpoint = {
    tracks: [
      {
        id: '1',
        title: 'Ocean',
        artist: 'Me',
        url: 'https://media.vibrationfit.com/audio.mp3',
        duration: 120,
      },
    ],
    currentIndex: 0,
    currentTime: 42,
    duration: 120,
    setName: 'Vision',
    setIconKey: '',
    contentCategory: 'life_vision' as const,
    updatedAt: now,
  }
  const state = applyContinuityAction(
    EMPTY_CONTINUITY,
    { type: 'playback', checkpoint },
    now,
  )
  assert.equal(
    applyContinuityAction(
      state,
      {
        type: 'playback',
        checkpoint: { ...checkpoint, currentTime: 1, updatedAt: now - 1000 },
      },
      now,
    ).playback?.currentTime,
    42,
  )
})
test('untrusted persisted state and external navigation targets are rejected', () => {
  assert.deepEqual(
    normalizeContinuity({
      visits: [null, { href: 'https://outside.test' }],
      playback: { tracks: [] },
    }),
    EMPTY_CONTINUITY,
  )
  assert.equal(
    continuityAction.safeParse({ ...visit, href: '//outside.test' }).success,
    false,
  )
  assert.equal(
    continuityAction.safeParse({ ...visit, href: '/journal?q=<script>' })
      .success,
    false,
  )
})
test('nested features retain their room and all directory destinations resolve', () => {
  for (const tool of ROOM_TOOLS)
    assert.equal(toolForHref(tool.href)?.id, tool.id)
  assert.equal(toolForHref('/story?kind=incantation')?.id, 'incantations')
  assert.equal(roomForHref('/audio/songwriter/abc'), 'listen')
  assert.equal(roomForHref('/journal/abc/edit'), 'capture')
})

test('every current member sidebar destination is reachable through a room or Home', () => {
  const destinations = [
    ...userNavigationPrimary,
    ...userNavigationGroups.flatMap((group) => group.items),
  ]
  for (const item of destinations) {
    assert.ok(
      item.href === '/dashboard' ||
        ROOM_TOOLS.some((tool) => tool.href === item.href),
      `Missing ${item.name}: ${item.href}`,
    )
  }
})
