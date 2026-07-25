import { createOpenAI } from '@ai-sdk/openai'
import OpenAI from 'openai'

export const VISION_MODEL = 'gemini-2.5-pro'

export const GATEWAY_BASE_URL = 'https://ai-gateway.vercel.sh/v1'

export const gateway = createOpenAI({
  baseURL: GATEWAY_BASE_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
})

export const gatewayClient = new OpenAI({
  baseURL: GATEWAY_BASE_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
})

/**
 * Extract the Vercel AI Gateway generation id from an AI SDK result
 * (generateText / streamText onFinish event / generateObject).
 *
 * The gateway surfaces it via providerMetadata.gateway.generationId; for the
 * OpenAI-compatible client it is the chat completion `id`. Storing it in
 * token_usage.provider_request_id lets the reconciliation cron fetch the
 * exact billed cost for the request from GET /v1/generation.
 */
export function gatewayGenerationId(result: unknown): string | undefined {
  const r = result as {
    providerMetadata?: { gateway?: { generationId?: string } }
    response?: { id?: string }
  } | undefined
  return r?.providerMetadata?.gateway?.generationId || r?.response?.id
}
