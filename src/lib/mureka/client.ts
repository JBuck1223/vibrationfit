/**
 * Mureka API Client
 *
 * Thin wrapper around the Mureka music generation REST API.
 * Handles song generation, task polling, and stem separation.
 */

import type {
  MurekaGenerateRequest,
  MurekaGenerateResponse,
  MurekaQueryResponse,
  MurekaStemRequest,
  MurekaStemResponse,
  MurekaFileUploadRequest,
  MurekaFileUploadResponse,
  MurekaError,
} from './types'

const MUREKA_API_URL = process.env.MUREKA_API_URL || 'https://api.mureka.ai'
const MUREKA_API_KEY = process.env.MUREKA_API_KEY

class MurekaClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = MUREKA_API_URL
    this.apiKey = MUREKA_API_KEY || ''
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('MUREKA_API_KEY is not configured')
    }

    const url = `${this.baseUrl}${path}`
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      let errorMessage = `Mureka API error: ${response.status}`
      try {
        const errorData = await response.json() as MurekaError
        errorMessage = errorData.error?.message || errorMessage
      } catch {
        // Use status-based message
      }
      throw new Error(errorMessage)
    }

    return response.json() as Promise<T>
  }

  /**
   * Upload a file for use as reference track, vocal, melody, etc.
   * For reference tracks: must be exactly 30 seconds (excess is trimmed).
   * Accepts either a URL or a Buffer.
   */
  async uploadFile(params: MurekaFileUploadRequest): Promise<MurekaFileUploadResponse> {
    if (!this.apiKey) {
      throw new Error('MUREKA_API_KEY is not configured')
    }

    const url = `${this.baseUrl}/v1/files/upload`

    if (params.url) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: params.url, purpose: params.purpose }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
        throw new Error((err as MurekaError).error?.message || `Upload failed: ${response.status}`)
      }
      return response.json() as Promise<MurekaFileUploadResponse>
    }

    throw new Error('File buffer upload not yet implemented — use URL-based upload')
  }

  /**
   * Generate a song from lyrics and style prompt.
   * Optionally pass reference_id for style-matching a reference track.
   * Returns a task ID for polling.
   */
  async generateSong(params: MurekaGenerateRequest): Promise<MurekaGenerateResponse> {
    const body: Record<string, unknown> = {
      lyrics: params.lyrics,
      prompt: params.prompt,
      model: params.model || 'auto',
    }
    if (params.reference_id) body.reference_id = params.reference_id
    if (params.vocal_id) body.vocal_id = params.vocal_id

    return this.request<MurekaGenerateResponse>('POST', '/v1/song/generate', body)
  }

  /**
   * Poll a generation task for completion.
   * Returns song results when status is 'completed'.
   */
  async queryTask(taskId: string): Promise<MurekaQueryResponse> {
    return this.request<MurekaQueryResponse>('GET', `/v1/song/query/${taskId}`)
  }

  /**
   * Separate a song into stems (vocals, instruments, etc.).
   * Returns a ZIP download URL.
   */
  async generateStems(params: MurekaStemRequest): Promise<MurekaStemResponse> {
    return this.request<MurekaStemResponse>('POST', '/v1/song/stem', {
      url: params.url,
    })
  }
}

export const mureka = new MurekaClient()
export type { MurekaClient }
