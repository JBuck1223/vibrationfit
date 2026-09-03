import { readFileSync, writeFileSync } from 'fs'
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
const SRC = '/Volumes/Extreme SSD/Vibration Fit Videos/Offer Video/After Effects/Exports/Offer Video 3-6-26.mp4'
const mp3Path = resolve(__dirname, 'offer-video-306.mp3')
const TERM = /activ|intensiv|eight|weeks|map|plan/i

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

console.log('Extracting audio from 3-6-26 export...')
execSync(`ffmpeg -y -i "${SRC}" -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 "${mp3Path}"`, { stdio: 'inherit' })

const file = new File([readFileSync(mp3Path)], 'offer-video-306.mp3', { type: 'audio/mpeg' })
console.log('Transcribing...')
const transcription = await openai.audio.transcriptions.create({
  file,
  model: 'whisper-1',
  language: 'en',
  response_format: 'verbose_json',
  timestamp_granularities: ['word', 'segment'],
})

const words = transcription.words || []
const hits = []
for (const w of words) {
  if (TERM.test(w.word)) {
    hits.push({ word: w.word.trim(), start: w.start, end: w.end, seek: formatTimestamp(w.start) })
  }
}

writeFileSync(resolve(__dirname, 'offer-video-306.json'), JSON.stringify({
  duration: transcription.duration,
  text: transcription.text,
  segments: transcription.segments,
  words,
  hits,
}, null, 2))

console.log('Duration', transcription.duration)
console.log('=== HITS ===')
for (const h of hits) console.log(`${h.seek}  ${h.word}`)
