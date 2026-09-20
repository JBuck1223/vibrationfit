import { NextResponse } from 'next/server'
import { authorizeOps } from '@/lib/ops/auth'
import { buildVibrationFitSnapshot } from '@/lib/ops/snapshot'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const denied = authorizeOps(request)
  if (denied) return denied
  try {
    const snapshot = await buildVibrationFitSnapshot()
    return NextResponse.json(snapshot.health, { status: snapshot.health.ok ? 200 : 503 })
  } catch (err) {
    return NextResponse.json({ ok: false, notes: [err instanceof Error ? err.message : 'Failed'] }, { status: 500 })
  }
}
