import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import {
  isWalkthroughId,
  sanitizeWalkthroughOverrides,
  WALKTHROUGH_OVERRIDES_SOURCE,
  getWalkthrough,
} from '@/lib/life-activation/walkthroughs'

const OVERRIDES_PATH = path.join(process.cwd(), WALKTHROUGH_OVERRIDES_SOURCE)
const SNAPSHOT_DIR = path.join(process.cwd(), 'public/walkthroughs')
const INBOX_DIR = path.join(SNAPSHOT_DIR, 'inbox')
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

function sanitizeFileBase(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'snapshot'
}

async function readOverrides() {
  try {
    const raw = await fs.readFile(OVERRIDES_PATH, 'utf8')
    return sanitizeWalkthroughOverrides(JSON.parse(raw))
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File required' }, { status: 400 })
  }

  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Use png, jpg, webp, or gif' }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Snapshot must be under 8MB' }, { status: 400 })
  }

  const walkthroughId = typeof form.get('walkthroughId') === 'string' ? String(form.get('walkthroughId')) : ''
  const stepId = typeof form.get('stepId') === 'string' ? String(form.get('stepId')) : ''
  const attach = isWalkthroughId(walkthroughId) && Boolean(stepId)
  if (attach) {
    const def = getWalkthrough(walkthroughId)
    if (!def?.steps.some((step) => step.id === stepId)) {
      return NextResponse.json({ error: 'Unknown walk-through step' }, { status: 400 })
    }
  }

  const base = attach ? `${walkthroughId}--${stepId}` : sanitizeFileBase(file.name)
  const destDir = attach ? SNAPSHOT_DIR : INBOX_DIR
  const destName = `${base}${ext}`
  const destPath = path.join(destDir, destName)
  const publicUrl = attach ? `/walkthroughs/${destName}` : `/walkthroughs/inbox/${destName}`

  try {
    await fs.mkdir(destDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(destPath, buffer)

    if (attach) {
      const overrides = await readOverrides()
      const bucket = { ...overrides[walkthroughId] }
      bucket[stepId] = { ...bucket[stepId], snapshot: publicUrl }
      overrides[walkthroughId] = bucket
      await fs.writeFile(OVERRIDES_PATH, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save snapshot'
    return NextResponse.json(
      {
        error: 'Could not write the snapshot in this repo. Drop the file in public/walkthroughs/inbox instead.',
        detail: message,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ url: publicUrl, attached: attach })
}
