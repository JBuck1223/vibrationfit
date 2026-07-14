/**
 * User Activity Stats API for Intensive Surveys
 * 
 * GET /api/intensive/stats
 * 
 * Returns comprehensive user activity stats to auto-populate post-intensive surveys
 * with real data that supports their self-reported scores.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAlignmentGymScheduleLabel, DEFAULT_ALIGNMENT_GYM_SCHEDULE_LABEL } from '@/lib/map/alignment-gym-schedule-label'
import { computeMapPillarStats, emptyMapPillarActive } from '@/lib/map/compute-map-pillar-stats'
import type { MapPillarActive } from '@/lib/map/types'

export type { MapPillarActive }

export interface IntensiveStats {
  // Vision Stats
  visions_count: number
  visions_active: number
  visions_draft: number
  visions_with_refinements: number
  total_refinements: number
  
  // Audio Stats
  audio_sets_count: number
  audio_tracks_count: number
  audio_tracks_completed: number
  
  // Vision Board Stats
  vision_board_items_count: number
  vision_board_images_count: number
  
  // Journal Stats
  journal_entries_count: number
  
  // Profile Stats
  profile_completion_percent: number
  profile_versions_count: number
  
  // Vibe Tribe Stats
  vibe_posts_count: number
  vibe_tribe_engaged: boolean

  // MAP (My Alignment Plan) Stats
  map_activated: boolean
  map_commitments_count: number
  map_pillar_active: MapPillarActive
  map_all_pillars_active: boolean

  // Alignment Gym Stats (intensive unlock Q11 — column: transformation_tracking)
  alignment_gym_toured: boolean
  alignment_gym_map_commitment: boolean
  alignment_gym_schedule_label: string
  alignment_gym_sessions_attended: number

  // Assessment Stats (legacy — no longer used in intensive unlock Q3)
  assessment_completed: boolean
  assessment_completed_count: number
  assessment_strengths_count: number
  assessment_growth_areas_count: number
  
  // Timestamps
  first_vision_created_at: string | null
  last_vision_updated_at: string | null
  last_audio_generated_at: string | null
  
  // Computed metrics
  days_since_start: number
  engagement_score: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize stats object
    const stats: IntensiveStats = {
      visions_count: 0,
      visions_active: 0,
      visions_draft: 0,
      visions_with_refinements: 0,
      total_refinements: 0,
      audio_sets_count: 0,
      audio_tracks_count: 0,
      audio_tracks_completed: 0,
      vision_board_items_count: 0,
      vision_board_images_count: 0,
      journal_entries_count: 0,
      profile_completion_percent: 0,
      profile_versions_count: 0,
      vibe_posts_count: 0,
      vibe_tribe_engaged: false,
      map_activated: false,
      map_commitments_count: 0,
      map_pillar_active: emptyMapPillarActive(),
      map_all_pillars_active: false,
      alignment_gym_toured: false,
      alignment_gym_map_commitment: false,
      alignment_gym_schedule_label: '',
      alignment_gym_sessions_attended: 0,
      assessment_completed: false,
      assessment_completed_count: 0,
      assessment_strengths_count: 0,
      assessment_growth_areas_count: 0,
      first_vision_created_at: null,
      last_vision_updated_at: null,
      last_audio_generated_at: null,
      days_since_start: 0,
      engagement_score: 0,
    }

    // ========================================================================
    // VISION STATS
    // ========================================================================
    const { data: visions, error: visionsError } = await supabase
      .from('vision_versions')
      .select('id, is_active, is_draft, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (visions && !visionsError) {
      stats.visions_count = visions.length
      stats.visions_active = visions.filter(v => v.is_active && !v.is_draft).length
      stats.visions_draft = visions.filter(v => v.is_draft).length
      
      if (visions.length > 0) {
        stats.first_vision_created_at = visions[0].created_at
        stats.last_vision_updated_at = visions.reduce((latest, v) => 
          new Date(v.updated_at) > new Date(latest) ? v.updated_at : latest, 
          visions[0].updated_at
        )
      }
    }

    // Get refinements count using RPC function
    const { data: refinementsData } = await supabase
      .rpc('get_user_total_refinements', { p_user_id: user.id })
    
    if (refinementsData && refinementsData.length > 0) {
      stats.total_refinements = refinementsData[0]?.total_refinement_count || 0
      stats.visions_with_refinements = refinementsData[0]?.versions_with_refinements || 0
    }

    // ========================================================================
    // AUDIO STATS
    // ========================================================================
    const visionIds = visions?.map(v => v.id) || []
    
    if (visionIds.length > 0) {
      // Get audio sets
      const { data: audioSets } = await supabase
        .from('audio_sets')
        .select('id, created_at')
        .in('vision_id', visionIds)
      
      stats.audio_sets_count = audioSets?.length || 0
      
      // Get audio tracks
      const audioSetIds = audioSets?.map(s => s.id) || []
      if (audioSetIds.length > 0) {
        const { data: audioTracks, count: trackCount } = await supabase
          .from('audio_tracks')
          .select('id, status, created_at', { count: 'exact' })
          .in('audio_set_id', audioSetIds)
          .order('created_at', { ascending: false })
        
        stats.audio_tracks_count = trackCount || 0
        stats.audio_tracks_completed = audioTracks?.filter(t => t.status === 'completed').length || 0
        
        if (audioTracks && audioTracks.length > 0) {
          stats.last_audio_generated_at = audioTracks[0].created_at
        }
      }
    }

    // ========================================================================
    // VISION BOARD STATS
    // ========================================================================
    const { data: visionBoardItems, count: boardItemCount } = await supabase
      .from('vision_board_items')
      .select('id, image_url', { count: 'exact' })
      .eq('user_id', user.id)
    
    stats.vision_board_items_count = boardItemCount || 0
    stats.vision_board_images_count = visionBoardItems?.filter(i => i.image_url).length || 0

    // ========================================================================
    // JOURNAL STATS
    // ========================================================================
    const { count: journalCount } = await supabase
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    stats.journal_entries_count = journalCount || 0

    // ========================================================================
    // VIBE TRIBE STATS
    // ========================================================================
    const { count: vibePostCount } = await supabase
      .from('vibe_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    stats.vibe_posts_count = vibePostCount ?? 0

    let vibeEngaged = false
    const { data: comments } = await supabase
      .from('vibe_comments')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .limit(10)

    if (comments?.length) {
      for (const comment of comments) {
        const { data: post } = await supabase
          .from('vibe_posts')
          .select('user_id')
          .eq('id', comment.post_id)
          .single()
        if (post && post.user_id !== user.id) {
          vibeEngaged = true
          break
        }
      }
    }

    if (!vibeEngaged) {
      const { data: hearts } = await supabase
        .from('vibe_hearts')
        .select('post_id')
        .eq('user_id', user.id)
        .not('post_id', 'is', null)
        .limit(10)

      if (hearts?.length) {
        for (const heart of hearts) {
          const { data: post } = await supabase
            .from('vibe_posts')
            .select('user_id')
            .eq('id', heart.post_id!)
            .single()
          if (post && post.user_id !== user.id) {
            vibeEngaged = true
            break
          }
        }
      }
    }

    stats.vibe_tribe_engaged = vibeEngaged

    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('first_vibe_post, vibe_engagement, activation_protocol_completed, alignment_gym_toured')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (checklist?.vibe_engagement) {
      stats.vibe_tribe_engaged = true
    }
    if (checklist?.first_vibe_post && stats.vibe_posts_count < 1) {
      stats.vibe_posts_count = 1
    }

    // ========================================================================
    // MAP (MY ALIGNMENT PLAN) STATS
    // ========================================================================
    const intensiveMapStepCompleted = Boolean(checklist?.activation_protocol_completed)
    let activeMapCommitments: {
      category: string | null
      activity_type: string | null
      cadence: unknown
    }[] = []

    try {
      const admin = createAdminClient()
      const { data, error: mapError } = await admin
        .from('commitments')
        .select('category, activity_type, cadence')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (mapError) {
        console.error('Error fetching MAP commitments for stats:', mapError)
      } else {
        activeMapCommitments = data ?? []
      }
    } catch (mapErr) {
      console.error('MAP stats admin client error:', mapErr)
    }

    const mapStats = computeMapPillarStats(activeMapCommitments, {
      intensiveMapStepCompleted,
    })

    stats.map_pillar_active = mapStats.map_pillar_active
    stats.map_commitments_count = mapStats.map_commitments_count
    stats.map_all_pillars_active = mapStats.map_all_pillars_active
    stats.map_activated = intensiveMapStepCompleted || stats.map_all_pillars_active

    // Unlock is after step 12 (gym tour) and 13 (MAP); MAP complete implies gym tour in normal flow
    stats.alignment_gym_toured =
      Boolean(checklist?.alignment_gym_toured) ||
      Boolean(checklist?.activation_protocol_completed)
    const gymCommitment = activeMapCommitments.find(c => c.activity_type === 'alignment_gym')
    stats.alignment_gym_map_commitment =
      Boolean(gymCommitment) ||
      (stats.alignment_gym_toured && intensiveMapStepCompleted)

    if (gymCommitment?.cadence) {
      stats.alignment_gym_schedule_label = getAlignmentGymScheduleLabel(gymCommitment.cadence)
    } else if (stats.alignment_gym_toured || stats.alignment_gym_map_commitment) {
      stats.alignment_gym_schedule_label = DEFAULT_ALIGNMENT_GYM_SCHEDULE_LABEL
    }

    try {
      const admin = createAdminClient()
      const { count: gymSessionsCount, error: gymSessionsError } = await admin
        .from('video_session_participants')
        .select('id, video_sessions!inner(session_type, title)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or('attended.eq.true,replay_viewed_at.not.is.null')
        .or('session_type.eq.alignment_gym,title.ilike.%alignment gym%', {
          referencedTable: 'video_sessions',
        })

      if (gymSessionsError) {
        console.error('Error fetching Alignment Gym attendance for stats:', gymSessionsError)
      } else {
        stats.alignment_gym_sessions_attended = gymSessionsCount ?? 0
      }
    } catch (gymErr) {
      console.error('Alignment Gym attendance stats error:', gymErr)
    }

    // ========================================================================
    // ASSESSMENT STATS (legacy)
    // ========================================================================
    const { data: assessments } = await supabase
      .from('assessment_results')
      .select('id, status, category_scores, overall_percentage')
      .eq('user_id', user.id)
    
    if (assessments && assessments.length > 0) {
      const completedAssessments = assessments.filter(a => a.status === 'completed')
      stats.assessment_completed = completedAssessments.length > 0
      stats.assessment_completed_count = completedAssessments.length
      
      // Count total categories assessed from latest assessment
      if (completedAssessments.length > 0) {
        const latestAssessment = completedAssessments[completedAssessments.length - 1]
        const categoryScores = latestAssessment.category_scores as Record<string, unknown> | null
        
        if (categoryScores && typeof categoryScores === 'object') {
          const totalCategories = Object.keys(categoryScores).length
          // All categories assessed become awareness points
          stats.assessment_strengths_count = totalCategories
          stats.assessment_growth_areas_count = totalCategories
        }
      }
    }

    // ========================================================================
    // PROFILE STATS
    // ========================================================================
    // Get all profile versions count
    const { count: profileVersionsCount } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    stats.profile_versions_count = profileVersionsCount || 0

    // Get active profile for completion calculation
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (profile) {
      // Calculate profile completion based on key fields
      const profileFields = [
        profile.gender,
        profile.relationship_status,
        profile.employment_type,
        profile.occupation,
        profile.living_situation,
        profile.city,
        profile.state,
        profile.household_income,
        profile.exercise_frequency,
        profile.state_love,
        profile.state_family,
        profile.state_work,
        profile.state_money,
        profile.state_health,
      ]
      
      const filledFields = profileFields.filter(f => f !== null && f !== undefined && f !== '').length
      stats.profile_completion_percent = Math.round((filledFields / profileFields.length) * 100)
    }

    // ========================================================================
    // INTENSIVE PURCHASE / DAYS SINCE START
    // ========================================================================
    const { data: intensive } = await supabase
      .from('order_items')
      .select('started_at, created_at, orders!inner(user_id), products!inner(product_type)')
      .eq('orders.user_id', user.id)
      .eq('products.product_type', 'intensive')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (intensive) {
      const startDate = intensive.started_at || intensive.created_at
      if (startDate) {
        const start = new Date(startDate)
        const now = new Date()
        stats.days_since_start = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    // ========================================================================
    // ENGAGEMENT SCORE (0-100)
    // ========================================================================
    // Weighted score based on key activities
    const engagementFactors = [
      { value: Math.min(stats.visions_count, 5) / 5, weight: 20 },           // Up to 5 visions
      { value: Math.min(stats.total_refinements, 10) / 10, weight: 15 },     // Up to 10 refinements
      { value: Math.min(stats.audio_sets_count, 5) / 5, weight: 20 },        // Up to 5 audio sets
      { value: Math.min(stats.vision_board_items_count, 20) / 20, weight: 15 }, // Up to 20 board items
      { value: Math.min(stats.journal_entries_count, 10) / 10, weight: 10 }, // Up to 10 journal entries
      { value: stats.profile_completion_percent / 100, weight: 10 },          // Profile completion
      { value: stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged ? 1 : 0, weight: 10 },
    ]
    
    stats.engagement_score = Math.round(
      engagementFactors.reduce((sum, f) => sum + (f.value * f.weight), 0)
    )

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error fetching intensive stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
