"use client"

import React, { useState, useRef } from 'react'
import { Button, Card, Container, Stack, PageHero, Input, Spinner } from '@/lib/design-system/components'
import { Play, Download, Droplets, Waves as WavesIcon, Wind } from 'lucide-react'

// Slider styles
const sliderStyles = `
  input[type="range"].slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #199D67;
    cursor: pointer;
    border: 2px solid #0A0A0A;
  }
  
  input[type="range"].slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #199D67;
    cursor: pointer;
    border: 2px solid #0A0A0A;
  }
  
  input[type="range"].slider::-webkit-slider-thumb:hover {
    background: #14B8A6;
  }
  
  input[type="range"].slider::-moz-range-thumb:hover {
    background: #14B8A6;
  }
`

interface SoundConfig {
  name: string
  rain?: {
    centerFreq: number
    bandwidth: number
  }
  ocean?: {
    waveSpeed: number
    waveDepth: number
    centerFreq: number
    bandwidth: number
  }
  waterfall?: {
    centerFreq: number
    bandwidth: number
    intensity: number
  }
}

export default function AudioDesignerPage() {
  const [rainConfig, setRainConfig] = useState({
    name: 'Rain',
    centerFreq: 2000,
    bandwidth: 3000
  })
  
  const [oceanConfig, setOceanConfig] = useState({
    name: 'Ocean Waves',
    waveSpeed: 0.2,
    waveDepth: 0.7,
    centerFreq: 500,
    bandwidth: 1500
  })
  
  const [waterfallConfig, setWaterfallConfig] = useState({
    name: 'Waterfall',
    centerFreq: 1500,
    bandwidth: 4000,
    intensity: 0.8
  })
  
  const [playing, setPlaying] = useState<'rain' | 'ocean' | 'waterfall' | null>(null)
  const [generating, setGenerating] = useState<'rain' | 'ocean' | 'waterfall' | null>(null)
  
  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const filterNodeRef = useRef<BiquadFilterNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const tremoloGainRef = useRef<GainNode | null>(null)
  const tremoloOscRef = useRef<OscillatorNode | null>(null)

  // Create noise buffer for Web Audio API
  const createNoiseBuffer = (audioContext: AudioContext, color: 'white' | 'brown' | 'pink', duration: number = 2) => {
    const sampleRate = audioContext.sampleRate
    const bufferSize = sampleRate * duration
    const buffer = audioContext.createBuffer(2, bufferSize, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      
      if (color === 'white') {
        // White noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1
        }
      } else if (color === 'brown') {
        // Brown noise (integrated white noise)
        let lastOut = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          data[i] = (lastOut + (0.02 * white)) / 1.02
          lastOut = data[i]
          data[i] *= 3.5 // Compensate for reduced volume
        }
      }
    }
    
    return buffer
  }

  const stopAudio = () => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop()
      noiseNodeRef.current = null
    }
    if (tremoloOscRef.current) {
      tremoloOscRef.current.stop()
      tremoloOscRef.current = null
    }
    if (audioContextRef.current?.state === 'running') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setPlaying(null)
  }

  const togglePlay = (type: 'rain' | 'ocean' | 'waterfall') => {
    if (playing === type) {
      // Stop current playback
      stopAudio()
    } else {
      // Stop any existing playback
      stopAudio()
      
      // Start new playback
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext
        
        const config = type === 'rain' ? rainConfig : type === 'ocean' ? oceanConfig : waterfallConfig
        const noiseColor = type === 'ocean' ? 'brown' : 'white'
        
        // Create noise buffer (looped)
        const noiseBuffer = createNoiseBuffer(audioContext, noiseColor, 2)
        const noiseNode = audioContext.createBufferSource()
        noiseNode.buffer = noiseBuffer
        noiseNode.loop = true
        noiseNodeRef.current = noiseNode
        
        // Create bandpass filter
        const filterNode = audioContext.createBiquadFilter()
        filterNode.type = 'bandpass'
        filterNode.frequency.value = config.centerFreq
        filterNode.Q.value = config.centerFreq / (config.bandwidth || 1000)
        filterNodeRef.current = filterNode
        
        // Create gain node for volume
        const gainNode = audioContext.createGain()
        gainNode.gain.value = type === 'waterfall' ? (waterfallConfig.intensity || 0.8) : 0.3
        gainNodeRef.current = gainNode
        
        // Connect nodes
        noiseNode.connect(filterNode)
        
        if (type === 'ocean') {
          // Add tremolo for ocean waves
          const tremoloGain = audioContext.createGain()
          const tremoloOsc = audioContext.createOscillator()
          tremoloOsc.type = 'sine'
          tremoloOsc.frequency.value = oceanConfig.waveSpeed
          
          const tremoloDepth = audioContext.createGain()
          tremoloDepth.gain.value = oceanConfig.waveDepth / 2
          
          tremoloOsc.connect(tremoloDepth)
          tremoloDepth.connect(tremoloGain.gain)
          
          tremoloGain.gain.value = 0.5
          
          filterNode.connect(tremoloGain)
          tremoloGain.connect(gainNode)
          
          tremoloGainRef.current = tremoloGain
          tremoloOscRef.current = tremoloOsc
          
          tremoloOsc.start()
        } else {
          filterNode.connect(gainNode)
        }
        
        gainNode.connect(audioContext.destination)
        
        noiseNode.start()
        setPlaying(type)
      } catch (error) {
        console.error('Audio playback error:', error)
        alert('Failed to start audio playback')
      }
    }
  }
  
  // Update audio parameters in real-time
  React.useEffect(() => {
    if (!playing || !filterNodeRef.current || !gainNodeRef.current) return
    
    const config = playing === 'rain' ? rainConfig : playing === 'ocean' ? oceanConfig : waterfallConfig
    
    // Update filter
    filterNodeRef.current.frequency.value = config.centerFreq
    filterNodeRef.current.Q.value = config.centerFreq / (config.bandwidth || 1000)
    
    // Update gain for waterfall
    if (playing === 'waterfall') {
      gainNodeRef.current.gain.value = waterfallConfig.intensity || 0.8
    }
    
    // Update tremolo for ocean
    if (playing === 'ocean' && tremoloOscRef.current && tremoloGainRef.current) {
      tremoloOscRef.current.frequency.value = oceanConfig.waveSpeed
      // Tremolo depth is controlled by gain depth, but we can't easily adjust this in real-time
    }
  }, [playing, rainConfig, oceanConfig, waterfallConfig])
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  const handleGenerate = async (type: 'rain' | 'ocean' | 'waterfall') => {
    setGenerating(type)
    
    try {
      const config = type === 'rain' ? rainConfig : type === 'ocean' ? oceanConfig : waterfallConfig
      
      const response = await fetch('/api/audio/generate-ambient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config })
      })
      
      if (!response.ok) throw new Error('Generation failed')
      
      const result = await response.json()
      alert(`✅ ${config.name} generated and saved!\nS3 URL: ${result.s3Url}`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate sound')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
          eyebrow="AUDIO TOOLS"
          title="Ambient Sound Designer"
        >
          <p className="text-neutral-400 text-center max-w-2xl mx-auto">
            Create custom ambient sounds with precise control over frequency, rhythm, and intensity.
            Preview in real-time - adjust sliders while listening to hear changes instantly.
          </p>
        </PageHero>

        {/* Rain Designer */}
        <Card variant="elevated" className="bg-[#0A0A0A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Rain</h2>
              <p className="text-sm text-neutral-400">Gentle rainfall with adjustable frequency range</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
              <Input
                value={rainConfig.name}
                onChange={(e) => setRainConfig({ ...rainConfig, name: e.target.value })}
                placeholder="e.g., Gentle Rain, Heavy Rain"
              />
            </div>

            {/* Center Frequency */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Center Frequency: {rainConfig.centerFreq}Hz
              </label>
              <input
                type="range"
                min="1000"
                max="4000"
                step="100"
                value={rainConfig.centerFreq}
                onChange={(e) => setRainConfig({ ...rainConfig, centerFreq: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Lower = deeper rain, Higher = lighter rain</p>
            </div>

            {/* Bandwidth */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Bandwidth: {rainConfig.bandwidth}Hz
              </label>
              <input
                type="range"
                min="1000"
                max="5000"
                step="100"
                value={rainConfig.bandwidth}
                onChange={(e) => setRainConfig({ ...rainConfig, bandwidth: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Wider = more varied rain texture</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => togglePlay('rain')}
                className="flex-1"
              >
                {playing === 'rain' ? (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Preview
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleGenerate('rain')}
                disabled={generating === 'rain'}
                className="flex-1"
              >
                {generating === 'rain' ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Save (5 min)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Ocean Waves Designer */}
        <Card variant="elevated" className="bg-[#0A0A0A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <WavesIcon className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Ocean Waves</h2>
              <p className="text-sm text-neutral-400">Rhythmic waves with adjustable speed and intensity</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
              <Input
                value={oceanConfig.name}
                onChange={(e) => setOceanConfig({ ...oceanConfig, name: e.target.value })}
                placeholder="e.g., Calm Ocean, Crashing Waves"
              />
            </div>

            {/* Wave Speed */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Wave Speed: {oceanConfig.waveSpeed.toFixed(2)}Hz ({(1/oceanConfig.waveSpeed).toFixed(1)}s per wave)
              </label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={oceanConfig.waveSpeed}
                onChange={(e) => setOceanConfig({ ...oceanConfig, waveSpeed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Slower = gentle waves, Faster = choppy waves</p>
            </div>

            {/* Wave Depth */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Wave Intensity: {(oceanConfig.waveDepth * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={oceanConfig.waveDepth}
                onChange={(e) => setOceanConfig({ ...oceanConfig, waveDepth: parseFloat(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Lower = subtle swells, Higher = dramatic waves</p>
            </div>

            {/* Center Frequency */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Center Frequency: {oceanConfig.centerFreq}Hz
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                value={oceanConfig.centerFreq}
                onChange={(e) => setOceanConfig({ ...oceanConfig, centerFreq: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Lower = deeper ocean, Higher = brighter waves</p>
            </div>

            {/* Bandwidth */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Bandwidth: {oceanConfig.bandwidth}Hz
              </label>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={oceanConfig.bandwidth}
                onChange={(e) => setOceanConfig({ ...oceanConfig, bandwidth: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Wider = more complex wave texture</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => togglePlay('ocean')}
                className="flex-1"
              >
                {playing === 'ocean' ? (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Preview
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleGenerate('ocean')}
                disabled={generating === 'ocean'}
                className="flex-1"
              >
                {generating === 'ocean' ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Save (5 min)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Waterfall Designer */}
        <Card variant="elevated" className="bg-[#0A0A0A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Wind className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Waterfall</h2>
              <p className="text-sm text-neutral-400">Continuous flowing water with adjustable intensity</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
              <Input
                value={waterfallConfig.name}
                onChange={(e) => setWaterfallConfig({ ...waterfallConfig, name: e.target.value })}
                placeholder="e.g., Gentle Stream, Powerful Waterfall"
              />
            </div>

            {/* Center Frequency */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Center Frequency: {waterfallConfig.centerFreq}Hz
              </label>
              <input
                type="range"
                min="800"
                max="3000"
                step="100"
                value={waterfallConfig.centerFreq}
                onChange={(e) => setWaterfallConfig({ ...waterfallConfig, centerFreq: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Lower = deeper flow, Higher = lighter cascade</p>
            </div>

            {/* Bandwidth */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Bandwidth: {waterfallConfig.bandwidth}Hz
              </label>
              <input
                type="range"
                min="2000"
                max="6000"
                step="200"
                value={waterfallConfig.bandwidth}
                onChange={(e) => setWaterfallConfig({ ...waterfallConfig, bandwidth: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Wider = more turbulent flow</p>
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Flow Intensity: {(waterfallConfig.intensity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={waterfallConfig.intensity}
                onChange={(e) => setWaterfallConfig({ ...waterfallConfig, intensity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-neutral-500 mt-1">Lower = gentle stream, Higher = powerful falls</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => togglePlay('waterfall')}
                className="flex-1"
              >
                {playing === 'waterfall' ? (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Preview
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleGenerate('waterfall')}
                disabled={generating === 'waterfall'}
                className="flex-1"
              >
                {generating === 'waterfall' ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Save (5 min)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
    </>
  )
}

