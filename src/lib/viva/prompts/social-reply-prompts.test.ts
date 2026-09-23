import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ADMIN_SOCIAL_REPLY_MODE,
  SOCIAL_REPLY_END,
  SOCIAL_REPLY_START,
  buildSocialReplySystemPrompt,
  buildSocialReplyUserMessage,
  extractSocialReplyDraft,
  parseSocialReplyIntake,
  parseSocialReplyIntakeJson,
} from './social-reply-prompts'

const intake = {
  incomingMessage: 'I keep attracting the same kind of relationship and I am exhausted.',
  platform: 'instagram_dm' as const,
  length: 'medium' as const,
  voice: 'vanessa_jordan' as const,
  notes: 'She commented on the Both/And reel.',
}

test('extracts the marked reply and ignores the admin note', () => {
  const text = `I kept it personal and skipped the pitch.

${SOCIAL_REPLY_START}
I hear how tired that loop is.

The pattern is not proof that this is all love has for you.
${SOCIAL_REPLY_END}
`
  assert.equal(
    extractSocialReplyDraft(text),
    'I hear how tired that loop is.\n\nThe pattern is not proof that this is all love has for you.',
  )
})

test('falls back to the full text when markers are missing', () => {
  assert.equal(extractSocialReplyDraft('  Just post this.  '), 'Just post this.')
})

test('parses intake and rejects an empty message', () => {
  assert.equal(parseSocialReplyIntake({ incomingMessage: '  ' }), null)
  assert.deepEqual(parseSocialReplyIntake({ incomingMessage: 'Help', platform: 'tiktok' }), {
    incomingMessage: 'Help',
    platform: 'tiktok',
    length: 'medium',
    voice: 'vanessa_jordan',
    notes: null,
  })
})

test('round-trips intake JSON stored on the session', () => {
  const parsed = parseSocialReplyIntakeJson(JSON.stringify(intake))
  assert.deepEqual(parsed, { ...intake, notes: 'She commented on the Both/And reel.' })
})

test('system prompt keeps VIVA programmed and the admin out of the story', () => {
  const prompt = buildSocialReplySystemPrompt(intake)
  assert.match(prompt, /Conversational Intelligence/)
  assert.match(prompt, /THIS IS NOT THE ADMIN'S LIFE/)
  assert.match(prompt, /I keep attracting the same kind of relationship/)
  assert.match(prompt, /Both\/And reel/)
  assert.match(prompt, /Vanessa and Jordan/)
  assert.doesNotMatch(prompt, /Life Vision is the anchor/)
})

test('first user message frames the third party, not the admin', () => {
  const message = buildSocialReplyUserMessage(intake, 'Keep the product pitch out.')
  assert.match(message, /Instagram DM/)
  assert.match(message, /I keep attracting/)
  assert.match(message, /Keep the product pitch out/)
  assert.equal(ADMIN_SOCIAL_REPLY_MODE, 'admin_social_reply')
})
