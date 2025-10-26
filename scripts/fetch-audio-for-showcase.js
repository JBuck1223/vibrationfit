// Script to fetch audio tracks from Supabase and update design system showcase
// Run with: node scripts/fetch-audio-for-showcase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchVisionAudio(visionId) {
  console.log(`Fetching audio for vision: ${visionId}`)
  
  // Map section keys to pretty titles
  const sectionLabels = {
    meta_intro: 'Forward - Your Life Vision',
    meta_outro: 'Conclusion - Integration',
    health: 'Health & Vitality',
    money: 'Money & Abundance',
    business: 'Business & Career',
    family: 'Family & Parenting',
    romance: 'Romance & Partnership',
    social: 'Social & Friends',
    fun: 'Fun & Recreation',
    travel: 'Travel & Adventure',
    home: 'Home & Living',
    possessions: 'Possessions & Lifestyle',
    giving: 'Giving & Legacy',
    spirituality: 'Spirituality & Growth'
  }

  // Order for sorting
  const sectionOrder = {
    meta_intro: 1,
    health: 2,
    money: 3,
    business: 4,
    family: 5,
    romance: 6,
    social: 7,
    fun: 8,
    travel: 9,
    home: 10,
    possessions: 11,
    giving: 12,
    spirituality: 13,
    meta_outro: 14
  }

  try {
    // Fetch audio tracks from vision_audio_tracks table
    const { data: tracks, error } = await supabase
      .from('vision_audio_tracks')
      .select('*')
      .eq('vision_id', visionId)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .neq('audio_url', '')

    if (error) {
      console.error('Error fetching tracks:', error)
      return null
    }

    if (!tracks || tracks.length === 0) {
      console.log('No audio tracks found for this vision')
      return null
    }

    console.log(`Found ${tracks.length} audio tracks`)

    // Format tracks for AudioTrack interface
    const formattedTracks = tracks
      .map(track => ({
        id: track.id,
        title: sectionLabels[track.section_key] || track.section_key,
        artist: 'VibrationFit AI',
        duration: 180, // Default, or calculate if stored
        url: track.audio_url,
        thumbnail: '',
        section_key: track.section_key,
        order: sectionOrder[track.section_key] || 99
      }))
      .sort((a, b) => a.order - b.order)
      .slice(0, 10) // Get first 10 for demo

    // Generate TypeScript array
    const typescriptArray = `const sampleTracks: AudioTrack[] = ${JSON.stringify(formattedTracks, null, 2)
      .replace(/"id":/g, '      id:')
      .replace(/"title":/g, '      title:')
      .replace(/"artist":/g, '      artist:')
      .replace(/"duration":/g, '      duration:')
      .replace(/"url":/g, '      url:')
      .replace(/"thumbnail":/g, '      thumbnail:')}`

    console.log('\n=== SAMPLE TRACKS (Copy to design-system page) ===\n')
    console.log(typescriptArray)
    console.log('\n=== END ===\n')

    return formattedTracks
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// Example usage
const visionId = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f' // Replace with your vision ID
fetchVisionAudio(visionId).then(() => process.exit(0))

