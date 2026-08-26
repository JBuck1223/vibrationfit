import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'
import {
  LIFE_EXPLORER_CDN,
  objectExists,
  putLifeExplorerObject,
  speakCacheKey,
} from '@/lib/life-explorer/media-s3'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const pending = new Map<string, Promise<string>>()

function cachedUrl(key: string) {
  return `${LIFE_EXPLORER_CDN}/${key}`
}

async function speakOne(text: string): Promise<string> {
  const clipped = text.trim().slice(0, 400)
  if (!clipped) throw new Error('empty')
  const key = speakCacheKey(clipped)
  if (await objectExists(key)) return cachedUrl(key)

  const inflight = pending.get(key)
  if (inflight) return inflight

  const job = (async () => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('Audio is not configured')
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        speed: 0.85,
        input: clipped,
        format: 'mp3',
      }),
    })
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Speak failed: ${response.status} ${errText}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    return putLifeExplorerObject(key, buffer, 'audio/mpeg')
  })()

  pending.set(key, job)
  try {
    return await job
  } finally {
    pending.delete(key)
  }
}

/** POST { texts: string[] } → { clips: Record<string, string> } */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const raw: unknown[] = Array.isArray(body.texts) ? body.texts : body.text ? [body.text] : []
  const texts = [...new Set(raw.map((t) => String(t || '').trim()).filter(Boolean))].slice(0, 40)
  if (!texts.length) {
    return NextResponse.json({ error: 'texts required' }, { status: 400 })
  }

  const chars = texts.reduce((n, t) => n + t.length, 0)
  const tokenValidation = await validateTokenBalance(user.id, Math.max(20, chars), supabase)
  if (tokenValidation) {
    return NextResponse.json({ error: tokenValidation.error }, { status: tokenValidation.status })
  }

  const clips: Record<string, string> = {}
  const billed: string[] = []
  for (const text of texts) {
    const key = speakCacheKey(text)
    if (await objectExists(key)) {
      clips[text] = cachedUrl(key)
    } else {
      billed.push(text)
      clips[text] = await speakOne(text)
    }
  }

  const billedChars = billed.reduce((n, t) => n + t.length, 0)
  if (billedChars > 0) {
    await trackTokenUsage(
      {
        user_id: user.id,
        action_type: 'audio_generation',
        model_used: 'tts-1',
        tokens_used: billedChars,
        input_tokens: billedChars,
        output_tokens: 0,
        success: true,
        metadata: { kind: 'life_explorer_speak', count: billed.length },
      },
      supabase
    )
  }

  return NextResponse.json({ clips })
}
