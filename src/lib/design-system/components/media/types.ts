export interface AudioTrack {
  id: string
  title: string
  artist: string
  duration: number // in seconds
  url: string
  thumbnail?: string
  variant?: string // Optional: 'sleep', 'meditation', 'energy' for background mixing
}
