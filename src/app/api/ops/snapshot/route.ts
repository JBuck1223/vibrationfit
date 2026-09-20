import { NextResponse } from 'next/server'
import { authorizeOps } from '@/lib/ops/auth'
import { buildVibrationFitSnapshot } from '@/lib/ops/snapshot'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const denied = authorizeOps(request)
  if (denied) return denied
  try {
    return NextResponse.json(await buildVibrationFitSnapshot())
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
