// app/api/life-vision/master/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModelConfig } from '@/lib/ai/config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildMasterVisionPrompt, MASTER_VISION_SHARED_SYSTEM_PROMPT } from '@/lib/viva/prompts'
// ENHANCED V3: Import richness computation
import { computeCategoryRichness } from '@/lib/viva/text-metrics'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * ============================
 *   Route Handler
 * ============================
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categorySummaries, categoryTranscripts = {}, profile, assessment, activeVision = null } = await request.json()

    if (!categorySummaries || Object.keys(categorySummaries).length === 0) {
      return NextResponse.json({ error: 'Category summaries are required' }, { status: 400 })
    }

    // Build the prompt
    const prompt = buildMasterVisionPrompt(
      categorySummaries,
      categoryTranscripts || {},
      profile || {},
      assessment || {},
      activeVision || null
    )

    // Get admin-approved AI model config
    const aiConfig = getAIModelConfig('LIFE_VISION_MASTER_ASSEMBLY')

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, aiConfig.model)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return NextResponse.json(
        {
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        },
        { status: tokenValidation.status }
      )
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: aiConfig.systemPrompt || MASTER_VISION_SHARED_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
    })

    const fullOutput = completion.choices[0]?.message?.content

    if (!fullOutput) {
      throw new Error('No output generated')
    }

    // Parse the output - split markdown and JSON
    const jsonMarker = '---JSON---'
    const jsonIndex = fullOutput.indexOf(jsonMarker)

    let markdown = ''
    let json: any = {}

    if (jsonIndex !== -1) {
      markdown = fullOutput.substring(0, jsonIndex).trim()
      const jsonString = fullOutput.substring(jsonIndex + jsonMarker.length).trim()

      try {
        json = JSON.parse(jsonString)
      } catch (e) {
        console.error('Failed to parse JSON, extracting categories from markdown:', e)
        // Fallback: extract categories from markdown
        json = extractCategoriesFromMarkdown(markdown)
      }
    } else {
      // No JSON marker, treat entire output as markdown
      markdown = fullOutput
      json = extractCategoriesFromMarkdown(markdown)
    }

    // ENHANCED V3: Compute per-category richness metadata
    const categoryLabels: Record<string, string> = {
      fun: 'Fun',
      health: 'Health',
      travel: 'Travel',
      love: 'Love',
      family: 'Family',
      social: 'Social',
      home: 'Home',
      work: 'Work',
      money: 'Money',
      stuff: 'Stuff',
      giving: 'Giving',
      spirituality: 'Spirituality'
    }

    const richnessMetadata: Record<string, any> = {}
    for (const [categoryKey, categoryLabel] of Object.entries(categoryLabels)) {
      const transcript = categoryTranscripts[categoryKey] || ''
      const summary = categorySummaries[categoryKey] || ''
      const existingVision = activeVision?.[categoryKey] || ''
      
      const richness = computeCategoryRichness(transcript, summary, existingVision)
      richnessMetadata[categoryKey] = richness
    }

    console.log('[Master Vision V3] Computed richness metadata for', Object.keys(richnessMetadata).length, 'categories')

    // Track token usage
    if (completion.usage) {
      try {
        await trackTokenUsage({
          user_id: user.id,
          action_type: 'life_vision_master_assembly',
          model_used: aiConfig.model,
          tokens_used: completion.usage.total_tokens || 0,
          input_tokens: completion.usage.prompt_tokens || 0,
          output_tokens: completion.usage.completion_tokens || 0,
          actual_cost_cents: 0,
          // OpenAI reconciliation fields
          openai_request_id: completion.id,
          openai_created: completion.created,
          system_fingerprint: completion.system_fingerprint,
          success: true,
          metadata: {
            categories_count: Object.keys(categorySummaries).length,
            markdown_length: markdown.length,
            has_profile: !!profile,
            has_assessment: !!assessment,
            total_input_chars: Object.values(richnessMetadata).reduce((sum: number, r: any) => sum + r.inputChars, 0),
            average_density: Object.values(richnessMetadata).reduce((acc: any[], r: any) => [...acc, r.density], [] as string[]).join(','),
          },
        })
      } catch (trackingError) {
        console.error('Failed to track token usage:', trackingError)
      }
    }

    return NextResponse.json({
      markdown,
      json,
      model: aiConfig.model,
      // ENHANCED V3: Include richness metadata in response
      richnessMetadata
    })

  } catch (err) {
    console.error('Master vision error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate master vision' },
      { status: 500 }
    )
  }
}

/**
 * ============================
 *   Markdown → JSON Fallback
 * ============================
 */

function extractCategoriesFromMarkdown(markdown: string): any {
  const categories: Record<string, string> = {}

  // Split by ## headings
  const sections = markdown.split(/##\s+/)

  sections.forEach(section => {
    const lines = section.trim().split('\n')
    const rawTitle = lines[0]?.trim()
    const title = rawTitle?.toLowerCase().replace(/^the\s+/i, '')

    if (title && [
      'forward', 'fun', 'health', 'travel', 'love', 'romance',
      'family', 'social', 'home', 'work', 'business', 'money',
      'stuff', 'possessions', 'giving', 'spirituality', 'conclusion'
    ].includes(title)) {
      const content = lines.slice(1).join('\n').trim()
      // Map legacy names to canonical keys
      let key = title
      if (title === 'romance') key = 'love'
      else if (title === 'business') key = 'work'
      else if (title === 'possessions') key = 'stuff'
      categories[key] = content
    }
  })

  // prefer the configured model label for meta
  const aiConfig = getAIModelConfig('LIFE_VISION_MASTER_ASSEMBLY')

  return {
    ...categories,
    meta: {
      model: aiConfig.model,
      created_at_iso: new Date().toISOString(),
      summary_style: 'present-tense vibrational activation',
      notes: 'extracted from markdown'
    }
  }
}