"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, PageLayout, GradientButton, Spinner, Badge } from '@/lib/design-system/components'
import { AudioPlayer } from '@/components/AudioPlayer'
import { createClient } from '@/lib/supabase/client'

type Voice = { id: string; name: string }

export default function VisionAudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tracks, setTracks] = useState<{ sectionKey: string; title: string; url: string; status?: string; createdAt?: string; voiceId?: string; contentHash?: string }[]>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [voice, setVoice] = useState<string>('alloy')

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
        const data = await resp.json()
        setVoices((data.voices || []).map((v: any) => ({ id: v.id, name: v.name })))
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (!visionId) return
    ;(async () => {
      await refreshStatus()
      setLoading(false)
    })()
  }, [visionId])

  async function refreshStatus() {
    if (!visionId) return
    const resp = await fetch(`/api/audio/generate?visionId=${visionId}`, { cache: 'no-store' })
    const data = await resp.json()
    const mapped = (data.tracks || []).map((t: any) => ({
      sectionKey: t.section_key,
      title: formatTitle(t.section_key),
      url: t.audio_url || '',
      status: t.status,
      createdAt: t.created_at,
      voiceId: t.voice_id,
      contentHash: t.content_hash,
    }))
    setTracks(mapped)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      // Fetch vision text sections (simplified: get latest version content)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load structure for 14 sections from existing vision record
      const { data: vv } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()

      const sections = buildFourteenSectionsFromVision(vv)

      const resp = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId, sections, voice }),
      })
      const data = await resp.json()
      await refreshStatus()
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-12">
        <div className="text-center py-12 bg-gradient-to-br from-[#199D67] to-[#14B8A6] rounded-3xl">
          <h1 className="text-5xl font-bold mb-4 text-white">Life Vision Audio</h1>
          <p className="text-xl text-white/90 mb-6">Generate premium, narrated audio of your vision</p>
          <div className="flex items-center justify-center gap-3">
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="px-4 py-2 rounded-full bg-black/30 text-white border-2 border-white/30"
            >
              {voices.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <GradientButton gradient="brand" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Audio'}
            </GradientButton>
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Spinner variant="primary" /></div>
          ) : (
            <AudioPlayer tracks={tracks} />
          )}
        </div>
      </Container>
    </PageLayout>
  )
}

function buildFourteenSectionsFromVision(v: any): { sectionKey: string; text: string }[] {
  if (!v) return []
  const sections: { sectionKey: string; text: string }[] = []
  const map: { key: string; field?: string }[] = [
    { key: 'meta_intro', field: 'forward' },
    { key: 'health', field: 'health' },
    { key: 'family', field: 'family' },
    { key: 'romance', field: 'romance' },
    { key: 'social', field: 'social' },
    { key: 'fun', field: 'fun' },
    { key: 'travel', field: 'travel' },
    { key: 'home', field: 'home' },
    { key: 'money', field: 'money' },
    { key: 'business', field: 'business' },
    { key: 'possessions', field: 'possessions' },
    { key: 'giving', field: 'giving' },
    { key: 'spirituality', field: 'spirituality' },
    { key: 'meta_outro', field: 'conclusion' },
  ]
  for (const m of map) {
    const raw = m.field ? (v[m.field] as string) : ''
    const text = (raw || '').trim()
    if (!text) continue
    sections.push({ sectionKey: m.key, text })
  }
  return sections
}

function formatTitle(sectionKey: string): string {
  return sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}


