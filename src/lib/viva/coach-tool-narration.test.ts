import assert from 'node:assert/strict'
import test from 'node:test'
import {
  narrateCoachToolResults,
  resolveCoachReply,
  shouldForceCoachNarration,
} from './coach-tool-narration'

test('does not force narration after read-only tools', () => {
  assert.equal(
    shouldForceCoachNarration([
      { toolCalls: [{ toolName: 'read_member_content' }] },
    ]),
    false,
  )
})

test('forces narration after a write tool so the model cannot go silent', () => {
  assert.equal(
    shouldForceCoachNarration([
      { toolCalls: [{ toolName: 'read_member_content' }] },
      { toolCalls: [{ toolName: 'save_journal_entry' }] },
    ]),
    true,
  )
})

test('narrates a saved journal when the model produced no text', () => {
  const reply = narrateCoachToolResults([
    {
      text: '',
      toolResults: [{
        toolName: 'save_journal_entry',
        output: {
          success: true,
          message: 'Saved "The Think Tank Is Crushing It" to your journal.',
          link: '/journal/abc',
        },
      }],
    },
  ])
  assert.equal(
    reply,
    'Saved "The Think Tank Is Crushing It" to your journal — [open it](/journal/abc).',
  )
})

test('prefers the model\'s spoken text over a synthesized confirmation', () => {
  const reply = resolveCoachReply([
    {
      text: "It's in your Journal.",
      toolResults: [{
        output: {
          success: true,
          message: 'Saved "The Think Tank Is Crushing It" to your journal.',
          link: '/journal/abc',
        },
      }],
    },
  ])
  assert.equal(reply, "It's in your Journal.")
})

test('resolveCoachReply falls back to tool narration when every step is silent', () => {
  const reply = resolveCoachReply([
    {
      text: '',
      toolResults: [{
        output: {
          success: true,
          message: 'Saved "The Think Tank Is Crushing It" to your journal.',
          link: '/journal/abc',
        },
      }],
    },
  ], '')
  assert.match(reply, /The Think Tank Is Crushing It/)
})
