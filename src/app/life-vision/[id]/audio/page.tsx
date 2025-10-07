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

  // Poll status while there are processing tracks or while generating
  useEffect(() => {
    if (!visionId) return
    const hasProcessing = tracks.some(t => t.status === 'processing' || t.status === 'pending')
    if (!generating && !hasProcessing) return
    const id = setInterval(() => {
      refreshStatus().catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [visionId, generating, tracks])

  async function refreshStatus() {
    if (!visionId) return
    const resp = await fetch(`/api/audio/generate?visionId=${visionId}`, { cache: 'no-store' })
    const data = await resp.json()
  const mapped = (data.tracks || []).map((t: any) => ({
      sectionKey: t.section_key,
      title: prettySectionTitle(t.section_key),
      url: t.audio_url || '',
      status: t.status,
      createdAt: t.created_at,
      voiceId: t.voice_id,
      contentHash: t.content_hash,
    }))
    // Order by canonical life vision order
    const order = canonicalOrder()
    mapped.sort((a: any, b: any) => order.indexOf(a.sectionKey) - order.indexOf(b.sectionKey))
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
  const map = canonicalOrder().map((key) => ({ key, field: mapFieldForKey(key) }))
  for (const m of map) {
    const raw = m.field ? (v[m.field] as string) : ''
    const text = (raw || '').trim()
    if (!text) continue
    sections.push({ sectionKey: m.key, text })
  }
  return sections
}

function canonicalOrder(): string[] {
  return [
    'meta_intro',
    'health',
    'family',
    'romance',
    'social',
    'fun',
    'travel',
    'home',
    'money',
    'business',
    'possessions',
    'giving',
    'spirituality',
    'meta_outro',
  ]
}

function mapFieldForKey(key: string): string | undefined {
  const mapping: Record<string, string> = {
    meta_intro: 'forward',
    meta_outro: 'conclusion',
    health: 'health',
    family: 'family',
    romance: 'romance',
    social: 'social',
    fun: 'fun',
    travel: 'travel',
    home: 'home',
    money: 'money',
    business: 'business',
    possessions: 'possessions',
    giving: 'giving',
    spirituality: 'spirituality',
  }
  return mapping[key]
}

function prettySectionTitle(sectionKey: string): string {
  if (sectionKey === 'meta_intro') return 'Forward'
  if (sectionKey === 'meta_outro') return 'Conclusion'
  return sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}


