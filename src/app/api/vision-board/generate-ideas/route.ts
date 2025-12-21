import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const VISION_BOARD_IDEAS_SYSTEM_PROMPT = `You are VIVA, the VibrationFit AI assistant. Generate exactly 3 vision board items per category based on the user's Life Vision.

CRITICAL RULES:
1. Each item MUST be a JSON object with "name" and "description" fields
2. Name: 2-5 words, natural and descriptive (like "Beach Sunset Scene" or "Mountain Lake View")
3. Description: 1-2 sentences describing the visual scene or object (like "A serene beach at sunset with crystal blue water and white sand.")
4. NO PEOPLE in any suggestions - AI image generation struggles with people. Focus on places, objects, nature, symbols, architecture, and abstract concepts.
5. Use second person ("you", "your") when referencing the user's vision
6. Be specific and visual - describe what they would SEE on the vision board
7. Return flat JSON structure with category names as keys

CORRECT FORMAT:
{
  "Fun": [
    {"name": "Beach Sunset Scene", "description": "A beautiful tropical beach at sunset with turquoise water, white sand, and palm trees swaying in the breeze."},
    {"name": "Dance Studio Space", "description": "A bright, modern dance studio with wooden floors, mirrors, and colorful lights, empty and ready for movement."},
    {"name": "Gourmet Charcuterie Board", "description": "An elaborate spread of artisanal cheeses, exotic fruits, and gourmet crackers arranged beautifully on a wooden board."}
  ],
  "Health": [
    {"name": "Greek Statue Physique", "description": "A classical marble statue showing athletic muscle definition and strong, capable form."},
    {"name": "Sunrise Yoga Pose", "description": "A peaceful yoga mat positioned on a mountain overlook at sunrise, with meditation cushions nearby."},
    {"name": "Fresh Green Smoothie", "description": "A vibrant green smoothie in a clear glass, garnished with mint and fresh berries, glowing with health."}
  ]
}

INCORRECT (too verbose, includes people):
{
  "Fun": [
    {"name": "Capture the essence of freedom", "description": "Capture the essence of freedom and adventure by adding an image of a beautiful, sandy beach where you imagine yourself enjoying beach activities."}
  ]
}

Focus on objects, places, nature, symbols, and abstract visuals that represent their vision WITHOUT people in the scene.`

function buildVisionBoardIdeasPrompt(vision: any, selectedCategories: string[]): string {
  // Vision content is stored in individual columns, not a vision JSONB column
  // Only include selected life categories (exclude forward/conclusion)
  const sections = VISION_CATEGORIES
    .filter(cat => LIFE_CATEGORY_KEYS.includes(cat.key as any) && selectedCategories.includes(cat.key))
    .map(cat => {
      const categoryVision = vision[cat.key] // Read directly from column
      if (!categoryVision || !String(categoryVision).trim()) return null
      
      return `## ${cat.label}
**Their Vision:**
${categoryVision}

Generate 3 vision board item suggestions for ${cat.label.toLowerCase()}.`
    })
    .filter(Boolean)
    .join('\n\n')
  
  return `Generate vision board item suggestions based on this person's Life Vision:

${sections}

CRITICAL FORMAT REQUIREMENTS:
Each suggestion MUST be a JSON object with BOTH "name" AND "description" fields.

Example of CORRECT format:
{
  "Fun": [
    {"name": "Beach Sunset Scene", "description": "A beautiful tropical beach at sunset with turquoise water, white sand, and palm trees swaying in the breeze."},
    {"name": "Dance Studio Space", "description": "A bright, modern dance studio with wooden floors, mirrors, and colorful lights, empty and ready for movement."}
  ]
}

Rules:
- Name: 2-5 words, natural and descriptive
- Description: 1-2 sentences describing the visual scene
- NO PEOPLE in any scenes (focus on places, objects, nature, symbols)
- 3 suggestions per category
- Concrete, specific, and visual items aligned with their vision

Return your response as JSON in the specified format.`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Vision Board Ideas - Unauthorized:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { visionId, categories } = await request.json()

    console.log('🎨 Vision Board Ideas Generation Request:', { 
      userId: user.id, 
      visionId,
      categories: categories || 'all'
    })

    if (!visionId) {
      console.error('❌ Vision Board Ideas - Missing vision ID')
      return NextResponse.json({ error: 'Vision ID required' }, { status: 400 })
    }

    // Filter to only life categories (exclude forward/conclusion)
    const selectedCategories = categories && Array.isArray(categories) && categories.length > 0
      ? categories.filter(c => LIFE_CATEGORY_KEYS.includes(c))
      : LIFE_CATEGORY_KEYS

    // Fetch the vision (must be active)
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('household_id', null)
      .single()

    if (visionError || !vision) {
      console.error('❌ Vision Board Ideas - Vision not found:', visionError)
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Check if vision has content for selected categories
    const categoriesWithContent = selectedCategories.filter(key => {
      const value = vision[key]
      return value && String(value).trim().length > 0
    })
    
    console.log('✅ Vision fetched successfully:', { 
      visionId: vision.id,
      title: vision.title,
      selectedCategories: selectedCategories.length,
      categoriesWithContent: categoriesWithContent.length,
      categories: categoriesWithContent
    })
    
    if (categoriesWithContent.length === 0) {
      console.error('❌ Vision Board Ideas - No content in selected categories')
      return NextResponse.json({ 
        error: 'The selected categories are empty in your Life Vision. Please create or refine your vision first.' 
      }, { status: 400 })
    }

    console.log('✅ Vision has content, proceeding with VIVA generation')

    // Build prompt (only for selected categories)
    const prompt = buildVisionBoardIdeasPrompt(vision, selectedCategories)
    console.log('✅ Prompt built, length:', prompt.length)

    // Get VIVA tool config
    console.log('🔧 Fetching VIVA tool config for: vision_board_ideas')
    const toolConfig = await getAIToolConfig('vision_board_ideas')
    console.log('✅ Tool config loaded:', { model: toolConfig.model_name, temperature: toolConfig.temperature })

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    console.log('💰 Token estimate:', estimatedTokens)
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

    // Build OpenAI params
    const messages = [
      { role: 'system' as const, content: toolConfig.system_prompt || VISION_BOARD_IDEAS_SYSTEM_PROMPT },
      { role: 'user' as const, content: prompt }
    ]
    const openaiParams = buildOpenAIParams(toolConfig, messages)

    // Add response format for JSON
    const completion = await openai.chat.completions.create({
      ...openaiParams,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No suggestions generated')
    }

    console.log('📝 Raw VIVA response text (first 1000 chars):', responseText.substring(0, 1000))

    // Parse JSON response
    let parsedResponse
    try {
      const rawResponse = JSON.parse(responseText)
      console.log('✅ Parsed VIVA raw response:', {
        keys: Object.keys(rawResponse),
        firstCategoryData: rawResponse[Object.keys(rawResponse)[0]],
        structure: JSON.stringify(rawResponse).substring(0, 1000)
      })
      
      // Transform VIVA's flat format to our expected nested format
      // VIVA returns: { "Fun": [{item, description}], "Health": [...] }
      // We need: { suggestions: [{category, categoryLabel, suggestions: [{name, description}]}] }
      const suggestions = []
      
      for (const [categoryLabel, items] of Object.entries(rawResponse)) {
        // Find the category object to get the key
        const categoryObj = VISION_CATEGORIES.find(c => c.label === categoryLabel)
        if (categoryObj && Array.isArray(items)) {
          console.log(`Processing ${categoryLabel}:`, {
            itemsCount: items.length,
            firstItem: items[0],
            itemKeys: items[0] ? Object.keys(items[0]) : []
          })
          
          // Validate that VIVA returned proper {name, description} objects
          const transformedItems = items.map((item: any, index: number) => {
            console.log(`Transforming ${categoryLabel} item ${index + 1}:`, JSON.stringify(item))
            
            // CRITICAL: Both name and description must be present
            if (!item.name || !item.description) {
              console.error(`❌ INVALID ITEM in ${categoryLabel}:`, JSON.stringify(item))
              console.error('❌ Full VIVA response:', responseText)
              throw new Error(`VIVA returned incomplete data for ${categoryLabel}. Item ${index + 1} is missing ${!item.name ? 'name' : 'description'}. This is a VIVA formatting error - please try again.`)
            }
            
            // Validate that description is not just empty or the same as name
            if (item.description.trim().length < 10) {
              console.error(`❌ INVALID DESCRIPTION in ${categoryLabel}:`, JSON.stringify(item))
              throw new Error(`VIVA returned incomplete description for ${categoryLabel}. Please try again.`)
            }
            
            return {
              name: item.name.trim(),
              description: item.description.trim()
            }
          })
          
          suggestions.push({
            category: categoryObj.key,
            categoryLabel: categoryLabel,
            suggestions: transformedItems
          })
        }
      }
      
      parsedResponse = { suggestions }
      
      console.log('✅ Transformed suggestions:', {
        suggestionsCount: suggestions.length,
        categories: suggestions.map(s => s.category)
      })
    } catch (parseError) {
      console.error('Failed to parse VIVA response:', responseText)
      throw new Error('Invalid response format from VIVA')
    }

    // Track token usage
    if (completion.usage) {
      try {
        await trackTokenUsage({
          user_id: user.id,
          action_type: 'vision_board_ideas',
          model_used: toolConfig.model_name,
          tokens_used: completion.usage.total_tokens || 0,
          input_tokens: completion.usage.prompt_tokens || 0,
          output_tokens: completion.usage.completion_tokens || 0,
          actual_cost_cents: 0, // Will be calculated by trackTokenUsage
          openai_request_id: completion.id,
          openai_created: completion.created,
          system_fingerprint: completion.system_fingerprint,
          success: true,
          metadata: {
            vision_id: visionId,
            suggestions_count: parsedResponse.suggestions?.length || 0,
            categories: selectedCategories,
          },
        })
      } catch (trackingError) {
        console.error('Failed to track token usage:', trackingError)
      }
    }

    // Save to vision_board_ideas table
    try {
      const categoryType = selectedCategories.length === LIFE_CATEGORY_KEYS.length ? 'all' : selectedCategories.join(',')
      
      const { data: savedIdea, error: saveError } = await supabase
        .from('vision_board_ideas')
        .insert({
          user_id: user.id,
          vision_version_id: visionId,
          category: categoryType,
          model_used: toolConfig.model_name,
          tokens_used: completion.usage?.total_tokens || 0,
          suggestions: parsedResponse.suggestions || [],
          status: 'active',
        })
        .select()
        .single()

      if (saveError) {
        console.error('Failed to save vision board ideas:', saveError)
        // Don't fail the request, just log
      } else {
        console.log('✅ Vision board ideas saved to database:', savedIdea.id)
        
        // Add the idea ID to the response so frontend can track it
        if (parsedResponse.suggestions) {
          parsedResponse.suggestions = parsedResponse.suggestions.map((s: any) => ({
            ...s,
            ideaId: savedIdea.id
          }))
        }
      }
    } catch (saveError) {
      console.error('Error saving vision board ideas:', saveError)
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      suggestions: parsedResponse.suggestions || [],
      model: toolConfig.model_name,
    })

  } catch (error: any) {
    console.error('❌ VISION BOARD IDEAS GENERATION ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

