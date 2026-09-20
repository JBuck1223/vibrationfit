import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import {
  SNAPSHOT_ABOUT_SYSTEM_PROMPT,
  buildSnapshotAboutPrompt,
  formatSnapshotProfileContext,
  formatSnapshotVisionContext,
} from '@/lib/viva/prompts/snapshot-about-prompt'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function toGatewayModel(name: string) {
  if (name.includes('/')) return name
  if (name.toLowerCase().includes('gemini')) return `google/${name}`
  return `openai/${name}`
}

function cleanAbout(raw: string): string {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/g, '').trim()
  }
  return text.slice(0, 500).trim()
}

async function loadProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: account } = await supabase
    .from('user_accounts')
    .select('first_name, last_name, full_name')
    .eq('id', userId)
    .maybeSingle()

  const { data: activeProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: latestProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Prefer the latest row when it is newer than the committed active profile,
  // so recent (including draft) edits still reach the About.
  let profile = activeProfile || latestProfile || null
  let usedDraft = false
  if (activeProfile && latestProfile && latestProfile.id !== activeProfile.id) {
    const latestAt = latestProfile.updated_at ? new Date(latestProfile.updated_at).getTime() : 0
    const activeAt = activeProfile.updated_at ? new Date(activeProfile.updated_at).getTime() : 0
    if (latestAt > activeAt) {
      profile = latestProfile
      usedDraft = !!latestProfile.is_draft
    }
  } else if (!activeProfile && latestProfile) {
    usedDraft = !!latestProfile.is_draft
  }

  if (profile && account) {
    profile = {
      ...profile,
      first_name: account.first_name ?? profile.first_name,
      last_name: account.last_name ?? profile.last_name,
    }
  }

  return {
    account,
    profile,
    usedDraft,
  }
}

async function loadActiveVision(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: activeVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeVision) return activeVision

  const { data: completeVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (completeVision) return completeVision

  const { data: latestVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return latestVision || null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const existingAbout = typeof body.existingAbout === 'string' ? body.existingAbout : null

    const [{ account, profile, usedDraft }, vision] = await Promise.all([
      loadProfile(supabase, user.id),
      loadActiveVision(supabase, user.id),
    ])

    const profileContext = formatSnapshotProfileContext(profile)
    const visionContext = formatSnapshotVisionContext(vision, LIFE_CATEGORY_KEYS)

    if (!profileContext && !visionContext) {
      return NextResponse.json(
        { error: 'Add some profile or life vision details first, then VIVA can write your About.' },
        { status: 422 }
      )
    }

    const name = account?.first_name || profile?.first_name || account?.full_name || null
    const userPrompt = buildSnapshotAboutPrompt({
      name,
      profileContext,
      visionContext,
      existingAbout,
    })

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('prompt_suggestions')
    } catch {
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const estimatedTokens = estimateTokensForText(
      `${SNAPSHOT_ABOUT_SYSTEM_PROMPT}\n\n${userPrompt}`,
      toolConfig.model_name
    )
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    if (tokenValidation) {
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining,
      }, { status: tokenValidation.status })
    }

    const result = await generateText({
      model: gateway(toGatewayModel(toolConfig.model_name)),
      system: SNAPSHOT_ABOUT_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
    })

    const aboutMe = cleanAbout(result.text || '')
    if (!aboutMe) {
      return NextResponse.json({ error: 'VIVA did not return an About. Try again.' }, { status: 500 })
    }

    if (result.usage) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'prompt_suggestions',
        model_used: toolConfig.model_name,
        tokens_used: result.usage.totalTokens || 0,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        success: true,
        metadata: { helper: 'snapshot_about', used_draft_profile: usedDraft },
      }, supabase).catch((err) => console.error('[Snapshot About] Token tracking error:', err))
    }

    return NextResponse.json({
      about_me: aboutMe,
      sources: {
        profile: !!profileContext,
        vision: !!visionContext,
        usedDraft,
      },
    })
  } catch (error: any) {
    console.error('[Snapshot About] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate About' },
      { status: 500 }
    )
  }
}
