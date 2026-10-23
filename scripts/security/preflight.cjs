// Configuration-only check. Does not contact providers or print secret values.
const checks = []
for (const name of ['CRON_SECRET','TWILIO_AUTH_TOKEN','AWS_SES_SNS_TOPIC_ARN','AWS_SES_INBOUND_SNS_TOPIC_ARN']) checks.push([name, Boolean(process.env[name])])
for (const name of ['AWS_SES_SNS_TOPIC_ARN','AWS_SES_INBOUND_SNS_TOPIC_ARN']) checks.push([`${name} format`, /^arn:(aws|aws-cn):sns:[a-z]+-[a-z]+-\d:\d{12}:[A-Za-z0-9_-]+(?:\.fifo)?$/.test(process.env[name] || '')])
let originValid = false
try {
  const origin = new URL(process.env.WEBHOOK_PUBLIC_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '')
  originValid = origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash
} catch {}
checks.push(['Twilio public HTTPS origin', originValid])
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'MISSING/INVALID'} ${name}`)
console.log('Verify that the public origin exactly matches the URLs configured in Twilio, and each SNS topic matches its endpoint. No provider requests were sent.')
process.exitCode = checks.every(([,ok]) => ok) ? 0 : 1
