import { OUTBOUND_URL } from '@/lib/urls'

const APP_BASE_URL = OUTBOUND_URL

interface DigestCommitment {
  title: string
  category: string
  cadence: { kind: string; count?: number } | null
  activity_type: string | null
}

const PILLAR_CONFIG: Record<string, { label: string; verb: string; color: string; emoji: string }> = {
  activations: { label: 'Activations', verb: 'Activate', color: '#39FF14', emoji: '⚡' },
  creations:   { label: 'Creations',   verb: 'Create',   color: '#FFFF00', emoji: '✍️' },
  connections: { label: 'Connections', verb: 'Connect',  color: '#BF00FF', emoji: '💜' },
  sessions:    { label: 'Sessions',    verb: 'Attend',   color: '#00FFFF', emoji: '🎯' },
}

function formatCadence(cadence: { kind: string; count?: number } | null): string {
  if (!cadence) return 'weekly'
  if (cadence.kind === 'daily') return 'daily'
  if (cadence.kind === 'days_per_week' && cadence.count) return `${cadence.count}x/week`
  return 'weekly'
}

export function generateMapDigestEmail(
  firstName: string | null,
  commitments: DigestCommitment[],
): { subject: string; htmlBody: string; textBody: string } {
  const name = firstName || 'there'

  const grouped = new Map<string, DigestCommitment[]>()
  for (const c of commitments) {
    const list = grouped.get(c.category) || []
    list.push(c)
    grouped.set(c.category, list)
  }

  const pillarOrder = ['activations', 'creations', 'connections', 'sessions']

  // -- HTML --
  const pillarSections = pillarOrder
    .filter(p => grouped.has(p))
    .map(p => {
      const config = PILLAR_CONFIG[p]
      const items = grouped.get(p)!
      const itemRows = items
        .map(c => `<tr><td style="padding: 4px 0 4px 12px; color: #d4d4d4; font-size: 14px;">• ${c.title} <span style="color: #737373; font-size: 12px;">(${formatCadence(c.cadence)})</span></td></tr>`)
        .join('')

      return `
        <tr>
          <td style="padding: 16px 0 4px 0;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${config.color};">
              ${config.emoji} ${config.label}
            </span>
          </td>
        </tr>
        ${itemRows}
      `
    })
    .join('')

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0; padding:0; background-color:#000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#0A0A0A; border-radius:16px; border:1px solid #1A1A1A;">
          <tr>
            <td style="padding: 28px 24px 0;">
              <h1 style="margin:0 0 4px; font-size:22px; font-weight:700; color:#ffffff;">Your MAP This Week</h1>
              <p style="margin:0 0 20px; font-size:14px; color:#737373;">Hey ${name}, here's what you're aligned to this week.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${pillarSections}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 28px 24px;">
              <a href="${APP_BASE_URL}/map" style="display:inline-block; padding:12px 28px; background-color:#39FF14; color:#000000; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;">
                Open MAP
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px;">
              <p style="margin:0; font-size:12px; color:#525252; text-align:center;">
                You're receiving this because you have weekly MAP reminders enabled.
                <a href="${APP_BASE_URL}/account/settings" style="color:#525252; text-decoration:underline;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // -- Plain text --
  const textLines = pillarOrder
    .filter(p => grouped.has(p))
    .flatMap(p => {
      const config = PILLAR_CONFIG[p]
      const items = grouped.get(p)!
      return [
        `\n${config.label.toUpperCase()}`,
        ...items.map(c => `  - ${c.title} (${formatCadence(c.cadence)})`),
      ]
    })

  const textBody = [
    `Your MAP This Week`,
    `Hey ${name}, here's what you're aligned to this week.`,
    ...textLines,
    `\nOpen your MAP: ${APP_BASE_URL}/map`,
    `\nManage preferences: ${APP_BASE_URL}/account/settings`,
  ].join('\n')

  return {
    subject: 'Your MAP This Week',
    htmlBody,
    textBody,
  }
}
