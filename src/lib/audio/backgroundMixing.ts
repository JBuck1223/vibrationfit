// Helper to get background track URL (client-side only, no server imports)
function getBackgroundTrackUrl(variant?: string): string | null {
  switch (variant) {
    case 'sleep':
    case 'meditation':
    case 'energy':
      return 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3'
    default:
      return null
  }
}

/**
 * Mix background audio with voice track using Web Audio API
 * Loops the background track continuously
 */
export async function createMixedAudio(
  voiceUrl: string,
  variant: string,
  audioContext: AudioContext
): Promise<{
  audioBuffer: AudioBufferSourceNode
  audioContext: AudioContext
}> {
  // Get background track URL for variant
  const bgUrl = getBackgroundTrackUrl(variant)
  
  if (!bgUrl) {
    // No background track, load voice only
    const response = await fetch(voiceUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    return {
      audioBuffer: audioContext.createBufferSource(),
      audioContext
    }
  }

  try {
    // Fetch both audio files
    const [voiceResponse, bgResponse] = await Promise.all([
      fetch(voiceUrl),
      fetch(bgUrl)
    ])

    const [voiceArrayBuffer, bgArrayBuffer] = await Promise.all([
      voiceResponse.arrayBuffer(),
      bgResponse.arrayBuffer()
    ])

    // Decode audio data
    const [voiceBuffer, bgBuffer] = await Promise.all([
      audioContext.decodeAudioData(voiceArrayBuffer),
      audioContext.decodeAudioData(bgArrayBuffer)
    ])

    // Create gain nodes for volume control
    const voiceGain = audioContext.createGain()
    const bgGain = audioContext.createGain()
    
    // Set volume levels based on variant
    let voiceVolume = 0.7  // Default: 70% voice, 30% background
    let bgVolume = 0.3
    
    if (variant === 'sleep') {
      // Sleep: 30% voice, 70% background (calming focus on ambient)
      voiceVolume = 0.3
      bgVolume = 0.7
    } else if (variant === 'meditation') {
      // Meditation: 50% voice, 50% background (balanced)
      voiceVolume = 0.5
      bgVolume = 0.5
    } else if (variant === 'energy') {
      // Energy: 80% voice, 20% background (voice-forward)
      voiceVolume = 0.8
      bgVolume = 0.2
    }
    
    voiceGain.gain.value = voiceVolume
    bgGain.gain.value = bgVolume

    // Create buffer sources
    const voiceSource = audioContext.createBufferSource()
    voiceSource.buffer = voiceBuffer
    voiceSource.connect(voiceGain)

    // Loop background track
    const bgSource = audioContext.createBufferSource()
    bgSource.buffer = bgBuffer
    bgSource.loop = true
    bgSource.loopStart = 0
    bgSource.loopEnd = bgBuffer.duration
    bgSource.connect(bgGain)

    // Connect gains to destination
    voiceGain.connect(audioContext.destination)
    bgGain.connect(audioContext.destination)

    // Store sources for control
    const mixedAudio = {
      voice: voiceSource,
      background: bgSource
    }

    return {
      audioBuffer: voiceSource,
      audioContext,
      ...mixedAudio
    } as any
  } catch (error) {
    console.error('Audio mixing failed:', error)
    
    // Fallback: load voice only
    const response = await fetch(voiceUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    return {
      audioBuffer: audioContext.createBufferSource(),
      audioContext
    }
  }
}
