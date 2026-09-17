import assert from 'node:assert/strict'
import test from 'node:test'
import { composeVivaJournalContent } from './compose-viva-entry'

test('wobble entries keep contrast, VIVA insight, and chosen truth separate', () => {
  const content = composeVivaJournalContent({
    journalTag: 'wobble',
    content: 'unused when wobble_summary is set',
    wobbleSummary: 'I feel like I have to hold every thread or it falls apart.',
    clarity: 'You were not questioning whether you could build it. You were questioning whether you had to carry everything else.',
    chosenTruth: 'I do not have to hold all the threads together for everything to work.',
    conversationId: 'thread-1',
  })
  assert.match(content, /\*\*The Wobble\*\*/)
  assert.match(content, /hold every thread/)
  assert.match(content, /\*\*What Became Clear\*\*/)
  assert.match(content, /You were not questioning/)
  assert.match(content, /\*\*What I Choose\*\*/)
  assert.match(content, /I do not have to hold/)
  assert.match(content, /\[Open the chat\]\(\/viva\?thread=thread-1\)/)
})

test('omits empty wobble sections', () => {
  const content = composeVivaJournalContent({
    journalTag: 'wobble',
    content: 'The contrast only.',
    conversationId: null,
  })
  assert.equal(content, '**The Wobble**\n\nThe contrast only.')
})

test('wins keep a single body plus a chat link', () => {
  const content = composeVivaJournalContent({
    journalTag: 'win',
    content: 'The client I put on my board said yes.',
    conversationId: 'win-thread',
  })
  assert.equal(
    content,
    'The client I put on my board said yes.\n\nFrom this conversation: [Open the chat](/viva?thread=win-thread)',
  )
})
