#!/usr/bin/env node

/**
 * Binaural Beat Generator
 * 
 * Generates pure binaural beat audio files for use in the audio mixing system.
 * Uses Web Audio API via node to create stereo audio with different frequencies in each ear.
 * 
 * Usage:
 *   node generate-binaural-beats.js
 * 
 * Output:
 *   Creates MP3 files in ./output/ directory ready for S3 upload
 */

import { spawn } from 'child_process'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Binaural beat configurations
const BINAURAL_BEATS = [
  {
    name: 'delta',
    displayName: 'Delta (0.5-4 Hz)',
    targetFrequency: 2.0,      // Hz - deep sleep
    baseFrequency: 200,         // Hz - carrier frequency
    duration: 300,              // 5 minutes (will loop in mixing)
    description: 'Deep sleep, healing, regeneration'
  },
  {
    name: 'theta',
    displayName: 'Theta (4-8 Hz)',
    targetFrequency: 6.0,       // Hz - meditation
    baseFrequency: 200,
    duration: 300,
    description: 'Deep relaxation, meditation, creativity'
  },
  {
    name: 'alpha',
    displayName: 'Alpha (8-13 Hz)',
    targetFrequency: 10.0,      // Hz - relaxed focus
    baseFrequency: 200,
    duration: 300,
    description: 'Relaxed focus, learning, light meditation'
  },
  {
    name: 'beta-low',
    displayName: 'Beta Low (13-18 Hz)',
    targetFrequency: 15.0,      // Hz - alert focus
    baseFrequency: 200,
    duration: 300,
    description: 'Alert focus, active thinking'
  },
  {
    name: 'beta-high',
    displayName: 'Beta High (18-30 Hz)',
    targetFrequency: 20.0,      // Hz - intense concentration
    baseFrequency: 200,
    duration: 300,
    description: 'Intense concentration, problem solving'
  },
  {
    name: 'gamma',
    displayName: 'Gamma (30-100 Hz)',
    targetFrequency: 40.0,      // Hz - peak cognitive function
    baseFrequency: 200,
    duration: 300,
    description: 'Peak cognitive function, heightened awareness'
  }
]

// Output directory
const OUTPUT_DIR = './output/binaural'

// Create output directory
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

console.log('🎵 Binaural Beat Generator')
console.log('=' .repeat(50))

/**
 * Generate binaural beat using FFmpeg
 * Creates two sine waves with slightly different frequencies
 */
async function generateBinauralBeat(config) {
  const { name, displayName, targetFrequency, baseFrequency, duration } = config
  
  const leftFreq = baseFrequency
  const rightFreq = baseFrequency + targetFrequency
  
  const outputPath = join(OUTPUT_DIR, `${name}.mp3`)
  
  console.log(`\n📊 Generating: ${displayName}`)
  console.log(`   Target Beat: ${targetFrequency} Hz`)
  console.log(`   Left Ear: ${leftFreq} Hz`)
  console.log(`   Right Ear: ${rightFreq} Hz`)
  console.log(`   Duration: ${duration}s`)
  
  return new Promise((resolve, reject) => {
    // FFmpeg command to generate binaural beat
    // - Generate two sine waves at different frequencies
    // - Pan them to separate channels (left/right)
    // - Mix at very low volume (-30dB) so it doesn't overpower other audio
    const ffmpeg = spawn('ffmpeg', [
      '-y',                                    // Overwrite output
      '-f', 'lavfi',                          // Use libavfilter
      '-i', `sine=frequency=${leftFreq}:duration=${duration}`,   // Left channel
      '-f', 'lavfi',
      '-i', `sine=frequency=${rightFreq}:duration=${duration}`,  // Right channel
      '-filter_complex',
      '[0:a]volume=-30dB[left];[1:a]volume=-30dB[right];[left][right]join=inputs=2:channel_layout=stereo[out]',
      '-map', '[out]',
      '-codec:a', 'libmp3lame',
      '-b:a', '128k',                         // Lower bitrate for pure tones
      '-ar', '44100',                         // Sample rate
      outputPath
    ])
    
    let stderr = ''
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`   ❌ Failed: ${stderr}`)
        reject(new Error(`FFmpeg exited with code ${code}`))
      } else {
        console.log(`   ✅ Generated: ${outputPath}`)
        resolve(outputPath)
      }
    })
  })
}

/**
 * Generate all binaural beats
 */
async function generateAll() {
  console.log('\n🚀 Starting generation...\n')
  
  const results = []
  
  for (const config of BINAURAL_BEATS) {
    try {
      const path = await generateBinauralBeat(config)
      results.push({ ...config, path, success: true })
    } catch (error) {
      console.error(`❌ Error generating ${config.name}:`, error.message)
      results.push({ ...config, success: false, error: error.message })
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(50))
  console.log('📋 Generation Summary')
  console.log('='.repeat(50))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(`\n✅ Successful: ${successful.length}`)
  successful.forEach(r => {
    console.log(`   • ${r.displayName} → ${r.path}`)
  })
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
    failed.forEach(r => {
      console.log(`   • ${r.displayName}: ${r.error}`)
    })
  }
  
  // Generate SQL insert statements
  console.log('\n' + '='.repeat(50))
  console.log('📝 SQL Insert Statements')
  console.log('='.repeat(50))
  console.log('\n-- After uploading to S3, use these statements:\n')
  
  successful.forEach((r, i) => {
    const s3Url = `https://media.vibrationfit.com/site-assets/audio/binaural/${r.name}.mp3`
    console.log(`INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order)`)
    console.log(`VALUES ('binaural-${r.name}', 'Binaural ${r.displayName}', 'binaural', '${s3Url}', '${r.description}', ${100 + i});`)
    console.log()
  })
  
  // Generate upload instructions
  console.log('\n' + '='.repeat(50))
  console.log('📤 Upload Instructions')
  console.log('='.repeat(50))
  console.log('\n1. Upload files to S3:')
  console.log('   aws s3 cp output/binaural/ s3://vibration-fit-client-storage/site-assets/audio/binaural/ --recursive')
  console.log('\n2. Verify files are accessible:')
  successful.forEach(r => {
    console.log(`   curl -I https://media.vibrationfit.com/site-assets/audio/binaural/${r.name}.mp3`)
  })
  console.log('\n3. Run the SQL statements above in Supabase')
  console.log('\n4. Verify in admin panel at /admin/audio-mixer')
  
  console.log('\n✨ All done!\n')
}

// Check if FFmpeg is installed
function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'])
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ FFmpeg not found. Please install FFmpeg:')
        console.error('   macOS: brew install ffmpeg')
        console.error('   Ubuntu: sudo apt install ffmpeg')
        process.exit(1)
      }
      resolve()
    })
  })
}

// Main
(async () => {
  try {
    await checkFFmpeg()
    await generateAll()
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
})()

