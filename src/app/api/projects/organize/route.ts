import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { flattenProfile, flattenProfileStories } from '@/lib/viva/prompt-flatteners'
import { PROJECT_ORGANIZE_SYSTEM_PROMPT, buildProjectOrganizePrompt } from '@/lib/viva/prompts'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { brainDump } = await request.json()

    if (!brainDump?.trim()) {
      return NextResponse.json({ error: 'Brain dump text is required' }, { status: 400 })
    }

    // Load tool config
    const toolConfig = await getAIToolConfig('project_organize')

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(brainDump, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error, tokensRemaining: tokenValidation.tokensRemaining },
        { status: tokenValidation.status }
      )
    }

    // Fetch context in parallel: vision, profile, existing projects
    const [visionResult, profileResult, existingProjectsResult] = await Promise.all([
      supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('household_id', null)
        .single(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('projects')
        .select('id, title, life_categories, project_tasks(id)')
        .eq('created_by', user.id)
        .eq('status', 'active'),
    ])

    // Build vision context from category columns
    let visionContext = ''
    if (visionResult.data) {
      const vision = visionResult.data
      const sections = LIFE_CATEGORY_KEYS
        .map(key => {
          const value = vision[key]
          if (!value || !String(value).trim()) return null
          return `### ${key}\n${String(value).slice(0, 400)}`
        })
        .filter(Boolean)
      visionContext = sections.join('\n\n')
    }

    // Build profile context
    let profileContext = ''
    if (profileResult.data) {
      const profile = profileResult.data
      profileContext = flattenProfile(profile, 50)
      const stories = flattenProfileStories(profile)
      if (stories.trim()) {
        profileContext += '\n\n' + stories
      }
    }

    // Build existing projects list
    const existingProjects = (existingProjectsResult.data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      task_count: (p.project_tasks || []).length,
      life_categories: p.life_categories || [],
    }))

    // Build prompt
    const prompt = buildProjectOrganizePrompt(brainDump, visionContext, profileContext, existingProjects)

    // Call OpenAI
    const messages = [
      { role: 'system', content: PROJECT_ORGANIZE_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]
    const params = buildOpenAIParams(toolConfig, messages)
    const completion = await openai.chat.completions.create(params)

    const responseText = completion.choices[0]?.message?.content || '{}'

    // Parse JSON response
    let organized
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      organized = JSON.parse(cleaned)
    } catch {
      organized = { projects: [], merge_into_existing: [], unassigned: [] }
    }

    // Ensure expected shape
    if (!Array.isArray(organized.projects)) organized.projects = []
    if (!Array.isArray(organized.merge_into_existing)) organized.merge_into_existing = []
    if (!Array.isArray(organized.unassigned)) organized.unassigned = []

    // Track token usage
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'project_organize',
      model_used: toolConfig.model_name,
      tokens_used: completion.usage?.total_tokens || 0,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      success: true,
      metadata: { brain_dump_length: brainDump.length, projects_suggested: organized.projects.length },
    }, supabase)

    return NextResponse.json({
      success: true,
      organized,
      model: toolConfig.model_name,
    })
  } catch (error) {
    console.error('Error in project organize:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
