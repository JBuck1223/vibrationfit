import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export async function pushScript(file, env = process.env) {
  if (!file) throw new Error('Usage: node push.mjs <package.json>')
  if (!env.VIBRATIONFIT_URL || !env.SCRIPT_STUDIO_IMPORT_TOKEN) throw new Error('Configure VIBRATIONFIT_URL and SCRIPT_STUDIO_IMPORT_TOKEN in the environment first.')
  const url = new URL('/api/script-studio/import', env.VIBRATIONFIT_URL)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Use HTTPS for the VibrationFit connection.')
  const payload = JSON.parse(await readFile(file, 'utf8'))
  if (!payload.request_id) throw new Error('Package requires a request_id UUID for safe retries.')
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.SCRIPT_STUDIO_IMPORT_TOKEN}` },
    body: JSON.stringify(payload),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Import failed (${response.status}): ${result.error || 'Unknown error'}`)
  return { script_id: result.script_id, url: new URL(result.path, url.origin).href }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  pushScript(process.argv[2]).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1 })
}
