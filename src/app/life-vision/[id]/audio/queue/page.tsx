'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Button, Badge, Spinner, DeleteConfirmationDialog, PageHero } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, ArrowLeft, Clock, Mic, Moon, Zap, Sparkles, Music, Trash2, Headphones, Wand2, Eye, ListMusic, Plus } from 'lucide-react'
import Link from 'next/link'

interface Voice {
  id: string
  name: string
  brandName?: string
  gender?: string
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      const voices = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: `${v.brandName || v.name} (${v.gender})`
      }))
      setVoices(voices)
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

  async function handleDelete() {
    if (!batchToDelete) return
    
    setDeleting(true)
    try {
      const supabase = createClient()
      
      // Delete the batch (cascade should handle audio_tracks)
      const { error } = await supabase
        .from('audio_generation_batches')
        .delete()
        .eq('id', batchToDelete.id)
      
      if (error) throw error
      
      // Remove from local state
      setActiveBatches(prev => prev.filter(b => b.id !== batchToDelete.id))
      
      // Close dialog
      setShowDeleteConfirm(false)
      setBatchToDelete(null)
    } catch (error) {
      console.error('Failed to delete batch:', error)
      alert('Failed to delete generation batch. Please try again.')
    } finally {
      setDeleting(false)
    }
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
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Audio Generation Queue"
          subtitle={hasActiveBatches ? 'Monitor your in-progress audio generations' : 'View your recent audio generation history'}
        >
          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
            <Button variant="outline" size="sm" asChild className="w-full col-span-2 lg:col-span-1">
              <Link href={`/life-vision/${visionId}/audio/sets`} className="flex items-center justify-center gap-2">
                <ListMusic className="w-4 h-4" />
                <span>Audio Sets</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/audio/generate`} className="flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4" />
                <span>Generate</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/audio/record`} className="flex items-center justify-center gap-2">
                <Mic className="w-4 h-4" />
                <span>Record</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/audio`} className="flex items-center justify-center gap-2">
                <Headphones className="w-4 h-4" />
                <span>All Audios</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}`} className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="lg:hidden">Vision</span>
                <span className="hidden lg:inline">View Vision</span>
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Card */}
          <Link href={`/life-vision/${visionId}/audio/generate`}>
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <p className="text-white text-lg">Generate more audio sets</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Record Card */}
          <Link href={`/life-vision/${visionId}/audio/record`}>
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#D03739]/20 via-[#8B5CF6]/10 to-[#14B8A6]/20 border-[#D03739]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#D03739]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-[#D03739]" />
                </div>
                <div>
                  <p className="text-white text-lg">Record life vision in your voice</p>
                </div>
              </div>
            </Card>
          </Link>
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
            <div className="flex flex-col items-center text-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                {hasActiveBatches ? 'Generation Queue' : 'Recent Audio Generations'}
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {activeBatches.map((batch) => {
                const isActive = ['pending', 'processing'].includes(batch.status)
                const progressPercent = Math.round((batch.tracks_completed / batch.total_tracks_expected) * 100)
                
                // Get icon for variant
                const getVariantIcon = (variantId: string) => {
                  if (variantId === 'standard') return (
                    <div className="p-1.5 rounded-lg bg-primary-500/20">
                      <Mic className="w-4 h-4 text-primary-500" />
                    </div>
                  )
                  if (variantId === 'sleep') return (
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <Moon className="w-4 h-4 text-blue-400" />
                    </div>
                  )
                  if (variantId === 'energy') return (
                    <div className="p-1.5 rounded-lg bg-yellow-500/20">
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                  )
                  if (variantId === 'meditation') return (
                    <div className="p-1.5 rounded-lg bg-purple-500/20">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                  )
                  return (
                    <div className="p-1.5 rounded-lg bg-neutral-500/20">
                      <Music className="w-4 h-4 text-neutral-400" />
                    </div>
                  )
                }
                
                return (
                  <div key={batch.id} className="relative">
                    <Link href={`/life-vision/${visionId}/audio/queue/${batch.id}`}>
                      <Card 
                        variant="default" 
                        hover
                        className="cursor-pointer !py-4 !px-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {/* Variant Icon */}
                            {getVariantIcon(batch.variant_ids[0] || 'standard')}
                            
                            {/* Content aligned with title */}
                            <div className="flex-1 space-y-2 min-w-0">
                              {/* Variant Name + Badge on Mobile */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white font-medium">
                                  {batch.variant_ids.map(v => v === 'standard' ? 'Voice Only' : v.charAt(0).toUpperCase() + v.slice(1)).join(', ')}
                                </p>
                                <span className="inline-flex md:hidden">
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
                                     batch.status === 'failed' ? 'Failed' :
                                     batch.status === 'partial_success' ? 'Partial' :
                                     batch.status}
                                  </Badge>
                                </span>
                              </div>
                              
                              {/* Tracks Count */}
                              <div className="text-sm text-neutral-400">
                                Tracks: {batch.tracks_completed}/{batch.total_tracks_expected}
                                {batch.tracks_failed > 0 && (
                                  <span className="text-red-400 ml-2">({batch.tracks_failed} failed)</span>
                                )}
                              </div>
                              
                              {/* Date and Time */}
                              <div className="text-xs text-neutral-500">
                                {new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(batch.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </div>
                              
                              {/* Voice Used */}
                              <div className="text-xs text-neutral-400">
                                Voice: {voices.find(v => v.id === batch.voice_id)?.name || batch.voice_id}
                              </div>

                              {/* Progress Bar */}
                              {isActive && (
                                <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2">
                                  <div 
                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Side - Desktop: Badge */}
                          <div className="hidden md:flex md:flex-col md:items-end md:gap-2">
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
                               batch.status === 'failed' ? 'Failed' :
                               batch.status === 'partial_success' ? 'Partial' :
                               batch.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                    
                    {/* Delete Button - Mobile: Top Right, Desktop: Bottom Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setBatchToDelete(batch)
                        setShowDeleteConfirm(true)
                      }}
                      className="absolute top-3 right-3 md:bottom-3 md:top-auto p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors z-10"
                      aria-label="Delete generation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setBatchToDelete(null)
        }}
        onConfirm={handleDelete}
        itemName={batchToDelete ? `${batchToDelete.variant_ids.map(v => v === 'standard' ? 'Voice Only' : v.charAt(0).toUpperCase() + v.slice(1)).join(', ')} generation` : ''}
        itemType="Audio Generation"
        isLoading={deleting}
        loadingText="Deleting..."
      />
    </Container>
  )
}


