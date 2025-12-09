/**
 * Reset Stuck Audio Generation Batches
 * 
 * Run this to reset batches that are stuck in "processing" or "pending" state
 * Usage: npx ts-node scripts/audio/reset-stuck-batches.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load from .env.local in project root
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetStuckBatches() {
  console.log('🔍 Checking for stuck batches...\n')

  // Find batches stuck in processing/pending (any age)
  const { data: stuckBatches, error } = await supabase
    .from('audio_generation_batches')
    .select('*')
    .in('status', ['processing', 'pending'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stuck batches:', error)
    return
  }

  if (!stuckBatches || stuckBatches.length === 0) {
    console.log('✅ No stuck batches found!')
    return
  }

  console.log(`Found ${stuckBatches.length} stuck batch(es):\n`)

  for (const batch of stuckBatches) {
    console.log(`📦 Batch ID: ${batch.id}`)
    console.log(`   Status: ${batch.status}`)
    console.log(`   Created: ${new Date(batch.created_at).toLocaleString()}`)
    console.log(`   Progress: ${batch.tracks_completed}/${batch.total_tracks_expected} completed, ${batch.tracks_failed} failed`)
    console.log(`   Voice: ${batch.voice_id}`)
    console.log(`   Variants: ${batch.variant_ids.join(', ')}`)
    console.log()

    // Reset to failed state
    const { error: updateError } = await supabase
      .from('audio_generation_batches')
      .update({
        status: 'failed',
        error_message: 'Batch stuck in processing - reset by admin script',
        completed_at: new Date().toISOString()
      })
      .eq('id', batch.id)

    if (updateError) {
      console.error(`   ❌ Failed to reset batch ${batch.id}:`, updateError)
    } else {
      console.log(`   ✅ Reset batch ${batch.id} to failed state`)
    }
    console.log()
  }

  console.log('\n✨ Done!')
}

resetStuckBatches().catch(console.error)

