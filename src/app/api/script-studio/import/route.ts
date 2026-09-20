import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { importScript } from '@/lib/script-studio/import'

// This credential is scoped to append-only script imports, never general DB access.
export async function POST(request: Request) {
  const expected = process.env.SCRIPT_STUDIO_IMPORT_TOKEN
  if (!expected || expected.length < 32) return NextResponse.json({ error: 'Script import connection is not configured' }, { status: 503 })
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /i, '') || ''
  const a = Buffer.from(supplied)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return importScript(request, true)
}
