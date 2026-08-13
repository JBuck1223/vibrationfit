import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gatewayClient } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ProposedSticky {
  statement: string
  kind: 'know' | 'wonder' | 'learned'
  confidence: 'high' | 'medium' | 'low'
  cleaned?: string | null
}

const SYSTEM_PROMPT = `You read photos of a child's physical Wonder Wall — sticky notes arranged under three headers: WHAT I KNOW, WHAT I WONDER, WHAT I LEARNED.

Rules (absolute):
- Transcribe each sticky note's EXACT words, including invented spelling. If spelling is invented, also give a cleaned version in "cleaned"; otherwise cleaned = null.
- NEVER invent stickies. Only transcribe what is visibly written.
- Assign "kind" from the header the sticky sits under (know / wonder / learned). If the layout is unclear, infer from wording (questions → wonder) and lower the confidence.
- Unreadable stickies: include them with statement "(unreadable)" and confidence "low" so the parent knows one was skipped.
- The child's language is sacred: no rephrasing, no grammar fixes in "statement".

Return ONLY a JSON object (no markdown fences): { "stickies": [{ "statement": string, "kind": "know"|"wonder"|"learned", "confidence": "high"|"medium"|"low", "cleaned": string|null }] }`

function parseStickies(content: string): ProposedSticky[] {
  const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  let parsed: { stickies?: ProposedSticky[] }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Vision model returned no JSON')
    parsed = JSON.parse(match[0])
  }
  return (parsed.stickies || []).filter(
    (s) =>
      typeof s.statement === 'string' &&
      s.statement.trim() &&
      ['know', 'wonder', 'learned'].includes(s.kind)
  )
}

/**
 * Snap the Wall — vision proposes stickies. Prefer image_data_url (base64)
 * so the model never has to fetch a private CDN URL. photo_url alone is a
 * fallback. Do NOT use response_format with multimodal gateway calls.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.expedition_id || (!body.image_data_url && !body.photo_url)) {
    return NextResponse.json(
      { error: 'expedition_id and image_data_url (or photo_url) required' },
      { status: 400 }
    )
  }

  const imageUrl: string = body.image_data_url || body.photo_url
  if (typeof imageUrl !== 'string' || imageUrl.length < 32) {
    return NextResponse.json({ error: 'Invalid image payload' }, { status: 400 })
  }
  if (/\.(heic|heif)(\?|$)/i.test(imageUrl) && !imageUrl.startsWith('data:')) {
    return NextResponse.json(
      {
        error:
          'This photo is still HEIC. Convert failed — try again, or set iPhone Camera → Formats → Most Compatible.',
      },
      { status: 400 }
    )
  }

  try {
    const model = 'openai/gpt-4o'
    const completion = await gatewayClient.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Read every sticky note on this Wonder Wall photo and propose items for parent review. Reply with JSON only.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from vision model')

    const stickies = parseStickies(content)

    await trackTokenUsage(
      {
        user_id: user.id,
        action_type: 'life_explorer_wall_photo',
        model_used: model.replace(/^openai\//, ''),
        tokens_used:
          (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0),
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0,
        openai_request_id: completion.id,
        success: true,
        metadata: { expedition_id: body.expedition_id },
      },
      supabase
    )

    return NextResponse.json({ stickies })
  } catch (err) {
    console.error('le wall photo extraction failed', err)
    const message = err instanceof Error ? err.message : 'Extraction failed'
    const friendly = /invalid input|unsupported|could not process|download/i.test(message)
      ? 'Could not read that photo. Try a clearer, well-lit shot of the stickies (JPEG works best).'
      : message
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
