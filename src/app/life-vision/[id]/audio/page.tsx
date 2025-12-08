'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Button, Badge, Spinner, TrackingMilestoneCard, StatusBadge, VersionBadge } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Mic, Headphones, Clock, ArrowRight, CheckCircle, Wand2, CalendarDays } from 'lucide-react'
import Link from 'next/link'

interface VisionData {
  id: string
  version_number: number
  is_active: boolean
  is_draft: boolean
  created_at: string
  title?: string
}

export default function AudioHubPage({ params }: { params: Promise<{ id: string }> }) {
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [vision, setVision] = useState<VisionData | null>(null)
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
    
    // Load vision data
    const { data: visionData, error: visionError } = await supabase
      .from('vision_versions')
      .select('id, is_active, is_draft, created_at, title')
      .eq('id', visionId)
      .single()
    
    if (visionError) {
      console.error('Error loading vision data:', visionError)
    }
    
    if (visionData) {
      // Get calculated version number using RPC
      const { data: calculatedVersionNumber } = await supabase
        .rpc('get_vision_version_number', { p_vision_id: visionData.id })
      
      const versionNumber = calculatedVersionNumber || 1
      
      setVision({
        ...visionData,
        version_number: versionNumber
      })
    }
    
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
              
              <p className="text-sm md:text-base text-neutral-300 max-w-2xl mx-auto mb-6">
                Transform your vision into powerful audio experiences
              </p>

              {/* Badge Row */}
              {vision ? (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm mb-6">
                  <VersionBadge 
                    versionNumber={vision.version_number} 
                    status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'} 
                  />
                  <StatusBadge 
                    status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'} 
                    subtle={!vision.is_active} 
                    className="uppercase tracking-[0.25em]" 
                  />
                  <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                    <CalendarDays className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium">Created:</span>
                    <span>{new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 mb-6">Loading vision info...</div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/sets`} className="flex items-center justify-center gap-2">
                    <Headphones className="w-4 h-4" />
                    Audio Sets
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/generate`} className="flex items-center justify-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    <span className="lg:hidden">Generate</span>
                    <span className="hidden lg:inline">Generate Audio</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/record`} className="flex items-center justify-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span className="lg:hidden">Record</span>
                    <span className="hidden lg:inline">Record Voice</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/queue`} className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="lg:hidden">Queue</span>
                    <span className="hidden lg:inline">Audio Queue</span>
                  </Link>
                </Button>
              </div>
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
        <Card>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Audio Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Audio Sets */}
            <Link href={`/life-vision/${visionId}/audio/sets`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Headphones className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Audio Sets</h3>
                <p className="text-sm text-neutral-300">
                  Listen to different mood variations of your life vision audio with voice only, sleep, energy, or meditation audio sets.
                </p>
              </Card>
            </Link>

            {/* VIVA Voice Generation */}
            <Link href={`/life-vision/${visionId}/audio/generate`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Generate Audio</h3>
              <p className="text-sm text-neutral-300">
                Choose from 9 professional voices to rapidly narrate your entire life vision with VIVA AI voice generation.
              </p>
              </Card>
            </Link>

            {/* Personal Recording */}
            <Link href={`/life-vision/${visionId}/audio/record`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-secondary-500/20 rounded-xl flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Record Voice</h3>
              <p className="text-sm text-neutral-300">
                Record your vision in your own voice. Perfect for creating a deeply personal connection with your vision.
              </p>
              </Card>
            </Link>

            {/* Generation Queue */}
            <Link href={`/life-vision/${visionId}/audio/queue`}>
              <Card 
                variant="elevated" 
                hover 
                className={`cursor-pointer h-full p-6 flex flex-col items-center text-center ${stats.activeBatches > 0 ? 'bg-blue-500/5 border-blue-500/30' : ''}`}
              >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stats.activeBatches > 0 ? 'bg-blue-500/20' : 'bg-neutral-500/20'}`}>
                <Clock className={`w-6 h-6 ${stats.activeBatches > 0 ? 'text-blue-400 animate-pulse' : 'text-neutral-400'}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Audio Queue</h3>
              <p className="text-sm text-neutral-300">
                Monitor active audio generation jobs and view their progress so you can start activating as soon as they're complete.
              </p>
              </Card>
            </Link>
          </div>
        </Card>

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

      </Stack>
    </Container>
  )
}
