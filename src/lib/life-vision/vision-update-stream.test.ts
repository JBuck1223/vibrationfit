import assert from 'node:assert/strict'
import test from 'node:test'
import { parseVisionUpdateMessage } from './vision-update-stream'

test('parses a vision proposal and hides it from chat', () => {
  const parsed = parseVisionUpdateMessage(
    'Here is Fun.\n<<<VISION fun>>>\nI play every afternoon.\n<<<END VISION>>>\nWant me to do Health next?',
  )
  assert.equal(parsed.chatText, 'Here is Fun.\n\nWant me to do Health next?')
  assert.equal(parsed.proposals.length, 1)
  assert.equal(parsed.proposals[0].category, 'fun')
  assert.equal(parsed.proposals[0].text, 'I play every afternoon.')
  assert.equal(parsed.proposals[0].complete, true)
  assert.equal(parsed.seeds.length, 0)
})

test('parses contrast and clarity seeds and hides them from chat', () => {
  const parsed = parseVisionUpdateMessage(
    'Thank you — I heard that.\n<<<SEED work contrast>>>\nI dread Monday mornings.\n<<<END SEED>>>\n<<<SEED work clarity>>>\nI lead a studio I love.\n<<<END SEED>>>\nWhat does a great Monday feel like in your body?',
  )
  assert.match(parsed.chatText, /Thank you/)
  assert.match(parsed.chatText, /What does a great Monday/)
  assert.equal(parsed.seeds.length, 2)
  assert.deepEqual(
    parsed.seeds.map((s) => s.polarity),
    ['contrast', 'clarity'],
  )
  assert.equal(parsed.seeds[0].text, 'I dread Monday mornings.')
  assert.equal(parsed.seeds[1].text, 'I lead a studio I love.')
  assert.ok(parsed.seeds.every((s) => s.complete))
  assert.equal(parsed.proposals.length, 0)
})

test('hides a partial seed marker while streaming', () => {
  const parsed = parseVisionUpdateMessage(
    'Got it.\n<<<SEED love contrast>>>\nWe argue about',
  )
  assert.equal(parsed.chatText, 'Got it.')
  assert.equal(parsed.seeds.length, 1)
  assert.equal(parsed.seeds[0].complete, false)
  assert.match(parsed.seeds[0].text, /We argue about/)
})

test('hides a trailing partial open marker', () => {
  const parsed = parseVisionUpdateMessage('One more thing. <<<SEED fun con')
  assert.equal(parsed.chatText, 'One more thing.')
  assert.equal(parsed.seeds.length, 0)
})

test('ignores seeds for forward/conclusion and unknown categories', () => {
  const parsed = parseVisionUpdateMessage(
    'Ok.\n<<<SEED forward contrast>>>\nShould not land.\n<<<END SEED>>>\n<<<SEED not_a_cat clarity>>>\nNope.\n<<<END SEED>>>\nNext question?',
  )
  assert.match(parsed.chatText, /Next question/)
  assert.equal(parsed.seeds.length, 0)
})
