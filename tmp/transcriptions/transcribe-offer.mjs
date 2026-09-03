import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
}

const openai = new OpenAI({ apiKey: envVars.OPENAI_API_KEY })
const URL = 'https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-1080p.mp4'
const mp3Path = resolve(__dirname, 'offer-video.mp3')
const TERM = /activ|intensiv/i

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

function formatSeek(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

console.log('Extracting audio from CDN (no full video download)...')
execSync(
  `ffmpeg -y -i "${URL}" -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 "${mp3Path}"`,
  { stdio: 'inherit' }
)

const audioSize = (parseInt(execSync(`stat -f%z "${mp3Path}"`).toString().trim()) / 1024 / 1024).toFixed(1)
console.log(`Audio: ${audioSize}MB`)

const file = new File([readFileSync(mp3Path)], 'offer-video.mp3', { type: 'audio/mpeg' })
console.log('Transcribing with Whisper (word-level timestamps)...')

const transcription = await openai.audio.transcriptions.create({
  file,
  model: 'whisper-1',
  language: 'en',
  response_format: 'verbose_json',
  timestamp_granularities: ['word', 'segment'],
})

const words = transcription.words || []
const segments = transcription.segments || []
console.log(`Duration: ${transcription.duration}s | Segments: ${segments.length} | Words: ${words.length}`)

const hits = []
for (const w of words) {
  if (TERM.test(w.word)) {
    hits.push({
      word: w.word.trim(),
      start: w.start,
      end: w.end,
      seek: formatSeek(w.start),
      range: `${formatTimestamp(w.start)} - ${formatTimestamp(w.end)}`,
    })
  }
}

let md = `# Homepage Offer Video — Timestamped Transcript\n\n`
md += `**File:** \`offer-video-5-13-26-1080p.mp4\`\n`
md += `**URL:** ${URL}\n`
md += `**Duration:** ${formatTimestamp(transcription.duration)}\n`
md += `**Generated:** ${new Date().toISOString()}\n\n`
md += `## Edit hits: activation / intensive / activate\n\n`

if (hits.length === 0) {
  md += `_No matching words found._\n\n`
} else {
  md += `| Seek | Range | Spoken word |\n|---|---|---|\n`
  for (const h of hits) {
    md += `| **${h.seek}** | ${h.range} | ${h.word} |\n`
  }
  md += `\n`
}

md += `## Full transcript (segments)\n\n`
for (const seg of segments) {
  const start = formatTimestamp(seg.start)
  const end = formatTimestamp(seg.end)
  const flagged = TERM.test(seg.text) ? '  ← MATCH' : ''
  md += `**[${start} - ${end}]**${flagged}\n${seg.text.trim()}\n\n`
}

writeFileSync(resolve(__dirname, 'offer-video.md'), md)
writeFileSync(
  resolve(__dirname, 'offer-video.json'),
  JSON.stringify({ duration: transcription.duration, text: transcription.text, segments, words, hits }, null, 2)
)

console.log('\n=== HITS ===')
for (const h of hits) {
  console.log(`${h.seek}  (${h.range})  ${h.word}`)
}
console.log(`\nSaved offer-video.md and offer-video.json`)
