import { NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { spawn } from 'child_process'

export const maxDuration = 120

function probeDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      url,
    ])

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })

    const timeout = setTimeout(() => {
      proc.kill('SIGKILL')
      resolve(null)
    }, 15_000)

    proc.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        console.warn(`[sync-durations] ffprobe failed for ${url}: ${stderr.slice(-200)}`)
        resolve(null)
        return
      }
      try {
        const info = JSON.parse(stdout)
        const dur = parseFloat(info?.format?.duration)
        resolve(isFinite(dur) && dur > 0 ? Math.round(dur) : null)
      } catch {
        resolve(null)
      }
    })

    proc.on('error', () => {
      clearTimeout(timeout)
      resolve(null)
    })
  })
}

export async function POST() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = createAdminClient()

  const { data: tracks, error: fetchErr } = await admin
    .from('music_catalog')
    .select('id, title, preview_url, duration_seconds')
    .eq('is_active', true)
    .not('preview_url', 'is', null)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const missing = (tracks || []).filter(
    (t) => !t.duration_seconds || t.duration_seconds <= 0
  )

  if (missing.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All tracks already have durations',
      updated: 0,
      total: tracks?.length ?? 0,
    })
  }

  console.log(`[sync-durations] Probing ${missing.length} tracks for duration...`)

  const results: { id: string; title: string; duration: number | null }[] = []

  for (const track of missing) {
    const dur = await probeDuration(track.preview_url)
    results.push({ id: track.id, title: track.title, duration: dur })

    if (dur !== null) {
      const { error: updateErr } = await admin
        .from('music_catalog')
        .update({
          duration_seconds: dur,
          updated_at: new Date().toISOString(),
        })
        .eq('id', track.id)

      if (updateErr) {
        console.warn(`[sync-durations] Failed to update "${track.title}": ${updateErr.message}`)
      } else {
        console.log(`[sync-durations] "${track.title}" → ${dur}s`)
      }
    } else {
      console.warn(`[sync-durations] Could not probe "${track.title}"`)
    }
  }

  const updated = results.filter((r) => r.duration !== null).length
  const failed = results.filter((r) => r.duration === null)

  return NextResponse.json({
    success: true,
    updated,
    skipped: failed.length,
    total: tracks?.length ?? 0,
    ...(failed.length > 0 && {
      failed: failed.map((f) => ({ id: f.id, title: f.title })),
    }),
  })
}
