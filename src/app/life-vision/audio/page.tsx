'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, Headphones, Music, Moon, Zap, Sparkles, Clock, CheckCircle, Circle, Target, X, Volume2 } from 'lucide-react'
import { Card, Button, Badge, Spinner, VersionBadge, StatusBadge, CreatedDateBadge } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { colors } from '@/lib/design-system/tokens'

interface AudioSet {
  id: string
  vision_id: string
  name: string
  description: string
  variant: string
  voice_id: string | null
  created_at: string
  vision_version_number: number
  vision_is_active: boolean
  vision_is_draft: boolean
  track_count: number
  is_ready: boolean
  is_mixing: boolean
}

interface VisionVersionWithAudios {
  vision_id: string
  version_number: number
  is_active: boolean
  is_draft: boolean
  created_at: string
  audio_sets_count: number
  ready_audio_sets_count: number
  mixing_audio_sets_count: number
  audio_sets: AudioSet[]
}

export default function AllVisionAudiosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visionVersions, setVisionVersions] = useState<VisionVersionWithAudios[]>([])
  const [visionCount, setVisionCount] = useState(0)
  const [totalAudioSets, setTotalAudioSets] = useState(0)
  const [readyAudioSets, setReadyAudioSets] = useState(0)

  useEffect(() => {
    fetchAudioSets()
  }, [])

  // Refresh on tab visibility regain
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAudioSets()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchAudioSets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Get all visions for this user
      const { data: visions, error: visionsError } = await supabase
        .from('vision_versions')
        .select('id, version_number, is_active, is_draft')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (visionsError) throw visionsError

      const visionIds = visions?.map(v => v.id) || []
      setVisionCount(visions?.length || 0)

      if (visionIds.length === 0) {
        setLoading(false)
        return
      }

      // Get all audio sets for these visions
      const { data: sets, error: setsError } = await supabase
        .from('audio_sets')
        .select(`
          id,
          vision_id,
          name,
          description,
          variant,
          voice_id,
          created_at
        `)
        .in('vision_id', visionIds)
        .order('created_at', { ascending: false })

      if (setsError) throw setsError

      // For each audio set, get track count and status
      const setsWithDetails = await Promise.all((sets || []).map(async (set) => {
        // Get vision details
        const vision = visions?.find(v => v.id === set.vision_id)
        
        // Calculate version number
        let versionNumber = 1
        try {
          const { data: calculatedVersionNumber } = await supabase
            .rpc('get_vision_version_number', { p_vision_id: set.vision_id })
          versionNumber = calculatedVersionNumber || vision?.version_number || 1
        } catch (error) {
          versionNumber = vision?.version_number || 1
        }

        // Get track count and status
        const { data: tracks } = await supabase
          .from('audio_tracks')
          .select('mix_status, status')
          .eq('audio_set_id', set.id)

        const trackCount = tracks?.length || 0
        const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
        const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')
        const isMixing = tracks?.some((t: any) => t.mix_status === 'mixing' || t.mix_status === 'pending')

        return {
          ...set,
          vision_version_number: versionNumber,
          vision_is_active: vision?.is_active || false,
          vision_is_draft: vision?.is_draft || false,
          track_count: trackCount,
          is_ready: !!(hasCompletedVoice && (set.variant === 'standard' || hasCompletedMixing)),
          is_mixing: !!isMixing
        }
      }))

      // Group audio sets by vision_id
      const visionVersionsMap = new Map<string, VisionVersionWithAudios>()
      
      setsWithDetails.forEach(audioSet => {
        const existing = visionVersionsMap.get(audioSet.vision_id)
        
        if (existing) {
          existing.audio_sets.push(audioSet)
          existing.audio_sets_count++
          if (audioSet.is_ready) existing.ready_audio_sets_count++
          if (audioSet.is_mixing) existing.mixing_audio_sets_count++
        } else {
          visionVersionsMap.set(audioSet.vision_id, {
            vision_id: audioSet.vision_id,
            version_number: audioSet.vision_version_number,
            is_active: audioSet.vision_is_active,
            is_draft: audioSet.vision_is_draft,
            created_at: audioSet.created_at,
            audio_sets_count: 1,
            ready_audio_sets_count: audioSet.is_ready ? 1 : 0,
            mixing_audio_sets_count: audioSet.is_mixing ? 1 : 0,
            audio_sets: [audioSet]
          })
        }
      })
      
      const groupedVersions = Array.from(visionVersionsMap.values()).sort((a, b) => {
        // Sort by created_at descending (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      setVisionVersions(groupedVersions)
      setTotalAudioSets(setsWithDetails.length)
      setReadyAudioSets(setsWithDetails.filter(s => s.is_ready).length)
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching audio sets:', err)
      const message = err instanceof Error ? err.message : 'Failed to load audio sets'
      setError(message)
      setLoading(false)
    }
  }

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case 'sleep':
        return <Moon className="w-5 h-5" />
      case 'energy':
        return <Zap className="w-5 h-5" />
      case 'meditation':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Music className="w-5 h-5" />
    }
  }

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'sleep':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'energy':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'meditation':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
      default:
        return 'text-green-400 bg-green-500/20 border-green-500/30'
    }
  }

  // Determine display status based on is_active and is_draft
  const getDisplayStatus = (visionVersion: VisionVersionWithAudios) => {
    const isActive = visionVersion.is_active === true
    const isDraft = visionVersion.is_draft === true
    
    if (isActive && !isDraft) return 'active'
    else if (!isActive && isDraft) return 'draft'
    else return 'complete'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <Spinner variant="primary" size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <X className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Audios</h2>
              <p className="text-neutral-400 mb-6">{error}</p>
              <Button onClick={fetchAudioSets} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Hero - All Vision Audios */}
      <div className="mb-8">
        {/* Subtle Gradient Background */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          {/* Modern Enhanced Layout with Card Container */}
          <div className="relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-3">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  AUDIO LIBRARY
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                  All Vision Audios
                </h1>
              </div>
              
              {/* Subtitle */}
              <div className="text-center">
                <h4 className="text-xs md:text-xl text-neutral-300 max-w-3xl mx-auto font-normal">
                  Browse all audio sets generated from your Life Visions.
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {visionVersions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{visionCount}</p>
                <p className="text-xs text-neutral-400">Vision Versions</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalAudioSets}</p>
                <p className="text-xs text-neutral-400">Audio Sets</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{readyAudioSets}</p>
                <p className="text-xs text-neutral-400">Ready</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* All Audio Sets List */}
      {visionVersions.length > 0 ? (
        <Card className="p-6 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white">Vision Versions Audio Sets</h3>
          </div>
          <div className="space-y-4">
            {visionVersions.map((visionVersion) => {
              const displayStatus = getDisplayStatus(visionVersion)
              
              return (
                <Card 
                  key={visionVersion.vision_id}
                  variant="outlined" 
                  className="p-3 md:p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    {/* Vision Version Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Version Circle Badge */}
                        <VersionBadge 
                          versionNumber={visionVersion.version_number} 
                          status={displayStatus} 
                        />
                        
                        {/* Created Date Badge */}
                        <CreatedDateBadge createdAt={visionVersion.created_at} />
                        
                        {/* Status Badge */}
                        <StatusBadge 
                          status={displayStatus} 
                          subtle={displayStatus !== 'active'}
                        />

                        {/* Audio Sets Count Badge */}
                        <Badge 
                          className={`${
                            displayStatus === 'active' 
                              ? 'bg-primary-500/20 text-primary-500 border-primary-500/30' 
                              : displayStatus === 'draft'
                              ? 'bg-[#FFFF00]/20 text-[#FFFF00] border-[#FFFF00]/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          {visionVersion.audio_sets_count} {visionVersion.audio_sets_count === 1 ? 'Audio Set' : 'Audio Sets'}
                        </Badge>

                        {/* Ready/Mixing Status */}
                        {visionVersion.mixing_audio_sets_count > 0 && (
                          <Badge variant="warning">
                            <Clock className="w-4 h-4 mr-1" />
                            {visionVersion.mixing_audio_sets_count} Mixing
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row flex-wrap gap-2 w-full md:w-auto md:justify-end">
                      <Button
                        onClick={() => router.push(`/life-vision/${visionVersion.vision_id}/audio`)}
                        variant="primary"
                        size="sm"
                        className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                      >
                        <Headphones className="w-4 h-4" />
                        <span>Audios</span>
                      </Button>
                      
                      <Button
                        onClick={() => router.push(`/life-vision/${visionVersion.vision_id}`)}
                        variant="outline"
                        size="sm"
                        className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Life Vision</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      ) : (
        <div className="text-center py-16">
          <Card className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-2xl font-bold text-white mb-4">No audio sets yet</h3>
            <p className="text-neutral-400 mb-8">
              Generate audio from your Life Vision to get started. Audio sets bring your vision to life through the power of sound.
            </p>
            <Button asChild size="lg">
              <Link href="/life-vision">
                <Target className="w-5 h-5 mr-2" />
                View Visions
              </Link>
            </Button>
          </Card>
        </div>
      )}
    </>
  )
}

