import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import {
  listAdminWalkthroughs,
  sanitizeWalkthroughOverrides,
  WALKTHROUGH_OVERRIDES_SOURCE,
  WALKTHROUGH_SOURCE,
  type WalkthroughOverrides,
} from '@/lib/life-activation/walkthroughs'

const OVERRIDES_PATH = path.join(process.cwd(), WALKTHROUGH_OVERRIDES_SOURCE)
const SNAPSHOT_INBOX_DIR = path.join(process.cwd(), 'public/walkthroughs/inbox')

async function listSnapshotInbox(): Promise<string[]> {
  try {
    const names = await fs.readdir(SNAPSHOT_INBOX_DIR)
    return names
      .filter((name) => name !== '.gitkeep' && !name.startsWith('.'))
      .map((name) => `/walkthroughs/inbox/${name}`)
  } catch {
    return []
  }
}

async function readOverridesFromDisk(): Promise<WalkthroughOverrides> {
  try {
    const raw = await fs.readFile(OVERRIDES_PATH, 'utf8')
    return sanitizeWalkthroughOverrides(JSON.parse(raw))
  } catch {
    return {}
  }
}

async function payload(overrides: WalkthroughOverrides) {
  return {
    sourceFile: WALKTHROUGH_SOURCE,
    overridesFile: WALKTHROUGH_OVERRIDES_SOURCE,
    snapshotsInboxDir: 'public/walkthroughs/inbox',
    persistNote:
      'Saves write walkthrough-overrides.json in this repo. Commit that file to ship the copy. Local Next.js picks it up after a refresh; production needs a deploy. Drop versioning screenshots in public/walkthroughs/inbox — they stay unassigned until you attach them here or tell me the step id.',
    overrides,
    inbox: await listSnapshotInbox(),
    walkthroughs: listAdminWalkthroughs(overrides),
  }
}

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  return NextResponse.json(await payload(await readOverridesFromDisk()))
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({}))
  const overrides = sanitizeWalkthroughOverrides(body.overrides)

  try {
    await fs.writeFile(OVERRIDES_PATH, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to write overrides'
    return NextResponse.json(
      {
        error:
          'Could not write walkthrough-overrides.json. Edit that file locally, then commit and deploy.',
        detail: message,
      },
      { status: 500 },
    )
  }

  return NextResponse.json(await payload(overrides))
}
