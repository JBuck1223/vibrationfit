import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import {
  COACH_STREAM_META_MARKER,
  COACH_STREAM_PADDING,
  CoachStreamError,
  parseCoachStreamBuffer,
  readCoachStream,
} from './coach-stream'

test('treats padding-only buffers as not ready', () => {
  const parsed = parseCoachStreamBuffer(COACH_STREAM_PADDING)
  assert.equal(parsed.ready, false)
  assert.equal(parsed.text, '')
  assert.equal(parsed.indicators, undefined)
})

test('waits for a complete meta line before becoming ready', () => {
  const partial = `${COACH_STREAM_PADDING}${COACH_STREAM_META_MARKER}{"indicators":[`
  const parsed = parseCoachStreamBuffer(partial)
  assert.equal(parsed.ready, false)
  assert.equal(parsed.text, '')
})

test('parses indicators and streams tokens after the meta line', () => {
  const raw =
    `${COACH_STREAM_PADDING}${COACH_STREAM_META_MARKER}` +
    `${JSON.stringify({ indicators: [{ source: 'vision', detail: 'Your Life Vision' }] })}\n` +
    'Hello there'
  const parsed = parseCoachStreamBuffer(raw)
  assert.equal(parsed.ready, true)
  assert.equal(parsed.text, 'Hello there')
  assert.deepEqual(parsed.indicators, [{ source: 'vision', detail: 'Your Life Vision' }])
})

test('keeps appending tokens as the buffer grows', () => {
  const prefix =
    `${COACH_STREAM_PADDING}${COACH_STREAM_META_MARKER}` +
    `${JSON.stringify({ indicators: [] })}\n`
  const first = parseCoachStreamBuffer(`${prefix}Hi`)
  const second = parseCoachStreamBuffer(`${prefix}Hi, I'm here.`)
  assert.equal(first.text, 'Hi')
  assert.equal(second.text, "Hi, I'm here.")
})

test('plain text streams still parse without framing (backward compatible)', () => {
  const parsed = parseCoachStreamBuffer("I'm right here with you.")
  assert.equal(parsed.ready, true)
  assert.equal(parsed.text, "I'm right here with you.")
})

test('malformed meta still surfaces the reply text', () => {
  const raw = `${COACH_STREAM_PADDING}${COACH_STREAM_META_MARKER}{not-json}\nStill here`
  const parsed = parseCoachStreamBuffer(raw)
  assert.equal(parsed.ready, true)
  assert.equal(parsed.text, 'Still here')
})

function listen(server: ReturnType<typeof createServer>): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('No port'))
        return
      }
      resolve(address.port)
    })
  })
}

test('readCoachStream assembles a framed reply and conversation id', async () => {
  const server = createServer((req, res) => {
    assert.equal(req.method, 'POST')
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Conversation-Id': 'thread-1',
    })
    res.write(COACH_STREAM_PADDING)
    res.write(
      `${COACH_STREAM_META_MARKER}${JSON.stringify({
        indicators: [{ source: 'vision', detail: 'Your Life Vision' }],
      })}\n`
    )
    res.write('Here with you — for real this time.')
    res.end()
  })

  const port = await listen(server)
  try {
    const updates: string[] = []
    const result = await readCoachStream({
      url: `http://127.0.0.1:${port}`,
      body: { messages: [{ role: 'user', content: 'hey' }] },
      onUpdate: (parsed) => {
        if (parsed.text) updates.push(parsed.text)
      },
    })
    assert.equal(result.conversationId, 'thread-1')
    assert.equal(result.parsed.ready, true)
    assert.equal(result.parsed.text, 'Here with you — for real this time.')
    assert.deepEqual(result.parsed.indicators, [{ source: 'vision', detail: 'Your Life Vision' }])
    assert.ok(updates.includes('Here with you — for real this time.'))
  } finally {
    server.close()
  }
})

test('readCoachStream keeps reading after a delayed first token', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Conversation-Id': 'thread-2',
    })
    res.write(COACH_STREAM_PADDING)
    setTimeout(() => {
      res.write(`${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n`)
      res.write('Later.')
      res.end()
    }, 40)
  })

  const port = await listen(server)
  try {
    const result = await readCoachStream({
      url: `http://127.0.0.1:${port}`,
      body: {},
      onUpdate: () => {},
    })
    assert.equal(result.parsed.text, 'Later.')
  } finally {
    server.close()
  }
})

test('readCoachStream surfaces JSON errors instead of hanging', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
  })

  const port = await listen(server)
  try {
    await assert.rejects(
      () =>
        readCoachStream({
          url: `http://127.0.0.1:${port}`,
          body: {},
          onUpdate: () => {},
        }),
      (err: unknown) => {
        assert.ok(err instanceof CoachStreamError)
        assert.equal(err.message, 'Unauthorized')
        assert.equal(err.status, 401)
        return true
      }
    )
  } finally {
    server.close()
  }
})
