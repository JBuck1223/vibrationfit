// /src/app/api/viva/refine-category-weave/route.ts
// New structured refinement endpoint with Refine + Weave blocks
// Uses buildIndividualCategoryPrompt with refinement and weave blocks

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIToolConfig, buildOpenAIParams } from "@/lib/ai/database-config";
import OpenAI from "openai";
import {
  trackTokenUsage,
  validateTokenBalance,
  estimateTokensForText,
} from "@/lib/tokens/tracking";
import {
  buildRefineCategoryPrompt,
  buildRefinementBlock,
  buildWeaveBlock,
  RefinementInputs,
  WeaveInputs,
} from "@/lib/viva/prompts/refine-category-vision-prompt";
import { getVisionCategory, isValidVisionCategory, VisionCategoryKey } from "@/lib/design-system/vision-categories";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

interface RefineCategoryWeaveRequest {
  visionId: string;
  category: string;
  currentVisionText: string; // The existing vision text for this category
  refinement?: RefinementInputs;
  weave?: WeaveInputs;
  perspective?: 'singular' | 'plural';
}

/**
 * POST /api/viva/refine-category-weave
 * 
 * Streaming endpoint for structured refinement with Refine + Weave blocks
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Get authenticated user
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Authentication required" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Parse request
        const body: RefineCategoryWeaveRequest = await req.json();
        const {
          visionId,
          category,
          currentVisionText,
          refinement,
          weave,
          perspective = 'singular'
        } = body;

        // Validate
        if (!visionId || !category || !currentVisionText) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Missing required fields: visionId, category, currentVisionText" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Validate category
        const categoryKey = category as VisionCategoryKey;
        if (!isValidVisionCategory(categoryKey)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Invalid category" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Verify vision ownership
        const { data: vision } = await supabase
          .from("vision_versions")
          .select("*")
          .eq("id", visionId)
          .eq("user_id", user.id)
          .single();

        if (!vision) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Vision not found or access denied" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Get category info
        const categoryInfo = getVisionCategory(categoryKey);
        if (!categoryInfo) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Invalid category" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Build the vision text with refinement and weave blocks appended
        let visionTextWithBlocks = currentVisionText;

        // Append refinement block if provided
        if (refinement && Object.keys(refinement).length > 0) {
          const refinementBlock = buildRefinementBlock(refinement);
          visionTextWithBlocks += refinementBlock;
        }

        // Append weave block if enabled
        if (weave?.enabled) {
          // Get other category texts for weaving
          if (weave.enabled && vision) {
            const otherCategories: Record<string, string> = {};
            
            // Get all categories except the current one
            const allCategories = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality'] as const;
            
            for (const cat of allCategories) {
              if (cat !== categoryKey && vision[cat]) {
                const text = vision[cat] as string;
                if (text && text.trim()) {
                  otherCategories[cat] = text;
                }
              }
            }
            
            const weaveBlock = buildWeaveBlock({
              ...weave,
              otherCategories
            });
            visionTextWithBlocks += weaveBlock;
          }
        }

        // Build the refinement prompt using dedicated refine prompt
        const prompt = buildRefineCategoryPrompt(
          categoryKey,
          categoryInfo.label,
          visionTextWithBlocks,
          perspective
        );

        // Get AI tool config
        const toolConfig = await getAIToolConfig("vision_refinement");

        // Estimate tokens
        const tokenEstimate = estimateTokensForText(prompt, toolConfig.model_name);

        // Check token balance
        const balanceCheck = await validateTokenBalance(user.id, tokenEstimate);
        if (balanceCheck) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: balanceCheck.error })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Build OpenAI params (disable JSON mode for plain text output)
        const messages = [
          { role: "user" as const, content: prompt }
        ];
        const openaiParams = buildOpenAIParams(toolConfig, messages, {
          forceNoJsonMode: true // We want plain text vision output, not JSON
        });

        // Call OpenAI with streaming
        const completion = await openai.chat.completions.create({
          ...openaiParams,
          stream: true,
        });

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;

        // Stream the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullText += content;
            outputTokens++;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }

        // Estimate input tokens (we don't get them from streaming)
        inputTokens = tokenEstimate;

        // Track usage
        await trackTokenUsage({
          user_id: user.id,
          action_type: "vision_refinement",
          model_used: toolConfig.model_name,
          tokens_used: inputTokens + outputTokens,
          actual_cost_cents: 0, // Will be calculated
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          success: true,
        });

        // Save refinement to database
        let refinementId: string | null = null;
        try {
          const { data: refinementData } = await supabase
            .from('vision_refinements')
            .insert({
              user_id: user.id,
              vision_id: visionId,
              category: categoryKey,
              input_text: currentVisionText,
              output_text: fullText,
              refinement_inputs: refinement || {},
              weave_settings: weave || { enabled: false },
              applied: false,
            })
            .select('id')
            .single();
          
          refinementId = refinementData?.id || null;
        } catch (saveError) {
          console.error('Error saving refinement to database:', saveError);
          // Don't fail the request if saving refinement fails
        }

        // Send completion event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ 
              done: true, 
              refinementId,
              usage: { 
                inputTokens, 
                outputTokens, 
                totalTokens: inputTokens + outputTokens 
              } 
            })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        console.error("Refine category weave error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ 
              error: error instanceof Error ? error.message : "Failed to refine category" 
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

