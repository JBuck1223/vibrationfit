import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createIdea, deleteIdea, listIdeas, setIdeaApplied } from '@/lib/seo/ideas'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const access = await verifyAdminAccess()
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })
  try {
    const path = request.nextUrl.searchParams.get('path') ?? undefined
    return NextResponse.json({ ideas: await listIdeas(path) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load ideas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const access = await verifyAdminAccess()
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })
  try {
    const body = await request.json()
    if (typeof body?.path !== 'string' || typeof body?.transcript !== 'string') {
      return NextResponse.json({ error: 'path and transcript are required' }, { status: 400 })
    }
    const idea = await createIdea({
      path: body.path,
      transcript: body.transcript,
      source: body.source === 'typed' ? 'typed' : 'voice',
      audioSeconds: typeof body.audioSeconds === 'number' ? body.audioSeconds : null,
      userId: access.user.id,
    })
    return NextResponse.json({ idea }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save idea' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const access = await verifyAdminAccess()
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })
  try {
    const body = await request.json()
    if (typeof body?.id !== 'string') return NextResponse.json({ error: 'id is required' }, { status: 400 })
    return NextResponse.json({ idea: await setIdeaApplied(body.id, Boolean(body.applied)) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update idea' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const access = await verifyAdminAccess()
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  try {
    await deleteIdea(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete idea' }, { status: 500 })
  }
}
