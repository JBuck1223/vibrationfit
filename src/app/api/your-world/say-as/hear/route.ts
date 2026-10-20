/**
 * POST { name, say_as, voice? } -> audio/mpeg
 * Short preview so the member can hear how a voice will say the name.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIVoices } from '@/lib/services/audioService'
import { applySayAsEntries } from '@/lib/your-world/say-as'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const name = String(body?.name || '').trim().slice(0, 60)
  const sayAs = String(body?.say_as || '').trim().slice(0, 80)
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const voices = getOpenAIVoices().map((v) => v.id as string)
  const voice = voices.includes(body?.voice) ? body.voice : 'alloy'
  const input = applySayAsEntries(`${name}.`, sayAs ? [{ name, say_as: sayAs }] : [])

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Audio is not configured' }, { status: 500 })

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice, input, format: 'mp3', speed: 0.9 }),
  })
  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    console.error('[SayAs] hear failed:', response.status, errText)
    return NextResponse.json({ error: 'Could not play that right now' }, { status: 502 })
  }

  return new NextResponse(Buffer.from(await response.arrayBuffer()), {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  })
}
