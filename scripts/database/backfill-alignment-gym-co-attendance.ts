#!/usr/bin/env tsx
/**
 * Backfill co-host Alignment Gym attendance for Jordan and Vanessa.
 *
 * Usage:
 *   npx tsx scripts/database/backfill-alignment-gym-co-attendance.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
  const { backfillAlignmentGymCoHostAttendance } = await import(
    '../../src/lib/video/alignment-gym-co-attendance'
  )

  const result = await backfillAlignmentGymCoHostAttendance()

  console.log('Alignment Gym co-host backfill complete:')
  console.log(`  Sessions checked: ${result.sessionsChecked}`)
  console.log(`  Sessions mirrored: ${result.mirroredSessions}`)
  console.log(`  Vanessa backfilled: ${result.vanessaBackfilled}`)
  console.log(`  Jordan backfilled: ${result.jordanBackfilled}`)
}

main().catch(error => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
