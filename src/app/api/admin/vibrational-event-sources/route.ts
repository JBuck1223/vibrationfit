import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchVibrationalEventSources, clearVibrationalSourceCache } from '@/lib/vibration/sources'

const ADMIN_EMAILS = ['buckinghambliss@gmail.com', 'admin@vibrationfit.com']

function isAdminUser(user: { email?: string | null; user_metadata?: Record<string, any> } | null): boolean {
  if (!user) return false
  const email = user.email?.toLowerCase() || ''
  if (ADMIN_EMAILS.includes(email)) return true
  return Boolean(user.user_metadata?.is_admin)
}

async function getAdminSupabase() {
  // First verify the user is an admin using regular client
  const userSupabase = await createClient()
  const {
    data: { user },
    error,
  } = await userSupabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null }
  }

  if (!isAdminUser(user)) {
    return { supabase: null, user: null }
  }

  // Return admin client for database operations
  const adminSupabase = createAdminClient()
  return { supabase: adminSupabase, user }
}

export async function GET() {
  try {
    const { supabase, user } = await getAdminSupabase()

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sources = await fetchVibrationalEventSources(supabase)
    const payload = sources.map((source) => ({
      ...source,
      origin: source.id.startsWith('default-') ? 'default' : 'database',
    }))

    return NextResponse.json({ sources: payload })
  } catch (error) {
    console.error('Failed to load vibrational event sources:', error)
    return NextResponse.json({ error: 'Failed to load vibrational event sources' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAdminSupabase()

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const {
      source_key: sourceKey,
      label,
      description,
      enabled = true,
      default_category: defaultCategory = null,
      field_map: fieldMap = {},
      analyzer_config: analyzerConfig = {},
    } = body

    if (!sourceKey || typeof sourceKey !== 'string') {
      return NextResponse.json({ error: 'source_key is required' }, { status: 400 })
    }

    if (!label || typeof label !== 'string') {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }

    if (typeof fieldMap !== 'object' || Array.isArray(fieldMap)) {
      return NextResponse.json({ error: 'field_map must be an object' }, { status: 400 })
    }

    if (typeof analyzerConfig !== 'object' || Array.isArray(analyzerConfig)) {
      return NextResponse.json({ error: 'analyzer_config must be an object' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vibrational_event_sources')
      .insert({
        source_key: sourceKey,
        label,
        description: description ?? null,
        enabled: Boolean(enabled),
        default_category: defaultCategory ?? null,
        field_map: fieldMap ?? {},
        analyzer_config: analyzerConfig ?? {},
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Failed to create vibrational event source:', error)
      
      // Check for duplicate key constraint violation
      if (error?.code === '23505') {
        return NextResponse.json(
          { error: `A source with key "${sourceKey}" already exists. Please use a unique source_key or edit the existing one.` },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: error?.message || 'Failed to create source' },
        { status: 500 }
      )
    }

    clearVibrationalSourceCache()

    return NextResponse.json({ source: data })
  } catch (error) {
    console.error('Failed to create vibrational event source:', error)
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
  }
}
