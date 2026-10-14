import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEPTH_CLEAR_WORDS,
  computeDepth,
  groupNotesByCategory,
  type DraftSessionCategoryText,
  type DraftSessionNote,
} from './draft-session'

function words(count: number, label = 'word'): string {
  // A scene word so the scene heuristic passes.
  return `every morning ${Array.from({ length: count }, (_, i) => `${label}${i}`).join(' ')}`
}

function note(
  category: string,
  polarity: DraftSessionNote['polarity'],
  member_text: string,
  id = `${category}-${polarity}-${member_text.length}`,
): DraftSessionNote {
  return {
    id,
    session_id: 's',
    category,
    polarity,
    text: member_text.slice(0, 30),
    member_text,
    source: 'member',
    created_at: new Date().toISOString(),
  }
}

function beats(category: string, now: string, dream: string): DraftSessionCategoryText {
  return {
    id: `${category}-ct`,
    session_id: 's',
    category,
    starter_text: null,
    imagination_text: null,
    vision_text: null,
    now_text: now,
    dream_text: dream,
    now_at: now ? new Date().toISOString() : null,
    dream_at: dream ? new Date().toISOString() : null,
    unknown_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

test('tagged passages need a dream (clarity) to clear, not just contrast', () => {
  const onlyContrast = groupNotesByCategory([
    note('work', 'contrast', words(DEPTH_CLEAR_WORDS + 10, 'now')),
  ]).find((g) => g.category === 'work')!
  assert.equal(onlyContrast.depth, 'thin')

  const withDream = groupNotesByCategory([
    note('work', 'contrast', words(DEPTH_CLEAR_WORDS, 'now')),
    note('work', 'clarity', words(20, 'dream')),
  ]).find((g) => g.category === 'work')!
  assert.equal(withDream.depth, 'cleared')
})

test('row beats clear on words alone (both beats written), unchanged', () => {
  const g = groupNotesByCategory([], [
    beats('home', words(70, 'now'), words(60, 'dream')),
  ]).find((c) => c.category === 'home')!
  assert.equal(g.depth, 'cleared')
})

test('a passage already inside a row beat is not counted twice', () => {
  const nowText = words(70, 'now')
  const g = groupNotesByCategory(
    [note('money', 'contrast', nowText)],
    [beats('money', nowText, '')],
  ).find((c) => c.category === 'money')!
  assert.equal(g.memberWords, 72) // 70 + "every morning"
  assert.equal(g.depth, 'thin')
})

test('spill-over from a directed turn lights another area', () => {
  const depth = computeDepth([
    note('work', 'contrast', words(DEPTH_CLEAR_WORDS, 'w')),
    note('work', 'clarity', words(10, 'wd')),
    note('money', 'contrast', words(DEPTH_CLEAR_WORDS, 'm')),
    note('money', 'clarity', words(10, 'md')),
  ])
  assert.deepEqual(depth.cleared.sort(), ['money', 'work'])
  assert.equal(depth.readyToCompose, false)
})
