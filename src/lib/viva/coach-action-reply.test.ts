import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCoachSpokenReply } from './coach-action-reply'

test('prefers the model\'s own speech over tool copy', () => {
  const spoken = buildCoachSpokenReply([
    {
      text: '',
      toolResults: [{
        output: {
          success: true,
          kind: 'journal',
          title: 'Win',
          message: 'Saved "Win" to your journal.',
          link: '/journal/abc',
        },
      }],
    },
    { text: 'Captured it — [your journal win](/journal/abc).' },
  ])
  assert.equal(spoken, 'Captured it — [your journal win](/journal/abc).')
})

test('a silent journal save talks like the coach, not a receipt', () => {
  const spoken = buildCoachSpokenReply([
    {
      text: '   ',
      toolResults: [{
        output: {
          success: true,
          kind: 'journal',
          title: 'Growth Gets to Be Supported',
          chosen_truth: 'I can scale without personally carrying every consequence of growth.',
          attached_names: ['$350,000/Month Vibration Fit'],
          message: 'Saved "Growth Gets to Be Supported" to your journal and attached it to 1 manifestation.',
          link: '/journal/win-1',
        },
      }],
    },
    { text: '' },
  ])
  assert.match(spoken, /Growth Gets to Be Supported/)
  assert.match(spoken, /\$350,000\/Month Vibration Fit/)
  assert.match(spoken, /scale without personally carrying/)
  assert.match(spoken, /\/journal\/win-1/)
  assert.doesNotMatch(spoken, /Saved "/)
  assert.doesNotMatch(spoken, /attached it to 1 manifestation/)
})

test('a silent create-and-attach turn names both and links both', () => {
  const spoken = buildCoachSpokenReply([
    {
      toolResults: [
        {
          output: {
            success: true,
            kind: 'manifestation',
            title: '$350,000/Month Vibration Fit',
            why: 'Scale that frees my attention.',
            link: '/manifestations/m1',
          },
        },
        {
          output: {
            success: true,
            kind: 'journal',
            title: 'Growth Gets to Be Supported',
            chosen_truth: 'I can scale without personally carrying every consequence of growth.',
            attached_names: ['$350,000/Month Vibration Fit'],
            link: '/journal/j1',
          },
        },
      ],
    },
  ])
  assert.match(spoken, /\$350,000\/Month Vibration Fit/)
  assert.match(spoken, /Growth Gets to Be Supported/)
  assert.match(spoken, /\/manifestations\/m1/)
  assert.match(spoken, /\/journal\/j1/)
  assert.doesNotMatch(spoken, /Added "/)
})

test('surfaces a failed tool when the model stays silent', () => {
  const spoken = buildCoachSpokenReply([
    {
      toolResults: [{
        output: { success: false, message: 'Could not save the journal entry.' },
      }],
    },
  ])
  assert.equal(spoken, 'Could not save the journal entry.')
})

test('a silent find-miss offers to create instead of dumping the lookup line', () => {
  const spoken = buildCoachSpokenReply([
    {
      toolResults: [{
        output: {
          success: false,
          not_found: true,
          query: '$350,000 per month Vibration Fit',
          message: 'Nothing on the platform matches "$350,000 per month Vibration Fit" yet.',
        },
      }],
    },
  ])
  assert.match(spoken, /I don't have/)
  assert.match(spoken, /\$350,000 per month Vibration Fit/)
  assert.match(spoken, /create it and attach/)
  assert.doesNotMatch(spoken, /I could not find anything/)
})

test('skips read-tool payloads that have no member-facing message', () => {
  const spoken = buildCoachSpokenReply([
    {
      toolResults: [{
        output: { success: true, content: 'Full Life Vision text…' },
      }],
    },
  ])
  assert.equal(spoken, '')
})
