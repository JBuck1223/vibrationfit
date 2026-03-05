import { createOpenAI } from '@ai-sdk/openai'
import OpenAI from 'openai'

export const VISION_MODEL = 'gemini-2.5-pro'

export const gateway = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
})

export const gatewayClient = new OpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
})
