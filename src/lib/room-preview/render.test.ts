import test from 'node:test'
import assert from 'node:assert/strict'
import { renderRoomPreview, type PreviewRoom } from './render'
import { steps } from './content'

test('all concept navigation stays under /room and has no live writes', () => {
  for (const room of [
    'home',
    'begin',
    'viva',
    'listen',
    'capture',
    'tribe',
    'tools',
    'account',
  ] as PreviewRoom[]) {
    const html = renderRoomPreview(room)
    for (const match of html.matchAll(/href="([^"]+)"/g))
      assert.ok(match[1].startsWith('/room/'), match[1])
    assert.doesNotMatch(html, /fetch\(|\/api\/|localStorage|supabase|action="/)
    assert.match(html, /Sample content/)
  }
})
test('Begin concept shows all eleven milestones without importing or modifying the live flow', () => {
  const html = renderRoomPreview('begin')
  assert.equal(steps.length, 11)
  for (const step of steps) assert.ok(html.includes(`<h4>${step[0]}</h4>`))
  assert.doesNotMatch(html, /<details/)
})
test('dashboard concept retains Begin and continuation cards', () => {
  const html = renderRoomPreview('home')
  for (const text of [
    'Welcome home.',
    '/room/begin',
    'Your quick actions',
    'CONTINUE LISTENING',
    'Your last journal entry',
    'Your latest creation',
  ])
    assert.ok(html.includes(text), text)
})
