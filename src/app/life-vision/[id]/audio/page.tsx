'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Button, Badge, Spinner, TrackingMilestoneCard } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Mic, Headphones, Clock, List, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AudioHubPage({ params }: { params: Promise<{ id: string }> }) {
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSets: 0,
    activeBatches: 0,
    completedTracks: 0,
    hasRecording: false
  })

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId) return
    loadStats()
  }, [visionId])

  async function loadStats() {
    const supabase = createClient()
    
    // Load audio sets count
    const { data: sets } = await supabase
      .from('audio_sets')
      .select('id')
      .eq('vision_id', visionId)
    
    // Load active batches count
    const { data: batches } = await supabase
      .from('audio_generation_batches')
      .select('id')
      .eq('vision_id', visionId)
      .in('status', ['pending', 'processing'])
    
    // Load completed tracks count
    const { data: tracks } = await supabase
      .from('audio_tracks')
      .select('id')
      .eq('vision_id', visionId)
      .eq('status', 'completed')
    
    setStats({
      totalSets: sets?.length || 0,
      activeBatches: batches?.length || 0,
      completedTracks: tracks?.length || 0,
      hasRecording: false
    })
    
    setLoading(false)
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="text-center">
              {/* Eyebrow */}
              <div className="mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  The Life I Choose
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Audio Studio</h1>
              
              <p className="text-sm md:text-base text-neutral-300 max-w-2xl mx-auto">
                Transform your vision into powerful audio experiences
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats.totalSets > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <TrackingMilestoneCard
              label="Audio Sets"
              value={stats.totalSets}
              theme="primary"
            />
            <TrackingMilestoneCard
              label="Active Batches"
              value={stats.activeBatches}
              theme="secondary"
            />
            <TrackingMilestoneCard
              label="Completed Tracks"
              value={stats.completedTracks}
              theme="accent"
            />
            <TrackingMilestoneCard
              label="Voice Recordings"
              value={stats.hasRecording ? 1 : 0}
              theme="primary"
            />
          </div>
        )}

        {/* Active Generation Alert */}
        {stats.activeBatches > 0 && (
          <Card variant="elevated" className="bg-blue-500/5 border-blue-500/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Generation In Progress</h3>
                  <p className="text-sm text-neutral-300">
                    {stats.activeBatches} {stats.activeBatches === 1 ? 'batch is' : 'batches are'} currently generating audio
                  </p>
                </div>
              </div>
              <Button variant="secondary" asChild>
                <Link href={`/life-vision/${visionId}/audio/queue`}>
                  View Queue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Audio */}
          <Link href={`/life-vision/${visionId}/audio/generate`}>
            <Card variant="elevated" hover className="cursor-pointer h-full p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Generate Audio</h3>
              <p className="text-sm text-neutral-300 mb-4">
                Create narrated audio versions of your vision with VIVA
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-xs">Voice Only</Badge>
                <Badge variant="info" className="text-xs">Background Mixes</Badge>
              </div>
            </Card>
          </Link>

          {/* Record Audio */}
          <Link href={`/life-vision/${visionId}/audio/record`}>
            <Card variant="elevated" hover className="cursor-pointer h-full p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Record Audio</h3>
              <p className="text-sm text-neutral-300 mb-4">
                Record your vision in your own voice using your device microphone
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs">Personal</Badge>
                <Badge variant="info" className="text-xs">Direct Upload</Badge>
              </div>
            </Card>
          </Link>

          {/* Audio Sets Library */}
          <Link href={`/life-vision/${visionId}/audio/sets`}>
            <Card variant="elevated" hover className="cursor-pointer h-full p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Audio Sets</h3>
              <p className="text-sm text-neutral-300 mb-4">
                Browse and play your completed audio sets and variations
              </p>
              <div className="flex items-center gap-2">
                {stats.totalSets > 0 ? (
                  <>
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {stats.totalSets} {stats.totalSets === 1 ? 'Set' : 'Sets'}
                    </Badge>
                    <Badge variant="info" className="text-xs">{stats.completedTracks} Tracks</Badge>
                  </>
                ) : (
                  <Badge variant="neutral" className="text-xs">No sets yet</Badge>
                )}
              </div>
            </Card>
          </Link>

          {/* Generation Queue */}
          <Link href={`/life-vision/${visionId}/audio/queue`}>
            <Card 
              variant="elevated" 
              hover 
              className={`cursor-pointer h-full p-6 ${stats.activeBatches > 0 ? 'bg-blue-500/5 border-blue-500/30' : ''}`}
            >
              <h3 className="text-xl font-semibold text-white mb-2">Generation Queue</h3>
              <p className="text-sm text-neutral-300 mb-4">
                Monitor active audio generation jobs and view their progress
              </p>
              <div className="flex items-center gap-2">
                {stats.activeBatches > 0 ? (
                  <Badge variant="info" className="text-xs animate-pulse">
                    <Clock className="w-3 h-3 mr-1" />
                    {stats.activeBatches} Active
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-xs">No active batches</Badge>
                )}
              </div>
            </Card>
          </Link>
        </div>

        {/* Quick Start Guide */}
        {stats.totalSets === 0 && (
          <Card variant="elevated" className="bg-primary-500/5 border-primary-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Getting Started with Audio</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Generate Audio</p>
                  <p className="text-sm text-neutral-300">Select a voice and generate narrated audio for all sections</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Add Background Music</p>
                  <p className="text-sm text-neutral-300">Create variations with sleep, energy, or meditation music</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Listen and Align</p>
                  <p className="text-sm text-neutral-300">Play your audio daily to align with your vision</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="primary" asChild>
                <Link href={`/life-vision/${visionId}/audio/generate`}>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* How It Works */}
        <Card variant="elevated">
          <h3 className="text-xl font-semibold text-white mb-4">Audio Features</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Headphones className="w-5 h-5 text-[#39FF14]" />
                <h4 className="text-lg font-semibold text-white">VIVA Voice Generation</h4>
              </div>
              <p className="text-sm text-neutral-300 ml-7">
                Choose from 9 professional voices to narrate your entire vision. Our VIVA system creates high-quality audio for each section.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-5 h-5 text-[#D03739]" />
                <h4 className="text-lg font-semibold text-white">Personal Recording</h4>
              </div>
              <p className="text-sm text-neutral-300 ml-7">
                Record your vision in your own voice. Perfect for creating a deeply personal connection with your vision.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <List className="w-5 h-5 text-[#14B8A6]" />
                <h4 className="text-lg font-semibold text-white">Background Variations</h4>
              </div>
              <p className="text-sm text-neutral-300 ml-7">
                Add sleep, energy, or meditation background music to create different mood variations of your audio.
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/life-vision/${visionId}`}>
              Back to Vision
            </Link>
          </Button>
          {stats.totalSets > 0 && (
            <Button variant="primary" asChild className="flex-1">
              <Link href={`/life-vision/${visionId}/audio/sets`}>
                View Audio Library
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </Stack>
    </Container>
  )
}
