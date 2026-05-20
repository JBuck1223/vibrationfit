'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Button, Badge, Spinner, TrackingMilestoneCard, StatusBadge, VersionBadge, PageHero, Icon } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Mic, Headphones, Clock, ArrowRight, AudioLines, CalendarDays, Eye, ListMusic, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface VisionData {
  id: string
  household_id?: string | null
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
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
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
      .select('id, household_id, is_active, is_draft, created_at, title')
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
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <PageHero
          eyebrow={vision?.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
          title="Audio Studio"
          subtitle="Transform your vision into powerful audio experiences"
        >
          {/* Badge Row */}
          {vision ? (
            <div className="text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <VersionBadge 
                  versionNumber={vision.version_number} 
                  status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'}
                  isHouseholdVision={!!vision.household_id}
                />
                <StatusBadge 
                  status={vision.is_active ? 'active' : vision.is_draft ? 'draft' : 'complete'} 
                  subtle={!vision.is_active} 
                  className="uppercase tracking-[0.25em]" 
                />
                <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <CalendarDays className="w-5 h-5 text-neutral-500" />
                  <span className="font-medium">Created:</span>
                  <span>{new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-500">Loading vision info...</div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
            <Button variant="outline" size="sm" asChild className="w-full col-span-2 lg:col-span-1">
              <Link href={`/life-vision/${visionId}/audio/sets`} className="flex items-center justify-center gap-2">
                <Icon icon={ListMusic} size="sm" className="shrink-0" />
                <span>Audio Sets</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/audio/generate`} className="flex items-center justify-center gap-2">
                <Icon icon={AudioLines} size="sm" className="shrink-0" />
                <span>Generate</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/audio/record`} className="flex items-center justify-center gap-2">
                <Icon icon={Mic} size="sm" className="shrink-0" />
                <span>Record</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/audio/queue`} className="flex items-center justify-center gap-2">
                <Icon icon={Clock} size="sm" className="shrink-0" />
                <span>Queue</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}`} className="flex items-center justify-center gap-2">
                <Icon icon={Eye} size="sm" className="shrink-0" />
                <span className="lg:hidden">Vision</span>
                <span className="hidden lg:inline">View Vision</span>
              </Link>
            </Button>
          </div>
        </PageHero>

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
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* How It Works Toggle */}
        <Card variant="elevated" className="bg-primary-500/5 border-primary-500/30">
          <button
            onClick={() => setHowItWorksOpen(!howItWorksOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-xl font-semibold text-white">How It Works</h3>
            <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${howItWorksOpen ? 'rotate-180' : ''}`} />
          </button>
          {howItWorksOpen && (
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-black text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Generate Audio or Record Voice</p>
                  <p className="text-sm text-neutral-300">Select a VIVA voice and generate audio for all sections or record your own voice.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-black text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Add Background Music and/or Frequency Enhancements</p>
                  <p className="text-sm text-neutral-300">Create unlimited variations using background tracks and/or healing frequencies.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-black text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Activate</p>
                  <p className="text-sm text-neutral-300">Play your audio daily to align with your vision. You can use it for sleep, energy, meditation, category-specific activation, or any other way you choose.</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Main Navigation Cards */}
        <Card>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Audio Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Audio Sets */}
            <Link href={`/life-vision/${visionId}/audio/sets`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon icon={ListMusic} size="md" color="#39FF14" />
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
                <Icon icon={AudioLines} size="md" color="#BF00FF" />
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
                <Icon icon={Mic} size="md" color="#00FFFF" />
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
                <Icon icon={Clock} size="md" color={stats.activeBatches > 0 ? '#60A5FA' : '#A3A3A3'} className={stats.activeBatches > 0 ? 'animate-pulse' : ''} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Audio Queue</h3>
              <p className="text-sm text-neutral-300">
                Monitor active audio generation jobs and view their progress so you can start activating as soon as they're complete.
              </p>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Global Audio Studio CTA */}
        <Card variant="glass" className="p-5 text-center">
          <p className="text-sm text-neutral-400 mb-3">
            Use the full Audio Studio to generate, record, and mix audio from all your Life Visions and Stories in one place.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/audio/generate?source=life_vision&sourceId=${visionId}`}>
              <Headphones className="w-4 h-4 mr-2" />
              Open in Audio Studio
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </Card>

      </Stack>
    </Container>
  )
}
