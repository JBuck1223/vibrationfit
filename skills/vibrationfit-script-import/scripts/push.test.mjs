import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pushScript } from './push.mjs'

test('push sends the exact batch with scoped authentication and returns the review URL', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'script-import-'))
  const file = join(directory, 'batch.json')
  const payload = { request_id: '8fd770cd-4593-4a43-83c3-c96b78e5a03b', title: 'Example', versions: [{ content: 'Exact words\nSecond line' }] }
  await writeFile(file, JSON.stringify(payload))
  let received
  let credential
  const server = createServer(async (request, response) => {
    credential = request.headers.authorization
    let body = ''
    for await (const chunk of request) body += chunk
    received = JSON.parse(body)
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ script_id: 'example', path: '/admin/scripts?script=example' }))
  })
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    const result = await pushScript(file, { VIBRATIONFIT_URL: origin, SCRIPT_STUDIO_IMPORT_TOKEN: 'test-only-token' })
    assert.deepEqual(received, payload)
    assert.equal(credential, 'Bearer test-only-token')
    assert.equal(result.url, `${origin}/admin/scripts?script=example`)
    await assert.rejects(pushScript(file, {}), /Configure/)
    await assert.rejects(pushScript(file, { VIBRATIONFIT_URL: 'http://example.com', SCRIPT_STUDIO_IMPORT_TOKEN: 'test' }), /HTTPS/)
    await writeFile(file, JSON.stringify({ title: 'Missing retry ID' }))
    await assert.rejects(pushScript(file, { VIBRATIONFIT_URL: origin, SCRIPT_STUDIO_IMPORT_TOKEN: 'test' }), /request_id/)
  } finally {
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
