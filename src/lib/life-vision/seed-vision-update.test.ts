import assert from 'node:assert/strict'
import test from 'node:test'
import { frameVisionUpdateSeedMessage } from './seed-vision-update'

test('frames pending Life Vision proposals the update page can restore', () => {
  const framed = frameVisionUpdateSeedMessage({
    intro: 'I proposed updates to Work.',
    proposals: [{
      category: 'work',
      content: 'I lead businesses where responsibility is shared.',
    }],
  })
  assert.match(framed, /I proposed updates to Work/)
  assert.match(framed, /<<<VISION work>>>/)
  assert.match(framed, /responsibility is shared/)
  assert.match(framed, /<<<END VISION>>>/)
})

test('skips invalid categories', () => {
  const framed = frameVisionUpdateSeedMessage({
    intro: 'Nothing valid.',
    proposals: [{ category: 'not-a-category', content: 'Nope.' }],
  })
  assert.equal(framed, 'Nothing valid.')
})
