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
const SRC = '/Volumes/Extreme SSD/Vibration Fit Videos/Offer Video/After Effects/Exports/Offer Video 8-30-26.mp4'
const mp3Path = resolve(__dirname, 'offer-video-830.mp3')

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

console.log('Extracting audio...')
execSync(`ffmpeg -y -i "${SRC}" -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 "${mp3Path}"`, { stdio: 'inherit' })

const file = new File([readFileSync(mp3Path)], 'offer-830.mp3', { type: 'audio/mpeg' })
console.log('Transcribing...')
const transcription = await openai.audio.transcriptions.create({
  file,
  model: 'whisper-1',
  language: 'en',
  response_format: 'verbose_json',
  timestamp_granularities: ['segment'],
})

let md = `# Offer Video 8-30-26\n\nDuration: ${formatTimestamp(transcription.duration)}\n\n`
for (const seg of transcription.segments || []) {
  md += `**[${formatTimestamp(seg.start)} - ${formatTimestamp(seg.end)}]** ${seg.text.trim()}\n\n`
}
writeFileSync(resolve(__dirname, 'offer-video-830.md'), md)
console.log(md)
