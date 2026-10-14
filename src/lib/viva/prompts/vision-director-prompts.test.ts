import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CORE_FOUR_ANCHORS,
  OPENER_PROMPT,
  buildDirectorUserPrompt,
  nextAnchor,
  parseDirectorOutput,
} from './vision-director-prompts'

const ct = (category: string, now = '', dream = '') => ({ category, now_text: now, dream_text: dream })

test('opener targets health and is the first anchor', () => {
  assert.deepEqual(OPENER_PROMPT.targets, ['health'])
  assert.equal(OPENER_PROMPT.anchored, true)
  assert.equal(OPENER_PROMPT.anchorIndex, 0)
  assert.ok(OPENER_PROMPT.prompt.includes('health, relationships, money, work'))
})

test('anchors walk health, relationships, money, work in order', () => {
  assert.deepEqual(nextAnchor([], []), { index: 0, targets: ['health'] })
  assert.deepEqual(
    nextAnchor([{ target_categories: ['health'] }], []),
    { index: 1, targets: ['love', 'family', 'social'] },
  )
  assert.deepEqual(
    nextAnchor([{ target_categories: ['health'] }, { target_categories: ['love', 'family', 'social'] }], []),
    { index: 2, targets: ['money'] },
  )
})

test('an anchor already written in the rows is skipped', () => {
  const next = nextAnchor([], [ct('health', 'tired all the time', 'strong and rested')])
  assert.deepEqual(next, { index: 1, targets: ['love', 'family', 'social'] })
})

test('relationships anchor is skipped only when all three areas have row beats', () => {
  const partial = nextAnchor([{ target_categories: ['health'] }], [ct('love', 'x', 'y')])
  assert.equal(partial?.index, 1)
  const full = nextAnchor(
    [{ target_categories: ['health'] }],
    [ct('love', 'x', 'y'), ct('family', 'x', 'y'), ct('social', 'x', 'y')],
  )
  assert.equal(full?.index, 2)
})

test('null once all four anchors are covered', () => {
  const turns = CORE_FOUR_ANCHORS.map((targets) => ({ target_categories: [...targets] }))
  assert.equal(nextAnchor(turns, []), null)
})

test('forced targets lock the card; gap mode states the priority order', () => {
  const forced = buildDirectorUserPrompt({ coverageBlock: 'COVERAGE', forcedTargets: ['money'], anchorIndex: 2 })
  assert.ok(forced.includes('ANCHORED'))
  assert.ok(forced.includes('money'))
  assert.ok(!forced.includes('FILLS GAPS'))

  const gaps = buildDirectorUserPrompt({ coverageBlock: 'COVERAGE' })
  assert.ok(gaps.includes('FILLS GAPS'))
  const emptyIdx = gaps.indexOf('EMPTY areas before THIN')
  const dreamIdx = gaps.indexOf('no dream yet before')
  const skipIdx = gaps.indexOf('Skip CLEARED and UNKNOWN')
  assert.ok(emptyIdx > -1 && dreamIdx > emptyIdx && skipIdx > dreamIdx)
})

test('director output parses, forced targets win over the model', () => {
  const parsed = parseDirectorOutput('```json\n{"targets":["travel"],"prompt":"Tell me about money."}\n```', ['money'])
  assert.deepEqual(parsed, { targets: ['money'], prompt: 'Tell me about money.' })
  const free = parseDirectorOutput('{"targets":["travel","fun","home"],"prompt":"Go."}', [])
  assert.deepEqual(free?.targets, ['travel', 'fun'])
  assert.equal(parseDirectorOutput('not json', []), null)
})
