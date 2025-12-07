'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Button, Badge, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

interface Voice {
  id: string
  name: string
}

interface Batch {
  id: string
  vision_id: string
  status: string
  tracks_completed: number
  tracks_failed: number
  tracks_pending: number
  total_tracks_expected: number
  voice_id: string
  variant_ids: string[]
  created_at: string
}

export default function AudioQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeBatches, setActiveBatches] = useState<Batch[]>([])
  const [voices, setVoices] = useState<Voice[]>([])

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId) return
    loadData()
  }, [visionId])

  async function loadData() {
    const supabase = createClient()

    // Load voices
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      setVoices(data.voices || [])
    } catch (err) {
      console.error('Failed to load voices:', err)
    }

    // Load all batches for this vision
    const { data: batches } = await supabase
      .from('audio_generation_batches')
      .select('*')
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (batches) {
      setActiveBatches(batches)
    }

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

  const hasActiveBatches = activeBatches.some(b => ['pending', 'processing'].includes(b.status))

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
              <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Generation Queue</h1>
              
              <p className="text-sm md:text-base text-neutral-300 max-w-2xl mx-auto">
                {hasActiveBatches ? 'Monitor your in-progress audio generations' : 'View your recent audio generation history'}
              </p>
            </div>
          </div>
        </div>

        {/* Generations List */}
        {activeBatches.length === 0 ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <CheckCircle className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Generations Yet</h3>
            <p className="text-neutral-400 mb-6">Start generating audio to see your queue here.</p>
            <Button variant="primary" asChild>
              <Link href={`/life-vision/${visionId}/audio/generate`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Audio Studio
              </Link>
            </Button>
          </Card>
        ) : (
          <Card variant="elevated" className={hasActiveBatches ? "bg-blue-500/5 border-blue-500/30" : ""}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  {hasActiveBatches ? (
                    <Spinner size="sm" className="text-blue-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {hasActiveBatches ? 'Active Generations' : 'Recent Generations'}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    {hasActiveBatches ? 'In-progress generations' : 'Completed generations'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {activeBatches.map((batch) => {
                const isActive = ['pending', 'processing'].includes(batch.status)
                const progressPercent = Math.round((batch.tracks_completed / batch.total_tracks_expected) * 100)
                
                return (
                  <Link key={batch.id} href={`/life-vision/${visionId}/audio/queue/${batch.id}`}>
                    <Card 
                      variant="default" 
                      hover
                      className="cursor-pointer !py-4 !px-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-medium">
                              {batch.variant_ids.map(v => v === 'standard' ? 'Voice Only' : v.charAt(0).toUpperCase() + v.slice(1)).join(', ')}
                            </p>
                            <Badge 
                              variant={
                                batch.status === 'completed' ? 'success' :
                                batch.status === 'failed' ? 'error' :
                                batch.status === 'partial_success' ? 'warning' :
                                'info'
                              }
                              className="text-xs"
                            >
                              {batch.status === 'processing' ? 'In Progress' : 
                               batch.status === 'pending' ? 'Queued' :
                               batch.status === 'completed' ? 'Complete' :
                               batch.status === 'partial_success' ? 'Partial' :
                               batch.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-neutral-400 mb-2">
                            <span>Voice: {voices.find(v => v.id === batch.voice_id)?.name || batch.voice_id}</span>
                            <span>•</span>
                            <span>{batch.tracks_completed} / {batch.total_tracks_expected} tracks</span>
                            {batch.tracks_failed > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-red-400">{batch.tracks_failed} failed</span>
                              </>
                            )}
                          </div>

                          {isActive && (
                            <div className="w-full bg-neutral-800 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-neutral-500">
                          {new Date(batch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/life-vision/${visionId}/audio`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audio Hub
            </Link>
          </Button>
          <Button variant="primary" asChild className="flex-1">
            <Link href={`/life-vision/${visionId}/audio/generate`}>
              Generate More Audio
            </Link>
          </Button>
        </div>
      </Stack>
    </Container>
  )
}


