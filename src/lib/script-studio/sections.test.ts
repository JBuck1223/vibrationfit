import assert from 'node:assert/strict'
import test from 'node:test'
import { scriptSections, restoreSections, sectionText } from './sections'
import { importSchema } from './schema'

test('restoring historical sections preserves locked text and title, matching by ID', () => {
  const opening = { id: 'opening', title: 'Approved opening', content: 'Keep this exactly.', locked: true }
  const current = [opening, { id: 'body', title: 'Lesson', content: 'New body', locked: false }]
  const historical = [{ ...opening, title: 'Old opening', content: 'Replace me', locked: false }, { id: 'body', title: 'Body', content: 'Old body', locked: false }]
  const restored = restoreSections(current, historical)
  assert.deepEqual(restored[0], opening)
  assert.equal(restored[1].content, 'Old body')
  assert.equal(restored[1].id, 'body')
  assert.equal(sectionText(restored), 'Keep this exactly.\n\nOld body')
  assert.deepEqual(restoreSections(current, [historical[1]])[0], opening)
})

test('plain text migrates without changing original whitespace', () => {
  assert.equal(scriptSections({ content: '  Opening\n\nBody\n' })[0].content, '  Opening\n\nBody\n')
})

test('imports reject ambiguous section identities and support grouped section snapshots', () => {
  const section = { id: 'opening', title: 'Opening', content: 'Hello', locked: true }
  const input = { request_id: '60cbb7ce-ff86-4f15-bec1-f552f6b3b393', group_id: '0a38bda7-a7fc-439d-b41a-2892277e1bf2', title: 'Welcome', versions: [{ sections: [section] }] }
  assert.equal(importSchema.safeParse(input).success, true)
  assert.equal(importSchema.safeParse({ ...input, versions: [{ sections: [section, section] }] }).success, false)
  assert.equal(importSchema.safeParse({ ...input, versions: [{ sections: [{ ...section, content: ' ' }] }] }).success, false)
  assert.equal(importSchema.safeParse({ ...input, versions: [{ content: 'Legacy text' }] }).success, true)
})
