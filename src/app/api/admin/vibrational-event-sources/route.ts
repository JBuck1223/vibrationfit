import { NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { fetchVibrationalEventSources, clearVibrationalSourceCache } from '@/lib/vibration/sources'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()
    const sources = await fetchVibrationalEventSources(adminClient)
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
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
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

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
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
