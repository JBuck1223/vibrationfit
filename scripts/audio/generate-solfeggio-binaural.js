#!/usr/bin/env node

/**
 * Solfeggio Binaural Beat Generator
 * 
 * Creates three types of healing frequency tracks:
 * 1. Pure Solfeggio frequencies with binaural modulation
 * 2. Static binaural beats at each brainwave range
 * 3. Progressive "journey" tracks that transition through states
 * 
 * Usage:
 *   node generate-solfeggio-binaural.js
 */

import { spawn } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Ancient Solfeggio frequencies (Hz)
const SOLFEGGIO_FREQUENCIES = [
  { hz: 174, name: 'Pain Relief', description: 'Physical pain relief, grounding' },
  { hz: 285, name: 'Tissue Healing', description: 'Tissue regeneration, cellular repair' },
  { hz: 396, name: 'Liberation', description: 'Release fear, guilt, and negative patterns' },
  { hz: 417, name: 'Change', description: 'Facilitate change, undo negative situations' },
  { hz: 528, name: 'DNA Repair', description: 'Love frequency, DNA repair, miracles' },
  { hz: 639, name: 'Connection', description: 'Relationships, connection, harmony' },
  { hz: 741, name: 'Awakening', description: 'Intuition, consciousness expansion' },
  { hz: 852, name: 'Spiritual Order', description: 'Return to spiritual order, inner strength' },
  { hz: 963, name: 'Divine Connection', description: 'Connection to divine, higher consciousness' }
]

// Brainwave states with beat frequencies
const BRAINWAVE_STATES = [
  { name: 'delta', displayName: 'Delta', beatHz: 2.0, range: '0.5-4 Hz', description: 'Deep sleep, healing' },
  { name: 'theta', displayName: 'Theta', beatHz: 6.0, range: '4-8 Hz', description: 'Deep meditation, creativity' },
  { name: 'alpha', displayName: 'Alpha', beatHz: 10.0, range: '8-13 Hz', description: 'Relaxed focus, learning' },
  { name: 'beta', displayName: 'Beta', beatHz: 15.0, range: '13-18 Hz', description: 'Alert focus, thinking' }
]

// Progressive journeys (transitions through states over time)
const JOURNEYS = [
  {
    name: 'sleep-journey',
    displayName: 'Sleep Journey',
    description: 'Gentle progression into deep sleep',
    solfeggioBase: 396, // Liberation (release the day)
    stages: [
      { state: 'alpha', duration: 60, fadeIn: 5, fadeOut: 5 },   // 0-60s: Relax
      { state: 'theta', duration: 120, fadeIn: 10, fadeOut: 10 }, // 60-180s: Deepen
      { state: 'delta', duration: 180, fadeIn: 10, fadeOut: 0 }   // 180-360s: Sleep
    ]
  },
  {
    name: 'meditation-journey',
    displayName: 'Meditation Journey',
    description: 'Deep meditation progression',
    solfeggioBase: 528, // DNA Repair (love frequency)
    stages: [
      { state: 'alpha', duration: 90, fadeIn: 10, fadeOut: 10 },  // 0-90s: Settle
      { state: 'theta', duration: 240, fadeIn: 15, fadeOut: 15 }, // 90-330s: Deep meditation
      { state: 'alpha', duration: 90, fadeIn: 10, fadeOut: 10 }   // 330-420s: Return
    ]
  },
  {
    name: 'focus-journey',
    displayName: 'Focus Journey',
    description: 'Peak concentration flow state',
    solfeggioBase: 741, // Awakening (consciousness)
    stages: [
      { state: 'alpha', duration: 60, fadeIn: 5, fadeOut: 5 },    // 0-60s: Warm up
      { state: 'beta', duration: 300, fadeIn: 10, fadeOut: 10 },  // 60-360s: Peak focus
      { state: 'alpha', duration: 60, fadeIn: 5, fadeOut: 5 }     // 360-420s: Wind down
    ]
  },
  {
    name: 'healing-journey',
    displayName: 'Healing Journey',
    description: 'Complete healing activation',
    solfeggioBase: 285, // Tissue Healing
    stages: [
      { state: 'alpha', duration: 60, fadeIn: 10, fadeOut: 10 },  // 0-60s: Relax
      { state: 'theta', duration: 180, fadeIn: 15, fadeOut: 15 }, // 60-240s: Deep healing
      { state: 'delta', duration: 120, fadeIn: 10, fadeOut: 10 }, // 240-360s: Cellular repair
      { state: 'theta', duration: 60, fadeIn: 10, fadeOut: 10 }   // 360-420s: Integration
    ]
  }
]

const OUTPUT_DIR = './output/solfeggio-binaural'

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

console.log('🎵 Solfeggio Binaural Beat Generator')
console.log('=' .repeat(70))

/**
 * Generate a static Solfeggio + Binaural beat
 */
async function generateSolfeggioBinaural(solfeggio, brainwave) {
  const baseHz = solfeggio.hz
  const beatHz = brainwave.beatHz
  
  const leftHz = baseHz - (beatHz / 2)
  const rightHz = baseHz + (beatHz / 2)
  
  const fileName = `${baseHz}hz-${brainwave.name}`
  const outputPath = join(OUTPUT_DIR, `${fileName}.mp3`)
  
  console.log(`\n📊 ${solfeggio.name} (${baseHz} Hz) + ${brainwave.displayName} (${brainwave.beatHz} Hz)`)
  console.log(`   Left: ${leftHz.toFixed(1)} Hz | Right: ${rightHz.toFixed(1)} Hz`)
  
  return new Promise((resolve, reject) => {
    const duration = 300 // 5 minutes
    
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `sine=frequency=${leftHz}:duration=${duration}`,
      '-f', 'lavfi',
      '-i', `sine=frequency=${rightHz}:duration=${duration}`,
      '-filter_complex',
      '[0:a]volume=-32dB[left];[1:a]volume=-32dB[right];[left][right]join=inputs=2:channel_layout=stereo[out]',
      '-map', '[out]',
      '-codec:a', 'libmp3lame',
      '-b:a', '128k',
      '-ar', '44100',
      outputPath
    ])
    
    let stderr = ''
    ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`   ❌ Failed: ${stderr}`)
        reject(new Error(`FFmpeg failed`))
      } else {
        console.log(`   ✅ ${fileName}.mp3`)
        resolve({ fileName, outputPath, solfeggio, brainwave })
      }
    })
  })
}

/**
 * Generate a progressive journey track
 */
async function generateJourney(journey) {
  const { name, displayName, solfeggioBase, stages } = journey
  const outputPath = join(OUTPUT_DIR, `journey-${name}.mp3`)
  
  console.log(`\n🌊 Journey: ${displayName} (Base: ${solfeggioBase} Hz)`)
  
  // Build complex FFmpeg filter for crossfading between stages
  let inputs = []
  let filters = []
  let currentTime = 0
  
  stages.forEach((stage, i) => {
    const brainwave = BRAINWAVE_STATES.find(b => b.name === stage.state)
    const beatHz = brainwave.beatHz
    const leftHz = solfeggioBase - (beatHz / 2)
    const rightHz = solfeggioBase + (beatHz / 2)
    
    console.log(`   Stage ${i + 1}: ${stage.state.toUpperCase()} (${currentTime}s-${currentTime + stage.duration}s)`)
    console.log(`      Frequencies: ${leftHz.toFixed(1)} Hz / ${rightHz.toFixed(1)} Hz`)
    
    // Generate inputs for this stage
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=${leftHz}:duration=${stage.duration}`)
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=${rightHz}:duration=${stage.duration}`)
    
    currentTime += stage.duration
  })
  
  // Build filter chain to crossfade between stages
  let filterComplex = ''
  let lastOutput = ''
  
  stages.forEach((stage, i) => {
    const leftIdx = i * 2
    const rightIdx = i * 2 + 1
    
    // Create stereo pair for this stage
    filterComplex += `[${leftIdx}:a]volume=-32dB[left${i}];`
    filterComplex += `[${rightIdx}:a]volume=-32dB[right${i}];`
    filterComplex += `[left${i}][right${i}]join=inputs=2:channel_layout=stereo[stage${i}];`
    
    if (i === 0) {
      lastOutput = `[stage${i}]`
    } else {
      // Crossfade with previous stage
      const fadeIn = stage.fadeIn || 10
      filterComplex += `${lastOutput}[stage${i}]acrossfade=d=${fadeIn}:c1=tri:c2=tri[mixed${i}];`
      lastOutput = `[mixed${i}]`
    }
  })
  
  // Final output
  filterComplex += `${lastOutput}volume=-32dB[out]`
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[out]',
      '-codec:a', 'libmp3lame',
      '-b:a', '192k', // Higher quality for journey tracks
      '-ar', '44100',
      outputPath
    ])
    
    let stderr = ''
    ffmpeg.stderr.on('data', (data) => { stderr += data.toString() })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`   ❌ Failed: ${stderr}`)
        reject(new Error(`FFmpeg failed`))
      } else {
        const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0)
        console.log(`   ✅ journey-${name}.mp3 (${Math.floor(totalDuration / 60)}min ${totalDuration % 60}s)`)
        resolve({ name, outputPath, journey })
      }
    })
  })
}

/**
 * Main generation function
 */
async function generateAll() {
  const results = []
  
  console.log('\n🎯 Generating Static Solfeggio + Binaural Combinations...\n')
  
  // Generate all combinations of Solfeggio + Brainwave
  for (const solfeggio of SOLFEGGIO_FREQUENCIES) {
    for (const brainwave of BRAINWAVE_STATES) {
      try {
        const result = await generateSolfeggioBinaural(solfeggio, brainwave)
        results.push({ ...result, type: 'static', success: true })
      } catch (error) {
        console.error(`❌ Error: ${error.message}`)
        results.push({ 
          solfeggio, 
          brainwave, 
          type: 'static', 
          success: false, 
          error: error.message 
        })
      }
    }
  }
  
  console.log('\n🌊 Generating Progressive Journey Tracks...\n')
  
  // Generate journey tracks
  for (const journey of JOURNEYS) {
    try {
      const result = await generateJourney(journey)
      results.push({ ...result, type: 'journey', success: true })
    } catch (error) {
      console.error(`❌ Error generating ${journey.name}: ${error.message}`)
      results.push({ 
        journey, 
        type: 'journey', 
        success: false, 
        error: error.message 
      })
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📋 Generation Summary')
  console.log('='.repeat(70))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  const staticTracks = successful.filter(r => r.type === 'static')
  const journeyTracks = successful.filter(r => r.type === 'journey')
  
  console.log(`\n✅ Successful: ${successful.length}`)
  console.log(`   • Static Combinations: ${staticTracks.length}`)
  console.log(`   • Journey Tracks: ${journeyTracks.length}`)
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
  }
  
  // Generate SQL
  console.log('\n' + '='.repeat(70))
  console.log('📝 SQL Insert Statements')
  console.log('='.repeat(70))
  
  console.log('\n-- Static Solfeggio + Binaural combinations:\n')
  staticTracks.forEach((r, i) => {
    const s3Url = `https://media.vibrationfit.com/site-assets/audio/mixing-tracks/solfeggio/binaural/${r.fileName}.mp3`
    const desc = `${r.solfeggio.description} with ${r.brainwave.description}`
    console.log(`INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order)`)
    console.log(`VALUES ('${r.fileName}', '${r.solfeggio.name} ${r.brainwave.displayName}', 'solfeggio', '${s3Url}', '${desc}', ${200 + i});`)
    console.log()
  })
  
  console.log('\n-- Progressive Journey tracks:\n')
  journeyTracks.forEach((r, i) => {
    const s3Url = `https://media.vibrationfit.com/site-assets/audio/mixing-tracks/solfeggio/binaural/journey-${r.name}.mp3`
    console.log(`INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order)`)
    console.log(`VALUES ('journey-${r.name}', '${r.journey.displayName}', 'journey', '${s3Url}', '${r.journey.description}', ${300 + i});`)
    console.log()
  })
  
  // Upload instructions
  console.log('\n' + '='.repeat(70))
  console.log('📤 Upload & Deploy')
  console.log('='.repeat(70))
  console.log('\n1. Upload to S3:')
  console.log('   aws s3 cp output/solfeggio-binaural/ s3://vibration-fit-client-storage/site-assets/audio/mixing-tracks/solfeggio/binaural/ --recursive\n')
  console.log('2. Verify upload:')
  console.log('   aws s3 ls s3://vibration-fit-client-storage/site-assets/audio/mixing-tracks/solfeggio/binaural/\n')
  console.log('3. Run the SQL statements above in Supabase\n')
  console.log('4. View in admin panel at /admin/audio-mixer\n')
  
  console.log('✨ Generation complete!\n')
  console.log(`📦 Generated ${successful.length} tracks:`)
  console.log(`   • ${SOLFEGGIO_FREQUENCIES.length} Solfeggio frequencies`)
  console.log(`   • × ${BRAINWAVE_STATES.length} Brainwave states`)
  console.log(`   • = ${staticTracks.length} static combinations`)
  console.log(`   • + ${journeyTracks.length} progressive journeys`)
  console.log(`   • Total: ${successful.length} healing frequency tracks! 🎵\n`)
}

// Check FFmpeg
function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'])
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ FFmpeg not found. Install: brew install ffmpeg')
        process.exit(1)
      }
      resolve()
    })
  })
}

// Run
(async () => {
  try {
    await checkFFmpeg()
    await generateAll()
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
})()

