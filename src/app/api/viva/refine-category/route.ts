// /src/app/api/viva/refine-category/route.ts
// One-shot refinement endpoint for individual categories
// Uses master-vision assembly rules and conversational context

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIToolConfig, buildOpenAIParams } from "@/lib/ai/database-config";
import OpenAI from "openai";
import {
  trackTokenUsage,
  validateTokenBalance,
  estimateTokensForText,
} from "@/lib/tokens/tracking";
import {
  flattenProfile,
  flattenAssessment,
  flattenAssessmentWithScores,
} from "@/lib/viva/prompt-flatteners";
import {
  MASTER_VISION_SHARED_SYSTEM_PROMPT,
  FIVE_PHASE_INSTRUCTIONS,
  FLOW_FLEXIBILITY_NOTE,
  STYLE_GUARDRAILS,
  MICRO_REWRITE_RULE,
} from "@/lib/viva/prompts/master-vision-prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge"; // Use Edge Runtime for faster cold starts

/**
 * ============================
 *   Request/Response Interfaces
 * ============================
 */
interface RefineCategoryRequest {
  visionId: string;
  category: string;
  currentRefinement?: string; // Optional - API will fetch if not provided
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  instructions?: string;
}

interface RefineCategoryResponse {
  success: boolean;
  refinedText?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
  };
  error?: string;
}

/**
 * ============================
 *   Build Refinement Prompt
 * ============================
 */
async function buildRefinementPrompt(
  request: RefineCategoryRequest,
  userId: string,
): Promise<string> {
  const { category, currentRefinement, conversationHistory, instructions } =
    request;

  // Get user data
  const supabase = await createClient();

  // Get vision context
  const { data: vision } = await supabase
    .from("vision_versions")
    .select("*")
    .eq("id", request.visionId)
    .eq("user_id", userId)
    .single();

  // Get profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get active assessment
  const { data: assessment } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  // Get category info
  const categoryMap: Record<string, string> = {
    forward: "Forward",
    fun: "Fun",
    health: "Health",
    travel: "Travel",
    love: "Love",
    family: "Family",
    social: "Social",
    home: "Home",
    work: "Work",
    money: "Money",
    stuff: "Stuff",
    giving: "Giving",
    spirituality: "Spirituality",
    conclusion: "Conclusion",
  };
  const categoryLabel = categoryMap[category] || category;

  // Build full vision context for cross-referencing
  let fullVisionContext = "";
  if (vision) {
    const allCategories = Object.entries({
      forward: vision.forward,
      fun: vision.fun,
      health: vision.health,
      travel: vision.travel,
      love: vision.love || vision.romance,
      family: vision.family,
      social: vision.social,
      home: vision.home,
      work: vision.work || vision.business,
      money: vision.money,
      stuff: vision.stuff || vision.possessions,
      giving: vision.giving,
      spirituality: vision.spirituality,
      conclusion: vision.conclusion,
    })
      .filter(([_, value]) => {
        // Ensure value is a string and not empty
        return typeof value === 'string' && value.trim().length > 0;
      })
      .map(
        ([key, content]) => {
          // Safely convert to string and truncate
          const contentStr = String(content || '');
          const truncated = contentStr.length > 400 
            ? contentStr.substring(0, 400) + '...' 
            : contentStr;
          return `## ${categoryMap[key] || key}\n${truncated}`;
        },
      )
      .join("\n\n");

    if (allCategories) {
      fullVisionContext = `\n\n**COMPLETE VISION CONTEXT (for cross-category connections):**\n\n${allCategories}\n\n`;
    }
  }

  // Build conversation summary
  const conversationContext =
    conversationHistory.length > 0
      ? `
**CONVERSATION CONTEXT (this is your refinement instructions):**
${conversationHistory.map((msg) => `${msg.role === "user" ? "User" : "VIVA"}: ${msg.content}`).join("\n\n")}
`
      : "";

  const additionalInstructions = instructions
    ? `
**ADDITIONAL INSTRUCTIONS:**
${instructions}
`
    : "";

  return `${MASTER_VISION_SHARED_SYSTEM_PROMPT}

${FIVE_PHASE_INSTRUCTIONS}
${FLOW_FLEXIBILITY_NOTE}
${STYLE_GUARDRAILS}

BACKGROUND CONTEXT (draw voice & specifics from here; current vision > conversation > profile > assessment):

${
  profile && Object.keys(profile).length > 0
    ? `PROFILE (flattened; use for facts, not phrasing):
${flattenProfile(profile)}
`
    : ""
}

${
  assessment
    ? `ASSESSMENT (compact; use specifics, never output scores):
${flattenAssessment(assessment)}
`
    : ""
}

**ORIGINAL USER INPUT — CONVERSATION CONTEXT (PRIMARY SOURCE FOR REFINEMENT):**
${conversationContext || "No conversation context provided."}

Use their conversation input to guide what changes to make. Their words in conversation indicate what they want improved or added.

**EXISTING VISION (for continuity, not copy):**
Study their current vision below. This is what we're refining - maintain their tone, phrasing, and patterns while elevating and improving.

${currentRefinement || "[No existing vision - this is unexpected]"}

${fullVisionContext}

CONTEXT USAGE RULES:
- Conversation = primary refinement guidance (what changes to make)
- Current vision = foundation to build upon (maintain 80%+ of their words)
- Profile & Assessment = factual specificity + color (names, roles, places, routines, preferences)
- Do NOT output scores or numeric values. Use them only to infer what matters most.
- Never copy field labels verbatim into the vision. Transform to natural first-person language.
- Prefer concrete details from profile/assessment to replace generic phrases.

FOUNDATIONAL PRINCIPLES - THE CORE PURPOSE:
1. **The basis of life is freedom** — This vision should help the member feel free.
2. **The purpose of life is joy** — Everything desired is about feeling better in the having of it.
3. **The result of life is expansion** — Reflect growth and expansion in this area.
4. **Activate freedom through reading** — The text itself should feel freeing.

**CRITICAL: LIFE IS INTERCONNECTED — WEAVE CATEGORIES TOGETHER**
This category doesn't exist in isolation. Use cross-category details naturally from their complete vision above (family ↔ work ↔ money ↔ home ↔ travel ↔ fun ↔ health, etc.).

${MICRO_REWRITE_RULE}

**YOUR TASK:**
Refine the **${categoryLabel}** vision section using:
- The 5-Phase Flow (energetic sequence, not rigid paragraphs)
- The narrative architecture layers (Who/What/Where/Why; Being/Doing/Receiving; Micro↔Macro; Contrast→Clarity→Celebration; Rhythmic Form)
- The conversation guidance (what changes to make)
- Their existing vision as foundation (maintain 80%+ of their words)
- Concrete specifics and cross-category weaving
- Flip any negatives to aligned positives
- No comparative language ("but/however/used to/will")

**STRUCTURE:**
Refine the ${categoryLabel} section following:
- Each section follows the 5 phases (energetic sequence, not rigid paragraphs)
- Include the Who/What/Where/Why mini-cycle inside each phase
- Ensure at least one sentence each of Being, Doing, and Receiving
- Include natural Micro↔Macro pulse across paragraphs
- Use specific details from ALL category inputs in their complete vision (not just this category)
- End with "Essence: …" (one present-tense feeling sentence; no comparison)

**CRITICAL REFINEMENT RULES:**
- This is a REFINEMENT, not a new creation from scratch
- The refined version MUST feel like an evolution of their existing vision above
- Keep 80%+ of their original words, phrases, and speech patterns
- Make it more powerful while keeping it recognizable as THEIRS
- Preserve the good parts, enhance the weak parts based on conversation guidance
- Honor their vibrational vocabulary - if they use specific phrasing, keep it

${additionalInstructions}

Output ONLY the refined vision text. No explanation, no meta-commentary, just the refined text itself.
`;
}

/**
 * ============================
 *   POST Handler
 * ============================
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    // Parse request
    const body: RefineCategoryRequest = await req.json();
    const {
      visionId,
      category,
      currentRefinement,
      conversationHistory,
      instructions,
    } = body;

    // Validate
    if (!visionId || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: visionId, category",
        },
        { status: 400 },
      );
    }

    // If no currentRefinement provided, fetch the original vision text
    let refinementToUse = currentRefinement || "";
    if (!refinementToUse) {
      const { data: fullVision } = await supabase
        .from("vision_versions")
        .select("*")
        .eq("id", visionId)
        .eq("user_id", user.id)
        .single();

      if (fullVision) {
        // Map category to vision field
        const fieldMap: Record<string, string> = {
          forward: "forward",
          fun: "fun",
          health: "health",
          travel: "travel",
          love: "love",
          family: "family",
          social: "social",
          home: "home",
          work: "work",
          money: "money",
          stuff: "stuff",
          giving: "giving",
          spirituality: "spirituality",
          conclusion: "conclusion",
        };

        // Handle legacy field names
        const actualField = fieldMap[category] || category;
        const legacyField =
          actualField === "love"
            ? "romance"
            : actualField === "work"
              ? "business"
              : actualField === "stuff"
                ? "possessions"
                : actualField;

        refinementToUse =
          fullVision[actualField as keyof typeof fullVision] ||
          fullVision[legacyField as keyof typeof fullVision] ||
          "";
      }
    }

    // Verify vision ownership
    const { data: vision } = await supabase
      .from("vision_versions")
      .select("user_id")
      .eq("id", visionId)
      .eq("user_id", user.id)
      .single();

    if (!vision) {
      return NextResponse.json(
        {
          success: false,
          error: "Vision not found or access denied",
        },
        { status: 404 },
      );
    }

    // Get AI tool config from database
    const toolConfig = await getAIToolConfig("vision_refinement");

    // Build prompt with the proper refinement text
    const bodyWithRefinement = {
      ...body,
      currentRefinement: refinementToUse,
    };
    const prompt = await buildRefinementPrompt(bodyWithRefinement, user.id);

    // Estimate tokens
    const tokenEstimate = estimateTokensForText(prompt, toolConfig.model_name);
    const maxTokens = Math.ceil(tokenEstimate * 1.5);

    // Check token balance
    const balanceCheck = await validateTokenBalance(user.id, tokenEstimate);
    if (balanceCheck) {
      return NextResponse.json(
        {
          success: false,
          error: balanceCheck.error,
        },
        { status: balanceCheck.status },
      );
    }

    // Build OpenAI params using database config
    const messages = [
      { role: "system" as const, content: MASTER_VISION_SHARED_SYSTEM_PROMPT },
      { role: "user" as const, content: prompt },
    ]
    const openaiParams = buildOpenAIParams(toolConfig, messages)

    // Call OpenAI
    const completion = await openai.chat.completions.create(openaiParams);

    const refinedText = completion.choices[0]?.message?.content?.trim();

    if (!refinedText) {
      return NextResponse.json(
        {
          success: false,
          error: "No refined text generated",
        },
        { status: 500 },
      );
    }

    // Track usage
    const usage = completion.usage;
    if (usage) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: "vision_refinement",
        model_used: toolConfig.model_name,
        tokens_used: usage.total_tokens,
        actual_cost_cents: 0, // Will be calculated
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        // OpenAI reconciliation fields
        openai_request_id: completion.id,
        openai_created: completion.created,
        system_fingerprint: completion.system_fingerprint,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      refinedText,
      usage: usage
        ? {
            inputTokens: usage.prompt_tokens,
            outputTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            costUsd: 0, // Calculate based on model pricing
          }
        : undefined,
    });
  } catch (error) {
    console.error("Refine category error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to refine category",
      },
      { status: 500 },
    );
  }
}
