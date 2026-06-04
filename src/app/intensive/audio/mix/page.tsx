'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Spinner, EmbeddedPlayer } from '@/lib/design-system/components'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Sliders } from 'lucide-react'
import { QueueStatusBanner } from '@/components/audio-studio'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import AudioMixPage from '@/app/audio/mix/page'

const SECTION_LABELS = new Map<string, string>([
  ['forward', 'Forward'], ['fun', 'Fun'], ['health', 'Health'], ['travel', 'Travel'],
  ['love', 'Love'], ['family', 'Family'], ['social', 'Social'], ['home', 'Home'],
  ['work', 'Work'], ['money', 'Money'], ['stuff', 'Stuff'], ['giving', 'Giving'],
  ['spirituality', 'Spirituality'], ['conclusion', 'Conclusion'], ['full', 'Full Life Vision'],
])
const CANONICAL_ORDER = ['forward', 'fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality', 'conclusion']

export default function IntensiveAudioMixPage() {
  const { setCompletedAt } = useIntensiveStep()
  const [stepAlreadyComplete, setStepAlreadyComplete] = useState<boolean | null>(null)
  const [completedTracks, setCompletedTracks] = useState<AudioTrack[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkStepCompletion() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('audios_generated, audios_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (checklist?.audios_generated) {
        setStepAlreadyComplete(true)
        if (checklist.audios_generated_at) {
          setCompletedAt(checklist.audios_generated_at)
        }
        loadCompletedMixTracks(supabase, user.id, cancelled)
      } else {
        setStepAlreadyComplete(false)
      }
    }
    checkStepCompletion()
    return () => {
      cancelled = true
      setCompletedAt(null)
    }
  }, [])

  async function loadCompletedMixTracks(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    cancelled: boolean
  ) {
    setTracksLoading(true)
    try {
      // Find the most recent custom mix batch to get the audio set ID
      const { data: batch } = await supabase
        .from('audio_generation_batches')
        .select('audio_set_ids')
        .eq('user_id', userId)
        .not('audio_set_ids', 'is', null)
        .contains('variant_ids', ['custom'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let audioSetId: string | null = null

      if (batch?.audio_set_ids?.length) {
        audioSetId = batch.audio_set_ids[0]
      } else {
        // Fallback: find the most recent custom-variant audio set directly
        const { data: audioSet } = await supabase
          .from('audio_sets')
          .select('id')
          .eq('user_id', userId)
          .like('variant', 'custom-%')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        audioSetId = audioSet?.id ?? null
      }

      if (cancelled || !audioSetId) { setTracksLoading(false); return }

      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id, audio_url, section_key, duration_seconds, mixed_audio_url, mix_status')
        .eq('audio_set_id', audioSetId)
        .eq('status', 'completed')
        .order('section_key')

      if (cancelled) return

      // Check if there's a combined "full" track with mixed audio (user chose combined output)
      const fullMixedTrack = (tracks || []).find(
        t => t.section_key === 'full' && t.mixed_audio_url && t.mix_status === 'completed'
      )

      let formatted: AudioTrack[]

      if (fullMixedTrack) {
        // Combined output: show the single mixed full-vision track
        const dur = typeof fullMixedTrack.duration_seconds === 'number' && isFinite(fullMixedTrack.duration_seconds) && fullMixedTrack.duration_seconds > 0 ? fullMixedTrack.duration_seconds : 0
        formatted = [{
          id: fullMixedTrack.id,
          title: 'Full Life Vision Mix',
          artist: '',
          duration: dur,
          url: fullMixedTrack.mixed_audio_url!,
          thumbnail: '',
          sectionKey: 'full',
        }]
      } else {
        // Individual output: show per-section tracks with mixed audio where available
        formatted = (tracks || [])
          .filter(t => t.section_key !== 'full')
          .map(t => {
            const url = (t.mixed_audio_url && t.mix_status === 'completed')
              ? t.mixed_audio_url
              : t.audio_url
            const dur = typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) && t.duration_seconds > 0 ? t.duration_seconds : 0
            return {
              id: t.id,
              title: SECTION_LABELS.get(t.section_key) || t.section_key,
              artist: '',
              duration: dur,
              url: url || '',
              thumbnail: '',
              sectionKey: t.section_key,
            }
          })
          .filter(t => t.url.length > 0)
          .sort((a, b) => {
            const ia = CANONICAL_ORDER.indexOf((a as any).sectionKey)
            const ib = CANONICAL_ORDER.indexOf((b as any).sectionKey)
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
          })
      }

      setCompletedTracks(formatted)
    } catch (err) {
      console.error('Error loading completed mix tracks:', err)
    } finally {
      if (!cancelled) setTracksLoading(false)
    }
  }

  if (stepAlreadyComplete === null) {
    return (
      <Container size="xl">
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (stepAlreadyComplete) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <QueueStatusBanner />

          <div className="max-w-2xl mx-auto w-full">
            {tracksLoading ? (
              <div className="flex min-h-[20vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : completedTracks.length > 0 ? (
              <EmbeddedPlayer
                tracks={completedTracks}
                setIcon={<Sliders className="w-5 h-5" />}
                setName="Life Vision Mix"
                contentCategory="life_vision"
                trackCount={completedTracks.length}
              />
            ) : (
              <Card variant="glass" className="p-6 md:p-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#39FF14]/15 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Audio Mix Complete</h3>
                    <p className="text-sm text-neutral-400 max-w-md">
                      Your Life Vision audio mix has been created.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Stack>
      </Container>
    )
  }

  return <AudioMixPage />
}
