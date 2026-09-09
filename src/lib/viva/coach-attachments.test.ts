import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildUserMessageContent,
  describeAttachments,
  isImageAttachment,
  parseVivaAttachments,
} from './coach-attachments'

test('parseVivaAttachments keeps only https attachments', () => {
  const parsed = parseVivaAttachments([
    { url: 'https://media.vibrationfit.com/a.jpg', name: 'a.jpg', type: 'image' },
    { url: 'http://evil.example/x.jpg', name: 'x.jpg', type: 'image' },
    { url: '/local.jpg', name: 'local.jpg', type: 'image' },
    { name: 'no-url', type: 'image' },
    null,
  ])
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].url, 'https://media.vibrationfit.com/a.jpg')
})

test('isImageAttachment treats photo mime and extensions as images', () => {
  assert.equal(
    isImageAttachment({ url: 'https://x.test/a', name: 'IMG_1.HEIC', type: 'document', mimeType: '' }),
    true,
  )
  assert.equal(
    isImageAttachment({ url: 'https://x.test/a', name: 'notes.pdf', type: 'document', mimeType: 'application/pdf' }),
    false,
  )
})

test('describeAttachments writes a short caption for photo-only turns', () => {
  assert.equal(
    describeAttachments([{ url: 'https://x.test/a.jpg', name: 'a.jpg', type: 'image' }]),
    'Shared a photo.',
  )
  assert.equal(
    describeAttachments([
      { url: 'https://x.test/a.jpg', name: 'a.jpg', type: 'image' },
      { url: 'https://x.test/b.jpg', name: 'b.jpg', type: 'image' },
    ]),
    'Shared 2 photos.',
  )
})

test('buildUserMessageContent sends images as multimodal parts', () => {
  const content = buildUserMessageContent('Look at this', [
    { url: 'https://media.vibrationfit.com/a.jpg', name: 'a.jpg', type: 'image', mimeType: 'image/jpeg' },
  ])
  assert.ok(Array.isArray(content))
  assert.deepEqual(content, [
    { type: 'text', text: 'Look at this' },
    { type: 'image', image: 'https://media.vibrationfit.com/a.jpg', mediaType: 'image/jpeg' },
  ])
})

test('buildUserMessageContent keeps document-only turns as text', () => {
  const content = buildUserMessageContent('', [
    { url: 'https://media.vibrationfit.com/notes.pdf', name: 'notes.pdf', type: 'document', mimeType: 'application/pdf' },
  ])
  assert.ok(Array.isArray(content))
  assert.equal(content[0].type, 'text')
  assert.equal(content[1].type, 'file')
})
