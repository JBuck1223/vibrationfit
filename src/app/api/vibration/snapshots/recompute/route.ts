import { NextResponse } from 'next/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'
import { recomputeEmotionalSnapshot } from '@/lib/vibration/service'

const REQUIRED_SECRET = process.env.CRON_SNAPSHOT_SECRET

function ensureEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured.')
  }
}

interface SnapshotTarget {
  user_id: string
  category: string
}

export async function POST(request: Request) {
  try {
    if (REQUIRED_SECRET) {
      const providedSecret = request.headers.get('x-cron-secret')
      if (providedSecret !== REQUIRED_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    ensureEnv()

    const supabaseAdmin: SupabaseClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: snapshotRows, error: snapshotError }, { data: eventRows, error: eventError }] = await Promise.all([
      supabaseAdmin.from('emotional_snapshots').select('user_id, category'),
      supabaseAdmin
        .from('vibrational_events')
        .select('user_id, category')
        .gte('created_at', sixtyDaysAgo),
    ])

    if (snapshotError) {
      throw snapshotError
    }
    if (eventError) {
      throw eventError
    }

    const targets = new Map<string, SnapshotTarget>()

    ;(snapshotRows || []).forEach((row) => {
      if (row.user_id && row.category) {
        targets.set(`${row.user_id}:${row.category}`, { user_id: row.user_id, category: row.category })
      }
    })

    ;(eventRows || []).forEach((row) => {
      if (row.user_id && row.category) {
        targets.set(`${row.user_id}:${row.category}`, { user_id: row.user_id, category: row.category })
      }
    })

    let successCount = 0
    const failures: Array<{ user_id: string; category: string; error: string }> = []

    for (const target of targets.values()) {
      try {
        await recomputeEmotionalSnapshot(target.user_id, target.category, supabaseAdmin)
        successCount += 1
      } catch (error) {
        console.error('Snapshot recompute failure:', error)
        failures.push({
          user_id: target.user_id,
          category: target.category,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      processed: targets.size,
      successful: successCount,
      failed: failures.length,
      failures,
    })
  } catch (error) {
    console.error('Snapshot recompute cron error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

