// /src/lib/jobs/update-activity-metrics.ts
// Background job to calculate user activity metrics

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserMetrics {
  user_id: string
  profile_completion_percent: number
  vision_count: number
  vision_refinement_count: number
  audio_generated_count: number
  journal_entry_count: number
  vision_board_image_count: number
  last_login_at: string | null
  total_logins: number
  days_since_last_login: number | null
  s3_file_count: number
  total_storage_mb: number
  tokens_used: number
  tokens_remaining: number
}

export async function updateActivityMetrics(userId?: string) {
  console.log('🔄 Starting activity metrics update...')

  try {
    // Get all users or specific user
    let userQuery = supabase.from('user_profiles').select('user_id, email')

    if (userId) {
      userQuery = userQuery.eq('user_id', userId)
    }

    const { data: users, error: usersError } = await userQuery

    if (usersError) throw usersError

    console.log(`📊 Processing ${users?.length || 0} users...`)

    for (const user of users || []) {
      await calculateMetricsForUser(user.user_id)
    }

    console.log('✅ Activity metrics update complete!')
    return { success: true, usersProcessed: users?.length || 0 }
  } catch (error: any) {
    console.error('❌ Error updating activity metrics:', error)
    return { success: false, error: error.message }
  }
}

async function calculateMetricsForUser(userId: string) {
  try {
    const metrics: Partial<UserMetrics> = {
      user_id: userId,
    }

    // Get profile completion
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      const filledFields = [
        profile.full_name,
        profile.phone,
        profile.timezone,
        profile.notification_preferences,
      ].filter(Boolean).length

      metrics.profile_completion_percent = Math.round((filledFields / 4) * 100)
    }

    // Get vision count and refinements
    const { data: visions } = await supabase
      .from('life_visions')
      .select('id, refinement_count, version_history')
      .eq('user_id', userId)
      .eq('is_deleted', false)

    metrics.vision_count = visions?.length || 0
    metrics.vision_refinement_count =
      visions?.reduce((sum, v) => sum + (v.refinement_count || 0), 0) || 0

    // Get audio count
    const { data: audios } = await supabase
      .from('life_vision_audio')
      .select('id')
      .eq('user_id', userId)
      .eq('is_deleted', false)

    metrics.audio_generated_count = audios?.length || 0

    // Get journal entry count
    const { data: entries } = await supabase
      .from('daily_paper_entries')
      .select('id')
      .eq('user_id', userId)

    metrics.journal_entry_count = entries?.length || 0

    // Get vision board image count
    const { data: images } = await supabase
      .from('life_vision_boards')
      .select('images')
      .eq('user_id', userId)

    let imageCount = 0
    images?.forEach((board) => {
      if (Array.isArray(board.images)) {
        imageCount += board.images.length
      }
    })
    metrics.vision_board_image_count = imageCount

    // Get login history (approximate from auth.users last_sign_in_at)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)

    if (authUser?.user) {
      metrics.last_login_at = authUser.user.last_sign_in_at || null

      if (metrics.last_login_at) {
        const daysSince = Math.floor(
          (Date.now() - new Date(metrics.last_login_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        metrics.days_since_last_login = daysSince
      }
    }

    // Approximate login count (we don't track this directly yet)
    metrics.total_logins = 1 // Placeholder - could implement tracking later

    // Get S3 storage info (placeholder - would need to query S3 or track in DB)
    // For now, estimate based on audio + vision board images
    metrics.s3_file_count = (metrics.audio_generated_count || 0) + imageCount
    metrics.total_storage_mb = metrics.s3_file_count * 2 // Rough estimate: 2MB per file

    // Get token usage
    const { data: tokenData } = await supabase
      .from('user_profiles')
      .select('credits, token_balance')
      .eq('user_id', userId)
      .single()

    // Assuming token system stores usage somewhere - placeholder for now
    metrics.tokens_used = 0 // Placeholder
    metrics.tokens_remaining = tokenData?.token_balance || tokenData?.credits || 0

    // Upsert metrics into user_activity_metrics
    const { error: upsertError } = await supabase
      .from('user_activity_metrics')
      .upsert(
        {
          ...metrics,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      console.error(`❌ Error upserting metrics for user ${userId}:`, upsertError)
    } else {
      console.log(`✅ Updated metrics for user ${userId}`)
    }
  } catch (error: any) {
    console.error(`❌ Error calculating metrics for user ${userId}:`, error)
  }
}

// CLI entry point
if (require.main === module) {
  const userId = process.argv[2] // Optional: pass user_id as argument

  updateActivityMetrics(userId)
    .then((result) => {
      console.log('📊 Result:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}






