import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '../../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) envVars[match[1].trim()] = match[2].trim()
}

const openai = new OpenAI({ apiKey: envVars.OPENAI_API_KEY })

const VIDEOS = [
  {
    name: '01-intensive-start',
    url: 'https://media.vibrationfit.com/site-assets/video/intensive/01-intensive-start-1080p.mp4',
    page: '/intensive/start',
    step: 'Dashboard Intro',
  },
  {
    name: '03-profile',
    url: 'https://media.vibrationfit.com/site-assets/video/intensive/03-profile-1080p.mp4',
    page: '/intensive/profile/new',
    step: 'Step 3: Create Profile',
  },
  {
    name: '05-vision-builder',
    url: 'https://media.vibrationfit.com/site-assets/video/intensive/05-vision-builder-1080p.mp4',
    page: '/intensive/life-vision/create',
    step: 'Step 5: Build Life Vision',
  },
  {
    name: '14-unlock',
    url: 'https://media.vibrationfit.com/site-assets/video/intensive/14-unlock-1080p.mp4',
    page: '/intensive/intake/unlock',
    step: 'Step 14: Unlock Platform',
  },
]

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

async function transcribeVideo(video) {
  const mp4Path = resolve(__dirname, `${video.name}.mp4`)
  const mp3Path = resolve(__dirname, `${video.name}.mp3`)

  console.log(`\n--- Downloading ${video.name} ---`)
  execSync(`curl -sL -o "${mp4Path}" "${video.url}"`)

  const sizeBytes = execSync(`stat -f%z "${mp4Path}"`).toString().trim()
  const sizeMB = (parseInt(sizeBytes) / 1024 / 1024).toFixed(1)
  console.log(`  Downloaded: ${sizeMB}MB`)

  console.log(`  Extracting audio...`)
  execSync(`ffmpeg -y -i "${mp4Path}" -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 "${mp3Path}" 2>/dev/null`)

  const audioSize = (parseInt(execSync(`stat -f%z "${mp3Path}"`).toString().trim()) / 1024 / 1024).toFixed(1)
  console.log(`  Audio extracted: ${audioSize}MB`)

  console.log(`  Transcribing with Whisper...`)
  const file = new File(
    [readFileSync(mp3Path)],
    `${video.name}.mp3`,
    { type: 'audio/mpeg' }
  )

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })

  console.log(`  Done! Duration: ${transcription.duration}s, Segments: ${transcription.segments?.length}`)

  // Clean up mp4 and mp3
  execSync(`rm -f "${mp4Path}" "${mp3Path}"`)

  return {
    ...video,
    duration: transcription.duration,
    text: transcription.text,
    segments: transcription.segments,
  }
}

async function main() {
  const results = []

  for (const video of VIDEOS) {
    try {
      const result = await transcribeVideo(video)
      results.push(result)
    } catch (err) {
      console.error(`  ERROR transcribing ${video.name}:`, err.message)
      results.push({ ...video, error: err.message })
    }
  }

  // Generate markdown output
  let md = `# Intensive Video Transcriptions (Timestamped)\n\n`
  md += `Generated: ${new Date().toISOString()}\n\n`
  md += `These are the 4 videos that need edits for the 14→12 step change.\n\n---\n\n`

  for (const r of results) {
    md += `## ${r.step}\n`
    md += `**File:** \`${r.name}-1080p.mp4\`\n`
    md += `**Page:** \`${r.page}\`\n`
    md += `**URL:** ${r.url}\n`

    if (r.error) {
      md += `**ERROR:** ${r.error}\n\n---\n\n`
      continue
    }

    md += `**Duration:** ${formatTimestamp(r.duration)}\n\n`
    md += `### Transcript\n\n`

    if (r.segments) {
      for (const seg of r.segments) {
        const start = formatTimestamp(seg.start)
        const end = formatTimestamp(seg.end)
        md += `**[${start} - ${end}]** ${seg.text.trim()}\n\n`
      }
    } else {
      md += r.text + '\n\n'
    }

    md += `---\n\n`
  }

  const outPath = resolve(__dirname, 'transcriptions.md')
  writeFileSync(outPath, md)
  console.log(`\nTranscriptions saved to: ${outPath}`)

  // Also save raw JSON
  const jsonPath = resolve(__dirname, 'transcriptions.json')
  writeFileSync(jsonPath, JSON.stringify(results, null, 2))
  console.log(`Raw JSON saved to: ${jsonPath}`)
}

main().catch(console.error)
