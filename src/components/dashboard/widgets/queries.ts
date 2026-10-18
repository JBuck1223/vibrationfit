'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import type { CommitmentOccurrence } from '@/lib/map/types'
import type { AreaStatsResponse } from '@/app/api/area-stats/route'
import type { AreaSlug } from '@/hooks/useAreaStats'

/** YYYY-MM-DD for "now" in the member's timezone (falls back to browser tz). */
export function todayInTimezone(tz: string | null | undefined): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

export function relativeDay(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Today's MAP
// ---------------------------------------------------------------------------

export const todayOccurrencesKey = (date: string) =>
  [...keys.commitmentOccurrences, 'date', date] as const

export function useTodayOccurrences(date: string) {
  return useQuery({
    queryKey: todayOccurrencesKey(date),
    queryFn: async () => {
      await fetch('/api/map/occurrences/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const res = await fetch(`/api/map/occurrences?date=${date}`)
      if (!res.ok) return [] as CommitmentOccurrence[]
      const data = await res.json()
      return (data.occurrences || []) as CommitmentOccurrence[]
    },
  })
}

export function useHasActiveMap() {
  return useQuery({
    queryKey: [...keys.maps, 'has-active'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_maps')
        .select('id')
        .eq('is_active', true)
        .eq('is_draft', false)
        .limit(1)
        .maybeSingle()
      return Boolean(data)
    },
  })
}

// ---------------------------------------------------------------------------
// Daily Paper
// ---------------------------------------------------------------------------

export interface DailyPaperRow {
  id: string
  entry_date: string
  gratitude: string
  task_one: string
  task_two: string
  task_three: string
  fun_plan: string
}

export function useTodayDailyPaper(date: string) {
  return useQuery({
    queryKey: [...keys.dailyPapers, 'date', date],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('daily_papers')
        .select('id, entry_date, gratitude, task_one, task_two, task_three, fun_plan')
        .eq('entry_date', date)
        .maybeSingle()
      return (data as DailyPaperRow | null) ?? null
    },
  })
}

// ---------------------------------------------------------------------------
// Area stats (streaks)
// ---------------------------------------------------------------------------

export function useAreaStatsQuery(area: AreaSlug) {
  return useQuery({
    queryKey: [...keys.areaActivations, 'stats', area],
    queryFn: async () => {
      const res = await fetch(`/api/area-stats?area=${encodeURIComponent(area)}`)
      if (!res.ok) return null
      return (await res.json()) as AreaStatsResponse
    },
    staleTime: 60_000,
  })
}

// ---------------------------------------------------------------------------
// Listen
// ---------------------------------------------------------------------------

export interface ListenSource {
  kind: 'vision' | 'song' | 'story'
  id: string
  title: string
  subtitle: string
  href: string
  artwork?: string | null
  /** Already-resolved playable tracks (song) or a set id to expand (vision/story). */
  trackUrl?: string | null
  audioSetId?: string | null
  durationSeconds?: number | null
}

export function useListenSources() {
  return useQuery({
    queryKey: [...keys.audioSets, 'dashboard-listen'],
    queryFn: async (): Promise<ListenSource[]> => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return []

      const [visionRes, songRes, storyRes] = await Promise.all([
        supabase
          .from('vision_versions')
          .select('id, title, created_at')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('is_draft', false)
          .is('household_id', null)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('song_tracks')
          .select('id, title, mp3_url, cover_url, duration_ms, created_at, song_id, songs!inner(title)')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .not('mp3_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('stories')
          .select('id, title, audio_set_id, created_at')
          .eq('user_id', userId)
          .not('audio_set_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const sources: ListenSource[] = []

      if (visionRes.data) {
        const { data: set } = await supabase
          .from('audio_sets')
          .select('id, name, created_at')
          .eq('vision_id', visionRes.data.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        sources.push({
          kind: 'vision',
          id: visionRes.data.id,
          title: visionRes.data.title || 'The Life I Choose',
          subtitle: set ? set.name : 'No audio yet',
          href: '/audio',
          audioSetId: set?.id ?? null,
        })
      }

      if (songRes.data) {
        const song = songRes.data as unknown as {
          id: string
          title: string | null
          mp3_url: string
          cover_url: string | null
          duration_ms: number | null
          songs: { title: string | null } | { title: string | null }[] | null
        }
        const parent = Array.isArray(song.songs) ? song.songs[0] : song.songs
        sources.push({
          kind: 'song',
          id: song.id,
          title: song.title || parent?.title || 'Untitled song',
          subtitle: 'Latest song',
          href: '/audio/songs',
          artwork: song.cover_url,
          trackUrl: song.mp3_url,
          durationSeconds: song.duration_ms ? Math.round(song.duration_ms / 1000) : null,
        })
      }

      if (storyRes.data) {
        sources.push({
          kind: 'story',
          id: storyRes.data.id,
          title: storyRes.data.title || 'Untitled story',
          subtitle: 'Latest story',
          href: `/story/${storyRes.data.id}`,
          audioSetId: storyRes.data.audio_set_id,
        })
      }

      return sources
    },
  })
}

export interface PlayableTrack {
  id: string
  title: string
  url: string
  duration: number
  sectionKey: string
}

/** Load completed tracks for an audio set, ordered by the Life Vision canonical section order. */
export async function loadAudioSetTracks(audioSetId: string): Promise<PlayableTrack[]> {
  const supabase = createClient()
  const { data: set } = await supabase
    .from('audio_sets')
    .select('variant, metadata')
    .eq('id', audioSetId)
    .single()
  const combinedOnly = (set?.metadata as { output_format?: string } | null)?.output_format === 'combined'

  let query = supabase
    .from('audio_tracks')
    .select('id, section_key, audio_url, mixed_audio_url, mix_status, duration_seconds')
    .eq('audio_set_id', audioSetId)
    .eq('status', 'completed')
    .not('audio_url', 'is', null)
  if (combinedOnly) query = query.eq('section_key', 'full')
  const { data: tracks } = await query

  const order = ['forward', 'fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality', 'conclusion', 'full']
  const labels: Record<string, string> = {
    forward: 'Forward', fun: 'Fun', health: 'Health', travel: 'Travel', love: 'Love', family: 'Family',
    social: 'Social', home: 'Home', work: 'Work', money: 'Money', stuff: 'Stuff', giving: 'Giving',
    spirituality: 'Spirituality', conclusion: 'Conclusion', full: 'Full Life Vision',
  }
  const direct = set?.variant === 'standard' || set?.variant === 'personal'

  return (tracks ?? [])
    .map((t) => {
      const url = !direct && t.mixed_audio_url && t.mix_status === 'completed' ? t.mixed_audio_url : t.audio_url
      return {
        id: t.id,
        title: labels[t.section_key] || t.section_key,
        url: url || '',
        duration: typeof t.duration_seconds === 'number' && t.duration_seconds > 0 ? t.duration_seconds : 0,
        sectionKey: t.section_key,
      }
    })
    .filter((t) => t.url.length > 0)
    .sort((a, b) => {
      const ia = order.indexOf(a.sectionKey)
      const ib = order.indexOf(b.sectionKey)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
}

// ---------------------------------------------------------------------------
// VIVA
// ---------------------------------------------------------------------------

export function useLastVivaSession() {
  return useQuery({
    queryKey: [...keys.vivaConversations, 'dashboard-last'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('conversation_sessions')
        .select('id, title, preview_message, message_count, last_message_at, mode')
        .eq('mode', 'coach')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()
      return data as {
        id: string
        title: string | null
        preview_message: string | null
        message_count: number | null
        last_message_at: string | null
        mode: string
      } | null
    },
  })
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export function useRecentJournal(limit = 3) {
  return useQuery({
    queryKey: [...keys.journalEntries, 'dashboard-recent', limit],
    queryFn: async () => {
      const supabase = createClient()
      const [{ data, count }] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, title, content, date, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(limit),
      ])
      return {
        entries: (data ?? []) as { id: string; title: string | null; content: string | null; date: string; created_at: string }[],
        total: count ?? 0,
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Abundance
// ---------------------------------------------------------------------------

export function useAbundanceMonth(monthStart: string, monthEnd: string) {
  return useQuery({
    queryKey: [...keys.abundanceEvents, 'month', monthStart],
    queryFn: async () => {
      const supabase = createClient()
      const [{ data: month }, { data: last }] = await Promise.all([
        supabase
          .from('abundance_events')
          .select('value_type, amount')
          .gte('date', monthStart)
          .lte('date', monthEnd),
        supabase
          .from('abundance_events')
          .select('note, amount, value_type, date, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      const rows = (month ?? []) as { value_type: 'money' | 'value'; amount: number | null }[]
      const moneyTotal = rows
        .filter((r) => r.value_type === 'money')
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      const valueCount = rows.filter((r) => r.value_type === 'value').length
      return {
        moneyTotal,
        moneyCount: rows.length - valueCount,
        valueCount,
        last: last as { note: string; amount: number | null; value_type: string; date: string; created_at: string } | null,
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Manifestations
// ---------------------------------------------------------------------------

export function useManifestationsSnapshot() {
  return useQuery({
    queryKey: [...keys.manifestations, 'dashboard-snapshot'],
    queryFn: async () => {
      const supabase = createClient()
      const [{ data: active }, { count: actualized }, { count: activeCount }] = await Promise.all([
        supabase
          .from('manifestations')
          .select('id, name, image_url, created_at')
          .eq('status', 'active')
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('manifestations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'actualized'),
        supabase
          .from('manifestations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
      ])
      return {
        items: (active ?? []) as { id: string; name: string | null; image_url: string; created_at: string }[],
        actualized: actualized ?? 0,
        active: activeCount ?? 0,
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Vibe Tribe
// ---------------------------------------------------------------------------

export interface VibePostPreview {
  id: string
  content: string | null
  vibe_tag: string | null
  hearts_count: number
  comments_count: number
  created_at: string
  user: { id: string; full_name: string | null; profile_picture_url: string | null } | null
}

export function useLatestVibePosts(limit = 2) {
  return useQuery({
    queryKey: [...keys.vibePosts, 'dashboard-latest', limit],
    queryFn: async () => {
      const res = await fetch(`/api/vibe-tribe/posts?limit=${limit}`)
      if (!res.ok) return [] as VibePostPreview[]
      const data = await res.json()
      return (data.posts ?? []) as VibePostPreview[]
    },
  })
}

// ---------------------------------------------------------------------------
// Alignment Gym
// ---------------------------------------------------------------------------

export interface GymSessionPreview {
  id: string
  title: string
  scheduled_at: string
  status: string
  recording_url: string | null
}

export function useGymSessions() {
  return useQuery({
    queryKey: [...keys.videoSessions, 'dashboard-gym'],
    queryFn: async () => {
      const supabase = createClient()
      const nowIso = new Date().toISOString()
      const [{ data: upcoming }, { data: recent }] = await Promise.all([
        supabase
          .from('video_sessions')
          .select('id, title, scheduled_at, status, recording_url')
          .or('session_type.eq.alignment_gym,title.ilike.%alignment gym%')
          .eq('hidden_from_users', false)
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('video_sessions')
          .select('id, title, scheduled_at, status, recording_url')
          .or('session_type.eq.alignment_gym,title.ilike.%alignment gym%')
          .eq('hidden_from_users', false)
          .lt('scheduled_at', nowIso)
          .not('recording_url', 'is', null)
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      return {
        next: (upcoming as GymSessionPreview | null) ?? null,
        lastReplay: (recent as GymSessionPreview | null) ?? null,
      }
    },
    staleTime: 60_000,
  })
}

// ---------------------------------------------------------------------------
// Life Vision
// ---------------------------------------------------------------------------

export function useActiveVisionSummary() {
  return useQuery({
    queryKey: [...keys.visions, 'dashboard-summary'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: vision } = await supabase
        .from('vision_versions')
        .select('id, title, created_at, updated_at, has_audio')
        .eq('is_active', true)
        .eq('is_draft', false)
        .is('household_id', null)
        .limit(1)
        .maybeSingle()
      if (!vision) return null

      const [{ data: lastRefinement }, { count: versionCount }] = await Promise.all([
        supabase
          .from('vision_refinements')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('vision_versions')
          .select('id', { count: 'exact', head: true })
          .is('household_id', null),
      ])

      return {
        id: vision.id as string,
        title: (vision.title as string | null) || 'The Life I Choose',
        committedAt: vision.created_at as string,
        hasAudio: Boolean(vision.has_audio),
        lastRefinedAt: (lastRefinement?.created_at as string | null) ?? null,
        versionCount: versionCount ?? 1,
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

export interface ReferralSummary {
  referralLink: string
  stats: { totalClicks: number; emailSignups: number; paidConversions: number; secondDegreeSignups: number }
  paidReferrals: { id: string; referred_email: string | null; created_at: string }[]
}

export function useReferralSummary() {
  return useQuery({
    queryKey: keys.referralDashboard,
    queryFn: async () => {
      let res = await fetch('/api/referral/dashboard')
      if (res.status === 404) {
        // Members are auto-enrolled; this covers anyone created before that trigger.
        await fetch('/api/referral/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        res = await fetch('/api/referral/dashboard')
      }
      if (!res.ok) return null
      return (await res.json()) as ReferralSummary
    },
  })
}
