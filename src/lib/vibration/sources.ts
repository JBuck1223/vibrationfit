import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VibrationalEventSource } from '@/lib/types/vibration'
import {
  DEFAULT_VIBRATIONAL_SOURCE_CONFIGS,
  getDefaultSourceConfig,
} from './sourceTypes'

type MaybeSource = VibrationalEventSource | null

type SourceCacheKey = 'all'

const sourceCache = new Map<SourceCacheKey, VibrationalEventSource[]>()

function normalizeSourceRecord(record: VibrationalEventSource): VibrationalEventSource {
  return {
    ...record,
    field_map: record.field_map ?? {},
    analyzer_config: record.analyzer_config ?? {},
  }
}

function coerceDefaultSource(sourceKey: string): VibrationalEventSource | null {
  const fallback = getDefaultSourceConfig(sourceKey)
  if (!fallback) return null

  return {
    id: `default-${fallback.source_key}`,
    source_key: fallback.source_key,
    label: fallback.label,
    description: fallback.description ?? null,
    enabled: fallback.enabled ?? true,
    default_category: fallback.default_category ?? null,
    field_map: fallback.field_map ?? {},
    analyzer_config: fallback.analyzer_config ?? {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
}

async function loadSourcesFromDatabase(
  client?: SupabaseClient
): Promise<VibrationalEventSource[]> {
  try {
    const supabase = client ?? (await createClient())
    const { data, error } = await supabase
      .from('vibrational_event_sources')
      .select('*')
      .order('source_key', { ascending: true })

    if (error) {
      console.error('Failed to load vibrational event sources:', error)
      return []
    }

    return (data ?? []).map(normalizeSourceRecord)
  } catch (error) {
    console.error('Unexpected error loading vibrational event sources:', error)
    return []
  }
}

export async function fetchVibrationalEventSources(
  client?: SupabaseClient
): Promise<VibrationalEventSource[]> {
  if (sourceCache.has('all')) {
    return sourceCache.get('all') as VibrationalEventSource[]
  }

  const dbSources = await loadSourcesFromDatabase(client)

  const fallbackSources = DEFAULT_VIBRATIONAL_SOURCE_CONFIGS.map((config) =>
    coerceDefaultSource(config.source_key)
  ).filter(Boolean) as VibrationalEventSource[]

  const merged = new Map<string, VibrationalEventSource>()

  for (const source of fallbackSources) {
    merged.set(source.source_key, source)
  }

  for (const source of dbSources) {
    merged.set(source.source_key, source)
  }

  const result = Array.from(merged.values())
  sourceCache.set('all', result)
  return result
}

export async function getVibrationalEventSource(
  sourceKey: string,
  client?: SupabaseClient
): Promise<MaybeSource> {
  const sources = await fetchVibrationalEventSources(client)
  return sources.find((source) => source.source_key === sourceKey) ?? null
}

export async function ensureVibrationalSourceEnabled(
  sourceKey: string,
  client?: SupabaseClient
): Promise<VibrationalEventSource> {
  const source = await getVibrationalEventSource(sourceKey, client)
  if (!source) {
    const fallback = coerceDefaultSource(sourceKey)
    if (fallback) {
      return fallback
    }
    throw new Error(`Vibrational source "${sourceKey}" is not registered.`)
  }

  if (!source.enabled) {
    throw new Error(`Vibrational source "${sourceKey}" is currently disabled.`)
  }

  return source
}

export function clearVibrationalSourceCache() {
  sourceCache.clear()
}
