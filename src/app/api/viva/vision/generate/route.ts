import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import { ensureForwardWarmup } from '@/lib/viva/seed-forward'
import { computeCompletion } from '@/lib/viva/compute-completion'

const Body = z.object({
  userId: z.string().uuid(),
  category: z.enum([
    'forward','fun','travel','home','family','romance','health',
    'money','business','social','possessions','giving','spirituality','conclusion'
  ]),
  inputs: z.object({
    wants: z.array(z.string()).default([]),
    not_wants: z.array(z.string()).default([]),
    vent: z.string().default('')
  })
})

export async function POST(req: NextRequest) {
  const body = Body.parse(await req.json())
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1) Load latest draft or create one
  const { data: latest, error: e1 } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', body.userId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  let draft = latest as any
  if (!draft || draft.status !== 'draft') {
    const nextVersion = (latest?.version_number ?? 0) + 1
    const { data: created, error: e2 } = await supabase
      .from('vision_versions')
      .insert({
        user_id: body.userId,
        version_number: nextVersion,
        title: `Life I Choose v${nextVersion}`,
        status: 'draft',
        completion_percent: 0,
        ai_generated: true
      })
      .select('*')
      .single()
    if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })
    draft = created!
    
    // Seed the forward warmup
    await ensureForwardWarmup(supabase, draft.id)
  }

  // 2) Call GPT-4 to compose the chunk
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const sys = [
    'You are VIVA, a warm best-friend coach.',
    'Compose a believable present-tense, first-person paragraph for the category.',
    'Positive framing, avoid negations, include one simple ritual/rhythm, ≤150 words.',
    'Return JSON: { reflection, paragraph, clarifier }'
  ].join(' ')

  const user = JSON.stringify({
    category: body.category,
    wants: body.inputs.wants,
    not_wants: body.inputs.not_wants,
    vent: body.inputs.vent
  })

  const tasks = `
  1) Mirror one specific feeling or theme in 1 short sentence.
  2) Flip contrast → direction of desire (no leaps).
  3) Write one polished paragraph (≤150 words), present-tense, first-person.
  4) Add one 1-line clarifier question.
  `

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
      { role: 'user', content: tasks }
    ]
  })

  const { reflection = '', paragraph = '', clarifier = '' } =
    JSON.parse(resp.choices[0]?.message?.content || '{}')

  // 3) Write this category field + recompute completion
  const updatePayload: any = { [body.category]: paragraph }
  const { data: updated, error: e3 } = await supabase
    .from('vision_versions')
    .update(updatePayload)
    .eq('id', draft.id)
    .select('*')
    .single()

  if (e3) return NextResponse.json({ error: e3.message }, { status: 400 })

  const completion_percent = computeCompletion(updated as any)
  if (completion_percent !== (updated as any).completion_percent) {
    await supabase
      .from('vision_versions')
      .update({ completion_percent })
      .eq('id', draft.id)
  }

  return NextResponse.json({
    reflection,
    paragraph,
    clarifier,
    vision: { id: draft.id, version_number: draft.version_number, completion_percent }
  })
}
