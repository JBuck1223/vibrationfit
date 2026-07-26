// One-off: inspect recent MediaConvert jobs to find the July 23-24 cost spike.
// Run: node --env-file=.env.local scripts/database/list-mediaconvert-jobs.mjs
import { MediaConvertClient, ListJobsCommand } from '@aws-sdk/client-mediaconvert'

const client = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: process.env.MEDIACONVERT_ENDPOINT,
})

const byDay = new Map()
let nextToken
let scanned = 0
let reachedOldJobs = false

do {
  const res = await client.send(
    new ListJobsCommand({ MaxResults: 20, Order: 'DESCENDING', NextToken: nextToken })
  )
  for (const job of res.Jobs || []) {
    scanned++
    const created = job.CreatedAt ? new Date(job.CreatedAt) : null
    if (!created) continue
    const day = created.toISOString().split('T')[0]
    if (day < '2026-07-18') {
      reachedOldJobs = true
      break
    }
    const tag = job.UserMetadata?.purpose || 'untagged'
    const input = job.Settings?.Inputs?.[0]?.FileInput || 'unknown'
    const key = `${day} | ${tag}`
    const entry = byDay.get(key) || { count: 0, inputs: new Map(), statuses: new Map() }
    entry.count++
    entry.inputs.set(input, (entry.inputs.get(input) || 0) + 1)
    entry.statuses.set(job.Status, (entry.statuses.get(job.Status) || 0) + 1)
    byDay.set(key, entry)
  }
  nextToken = reachedOldJobs ? undefined : res.NextToken
} while (nextToken && scanned < 5000)

console.log(`Scanned ${scanned} jobs (back to 2026-07-20)\n`)
for (const [key, entry] of [...byDay.entries()].sort()) {
  console.log(`${key}: ${entry.count} jobs, statuses: ${JSON.stringify(Object.fromEntries(entry.statuses))}`)
  const topInputs = [...entry.inputs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  for (const [input, count] of topInputs) {
    console.log(`   ${count}x  ${input.slice(-90)}`)
  }
}
