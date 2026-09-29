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

test('a short current state and a short want are not enough to write the vision', () => {
  const substance = describeIntakeSubstance({
    category: 'work',
    current_state: 'My job is draining.',
    dream_response: { want: 'I want work that feels like mine.' },
    conversation: [
      { role: 'user', content: 'My job is draining.' },
      { role: 'user', content: 'I want work that feels like mine.' },
    ],
  })

  assert.equal(substance.ready, false)
  assert.ok(substance.gaps.some((gap) => gap.startsWith('current_state')))
  assert.ok(substance.gaps.some((gap) => gap.startsWith('dream.want')))
  assert.ok(substance.gaps.some((gap) => gap.startsWith('they have written')))
})

test('padded fields do not count when the person has barely spoken', () => {
  const substance = describeIntakeSubstance({
    category: 'home',
    current_state: words(min.currentStateWords, 'now'),
    dream_response: {
      want: words(min.wantWords, 'want'),
      feel: words(min.textureWords, 'feel'),
    },
    conversation: [{ role: 'user', content: 'Home is messy and I want it calm.' }],
  })

  assert.equal(substance.ready, false)
  assert.ok(substance.gaps.some((gap) => gap.startsWith('they have written')))
})

test('a long chat still waits until the stored fields can carry a vision', () => {
  const substance = describeIntakeSubstance({
    category: 'love',
    current_state: 'We barely talk.',
    dream_response: { want: 'I want us close again.' },
    conversation: [{ role: 'user', content: words(min.userWords) }],
  })

  assert.equal(substance.ready, false)
  assert.ok(substance.gaps.some((gap) => gap.startsWith('dream.want')))
})

test('why, feel, or become has to show up before the vision can be written', () => {
  const substance = describeIntakeSubstance({
    category: 'money',
    current_state: words(min.currentStateWords, 'now'),
    dream_response: { want: words(min.wantWords, 'want') },
    conversation: [{ role: 'user', content: words(min.userWords) }],
  })

  assert.equal(substance.ready, false)
  assert.ok(substance.gaps.some((gap) => gap.startsWith('why / feel / become')))
})

test('a meaty picture in the area is ready', () => {
  const substance = describeIntakeSubstance({
    category: 'family',
    current_state: words(min.currentStateWords, 'now'),
    dream_response: {
      want: words(min.wantWords, 'want'),
      why: words(min.textureWords, 'why'),
    },
    conversation: [
      { role: 'assistant', content: words(80, 'viva') },
      { role: 'user', content: words(min.userWords, 'mine') },
    ],
  })

  assert.equal(substance.ready, true)
  assert.deepEqual(substance.gaps, [])
  assert.equal(substance.userWords, min.userWords)
})
