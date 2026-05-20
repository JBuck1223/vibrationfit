/**
 * Mureka API Types
 *
 * TypeScript interfaces for the Mureka music generation REST API.
 * API base: https://api.mureka.ai
 */

export interface MurekaGenerateRequest {
  lyrics: string
  prompt?: string
  model?: 'auto' | 'V9' | 'V8' | 'O2' | 'V7.6' | 'V7.5'
  reference_id?: string
  vocal_id?: string
}

export type MurekaFilePurpose =
  | 'reference'
  | 'vocal'
  | 'melody'
  | 'instrumental'
  | 'voice'
  | 'audio'
  | 'remix'
  | 'soundtrack'

export interface MurekaFileUploadRequest {
  url?: string
  file?: Buffer
  purpose: MurekaFilePurpose
}

export interface MurekaFileUploadResponse {
  id: string
  purpose: string
  filename?: string
  created_at: number
  trace_id: string
}

export interface MurekaGenerateResponse {
  id: string
  created_at: number
  model: string
  status: 'preparing' | 'generating' | 'completed' | 'failed'
  trace_id: string
}

export interface MurekaSongResult {
  id: string
  url: string
  flac_url?: string
  wav_url?: string
  duration: number
  lyrics_sections?: {
    section_type: string
    start?: number
    end?: number
    lines?: {
      start: number
      end: number
      text: string
      words?: { start: number; end: number; text: string }[]
    }[]
  }[]
}

export interface MurekaQueryResponse {
  id: string
  status: 'preparing' | 'generating' | 'completed' | 'succeeded' | 'failed'
  songs?: MurekaSongResult[]
  choices?: MurekaSongResult[]
  error?: string
  trace_id: string
}

export interface MurekaStemRequest {
  url: string
}

export interface MurekaStemResponse {
  zip_url: string
  trace_id: string
}

export interface MurekaLyricsRequest {
  prompt?: string
}

export interface MurekaLyricsResponse {
  lyrics: string
  trace_id?: string
}

export interface MurekaError {
  error: {
    message: string
  }
  trace_id: string
}
