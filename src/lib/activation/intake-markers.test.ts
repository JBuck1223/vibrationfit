import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACTIVATION_VISION_SOURCE_MIN,
  describeIntakeSubstance,
} from './intake-markers'

function words(count: number, label = 'word'): string {
  return Array.from({ length: count }, (_, i) => `${label}${i}`).join(' ')
}

const min = ACTIVATION_VISION_SOURCE_MIN

test('a short now and a short imagination are not enough to write the vision', () => {
  const substance = describeIntakeSubstance({
    category: 'work',
    current_state: 'My job is draining.',
    dream_response: { want: 'I want work that feels like mine.' },
  })

  assert.equal(substance.ready, false)
  assert.ok(substance.gaps.some((gap) => gap.startsWith('current_state')))
  assert.ok(substance.gaps.some((gap) => gap.startsWith('dream.want')))
})

test('a full now beat still waits for the imagination beat', () => {
  const substance = describeIntakeSubstance({
    category: 'love',
    current_state: words(min.currentStateWords, 'now'),
    dream_response: { want: 'I want us close again.' },
  })

  assert.equal(substance.ready, false)
  assert.deepEqual(
    substance.gaps.map((gap) => gap.split(' ')[0]),
    ['dream.want'],
  )
})

test('no category means not ready even with both beats full', () => {
  const substance = describeIntakeSubstance({
    category: null,
    current_state: words(min.currentStateWords, 'now'),
    dream_response: { want: words(min.wantWords, 'want') },
  })

  assert.equal(substance.ready, false)
  assert.ok(substance.gaps.some((gap) => gap.startsWith('category')))
})

test('why, feel, become and chat word counts do not gate readiness', () => {
  const substance = describeIntakeSubstance({
    category: 'money',
    current_state: words(min.currentStateWords, 'now'),
    dream_response: { want: words(min.wantWords, 'want') },
    conversation: [],
  })

  assert.equal(substance.ready, true)
  assert.deepEqual(substance.gaps, [])
  assert.equal(substance.textureWords, 0)
  assert.equal(substance.userWords, 0)
})

test('both beats at the floor are ready', () => {
  const substance = describeIntakeSubstance({
    category: 'family',
    current_state: words(min.currentStateWords, 'now'),
    dream_response: { want: words(min.wantWords, 'want') },
  })

  assert.equal(substance.ready, true)
  assert.equal(substance.currentWords, min.currentStateWords)
  assert.equal(substance.wantWords, min.wantWords)
})
